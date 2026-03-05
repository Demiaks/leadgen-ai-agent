
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import { leadStorage, historyStorage, profileStorage } from '../services/storage';
import { generateLeads, deepDiveLead, sendToWebhook, predictBuyingIntent } from '../services/geminiService';
import { syncLeadToCrm } from '../services/crmService';
import { Lead, SearchCriteria, AppState, LeadStatus, Notification, UserProfile, SearchHistoryItem, LeadLog, SortOption, WarRoomMessage, DiscoveryCallFeedback } from '../types';

interface AppContextType {
    // Auth & Session
    session: any;
    isOfflineMode: boolean;
    setOfflineMode: (value: boolean) => void;
    logout: () => Promise<void>;
    
    // Data State
    leads: Lead[];
    setLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
    userProfile: UserProfile | null;
    setUserProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
    searchHistory: SearchHistoryItem[];
    setSearchHistory: React.Dispatch<React.SetStateAction<SearchHistoryItem[]>>;
    
    // UI State
    appState: AppState;
    setAppState: React.Dispatch<React.SetStateAction<AppState>>;
    theme: 'dark' | 'light';
    toggleTheme: () => void;
    selectedLeadIds: Set<string>;
    toggleSelectLead: (id: string) => void;
    toggleSelectAll: (filteredLeads: Lead[]) => void;
    clearSelection: () => void;
    activeLead: Lead | null;
    setActiveLead: React.Dispatch<React.SetStateAction<Lead | null>>;
    notifications: Notification[];
    addNotification: (message: string, type: Notification['type']) => void;
    removeNotification: (id: string) => void;
    
    // Actions
    handleSearch: (criteria: SearchCriteria) => Promise<void>;
    updateLead: (id: string, updates: Partial<Lead>) => void;
    deleteLead: (id: string) => void;
    handleDeepDive: (lead: Lead) => Promise<void>;
    handleCrmExport: (lead: Lead) => Promise<void>;
    handlePredictIntent: (lead: Lead) => Promise<void>;
    saveSettings: (profile: UserProfile) => Promise<void>;
    updateGamification: (xpGain: number, badgeId?: string) => Promise<void>;
    resetDashboard: () => void;
    
    // Helper References
    statusMessage: string;
    searchLogs: string[];
    isAdmin: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // --- STATE DEFINITIONS ---
    const [session, setSession] = useState<any>(null);
    const [isOfflineMode, setIsOfflineMode] = useState(false);
    const [leads, setLeads] = useState<Lead[]>([]);
    const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [appState, setAppState] = useState<AppState>(AppState.IDLE);
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');
    const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
    const [activeLead, setActiveLead] = useState<Lead | null>(null);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [statusMessage, setStatusMessage] = useState("");
    const [searchLogs, setSearchLogs] = useState<string[]>([]);
    const isAdmin = userProfile?.role === 'ADMIN';
    
    const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

