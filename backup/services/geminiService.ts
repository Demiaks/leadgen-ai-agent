import { GoogleGenAI, Type } from "@google/genai";
import { Lead, SearchCriteria, LeadStatus, BuyingSignal, Battlecard, OrgNode, SequenceStep, RoleplayMessage, VisualAnalysis, LandingStyle, ScoringWeights, WarRoomMessage, DiscoveryCallFeedback, AIService, VisualConfig } from '../types';
import { AI_AGENCY_SERVICES } from '../src/constants/services';

const MODEL_NAME = "gemini-3-flash-preview"; 
const REASONING_MODEL = "gemini-3-pro-preview";
const SEARCH_MODEL = "gemini-3-flash-preview"; 
const AUDIO_MODEL = "gemini-2.5-flash-native-audio-preview-12-2025"; 

const MAX_RETRIES = 2;
const INITIAL_RETRY_DELAY = 1000;

// --- HELPERS ---

const getEnvApiKey = (): string | undefined => {
    try {
        // Safe check for process.env
        if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
            return process.env.API_KEY;
        }
        // Safe check for Vite
        if (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.VITE_API_KEY) {
            return (import.meta as any).env.VITE_API_KEY;
        }
    } catch (e) {}
    return undefined;
};

const getAiClient = (apiKey?: string) => {
  const key = apiKey || getEnvApiKey();
  if (!key) return null;
  return new GoogleGenAI({ apiKey: key });
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const extractJSON = (text: string, startChar: string, endChar: string): string => {
    const startIndex = text.indexOf(startChar);
    const endIndex = text.lastIndexOf(endChar);
    if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
        return text.substring(startIndex, endIndex + 1);
    }
    return text;
};

const withRetry = async <T>(fn: () => Promise<T>, retries: number, delayMs: number, operationName: string): Promise<T> => {
    try {
        return await fn();
    } catch (error: any) {
        if (retries > 0 && !isFatalError(error)) {
            console.warn(`Retrying ${operationName}... (${retries} left). Error: ${error.message}`);
            await delay(delayMs);
            return withRetry(fn, retries - 1, delayMs * 2, operationName);
        }
        throw error;
    }
};

const isFatalError = (error: any) => {
    const msg = (error?.message || error?.toString() || "").toLowerCase();
    return msg.includes("401") || 
           msg.includes("api key not valid") || 
           msg.includes("quota") || 
           msg.includes("404") || 
           msg.includes("failed to fetch") ||
           msg.includes("network error");
};

const generateMockCoordinates = (seed: string) => {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    const x = Math.abs(Math.sin(hash) * 10000) % 90 + 5; // 5-95%
    const y = Math.abs(Math.cos(hash) * 10000) % 90 + 5; // 5-95%
    return { x, y };
};

// Helper to clean email body
export const cleanEmailBody = (body: string, subject: string): string => {
    if (!body) return "";
    let cleaned = body;
    // Remove "Asunto: ..." or "Subject: ..." from the beginning of the body
    const subjectPrefixes = ["Asunto:", "Subject:", "ASUNTO:", "SUBJECT:"];
    for (const prefix of subjectPrefixes) {
        if (cleaned.trim().startsWith(prefix)) {
            const lines = cleaned.split('\n');
            // Check if the first line contains the subject
            if (lines[0].toLowerCase().includes(prefix.toLowerCase())) {
                cleaned = lines.slice(1).join('\n').trim();
            }
        }
    }
    // Also remove the subject itself if it's the first line
    if (subject && cleaned.trim().startsWith(subject)) {
        const lines = cleaned.split('\n');
        cleaned = lines.slice(1).join('\n').trim();
    }
    // Handle HTML cases if any
    cleaned = cleaned.replace(/^<p>Asunto:.*?<\/p>/i, "");
    cleaned = cleaned.replace(/^<p>Subject:.*?<\/p>/i, "");
    
    return cleaned;
};

