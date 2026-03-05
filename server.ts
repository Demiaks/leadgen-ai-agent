import express from "express";
import cors from "cors";
import axios from "axios";
import * as cheerio from "cheerio";
import nodemailer from "nodemailer";
import SftpClient from "ssh2-sftp-client";
import * as ftp from "basic-ftp";
import { Readable } from "stream";
import { createClient } from '@supabase/supabase-js';
import http from "http";
import { getLandings, saveLanding } from "./db";
import { PublishLandingSchema, EmailSchema } from "./validation";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY are required.');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const adminMiddleware = async (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
    
    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user || user.email !== process.env.ADMIN_EMAIL) {
        return res.status(403).json({ error: 'Forbidden' });
    }
    next();
};

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const PORT = Number(process.env.PORT) || 3000;

  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use('/api', adminMiddleware);

  // In-memory store for published landings (for demo purposes)

  // 1. Scrape Endpoint
  app.post("/api/scrape", async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) return res.status(400).json({ error: "URL is required" });

      // Basic scraping logic
      const response = await axios.get(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
      });
      const html = response.data;
      const $ = cheerio.load(html);
      
      const title = $("title").text();
      const description = $('meta[name="description"]').attr("content") || "";
      const text = $("body").text().replace(/\s+/g, " ").trim().substring(0, 1000);

      res.json({ title, description, text });
    } catch (error: any) {
      console.error("Scraping error:", error.message);
      res.status(500).json({ error: "Failed to scrape URL" });
    }
  });

  // 2. Test Deployment Endpoint
  app.post("/api/test-deployment", async (req, res) => {
    const { config } = req.body;
    if (!config || config.type === 'NONE') {
        return res.status(400).json({ error: "Configuración no válida" });
    }

    try {
        if (config.type === 'SFTP') {
            const sftp = new SftpClient();
            try {
                await sftp.connect({
                    host: config.host,
                    port: config.port || 22,
                    username: config.username,
                    password: config.password,
                    readyTimeout: 30000
                });
                res.json({ success: true, message: "Conexión SFTP exitosa" });
            } finally {
                await sftp.end();
            }
        } else if (config.type === 'FTP') {
            const client = new ftp.Client();
            // @ts-ignore
            client.ftp.timeout = 30000;
            try {
                await client.access({
                    host: config.host,
                    port: config.port || 21,
                    user: config.username,
                    password: config.password,
                    secure: config.secure || false
                });
                res.json({ success: true, message: "Conexión FTP exitosa" });
            } finally {
                client.close();
            }
        } else if (config.type === 'WEBHOOK') {
            const response = await axios.post(config.webhookUrl, { test: true });
            res.json({ success: true, message: `Webhook respondió con status: ${response.status}` });
        }
    } catch (error: any) {
        console.error("Test Deployment Error:", error);
        res.status(500).json({ error: error.message || "Error al conectar con el servidor" });
    }
  });

  // 3. Publish Landing Endpoint
  app.post("/api/publish-landing", async (req, res) => {
    const validation = PublishLandingSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: "Invalid landing data", details: validation.error.issues });
    }
    const { html, slug, deploymentConfig } = validation.data;
    const socketId = req.headers['x-socket-id'] as string;
    
    const id = slug || Math.random().toString(36).substring(2, 10);
    
    const emit = (message: string, progress: number) => {
        console.log(`[${id}] ${message} (${progress}%)`);
    };
    
    try {
        let finalUrl = "";
        const baseUrl = process.env.APP_URL || `http://localhost:${PORT}`;
        finalUrl = `${baseUrl}/l/${id}`;

        // Custom Deployment Logic
        if (deploymentConfig && deploymentConfig.type !== 'NONE') {
            emit(`Iniciando despliegue vía ${deploymentConfig.type}...`, 10);
            if (deploymentConfig.type === 'SFTP') {
                const sftp = new SftpClient();
                try {
                    emit("Conectando con SFTP...", 20);
                    await sftp.connect({
                        host: deploymentConfig.host,
                        port: deploymentConfig.port || 22,
                        username: deploymentConfig.username,
                        password: deploymentConfig.password,
                        readyTimeout: 120000,
                        retries: 3,
                        retry_factor: 2,
                        retry_minTimeout: 2000
                    });
                    
                    emit("Preparando directorio remoto...", 40);
                    await sftp.mkdir(deploymentConfig.path, true);
                    const basePath = deploymentConfig.path?.endsWith('/') ? deploymentConfig.path : `${deploymentConfig.path}/`;
                    const remotePath = `${basePath}${id}.html`;
                    
                    emit("Subiendo archivo...", 60);
                    const buffer = Buffer.from(html, 'utf-8');
                    await sftp.put(buffer, remotePath);
                    
                    emit("Finalizando...", 90);
                    const host = deploymentConfig.host;
                    const publicBase = host.includes('demiak.es') ? 'https://demiak.es/landings' : `https://${host}`;
                    finalUrl = `${publicBase}/${id}.html`;
                } finally {
                    await sftp.end();
                }
            } else if (deploymentConfig.type === 'FTP') {
                const client = new ftp.Client();
                client.ftp.verbose = true;
                // @ts-ignore
                client.ftp.timeout = 120000;
                try {
                    emit("Conectando con FTP...", 20);
                    await client.access({
                        host: deploymentConfig.host,
                        port: deploymentConfig.port || 21,
                        user: deploymentConfig.username,
                        password: deploymentConfig.password,
                        secure: deploymentConfig.secure || false
                    });
                    
                    emit("Preparando directorio remoto...", 40);
                    await client.ensureDir(deploymentConfig.path);
                    const basePath = deploymentConfig.path?.endsWith('/') ? deploymentConfig.path : `${deploymentConfig.path}/`;
                    const remotePath = `${basePath}${id}.html`;
                    
                    emit("Subiendo archivo...", 60);
                    const stream = Readable.from([html]);
                    await client.uploadFrom(stream, remotePath);
                    
                    emit("Finalizando...", 90);
                    const host = deploymentConfig.host;
                    const publicBase = host.includes('demiak.es') ? 'https://demiak.es/landings' : `https://${host}`;
                    finalUrl = `${publicBase}/${id}.html`;
                } finally {
                    client.close();
                }
            } else if (deploymentConfig.type === 'WEBHOOK') {
                emit("Enviando Webhook...", 50);
                await axios.post(deploymentConfig.webhookUrl, {
                    html,
                    slug: id,
                    secret: deploymentConfig.webhookSecret
                });
                finalUrl = `https://demiak.es/${id}`;
            }
        } else {
            emit("Guardando localmente...", 50);
            await saveLanding(id, html);
        }
        
        emit("Despliegue completado con éxito", 100);
        res.json({ success: true, url: finalUrl, id });
    } catch (error: any) {
        emit(`Error en el despliegue: ${error.message}`, 0);
        console.error("Publishing error:", error.message);
        res.status(500).json({ error: `Failed to publish: ${error.message}` });
    }
  });

  // 3. Serve Published Landings
  app.get("/l/:id", async (req, res) => {
    const { id } = req.params;
    const landings = await getLandings();
    const html = landings[id];
    
    if (!html) {
      return res.status(404).send("<h1>Landing Page Not Found</h1><p>The requested landing page does not exist or has expired.</p>");
    }
    
    res.send(html);
  });

  // 4. Email Endpoint
  app.post("/api/send-email", async (req, res) => {
    console.log("Email request received:", req.body);
    try {
      const validation = EmailSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid email data", details: validation.error.issues });
      }
      const { to, subject, text, html } = validation.data;

      let transporter;
      
      // Use real SMTP if configured, otherwise fallback to Ethereal for demo
      if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        console.log("Using configured SMTP:", process.env.SMTP_HOST);
        transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT) || 587,
          secure: process.env.SMTP_SECURE === "true",
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
          tls: {
            // Do not fail on invalid certs
            rejectUnauthorized: false
          }
        });
      } else {
        console.log("Using Ethereal fallback");
        // For demonstration, we use Ethereal Email (fake SMTP service)
        try {
          let testAccount = await nodemailer.createTestAccount();
          transporter = nodemailer.createTransport({
            host: "smtp.ethereal.email",
            port: 587,
            secure: false,
            auth: {
              user: testAccount.user,
              pass: testAccount.pass,
            },
          });
        } catch (etherealError: any) {
          console.error("Ethereal account creation failed:", etherealError.message);
          throw new Error(`Could not create test account: ${etherealError.message}`);
        }
      }

      console.log("Sending mail to:", to);
      let info = await transporter.sendMail({
        from: process.env.SMTP_FROM || '"LeadGen AI" <noreply@leadgen.ai>',
        to,
        subject,
        text,
        html,
      });

      console.log("Mail sent successfully:", info.messageId);
      res.json({ 
        success: true, 
        messageId: info.messageId, 
        previewUrl: nodemailer.getTestMessageUrl(info) 
      });
    } catch (error: any) {
      console.error("Email error details:", error);
      res.status(500).json({ 
        success: false,
        error: `Failed to send email: ${error.message}`,
        details: error.stack
      });
    }
  });

  // Serve static files in production or use Vite middleware in development
  if (process.env.NODE_ENV === "production") {
    app.use(express.static("dist"));
    // Fallback for SPA routing
    app.get(/.*/, (req, res) => {
      res.sendFile("dist/index.html", { root: "." });
    });
  } else {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  if (import.meta.url === `file://${process.argv[1]}`) {
    server.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  startServer();
}

export default app;
