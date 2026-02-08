
import { Lead, SearchHistoryItem, UserProfile, EmailTemplate } from '../types';
import { supabase, SUPABASE_URL } from './supabaseClient';

// --- HELPERS ---

// Verifica si Supabase está configurado con una URL real (no placeholder)
const isSupabaseConfigured = () => {
    return SUPABASE_URL && 
           SUPABASE_URL !== 'https://tu-proyecto.supabase.co' && 
           SUPABASE_URL !== 'AQUI_TU_URL_DE_SUPABASE' &&
           !SUPABASE_URL.includes('your-project');
};

// Local Storage Helpers
const local = {
    get: <T>(key: string, def: T): T => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : def;
        } catch { return def; }
    },
    set: (key: string, data: any) => {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (e) { console.error("Local storage error", e); }
    }
};

const KEYS = {
    LEADS: 'app_leads_v1',
    PROFILE: 'app_profile_v1',
    HISTORY: 'app_history_v1',
    TEMPLATES: 'app_templates_v1'
};

// --- STORAGE SERVICES ---

export const leadStorage = {
    getAll: async (): Promise<Lead[]> => {
        // Siempre intentamos cargar local primero para velocidad
        const localLeads = local.get<Lead[]>(KEYS.LEADS, []);

        if (!isSupabaseConfigured()) return localLeads;

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return localLeads;

            const { data, error } = await supabase
                .from('leads')
                .select('*')
                .eq('user_id', user.id);
            
            if (error) throw error;
            
            // Map SQL (snake_case) to Frontend (camelCase)
            const dbLeads = data.map((row: any) => ({
                id: row.id,
                name: row.name,
                company: row.company,
                role: row.role,
                status: row.status,
                qualificationScore: row.qualification_score,
                techStack: row.tech_stack || [],
                outreach: row.outreach_data || {},
                seoAnalysis: row.seo_analysis || undefined,
                painPoints: row.pain_points || [],
                emailGuess: row.contact_info?.email,
                phone: row.contact_info?.phone,
                linkedinUrl: row.contact_info?.linkedin,
                address: row.contact_info?.address,
                sourceUrl: row.contact_info?.sourceUrl,
                reasoning: row.reasoning,
                auditObservation: row.audit_observation,
                isDeepDived: row.is_deep_dived,
                notes: row.notes || [],
                history: row.history_log || []
            }));

            // Sync local with DB (DB wins)
            local.set(KEYS.LEADS, dbLeads);
            return dbLeads;

        } catch (error) {
            console.warn("⚠️ Usando modo offline para Leads (Error DB o Conexión)", error);
            return localLeads;
        }
    },

    saveAll: async (leads: Lead[]) => {
        // 1. Guardar localmente siempre
        local.set(KEYS.LEADS, leads);

        if (!isSupabaseConfigured()) return;

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Transform to SQL format
            const rows = leads.map(lead => ({
                id: lead.id.length > 36 ? undefined : lead.id, // Only send UUIDs if valid, else let DB gen
                user_id: user.id,
                name: lead.name,
                company: lead.company,
                role: lead.role,
                status: lead.status,
                qualification_score: lead.qualificationScore,
                tech_stack: lead.techStack,
                outreach_data: lead.outreach,
                seo_analysis: lead.seoAnalysis,
                pain_points: lead.painPoints,
                contact_info: {
                    email: lead.emailGuess,
                    phone: lead.phone,
                    linkedin: lead.linkedinUrl,
                    address: lead.address,
                    sourceUrl: lead.sourceUrl
                },
                reasoning: lead.reasoning,
                audit_observation: lead.auditObservation,
                is_deep_dived: lead.isDeepDived,
                notes: lead.notes,
                history_log: lead.history
            }));

            const { error } = await supabase.from('leads').upsert(rows, { onConflict: 'id' });
            if (error) throw error;

        } catch (error) {
            console.error("Error syncing leads to DB (Data saved locally)", error);
        }
    },

    update: async (lead: Lead) => {
        // Update local state by fetching, modifying, saving
        const current = local.get<Lead[]>(KEYS.LEADS, []);
        const updated = current.map(l => l.id === lead.id ? lead : l);
        local.set(KEYS.LEADS, updated);

        if (!isSupabaseConfigured()) return;
        
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const row = {
                id: lead.id,
                user_id: user.id,
                name: lead.name,
                company: lead.company,
                role: lead.role,
                status: lead.status,
                qualification_score: lead.qualificationScore,
                tech_stack: lead.techStack,
                outreach_data: lead.outreach,
                seo_analysis: lead.seoAnalysis,
                pain_points: lead.painPoints,
                contact_info: {
                    email: lead.emailGuess,
                    phone: lead.phone,
                    linkedin: lead.linkedinUrl,
                    address: lead.address,
                    sourceUrl: lead.sourceUrl
                },
                reasoning: lead.reasoning,
                audit_observation: lead.auditObservation,
                is_deep_dived: lead.isDeepDived,
                notes: lead.notes,
                history_log: lead.history
            };

            const { error } = await supabase.from('leads').upsert(row);
            if (error) throw error;
        } catch (e) {
            console.error("Error updating lead in DB:", e);
        }
    },

    delete: async (id: string) => {
        const current = local.get<Lead[]>(KEYS.LEADS, []);
        local.set(KEYS.LEADS, current.filter(l => l.id !== id));

        if (!isSupabaseConfigured()) return;
        try {
            await supabase.from('leads').delete().eq('id', id);
        } catch (e) { console.error("Error deleting lead from DB:", e); }
    }
};