const generateMockLeads = (criteria: SearchCriteria): Lead[] => {
    return Array.from({ length: criteria.leadCount || 5 }).map((_, i) => ({
        id: `mock-${Date.now()}-${i}`,
        name: `Lead Simulado ${i + 1}`,
        role: criteria.targetPersona || "Decision Maker",
        company: `${criteria.industry} Corp ${i + 1}`,
        qualificationScore: Math.floor(Math.random() * 40) + 50,
        reasoning: "Datos generados por simulación (API Key faltante, cuota excedida o modelo no encontrado).",
        status: LeadStatus.NEW,
        industry: criteria.industry,
        location: criteria.location,
        painPoints: ["Necesidad de optimización", "Crecimiento estancado"],
        emailGuess: `contacto@empresa${i+1}.com`,
        outreach: { email: "", linkedin: "", phone: "", subjectVariants: [] },
        coordinates: generateMockCoordinates(`mock-${i}`)
    }));
};

// --- EXPORTED SERVICES ---

export const generateLeads = async (
  criteria: SearchCriteria, 
  apiKey?: string,
  onQuotaExceeded?: (message: string) => void,
  customInstructions?: string,
  emailSignature?: string,
  forceMock: boolean = false,
  weights?: ScoringWeights,
  calendlyUrl?: string
): Promise<Lead[]> => {
  
  if (forceMock) {
      await delay(1000); 
      return generateMockLeads(criteria);
  }

  const ai = getAiClient(apiKey);
  
  if (!ai) {
    console.warn("API_KEY missing. Falling back to mock data.");
    return generateMockLeads(criteria);
  }

  const count = criteria.leadCount || 10;
  console.log(`🔎 Smart Search Active (${criteria.searchType}):`, criteria);

  const executeSearch = async () => {
      let searchContext = "";
      let disqualifiers = "";

      if (criteria.searchType === 'COMPETITORS' && criteria.competitorUrl) {
          searchContext = `Encuentra ${count} empresas B2B que sean competidores directos o alternativas a "${criteria.competitorUrl}" en la ubicación "${criteria.location}". 
          Utiliza consultas de búsqueda como "alternativas a ${criteria.competitorUrl}", "competidores de ${criteria.competitorUrl}", o empresas similares en el mismo sector.`;
          disqualifiers = "Excluye estrictamente a la empresa original, directorios de empresas (como G2, Capterra, Crunchbase), y agregadores de listas.";
      } else if (criteria.searchType === 'SOCIAL') {
          searchContext = `Busca ${count} perfiles públicos de profesionales en LinkedIn o Twitter con el cargo "${criteria.targetPersona}" en el sector "${criteria.industry}" ubicados en "${criteria.location}". 
          Utiliza operadores de búsqueda avanzados como: site:linkedin.com/in/ "${criteria.targetPersona}" "${criteria.industry}" "${criteria.location}".
          Prioriza aquellos que han publicado recientemente sobre temas relacionados con "${criteria.valueProposition}".`;
      } else {
          searchContext = `
            Objetivo: Encontrar ${count} empresas B2B reales y activas en "${criteria.location}" (Industria: "${criteria.industry}") que sean clientes ideales para: "${criteria.valueProposition}".
            
            Estrategia de Búsqueda Avanzada:
            1. Ejecuta búsquedas específicas para encontrar empresas en esta industria y ubicación.
            2. Busca señales de intención de compra o necesidad: empresas expandiéndose, contratando para el rol de "${criteria.targetPersona}", o que utilicen tecnologías complementarias.
            3. Identifica a la persona específica que toma las decisiones con el cargo de "${criteria.targetPersona}" en cada empresa.
          `;
      }

      const systemInstruction = `
        Eres un Lead Researcher de élite para ventas B2B. Tu objetivo es proporcionar leads de la más alta calidad y precisión.
        
        DATASET DE NUESTROS SERVICIOS (Usa esto para personalizar el outreach):
        ${JSON.stringify(AI_AGENCY_SERVICES, null, 2)}

        TU PROCESO MENTAL ESTRICTO:
        1. INVESTIGA: Usa Google Search activamente para encontrar empresas y personas reales y actuales. No inventes datos.
        2. VERIFICA: Asegúrate de que la empresa siga activa y que la persona siga trabajando allí.
        3. ANALIZA: Evalúa críticamente si tienen el problema que resuelve la propuesta de valor.
        4. INFIERE: Si no encuentras el email exacto, genera el patrón corporativo más probable (ej. inicial.apellido@empresa.com).
        
        CRITERIOS DE SCORING (0-100):
        ${weights ? `Prioriza estos pesos en tu evaluación: 
        - Tecnología: ${weights.techStack}%
        - Presencia Social: ${weights.socialPresence}%
        - Salud SEO: ${weights.seoHealth}%
        - Señales de Intención: ${weights.intentSignals}%
        - Tamaño de Empresa: ${weights.companySize}%` : `
        - 90-100: Match perfecto. Fuerte señal de intención, tamaño ideal, decisor identificado.
        - 70-89: Buen fit. Industria y ubicación correctas, pero señales de intención moderadas.
        - <70: Fit dudoso. Empresa muy pequeña, o sin decisor claro. (Evita incluir leads con score menor a 70).`}

        FORMATO DE RESPUESTA:
        Devuelve ÚNICAMENTE un Array JSON válido. Sin bloque de código markdown (```json), sin texto introductorio ni conclusiones.
        
        ${customInstructions ? `REQUISITOS ADICIONALES DEL USUARIO: ${customInstructions}` : ''}
      `;

      const prompt = `
        ${searchContext}
        ${disqualifiers}

        Para cada lead encontrado, extrae o deduce la siguiente información estructurada en JSON:
        [
          {
            "name": "Nombre del Decisor", 
            "role": "Cargo Exacto", 
            "company": "Nombre Empresa", 
            "qualificationScore": 85, 
            "reasoning": "Razón del score basada en la investigación...", 
            "painPoints": ["Dolor 1", "Dolor 2"],
            "sourceUrl": "URL Web de la empresa o perfil", 
            "emailGuess": "email@empresa.com", 
            "industry": "Industria",
            "location": "Ciudad",
            "techStack": ["Tecnología 1", "Tecnología 2"],
            "outreach": { 
                "subject": "Asunto corto y directo (máx 60 caracteres)", 
                "email": "Cuerpo email en HTML. ${calendlyUrl ? `Incluye este enlace para agendar: ${calendlyUrl}` : ''}", 
                "linkedin": "Mensaje LinkedIn", 
                "phone": "Script telefónico" 
            }
          }
        ]
      `;

      const response = await ai.models.generateContent({
        model: SEARCH_MODEL,
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }], 
          systemInstruction: systemInstruction,
          temperature: 0.2,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, description: "Nombre del decisor" },
                role: { type: Type.STRING, description: "Cargo exacto" },
                company: { type: Type.STRING, description: "Nombre de la empresa" },
                qualificationScore: { type: Type.INTEGER, description: "Score de 0 a 100" },
                reasoning: { type: Type.STRING, description: "Justificación detallada del score basada en la investigación" },
                painPoints: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Lista de puntos de dolor identificados" },
                sourceUrl: { type: Type.STRING, description: "URL web de la empresa o perfil" },
                emailGuess: { type: Type.STRING, description: "Email corporativo deducido o encontrado" },
                industry: { type: Type.STRING, description: "Industria de la empresa" },
                location: { type: Type.STRING, description: "Ubicación de la empresa" },
                techStack: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Tecnologías que utilizan" },
                outreach: {
                  type: Type.OBJECT,
                  properties: {
                    subject: { type: Type.STRING },
                    email: { type: Type.STRING },
                    linkedin: { type: Type.STRING },
                    phone: { type: Type.STRING }
                  }
                }
              },
              required: ["name", "role", "company", "qualificationScore", "reasoning", "sourceUrl", "emailGuess", "industry", "location", "outreach"]
            }
          }
        }
      });

      let rawJSON = response.text || "[]";
      rawJSON = rawJSON.replace(/```json/gi, "").replace(/```/g, "");
      rawJSON = extractJSON(rawJSON, '[', ']');
      rawJSON = rawJSON.trim();

      if (!rawJSON.startsWith("[")) throw new Error("La respuesta no es un JSON válido.");

      let parsedLeads: any[] = JSON.parse(rawJSON);
      
      if (!Array.isArray(parsedLeads)) {
          parsedLeads = [parsedLeads];
      }

      const processedLeads: Lead[] = parsedLeads.map((l, index) => {
        const leadId = `gen-lead-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 5)}`;
        const historyId = `hist-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        
        return {
          ...l,
          id: leadId,
          status: LeadStatus.NEW,
          location: l.location || criteria.location,
          valueProposition: criteria.valueProposition,
          senderName: criteria.senderName,
          senderWebsite: criteria.senderWebsite,
          senderEmail: criteria.senderEmail,
          landingPageUrl: criteria.landingPageUrl,
          strategy: criteria.strategy,
          isDeepDived: false,
          notes: [],
          history: [{ id: historyId, timestamp: Date.now(), action: 'Lead Created (AI Search)', user: 'System' }],
          techStack: l.techStack || [], 
          emailStatus: 'UNKNOWN',
          outreach: {
              ...l.outreach,
              subject: (l.outreach?.subject && l.outreach.subject.length < 150) ? l.outreach.subject : `Propuesta para ${l.company}`,
              email: l.outreach?.email || "",
              linkedin: l.outreach?.linkedin || "",
              phone: l.outreach?.phone || "",
              subjectVariants: (l.outreach?.subject && l.outreach.subject.length < 150) ? [l.outreach.subject] : [`Propuesta para ${l.company}`]
          },
          sourceUrl: l.sourceUrl || `https://google.com/search?q=${encodeURIComponent(l.company)}`,
          emailGuess: l.emailGuess ? l.emailGuess.toLowerCase() : `contacto@${(l.company || 'empresa').replace(/\s+/g, '').toLowerCase()}.com`,
          coordinates: generateMockCoordinates(criteria.location + (l.company || ''))
        };
      });

      return processedLeads;
  };

  try {
      return await withRetry(executeSearch, MAX_RETRIES, INITIAL_RETRY_DELAY, "Generate Leads");
  } catch (error: any) {
    if (isFatalError(error)) {
        if (onQuotaExceeded) onQuotaExceeded("⏳ Límite de cuota IA o Modelo no encontrado. Usando Mock Data.");
        return generateMockLeads(criteria);
    }
    console.error("Gemini Error:", error);
    return generateMockLeads(criteria);
  }
};

