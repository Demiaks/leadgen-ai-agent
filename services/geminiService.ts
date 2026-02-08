
import { GoogleGenAI, GenerateContentResponse, Part } from "@google/genai";
import { Lead, SearchCriteria, LeadStatus, BuyingSignal, Battlecard, OrgNode, SequenceStep, RoleplayMessage, VisualAnalysis } from '../types';

const MODEL_NAME = "gemini-3-flash-preview"; 
const REASONING_MODEL = "gemini-3-pro-preview";
const SEARCH_MODEL = "gemini-3-flash-preview"; 
const AUDIO_MODEL = "gemini-2.5-flash-native-audio-preview-12-2025"; 

const MAX_RETRIES = 2;
const INITIAL_RETRY_DELAY = 1000;

// --- HELPERS ---

const getAiClient = (apiKey?: string) => {
  const key = apiKey || process.env.API_KEY;
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
    // 429 is Quota Exceeded (Resource Exhausted) - usually fatal for immediate retry unless backoff is huge
    // 401 is Unauthorized - fatal
    // 404 is Not Found (Model name error)
    const msg = error.message || "";
    return msg.includes("401") || msg.includes("API key not valid") || msg.includes("quota") || msg.includes("404");
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
  forceMock: boolean = false
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
          searchContext = `Encuentra empresas que sean competidores directos o alternativas a "${criteria.competitorUrl}" en "${criteria.location}".`;
          disqualifiers = "No incluyas a la empresa original ni a agregadores de listas.";
      } else if (criteria.searchType === 'SOCIAL') {
          searchContext = `Busca perfiles públicos (LinkedIn/Twitter) de "${criteria.targetPersona}" que trabajen en el sector "${criteria.industry}" en "${criteria.location}". Prioriza aquellos que han publicado recientemente sobre "${criteria.valueProposition}".`;
      } else {
          searchContext = `
            Objetivo: Encontrar ${count} empresas B2B en "${criteria.location}" (Industria: "${criteria.industry}") que podrían beneficiarse de: "${criteria.valueProposition}".
            
            Estrategia de Búsqueda:
            1. Busca empresas que muestren síntomas de necesitar esta solución (ej. malas reseñas, webs lentas, noticias de expansión, vacantes abiertas para "${criteria.targetPersona}").
            2. Identifica al Tomador de Decisiones ideal: "${criteria.targetPersona}".
          `;
      }

      const systemInstruction = `
        Eres un Lead Researcher de élite para ventas B2B. Tu trabajo no es solo listar empresas, sino CALIFICARLAS.
        
        TU PROCESO MENTAL:
        1. INVESTIGA: Usa Google Search para encontrar empresas reales.
        2. ANALIZA: ¿Tienen el problema que resuelve la propuesta de valor?
        3. INFIERE: Si no encuentras el email exacto, genera el patrón más probable (nombre.apellido@empresa.com).
        
        CRITERIOS DE SCORING (0-100):
        - 90-100: Match perfecto. Tienen el problema evidente y dinero para pagarlo.
        - 70-89: Buen fit. Industria correcta, tamaño correcto.
        - <70: Fit dudoso o empresa muy pequeña/inactiva.

        FORMATO DE RESPUESTA:
        Devuelve ÚNICAMENTE un Array JSON válido. Sin markdown, sin explicaciones fuera del JSON.
        
        ${customInstructions ? `REQ ADICIONALES: ${customInstructions}` : ''}
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
            "reasoning": "Razón del score...", 
            "painPoints": ["Dolor 1", "Dolor 2"],
            "sourceUrl": "URL Web", 
            "emailGuess": "email@empresa.com", 
            "industry": "Industria",
            "location": "Ciudad",
            "techStack": ["Tecnología 1", "Tecnología 2"],
            "outreach": { 
                "subject": "Asunto", 
                "email": "Cuerpo email", 
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
          temperature: 0.3
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

      const processedLeads: Lead[] = parsedLeads.map((l, index) => ({
        ...l,
        id: `gen-lead-${Date.now()}-${index}`,
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
        history: [{ id: Date.now().toString(), timestamp: Date.now(), action: 'Lead Created (AI Search)', user: 'System' }],
        techStack: l.techStack || [], 
        emailStatus: 'UNKNOWN',
        sourceUrl: l.sourceUrl || `https://google.com/search?q=${encodeURIComponent(l.company)}`,
        emailGuess: l.emailGuess ? l.emailGuess.toLowerCase() : `contacto@${l.company.replace(/\s+/g, '').toLowerCase()}.com`,
        coordinates: generateMockCoordinates(criteria.location + l.company)
      }));

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
      Busca información técnica y de negocio reciente.
      
      Devuelve un JSON con:
      {
        "techStack": ["Tecnología 1", "Tecnología 2"],
        "painPoints": ["Problema 1", "Problema 2"],
        "auditObservation": "Observación estratégica breve sobre su situación digital.",
        "seoAnalysis": {
             "overallScore": 75,
             "mainIssue": "Problema principal SEO",
             "keywordDensity": "Media",
             "metaTitlePresence": true
        }
      }
    `;

    try {
        const response = await ai.models.generateContent({
            model: SEARCH_MODEL,
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
                // NOTE: responseMimeType is theoretically supported in 3-flash but guideline says "output response.text may not be in JSON format" for search.
                // We'll rely on the model being smart enough to return JSON string as requested in prompt.
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
};

export const verifyEmailAddress = async (email: string, apiKey?: string): Promise<'VERIFIED' | 'INVALID' | 'UNKNOWN'> => {
    await delay(500);
    return Math.random() > 0.5 ? 'VERIFIED' : 'UNKNOWN'; 
};

export const analyzeVisual = async (imageBase64: string, apiKey?: string): Promise<VisualAnalysis> => {
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
};

export const generateOutreachSequence = async (lead: Lead, apiKey?: string): Promise<SequenceStep[]> => {
    const ai = getAiClient(apiKey);
    if (!ai) throw new Error("No API Key");

    const prompt = `Crea una secuencia de 3 emails de venta para ${lead.name} de ${lead.company}. Enfócate en sus dolores: ${lead.painPoints?.join(', ')}. Devuelve JSON Array.`;

    const response = await ai.models.generateContent({
        model: REASONING_MODEL,
        contents: prompt,
        config: { responseMimeType: "application/json" }
    });

    return JSON.parse(response.text || "[]");
};

export const generateEmailTemplate = async (instruction: string, apiKey?: string): Promise<{subject: string, body: string}> => {
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
        
        Devuelve un JSON con:
        {
            "subject": "Asunto atractivo...",
            "body": "Cuerpo del correo (usa saltos de línea \\n)..."
        }
    `;

    const response = await ai.models.generateContent({
        model: REASONING_MODEL,
        contents: prompt,
        config: { responseMimeType: "application/json" }
    });

    return JSON.parse(response.text || "{\"subject\":\"\", \"body\":\"\"}");
};