export const historyStorage = {
    getAll: async (): Promise<SearchHistoryItem[]> => {
        return local.get(KEYS.HISTORY, []);
    },
    save: async (history: SearchHistoryItem[]) => {
        local.set(KEYS.HISTORY, history);
    }
};

export const templateStorage = {
    getAll: async (): Promise<EmailTemplate[]> => {
        return local.get(KEYS.TEMPLATES, []);
    },
    save: async (templates: EmailTemplate[]) => {
        local.set(KEYS.TEMPLATES, templates);
    },
    add: async (template: EmailTemplate) => {
        const current = local.get<EmailTemplate[]>(KEYS.TEMPLATES, []);
        local.set(KEYS.TEMPLATES, [...current, template]);
    },
    delete: async (id: string) => {
        const current = local.get<EmailTemplate[]>(KEYS.TEMPLATES, []);
        local.set(KEYS.TEMPLATES, current.filter(t => t.id !== id));
    }
};

export const profileStorage = {
    get: async (): Promise<UserProfile | null> => {
        const localProfile = local.get<UserProfile | null>(KEYS.PROFILE, null);
        
        if (!isSupabaseConfigured()) return localProfile;
        
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return localProfile;

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (error) throw error;
            if (!data) return localProfile;

            const dbProfile = {
                name: data.name,
                email: data.email,
                website: data.website,
                apiKey: data.api_key,
                gamification: data.gamification, 
                ...(data.gamification || {}), 
                ...(data.settings || {}) // Spread settings if they exist
            } as UserProfile;
            
            local.set(KEYS.PROFILE, dbProfile);
            return dbProfile;

        } catch (e) {
            console.warn("⚠️ Usando perfil local (Error DB)", e);
            return localProfile;
        }
    },
    save: async (profile: UserProfile) => {
        local.set(KEYS.PROFILE, profile);

        if (!isSupabaseConfigured()) return;
        
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const updates = {
                id: user.id,
                name: profile.name,
                email: profile.email,
                website: profile.website,
                api_key: profile.apiKey,
                gamification: {
                    xp: profile.xp,
                    level: profile.level,
                    currentStreak: profile.currentStreak,
                    lastLoginDate: profile.lastLoginDate,
                    badges: profile.badges
                },
                settings: {
                    customInstructions: profile.customInstructions,
                    emailSignature: profile.emailSignature,
                    webhookUrl: profile.webhookUrl,
                    landingPage: profile.landingPage,
                    jobTitle: profile.jobTitle,
                    hubspotKey: profile.hubspotKey,
                    salesforceKey: profile.salesforceKey,
                    scoringWeights: profile.scoringWeights
                },
                updated_at: new Date()
            };

            const { error } = await supabase.from('profiles').upsert(updates);
            if (error) {
                // Check specifically for the "missing column" error (PGRST204 or 42703)
                if (error.code === 'PGRST204' || error.message?.includes('settings')) {
                    console.error("⚠️ Error de Schema en Base de Datos: Falta columna 'settings'. Ejecuta el script SQL de migración.");
                } else {
                    console.error("Error saving profile to DB:", error);
                }
                throw error;
            }
        } catch (e) {
            console.warn("Profile saved LOCALLY only due to DB error.");
        }
    }
};