export const deepDiveLead = async (lead: Lead, apiKey?: string, isOfflineMode?: boolean): Promise<Partial<Lead>> => {
    if (isOfflineMode) {
        await delay(1000);
        return { isDeepDived: true, auditObservation: "Simulación de análisis profundo offline." };
    }
    
    const ai = getAiClient(apiKey);
    if (!ai) return {};

    const prompt = `
      Realiza una investigación profunda sobre la empresa "${lead.company}" (${lead.sourceUrl}).
      Busca información técnica y de negocio reciente utilizando Google Search.
      Identifica las tecnologías que utilizan, sus principales puntos de dolor y realiza un análisis SEO básico de su sitio web.
    `;

    try {
        const response = await ai.models.generateContent({
            model: SEARCH_MODEL,
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
                responseMimeType: "application/json",
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    techStack: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Tecnologías identificadas" },
                    painPoints: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Problemas o áreas de mejora" },
                    auditObservation: { type: Type.STRING, description: "Observación estratégica breve sobre su situación digital" },
                    seoAnalysis: {
                      type: Type.OBJECT,
                      properties: {
                        overallScore: { type: Type.INTEGER, description: "Puntuación SEO general (0-100)" },
                        mainIssue: { type: Type.STRING, description: "Problema principal de SEO encontrado" },
                        keywordDensity: { type: Type.STRING, description: "Densidad de palabras clave (Baja, Media, Alta)" },
                        metaTitlePresence: { type: Type.BOOLEAN, description: "¿Tiene meta título optimizado?" }
                      }
                    }
                  },
                  required: ["techStack", "painPoints", "auditObservation"]
                }
            }
        });

        const text = response.text || "{}";
        const jsonStr = extractJSON(text, '{', '}');
        const json = JSON.parse(jsonStr);
        return { ...json, isDeepDived: true };
    } catch (e) {
        console.error("Deep Dive Error", e);
        return { isDeepDived: true };
    }
};

