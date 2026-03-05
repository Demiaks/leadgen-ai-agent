
import { createClient } from '@supabase/supabase-js';

// Safe environment variable access for Browser (Vite) and Legacy (Process) environments
const getEnv = (key: string, viteKey: string): string | undefined => {
  try {
    // Check Vite import.meta
    if (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env[viteKey]) {
      return (import.meta as any).env[viteKey];
    }
    // Check global Process (Node/Webpack)
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key];
    }
  } catch (e) {
    // Ignore reference errors
  }
  return undefined;
};

// Default fallback values to prevent hard crash on init
export const SUPABASE_URL = getEnv('REACT_APP_SUPABASE_URL', 'VITE_SUPABASE_URL') || 'https://placeholder-project.supabase.co';
const SUPABASE_ANON_KEY = getEnv('REACT_APP_SUPABASE_ANON_KEY', 'VITE_SUPABASE_ANON_KEY') || 'placeholder-key';

const FORCE_MOCK = localStorage.getItem('force_mock_mode') === 'true';

let client;

try {
    // Attempt to create real client if URL is valid and not forced mock
    if (SUPABASE_URL && !SUPABASE_URL.includes('placeholder') && !FORCE_MOCK) {
        client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: {
                autoRefreshToken: true,
                persistSession: true,
                detectSessionInUrl: true,
                // Use a custom storage key to avoid collisions
                storageKey: 'leadgen-ai-auth-token',
            }
        });
    }
} catch (error) {
    console.warn("⚠️ Supabase initialization failed. Using Mock Client for Offline Mode.", error);
}

// --- STATEFUL MOCK CLIENT ---
if (!client || SUPABASE_URL.includes('placeholder') || FORCE_MOCK) {
    console.warn("⚠️ Running in Mock Mode");

    const MOCK_SESSION_KEY = 'mock_supabase_session';
    const MOCK_USERS_KEY = 'mock_supabase_users';
    const listeners = new Set<Function>();

    const getMockUsers = (): any[] => {
        try {
            const stored = localStorage.getItem(MOCK_USERS_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch { return []; }
    };

    const saveMockUser = (user: any) => {
        const users = getMockUsers();
        users.push(user);
        localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users));
    };

    const getMockSession = () => {
        try {
            const stored = localStorage.getItem(MOCK_SESSION_KEY);
            return stored ? JSON.parse(stored) : null;
        } catch { return null; }
    };

    const setMockSession = (session: any) => {
        if (session) localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(session));
        else localStorage.removeItem(MOCK_SESSION_KEY);
        
        listeners.forEach(cb => cb('SIGNED_IN', session));
    };

    client = {
        auth: {
            getSession: async () => ({ data: { session: getMockSession() }, error: null }),
            getUser: async () => ({ data: { user: getMockSession()?.user || null }, error: null }),
            onAuthStateChange: (callback: Function) => {
                listeners.add(callback);
                callback('INITIAL_SESSION', getMockSession());
                return { data: { subscription: { unsubscribe: () => listeners.delete(callback) } } };
            },
            signInWithPassword: async ({ email, password }: any) => {
                const users = getMockUsers();
                const user = users.find(u => u.email === email);
                
                if (!user) {
                    return { data: { user: null, session: null }, error: { message: 'Usuario no encontrado' } };
                }
                
                if (user.password !== password) {
                    return { data: { user: null, session: null }, error: { message: 'Contraseña incorrecta' } };
                }

                const session = { access_token: 'mock-token-' + Math.random(), user: { id: user.id, email: user.email } };
                setMockSession(session);
                return { data: { user: session.user, session }, error: null };
            },
            signUp: async ({ email, password }: any) => {
                const users = getMockUsers();
                if (users.find(u => u.email === email)) {
                    return { data: { user: null, session: null }, error: { message: 'El usuario ya existe' } };
                }

                const newUser = { id: 'user-' + Math.random().toString(36).substr(2, 9), email, password };
                saveMockUser(newUser);
                
                const session = { access_token: 'mock-token-' + Math.random(), user: { id: newUser.id, email: newUser.email } };
                setMockSession(session);
                return { data: { user: session.user, session }, error: null };
            },
            signOut: async () => {
                setMockSession(null);
                listeners.forEach(cb => cb('SIGNED_OUT', null));
                return { error: null };
            },
        },
        from: () => ({
            select: () => ({ 
                eq: () => ({ 
                    single: async () => ({ data: null, error: null }), 
                    maybeSingle: async () => ({ data: null, error: null }) 
                }),
                order: () => ({ data: [], error: null })
            }),
            upsert: async () => ({ error: null }),
            delete: async () => ({ eq: async () => ({ error: null }) })
        })
    } as any;
}

export const supabase = client;