    // --- NOTIFICATIONS ---
    const addNotification = useCallback((message: string, type: Notification['type'] = 'INFO') => {
        const id = `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        setNotifications(prev => [...prev, { id, message, type }]);
    }, []);

    const removeNotification = useCallback((id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    // --- AUTH & INIT ---
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') as 'dark' | 'light';
        if (savedTheme) {
            setTheme(savedTheme);
            if (savedTheme === 'light') {
                document.documentElement.classList.add('light');
            } else {
                document.documentElement.classList.remove('light');
            }
        }
    }, []);

    useEffect(() => {
        const initAuth = async () => {
            try {
                // Check if supabase client is valid or mock
                if (!supabase || (supabase as any).isMock) {
                    console.warn("Using Mock Supabase Client");
                    return;
                }
                const { data, error } = await supabase.auth.getSession();
                if (error) throw error;
                setSession(data.session);
            } catch (err) {
                console.log("Auth session check skipped/failed (Offline Mode ready)", err);
            }
        };
        initAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        if (!session && !isOfflineMode) return;

        const initData = async () => {
            try {
                const [loadedLeads, loadedHistory, loadedProfile] = await Promise.all([
                    leadStorage.getAll(),
                    historyStorage.getAll(),
                    profileStorage.get()
                ]);

                if (loadedLeads.length > 0) {
                    setLeads(loadedLeads);
                    setAppState(AppState.COMPLETE);
                }
                setSearchHistory(loadedHistory);

                // Gamification Streak Logic
                if (loadedProfile) {
                    const today = new Date().toDateString();
                    const lastLogin = loadedProfile.lastLoginDate;
                    let streak = loadedProfile.currentStreak || 0;
                    if (lastLogin !== today) {
                        const yesterday = new Date();
                        yesterday.setDate(yesterday.getDate() - 1);
                        if (lastLogin === yesterday.toDateString()) streak += 1;
                        else streak = 1;
                    }
                    
                    const updated: UserProfile = { 
                        ...loadedProfile, 
                        lastLoginDate: today, 
                        currentStreak: streak 
                    };

                    if (updated.email === 'desarrollodemiak@gmail.com') {
                        updated.role = 'ADMIN';
                    }

                    setUserProfile(updated);
                    await profileStorage.save(updated);
                } else {
                    const newProfile: UserProfile = { 
                        name: session?.user?.email?.split('@')[0] || 'Invitado', 
                        email: session?.user?.email || 'demo@offline.local', 
                        website: '', 
                        currentStreak: 1, 
                        lastLoginDate: new Date().toDateString(),
                        role: (session?.user?.email === 'desarrollodemiak@gmail.com') ? 'ADMIN' : 'USER'
                    };
                    setUserProfile(newProfile);
                    await profileStorage.save(newProfile);
                }
            } catch (e) {
                console.error("DB Error", e);
            }
        };
        initData();
    }, [session, isOfflineMode]);

    // --- PERSISTENCE ---
    useEffect(() => {
        if ((session || isOfflineMode) && leads.length > 0) leadStorage.saveAll(leads);
    }, [leads, session, isOfflineMode]);

    useEffect(() => {
        historyStorage.save(searchHistory);
    }, [searchHistory]);

    // --- ACTIONS ---

    const logout = async () => {
        if (isOfflineMode) {
            setIsOfflineMode(false);
            setLeads([]);
            setUserProfile(null);
            return;
        }
        await supabase.auth.signOut();
        setSession(null);
        setLeads([]);
    };

    const updateGamification = async (xpGain: number, badgeId?: string) => {
        if (!userProfile) return;
        
        let newXp = (userProfile.xp || 0) + xpGain;
        let newLevel = userProfile.level || 1;
        const nextLevelXp = newLevel * 1000;
        if (newXp >= nextLevelXp) {
            newLevel++;
            addNotification(`🎉 ¡Subiste de Nivel! Ahora eres Nivel ${newLevel}`, "SUCCESS");
        }
  
        let newBadges = userProfile.badges || [];
        if (badgeId && !newBadges.includes(badgeId)) {
            newBadges = [...newBadges, badgeId];
            addNotification(`🏅 ¡Nueva Medalla Desbloqueada!`, "SUCCESS");
        }
  
        const updatedProfile = { ...userProfile, xp: newXp, level: newLevel, badges: newBadges };
        setUserProfile(updatedProfile);
        await profileStorage.save(updatedProfile);
    };

    const handleSearch = async (criteria: SearchCriteria) => {
        timeoutsRef.current.forEach(clearTimeout);
        timeoutsRef.current = [];
    
        setAppState(AppState.SEARCHING);
        setStatusMessage("Inicializando agentes...");
        setSearchLogs(["[SISTEMA] Inicializando agentes de búsqueda..."]);
        setLeads([]); 
        setSelectedLeadIds(new Set());
        setActiveLead(null); 
    
        try {
          const addLog = (msg: string) => setSearchLogs(prev => [...prev, `[AGENTE] ${msg}`]);

          timeoutsRef.current.push(setTimeout(() => {
              setStatusMessage("Agente Investigador buscando empresas...");
              addLog("Agente Investigador activado. Buscando en Google Search...");
          }, 800));
          
          timeoutsRef.current.push(setTimeout(() => {
              setAppState(AppState.PROCESSING);
              addLog("Empresas encontradas. Iniciando análisis de perfiles...");
          }, 2000));
          
          timeoutsRef.current.push(setTimeout(() => {
              setStatusMessage("Agente Analista evaluando data...");
              addLog("Agente Analista evaluando propuesta de valor y calculando scores...");
          }, 2500));
    
          const results = await generateLeads(
              criteria, 
              userProfile?.apiKey,
              (msg) => {
                  addNotification(msg, 'WARNING');
                  addLog(`ADVERTENCIA: ${msg}`);
              },
              userProfile?.customInstructions,
              userProfile?.emailSignature,
              isOfflineMode,
              userProfile?.scoringWeights,
              userProfile?.calendlyUrl
          );
          
          addLog(`Búsqueda finalizada. ${results.length} prospectos procesados.`);
          
          timeoutsRef.current.forEach(clearTimeout);
          timeoutsRef.current = [];
    
          const sortedResults = results.sort((a, b) => b.qualificationScore - a.qualificationScore);
          setLeads(sortedResults);
          setAppState(AppState.COMPLETE);
          
          updateGamification(50, 'first_lead');
          if (results.length > 50) updateGamification(0, 'master_hunter');
          
          const historyItem: SearchHistoryItem = {
              id: `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
              timestamp: Date.now(),
              criteria: criteria,
              leadCount: sortedResults.length,
              leads: sortedResults
          };
          setSearchHistory(prev => [historyItem, ...prev].slice(0, 10));
    
          addNotification(`¡Éxito! ${results.length} prospectos encontrados`, "SUCCESS");
        } catch (err: any) {
          timeoutsRef.current.forEach(clearTimeout);
          timeoutsRef.current = [];
          console.error(err);
          setAppState(AppState.ERROR);
          addNotification("Búsqueda interrumpida: " + err.message, "ERROR");
        }
    };

    const updateLead = useCallback(async (id: string, updates: Partial<Lead>) => {
        setLeads(prev => prev.map(lead => {
            if (lead.id === id) {
                let newHistory = lead.history || [];
                if (updates.status && updates.status !== lead.status) {
                    const log: LeadLog = { 
                        id: `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`, 
                        timestamp: Date.now(), 
                        action: `Status changed to ${updates.status}`, 
                        user: 'User' 
                    };
                    newHistory = [...newHistory, log];
                    if (updates.status === LeadStatus.QUALIFIED) updateGamification(50, 'closer');
                }
                const updatedLead = { 
                    ...lead, 
                    ...updates, 
                    outreach: updates.outreach ? { ...lead.outreach, ...updates.outreach } : lead.outreach,
                    history: newHistory 
                };
                leadStorage.update(updatedLead);
                return updatedLead;
            }
            return lead;
        }));
        
        // Also update active lead if it matches
        setActiveLead(prev => {
            if (prev && prev.id === id) {
                return { 
                    ...prev, 
                    ...updates, 
                    outreach: updates.outreach ? { ...prev.outreach, ...updates.outreach } : prev.outreach 
                };
            }
            return prev;
        });
    }, [userProfile]); 

    const deleteLead = useCallback((id: string) => {
        if (window.confirm("¿Eliminar prospecto?")) {
          setLeads(prev => prev.filter(lead => lead.id !== id));
          setSelectedLeadIds(prev => { const n = new Set(prev); n.delete(id); return n; });
          setActiveLead(prev => (prev && prev.id === id) ? null : prev);
          leadStorage.delete(id);
          addNotification("Prospecto eliminado", "INFO");
        }
    }, []);

    const handleDeepDive = async (lead: Lead) => {
        try {
            const updates = await deepDiveLead(lead, userProfile?.apiKey, isOfflineMode);
            updateLead(lead.id, updates);
            updateGamification(20); 
        } catch (e: any) {
            addNotification("Error Deep Dive", "ERROR");
            throw e; 
        }
    };

    const handleCrmExport = async (lead: Lead) => {
        if (!userProfile) {
            addNotification("Perfil no cargado", "ERROR");
            return;
        }
        if (!userProfile.hubspotKey && !userProfile.salesforceKey && !userProfile.webhookUrl) {
            addNotification("Configura un CRM en Ajustes primero", "WARNING");
            return;
        }

        try {
            const updatedLead = await syncLeadToCrm(lead, userProfile);
            updateLead(lead.id, updatedLead);
            addNotification(`Sincronizado con ${updatedLead.crmSync?.platform}`, "SUCCESS");
            updateGamification(30);
        } catch (e: any) {
            addNotification(`Error CRM: ${e.message}`, "ERROR");
        }
    };

    const handlePredictIntent = async (lead: Lead) => {
        try {
            const result = await predictBuyingIntent(lead, userProfile?.apiKey);
            updateLead(lead.id, { intentScore: result.score, intentReason: result.reason });
            addNotification("Intención de compra analizada", "SUCCESS");
            updateGamification(10);
        } catch (e) {
            addNotification("Error analizando intención", "ERROR");
        }
    };

    const saveSettings = async (profile: UserProfile) => {
        const updatedProfile = {
            ...profile,
            xp: userProfile?.xp || 0,
            level: userProfile?.level || 1,
            currentStreak: userProfile?.currentStreak || 1,
            lastLoginDate: userProfile?.lastLoginDate || new Date().toDateString(),
            badges: userProfile?.badges || []
        };
        setUserProfile(updatedProfile);
        await profileStorage.save(updatedProfile);
        addNotification("Configuración guardada", "SUCCESS");
    };

    const resetDashboard = () => {
        timeoutsRef.current.forEach(clearTimeout);
        timeoutsRef.current = [];
        setAppState(AppState.IDLE);
        setLeads([]);
        setSelectedLeadIds(new Set());
        setActiveLead(null);
        addNotification("Tablero reiniciado", "INFO");
    };

    const toggleSelectLead = useCallback((id: string) => {
        setSelectedLeadIds(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
    }, []);

    const toggleSelectAll = (filteredLeads: Lead[]) => {
        if (selectedLeadIds.size === filteredLeads.length) setSelectedLeadIds(new Set());
        else setSelectedLeadIds(new Set(filteredLeads.map(l => l.id)));
    };

    const clearSelection = () => setSelectedLeadIds(new Set());

    const toggleTheme = useCallback(() => {
        setTheme(prev => {
            const next = prev === 'dark' ? 'light' : 'dark';
            localStorage.setItem('theme', next);
            if (next === 'light') {
                document.documentElement.classList.add('light');
            } else {
                document.documentElement.classList.remove('light');
            }
            return next;
        });
    }, []);

    return (
        <AppContext.Provider value={{
            session, isOfflineMode, setOfflineMode: setIsOfflineMode, logout,
            leads, setLeads, userProfile, setUserProfile, searchHistory, setSearchHistory,
            appState, setAppState, theme, toggleTheme, selectedLeadIds, toggleSelectLead, toggleSelectAll, clearSelection,
            activeLead, setActiveLead, notifications, addNotification, removeNotification,
            handleSearch, updateLead, deleteLead, handleDeepDive, handleCrmExport, handlePredictIntent, saveSettings, updateGamification, resetDashboard,
            statusMessage, searchLogs, isAdmin
        }}>
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
};