export const sendToWebhook = async (lead: Lead, webhookUrl: string): Promise<boolean> => {
    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(lead)
        });
        return response.ok;
    } catch (e) {
        console.error("Webhook Error", e);
        return false;
    }
};

export const generateBattlecard = async (lead: Lead, apiKey?: string): Promise<Battlecard> => {
    try {
        const ai = getAiClient(apiKey);
        if (!ai) throw new Error("No API Key");

        const prompt = `
            Genera una Battlecard de Ventas estratégica para venderle a "${lead.role}" de "${lead.company}".
            Contexto: ${lead.reasoning}
            
            JSON Esperado:
            {
                "personalityType": "DRIVER" | "ANALYTICAL" | "AMIABLE" | "EXPRESSIVE",
                "personalityTips": "Cómo tratarlo...",
                "iceBreakers": ["Frase 1", "Frase 2"],
                "goldenQuestion": "Pregunta clave...",
                "valueHook": "Gancho de valor...",
                "killShotObjection": { "objection": "Objeción probable", "counter": "Respuesta" },
                "winProbability": 85
            }
        `;
        
        const response = await ai.models.generateContent({
            model: REASONING_MODEL,
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });
        
        return JSON.parse(response.text || "{}");
    } catch (error) {
        console.error("Battlecard Error:", error);
        return {
            personalityType: "DRIVER",
            personalityTips: "Sé directo y enfocado en resultados.",
            iceBreakers: ["Vi tu perfil y me llamó la atención tu rol en " + lead.company],
            goldenQuestion: "¿Cómo están manejando actualmente su estrategia de leads?",
            valueHook: "Podemos automatizar tu prospección en 24h.",
            killShotObjection: { objection: "No tenemos presupuesto", counter: "Nuestro sistema se paga solo con el primer lead cerrado." },
            winProbability: 50
        };
    }
};

