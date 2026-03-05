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
import fs from "fs";
import path from "path";
import { getLandings, saveLanding } from "./db";
import { PublishLandingSchema, EmailSchema } from "./validation";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('WARNING: SUPABASE_URL and SUPABASE_ANON_KEY are missing. Admin features will be disabled.');
}

const supabase = (supabaseUrl && supabaseAnonKey) 
    ? createClient(supabaseUrl, supabaseAnonKey) 
    : null;

const adminMiddleware = async (req: any, res: any, next: any) => {
    if (!supabase) return res.status(503).json({ error: 'Supabase not configured' });

    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
    
    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user || user.email !== process.env.ADMIN_EMAIL) {
        return res.status(403).json({ error: 'Forbidden' });
    }
    next();
};

// ... imports

const app = express();
const server = http.createServer(app);
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/api', adminMiddleware);

// ... (rest of the API routes)

// Serve static files in production or use Vite middleware in development
if (process.env.NODE_ENV === "production") {
    // Serve static files from the 'dist' directory
    app.use(express.static(path.join(process.cwd(), "dist")));

    // Handle SPA routing: serve index.html for any unknown routes
    app.get("*", (req, res) => {
        if (req.originalUrl.startsWith('/api')) {
            return res.status(404).json({ error: "Not Found" });
        }
        res.sendFile(path.join(process.cwd(), "dist", "index.html"));
    });
} else {
    // Development mode with Vite middleware
    // ... (existing dev logic)
}

// Start the server
server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});

export default app;

export default app;