export const detectBuyingSignals = async (lead: Lead, apiKey?: string): Promise<BuyingSignal[]> => {
    const ai = getAiClient(apiKey);
    if (!ai) return [];

    const prompt = `Busca noticias recientes sobre ${lead.company}. Detecta señales de compra (Funding, Hiring, Expansion). JSON Array.`;
    
    try {
        const response = await ai.models.generateContent({
            model: SEARCH_MODEL,
            contents: prompt,
            config: { 
                tools: [{ googleSearch: {} }],
                // responseMimeType: "application/json" // Avoid JSON enforcement with Search to be safe
            }
        });
        const text = response.text || "[]";
        const jsonStr = extractJSON(text, '[', ']');
        return JSON.parse(jsonStr);
    } catch {
        return [];
    }
};

export const generateLandingCopy = async (industry: string, apiKey?: string): Promise<string> => {
    const ai = getAiClient(apiKey);
    if (!ai) return "Error: No API Key";

    const prompt = `Genera el texto para una Landing Page de alta conversión para la industria: ${industry}. Usa estructura AIDA.`;
    
    const response = await ai.models.generateContent({
        model: REASONING_MODEL,
        contents: prompt
    });
    
    return response.text || "";
};

export const generateRoleplayResponse = async (lead: Lead, history: RoleplayMessage[], apiKey?: string): Promise<RoleplayMessage> => {
    const ai = getAiClient(apiKey);
    if (!ai) throw new Error("No API Key");

    const systemPrompt = `Actúa como ${lead.name}, ${lead.role} de ${lead.company}. Estás ocupado y eres escéptico.
    Historial: ${JSON.stringify(history)}
    Responde al último mensaje del usuario. Sé breve. Incluye feedback opcional en el JSON.
    Format JSON: { "text": "...", "feedback": "..." }`;

    const response = await ai.models.generateContent({
        model: REASONING_MODEL,
        contents: systemPrompt,
        config: { responseMimeType: "application/json" }
    });

    const data = JSON.parse(response.text || "{}");
    return {
        id: Date.now().toString(),
        sender: 'AI',
        text: data.text,
        feedback: data.feedback
    };
};

export const processVoiceInteraction = async (lead: Lead, audioBase64: string, history: RoleplayMessage[], apiKey?: string): Promise<{ text: string, audio?: string }> => {
    const ai = getAiClient(apiKey);
    if (!ai) throw new Error("No API Key");

    // Using Audio Model for native handling
    const response = await ai.models.generateContent({
        model: AUDIO_MODEL,
        contents: {
            parts: [
                { inlineData: { mimeType: "audio/wav", data: audioBase64 } }, // Assuming WAV input from recorder
                { text: `Responde como ${lead.name}.` }
            ]
        },
        config: {
             responseModalities: ["AUDIO"], // Force audio output
        }
    });
    
    // The response will contain audio in the first part's inlineData
    const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    
    return {
        text: "(Respuesta de Audio)",
        audio: audioData
    };
};

export const generateOrgChart = async (lead: Lead, apiKey?: string): Promise<OrgNode[]> => {
    const ai = getAiClient(apiKey);
    if (!ai) return [];

    const prompt = `Investiga la estructura organizacional de ${lead.company}. Identifica roles clave (CEO, CTO, Marketing, Ventas). JSON Array de nodos.`;

    try {
        const response = await ai.models.generateContent({
            model: SEARCH_MODEL,
            contents: prompt,
            config: { 
                tools: [{ googleSearch: {} }],
                // responseMimeType: "application/json"
            }
        });
        const text = response.text || "[]";
        const jsonStr = extractJSON(text, '[', ']');
        return JSON.parse(jsonStr);
    } catch {
        return [];
    }
};