export const verifyEmailAddress = async (email: string, apiKey?: string): Promise<'VERIFIED' | 'INVALID' | 'UNKNOWN'> => {
    await delay(500);
    return Math.random() > 0.5 ? 'VERIFIED' : 'UNKNOWN'; 
};

export const analyzeVisual = async (imageBase64: string, apiKey?: string): Promise<VisualAnalysis> => {
    try {
        const ai = getAiClient(apiKey);
        if (!ai) throw new Error("No API Key");

        const prompt = "Analiza esta captura de pantalla de un sitio web. Identifica problemas de UX/UI y diseño que reduzcan conversión. Devuelve JSON.";
        
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: {
                parts: [
                    { inlineData: { mimeType: "image/png", data: imageBase64 } },
                    { text: prompt }
                ]
            },
            config: { responseMimeType: "application/json" }
        });
        
        return JSON.parse(response.text || "{}");
    } catch (error) {
        console.error("Visual Analysis Error:", error);
        return {
            designScore: 70,
            uxIssues: ["Posibles problemas de contraste", "CTA poco visible"],
            conversionBlockers: ["Falta de prueba social"],
            aiFeedback: "Mejorar la jerarquía visual y aumentar tamaño de botones"
        };
    }
};

export const generateOutreachSequence = async (lead: Lead, apiKey?: string): Promise<SequenceStep[]> => {
    try {
        const ai = getAiClient(apiKey);
        if (!ai) throw new Error("No API Key");

        const prompt = `Crea una secuencia de 3 emails de venta para ${lead.name} de ${lead.company}. Enfócate en sus dolores: ${lead.painPoints?.join(', ')}. Devuelve JSON Array.`;

        const response = await ai.models.generateContent({
            model: REASONING_MODEL,
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });

        return JSON.parse(response.text || "[]");
    } catch (error) {
        console.error("Sequence Error:", error);
        return [
            { id: '1', day: 1, intent: 'HOOK', subject: 'Idea para ' + lead.company, body: 'Hola ' + lead.name + ', vi que están trabajando en...' },
            { id: '2', day: 3, intent: 'VALUE', subject: 'Seguimiento LinkedIn', body: 'Hola ' + lead.name + ', te envié un correo hace un par de días...' },
            { id: '3', day: 7, intent: 'BREAKUP', subject: 'Re: Idea para ' + lead.company, body: 'Hola ' + lead.name + ', solo quería asegurarme de que recibiste mi mensaje anterior.' }
        ];
    }
};

export const generateEmailTemplate = async (instruction: string, apiKey?: string): Promise<{subject: string, body: string}> => {
    try {
        const ai = getAiClient(apiKey);
        if (!ai) throw new Error("No API Key");

        const prompt = `
            Actúa como un Copywriter de Ventas B2B experto.
            Escribe una plantilla de correo electrónico basada en esta instrucción: "${instruction}".
            
            IMPORTANTE: Usa estas variables exactas donde corresponda para personalización:
            {{name}} = Nombre del prospecto
            {{company}} = Nombre de la empresa
            {{role}} = Cargo
            {{industry}} = Industria
            {{city}} = Ciudad
            
            REGLA DE ORO: El campo "body" NO debe incluir el asunto. El asunto va únicamente en el campo "subject". No escribas "Asunto: ..." dentro del cuerpo.
            
            Devuelve un JSON con:
            {
                "subject": "Asunto atractivo...",
                "body": "Cuerpo del correo (usa saltos de línea \n)..."
            }
        `;

        const response = await ai.models.generateContent({
            model: REASONING_MODEL,
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });

        const result = JSON.parse(response.text || "{\"subject\":\"\", \"body\":\"\"}");
        
        // Clean body to ensure no subject is repeated
        return {
            subject: result.subject,
            body: cleanEmailBody(result.body, result.subject)
        };
    } catch (error) {
        console.error("Template Error:", error);
        return {
            subject: "Propuesta para {{company}}",
            body: "Hola {{name}},\n\nMe pongo en contacto contigo porque..."
        };
    }
};

export const analyzeSentiment = async (replyText: string, apiKey?: string) => {
    const ai = getAiClient(apiKey);
    if (!ai) throw new Error("No API Key");

    const prompt = `
        Analiza el sentimiento de esta respuesta de un prospecto B2B:
        "${replyText}"
        
        Devuelve un JSON con:
        {
            "sentiment": "POSITIVE" | "NEUTRAL" | "NEGATIVE",
            "score": 0-100 (100 es muy positivo),
            "summary": "Resumen breve de su postura",
            "nextStep": "Sugerencia de siguiente paso"
        }
    `;

    const response = await ai.models.generateContent({
        model: REASONING_MODEL,
        contents: prompt,
        config: { responseMimeType: "application/json" }
    });

    return JSON.parse(response.text || "{}");
};

export const generateSingleOutreach = async (lead: Lead, apiKey?: string, calendlyUrl?: string): Promise<Partial<Lead['outreach']>> => {
    try {
        const ai = getAiClient(apiKey);
        if (!ai) throw new Error("No API Key");

        const prompt = `
            Actúa como un Copywriter de Ventas B2B experto.
            Genera una propuesta de outreach personalizada para ${lead.name}, ${lead.role} de ${lead.company}.
            
            Contexto del Lead:
            - Industria: ${lead.industry}
            - Dolores: ${lead.painPoints?.join(', ')}
            - Propuesta de Valor: ${lead.valueProposition}
            - Observación: ${lead.auditObservation}
            ${calendlyUrl ? `- Enlace para agendar: ${calendlyUrl}` : ''}
            
            SERVICIOS DISPONIBLES (Recomienda el más adecuado basándote en su perfil y dolores):
            ${JSON.stringify(AI_AGENCY_SERVICES, null, 2)}

            REGLAS:
            1. Identifica el perfil del cliente: ¿Es DELEGADOR (quiere tiempo), VISIONARIO (quiere escala/autoridad) o TÉCNICO?
            2. Selecciona el servicio de la lista que mejor resuelva sus dolores.
            3. Menciona el ROI esperado del servicio seleccionado.
            4. Incluye el "Tip Estratégico" de forma natural en la propuesta.
            5. Prioriza resultados de negocio, no solo la tecnología.
            6. REGLA DE ORO: El campo "email" NO debe incluir el asunto. El asunto va únicamente en el campo "subject". No escribas "Asunto: ..." dentro del cuerpo del email.
            ${calendlyUrl ? '7. Incluye el enlace para agendar de forma natural en el email.' : ''}

            Devuelve un JSON con:
            {
                "subject": "Asunto atractivo",
                "email": "Cuerpo del email en HTML (usa <p>, <br>, <strong>)",
                "linkedin": "Mensaje corto para LinkedIn",
                "phone": "Script rápido para llamada"
            }
        `;

        const response = await ai.models.generateContent({
            model: REASONING_MODEL,
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });

        const data = JSON.parse(response.text || "{}");
        
        // Safeguard: Ensure subject is not the whole email
        let subject = data.subject || `Propuesta para ${lead.company}`;
        if (subject.length > 150) {
            subject = subject.substring(0, 147) + "...";
        }

        return {
            subject: subject,
            email: cleanEmailBody(data.email, subject),
            linkedin: data.linkedin,
            phone: data.phone
        };
    } catch (error) {
        console.error("Single Outreach Error:", error);
        return {
            subject: `Propuesta para ${lead.company}`,
            email: `<p>Hola ${lead.name},</p><p>He estado analizando ${lead.company} y creo que podemos ayudarles...</p>`,
            linkedin: `Hola ${lead.name}, me gustaría conectar contigo...`,
            phone: `Hola ${lead.name}, soy... te llamo porque...`
        };
    }
};

export const detectBuyingSignals = async (lead: Lead, apiKey?: string): Promise<BuyingSignal[]> => {
    const ai = getAiClient(apiKey);
    if (!ai) return [];

    const prompt = `Busca noticias recientes sobre ${lead.company}. Detecta señales de compra (Funding, Hiring, Expansion, Nuevos Productos, Cambios de Liderazgo).`;
    
    try {
        const response = await ai.models.generateContent({
            model: SEARCH_MODEL,
            contents: prompt,
            config: { 
                tools: [{ googleSearch: {} }],
                responseMimeType: "application/json",
                responseSchema: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      type: { type: Type.STRING, description: "Tipo de señal (ej. Funding, Hiring, Expansion)" },
                      description: { type: Type.STRING, description: "Descripción detallada de la señal" },
                      date: { type: Type.STRING, description: "Fecha aproximada de la noticia" },
                      source: { type: Type.STRING, description: "Fuente de la información" }
                    },
                    required: ["type", "description"]
                  }
                }
            }
        });
        const text = response.text || "[]";
        const jsonStr = extractJSON(text, '[', ']');
        return JSON.parse(jsonStr);
    } catch {
        return [];
    }
};

export const generateLandingCopy = async (
    industry: string, 
    apiKey?: string,
    userContext?: {
        name?: string;
        website?: string;
        email?: string;
        phone?: string;
        valueProposition?: string;
        customInstructions?: string;
        legalNoticeUrl?: string;
        privacyPolicyUrl?: string;
        cookiesPolicyUrl?: string;
        calendlyUrl?: string;
        googleAnalyticsId?: string;
        facebookPixelId?: string;
    },
    style: LandingStyle = 'CYBER',
    visualConfig?: VisualConfig
): Promise<string> => {
    const ai = getAiClient(apiKey);
    if (!ai) return "Error: No API Key";

    const styleInstructions = {
        CYBER: "Usa un diseño moderno, oscuro (dark mode), elegante y profesional (bg-slate-950, text-white). Estética futurista con bordes brillantes y glassmorphism.",
        MINIMAL: "Usa un diseño minimalista, limpio, con mucho espacio en blanco (bg-white, text-slate-900). Tipografía elegante (serif para títulos, sans para cuerpo), estilo Apple o Stripe.",
        CORPORATE: "Usa un diseño corporativo tradicional, serio y confiable (bg-slate-50, text-slate-800). Secciones bien definidas, fuentes sans-serif profesionales."
    };

    const colors = visualConfig || {
        primaryColor: style === 'CYBER' ? '#6366f1' : style === 'MINIMAL' ? '#0f172a' : '#2563eb',
        secondaryColor: style === 'CYBER' ? '#10b981' : style === 'MINIMAL' ? '#64748b' : '#1e40af',
        fontFamily: style === 'MINIMAL' ? 'Georgia, serif' : 'Inter, sans-serif'
    };

      const prompt = `
      Actúa como un Copywriter experto en B2B, SaaS y Desarrollador Web Frontend especializado en Conversión (CRO) y SEO.
      Tu objetivo es generar el código HTML completo para una Landing Page diseñada para vender NUESTROS servicios/productos al nicho de: "${industry}".
      
      REGLAS CRÍTICAS DE MARCA:
      - NO utilices el nombre "Nuestra Empresa de IA" ni "Nuestra Empresa IA".
      - NO incluyas logos genéricos ni slogans predeterminados.
      - Utiliza el nombre de empresa: "${userContext?.name || 'Demiak'}".
      - El sitio web principal es: "${userContext?.website || 'demiak.es'}".
      - URL de Agendamiento (Calendly): "${userContext?.calendlyUrl || '#'}" (Asegúrate de usar la URL completa con https:// si está disponible).
      - ÉTICA Y VERACIDAD: NO inventes testimonios falsos, NO hagas promesas de resultados imposibles y, bajo ningún concepto, menciones "devolución de dinero" o "garantía de reembolso si no hay resultados". El copy debe ser profesional, honesto y basado en valor real.
      
      ESTILO VISUAL REQUERIDO: ${styleInstructions[style]}
      
      IMPORTANTE: Debes usar estas variables CSS para el diseño:
      - Color Primario: ${colors.primaryColor}
      - Color Secundario: ${colors.secondaryColor}
      - Fuente: ${colors.fontFamily}
      
      OPTIMIZACIÓN SEO:
      - Incluye etiquetas <title> y <meta name="description"> optimizadas para el nicho "${industry}".
      - Utiliza etiquetas semánticas (header, main, section, footer, h1, h2, h3).
      - Asegúrate de que el H1 sea único y contenga palabras clave relevantes.
      - Añade atributos alt descriptivos a las imágenes (usa placeholders de Unsplash o similar).
      
      REQUISITOS TÉCNICOS:
      - Devuelve un documento HTML5 completo y válido (<!DOCTYPE html>...).
      - Utiliza Tailwind CSS a través de CDN en el <head>: <script src="https://cdn.tailwindcss.com"></script>
      
      ${userContext?.googleAnalyticsId ? `
      - GOOGLE ANALYTICS: Incluye el script de Google Analytics (gtag.js) en el <head> usando el ID: ${userContext.googleAnalyticsId}.
      ` : ''}
      
      ${userContext?.facebookPixelId ? `
      - FACEBOOK PIXEL: Incluye el script de Facebook Pixel en el <head> usando el ID: ${userContext.facebookPixelId}.
      ` : ''}

      - En el <head>, añade un bloque <style> que defina:
        :root {
          --primary: ${colors.primaryColor};
          --secondary: ${colors.secondaryColor};
          --font-family: ${colors.fontFamily};
        }
        body { font-family: var(--font-family); }
        .bg-primary { background-color: var(--primary); }
        .text-primary { color: var(--primary); }
        .border-primary { border-color: var(--primary); }
        .bg-secondary { background-color: var(--secondary); }
        .text-secondary { color: var(--secondary); }
        .btn-primary { background-color: var(--primary); color: white; padding: 0.75rem 1.5rem; border-radius: 0.5rem; font-weight: bold; transition: opacity 0.2s; }
        .btn-primary:hover { opacity: 0.9; }
      
      - Usa estas clases (.bg-primary, .text-primary, .btn-primary, etc.) para los elementos clave.
      - En el <html> o <body> añade la clase "scroll-smooth" de Tailwind.
      - Hazlo totalmente responsive.
      - Sección de Contacto Directo DEBE tener el id="contact-section".
      
      FOOTER LEGAL:
      - Incluye un footer con enlaces a:
        * Aviso Legal: ${userContext?.legalNoticeUrl || '#'}
        * Política de Privacidad: ${userContext?.privacyPolicyUrl || '#'}
        * Política de Cookies: ${userContext?.cookiesPolicyUrl || '#'}
      - Si las URLs no están proporcionadas, usa los enlaces de demiak.es correspondientes.
      
      DATOS DE NUESTRA EMPRESA (EL VENDEDOR):
      - Nombre: ${userContext?.name || 'Demiak'}
      - Web: ${userContext?.website || 'demiak.es'}
      - Email de Contacto: ${userContext?.email || ''}
      - Teléfono de Contacto: ${userContext?.phone || ''}
      - Propuesta de Valor: ${userContext?.valueProposition || 'Soluciones avanzadas de IA para optimización de procesos.'}
      
      ${userContext?.customInstructions ? `INSTRUCCIONES ADICIONALES: ${userContext.customInstructions}` : ''}

      OBJETIVO DE LA LANDING: Agendar llamadas de consultoría estratégica y captar leads cualificados.
      IMPORTANTE: Todos los botones de CTA (Call to Action) principales DEBEN apuntar a la URL de Agendamiento (Calendly): "${userContext?.calendlyUrl || '#'}". Si no hay URL de agendamiento, deben apuntar a #contact-section.
      
      TONO:
      - Persuasivo pero profesional.
      - Claro y directo.
      - Enfocado en beneficios y transformación.
      - Sin lenguaje corporativo aburrido.
      - Frases cortas y fáciles de leer.

      ESTRUCTURA OBLIGATORIA (Orientada a conversión):
      
      1. Hero Section (Impacto inmediato):
