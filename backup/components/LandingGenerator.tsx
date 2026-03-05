import React, { useState, useEffect } from 'react';
import { generateLandingCopy } from '../services/geminiService';
import { SparklesIcon, LayoutIcon, CopyIcon, LinkIcon, FileTextIcon, TrashIcon, CheckIcon, ArrowRightIcon, BoltIcon, ChartBarIcon, ShieldCheckIcon, DownloadIcon, PaletteIcon, GlobeIcon, RocketIcon, SaveIcon } from './Icons';
import { Notification, SavedLandingPage, UserProfile, LandingStyle, VisualConfig } from '../types';
import axios from 'axios';

interface LandingGeneratorProps {
  addNotification: (message: string, type: Notification['type']) => void;
  apiKey?: string; // Accept API Key
  userProfile: UserProfile | null;
  saveSettings: (profile: UserProfile) => Promise<void>;
}

const LandingGenerator: React.FC<LandingGeneratorProps> = ({ addNotification, apiKey, userProfile, saveSettings }) => {
  const [industry, setIndustry] = useState('');
  const [valueProposition, setValueProposition] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [landingStyle, setLandingStyle] = useState<LandingStyle>('CYBER');
  const [objective, setObjective] = useState('agendar llamadas');
  const [generatedContent, setGeneratedContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showVisualEditor, setShowVisualEditor] = useState(false);
  const [currentLandingId, setCurrentLandingId] = useState<string | null>(null);
  const [savedLandings, setSavedLandings] = useState<SavedLandingPage[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  const [customSlug, setCustomSlug] = useState('');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);

  const addDebugLog = (msg: string) => {
    setDebugLogs(prev => [msg, ...prev].slice(0, 5));
    console.log("DEBUG:", msg);
  };

  const [visualConfig, setVisualConfig] = useState<VisualConfig>({
    primaryColor: '#6366f1',
    secondaryColor: '#10b981',
    fontFamily: 'Inter, sans-serif'
  });

  useEffect(() => {
    if (userProfile?.savedLandingPages) {
      setSavedLandings(userProfile.savedLandingPages);
    }
    if (userProfile?.valueProposition) {
      setValueProposition(userProfile.valueProposition);
    }
    if (userProfile?.email) {
      setContactEmail(userProfile.email);
    }
  }, [userProfile]);

  const updateHtmlWithVisuals = (html: string, config: VisualConfig) => {
    const rootStyle = `:root {
          --primary: ${config.primaryColor};
          --secondary: ${config.secondaryColor};
          --font-family: ${config.fontFamily};
        }`;
    
    // Replace the :root block in the HTML
    return html.replace(/:root\s*\{[^}]*\}/, rootStyle);
  };

  const handleVisualChange = (field: keyof VisualConfig, value: string) => {
    const newConfig = { ...visualConfig, [field]: value };
    setVisualConfig(newConfig);
    if (generatedContent) {
        setGeneratedContent(updateHtmlWithVisuals(generatedContent, newConfig));
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!industry.trim()) {
      addNotification("Por favor ingresa una industria", "ERROR");
      return;
    }

    setIsLoading(true);
    setPublishedUrl(null);
    try {
      // Use current visual config or defaults based on style
      const initialVisuals = {
        primaryColor: landingStyle === 'CYBER' ? '#6366f1' : landingStyle === 'MINIMAL' ? '#0f172a' : '#2563eb',
        secondaryColor: landingStyle === 'CYBER' ? '#10b981' : landingStyle === 'MINIMAL' ? '#64748b' : '#1e40af',
        fontFamily: landingStyle === 'MINIMAL' ? 'Georgia, serif' : 'Inter, sans-serif'
      };
      setVisualConfig(initialVisuals);

      const content = await generateLandingCopy(industry, apiKey, {
        name: userProfile?.name,
        website: userProfile?.website || 'demiak.es',
        email: contactEmail || userProfile?.email,
        phone: contactPhone,
        valueProposition: valueProposition || userProfile?.valueProposition,
        customInstructions: `${customPrompt ? `PROMPT MANUAL: ${customPrompt}. ` : ''}${userProfile?.customInstructions || ''}. OBJETIVO PRINCIPAL: ${objective}`,
        legalNoticeUrl: userProfile?.legalNoticeUrl,
        privacyPolicyUrl: userProfile?.privacyPolicyUrl,
        cookiesPolicyUrl: userProfile?.cookiesPolicyUrl,
        calendlyUrl: userProfile?.calendlyUrl,
        googleAnalyticsId: userProfile?.googleAnalyticsId,
        facebookPixelId: userProfile?.facebookPixelId
      }, landingStyle, initialVisuals);
      setGeneratedContent(content);
      setIsEditing(false);
      setCurrentLandingId(null);
      setCustomSlug(industry.toLowerCase().replace(/\s+/g, '-'));
      addNotification("Copy generado exitosamente", "SUCCESS");
    } catch (error) {
      addNotification("Error al generar el contenido", "ERROR");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!generatedContent) return;
    setIsPublishing(true);
    try {
        const slug = customSlug || `${userProfile?.name?.toLowerCase().replace(/\s+/g, '-') || 'user'}-${industry.toLowerCase().replace(/\s+/g, '-')}`;
        const response = await axios.post('/api/publish-landing', {
            html: generatedContent,
            slug,
            deploymentConfig: userProfile?.deploymentConfig
        });
        setPublishedUrl(response.data.url);
        addNotification("Landing publicada con éxito!", "SUCCESS");
        
        // Update saved landing with published URL if it exists
        if (currentLandingId && userProfile) {
            const updatedLandings = savedLandings.map(l => 
                l.id === currentLandingId ? { ...l, publishedUrl: response.data.url } : l
            );
            await saveSettings({ ...userProfile, savedLandingPages: updatedLandings });
            setSavedLandings(updatedLandings);
        }
    } catch (error: any) {
        const errorMsg = error.response?.data?.error || error.message || "Error al publicar";
        addNotification(errorMsg, "ERROR");
    } finally {
        setIsPublishing(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedContent);
    addNotification("Contenido copiado al portapapeles", "SUCCESS");
  };

  const handleSave = async () => {
    if (!userProfile) {
        addNotification("Debes iniciar sesión para guardar.", "ERROR");
        return;
    }

    const now = Date.now();
    let updatedLandings = [...savedLandings];

    if (currentLandingId) {
        // Update existing
        updatedLandings = updatedLandings.map(l => 
            l.id === currentLandingId ? { ...l, content: generatedContent, updatedAt: now, visualConfig } : l
        );
    } else {
        // Create new
        const newLanding: SavedLandingPage = {
            id: now.toString(),
            industry: industry || 'Sin Industria',
            content: generatedContent,
            createdAt: now,
            updatedAt: now,
            visualConfig
        };
        updatedLandings.push(newLanding);
        setCurrentLandingId(newLanding.id);
    }

    try {
        await saveSettings({ ...userProfile, savedLandingPages: updatedLandings });
        setSavedLandings(updatedLandings);
        setIsEditing(false);
        addNotification("Landing Page guardada", "SUCCESS");
    } catch (error) {
        addNotification("Error al guardar", "ERROR");
    }
  };

  const handleLoadLanding = (landing: SavedLandingPage) => {
      setIndustry(landing.industry);
      setGeneratedContent(landing.content);
      setCurrentLandingId(landing.id);
      setIsEditing(false);
      setPublishedUrl(landing.publishedUrl || null);
      if (landing.visualConfig) {
          setVisualConfig(landing.visualConfig);
      }
      // Extract slug from publishedUrl or use industry
      if (landing.publishedUrl) {
          const parts = landing.publishedUrl.split('/');
          const slug = parts[parts.length - 1].replace('.html', '');
          setCustomSlug(slug);
      } else {
          setCustomSlug(landing.industry.toLowerCase().replace(/\s+/g, '-'));
      }
  };

  const handleDeleteLanding = (id: string, e: React.PointerEvent) => {
      e.stopPropagation();
      addDebugLog("Click BORRAR id: " + id);
      
      // Confirmación nativa para máxima fiabilidad
      if (window.confirm("¿Estás seguro de que quieres eliminar esta landing?")) {
          addDebugLog("Confirmación nativa aceptada");
          executeDelete(id, e);
      } else {
          addDebugLog("Confirmación nativa cancelada");
      }
  };

  const executeDelete = async (id: string, e: React.PointerEvent) => {
      if (e) e.stopPropagation();
      addDebugLog("Ejecutando borrado id: " + id);
      
      if (!userProfile) {
          addDebugLog("Error: No hay perfil para borrar");
          addNotification("Error: Perfil no cargado", "ERROR");
          return;
      }
      
      setIsDeleting(id);
      setConfirmDeleteId(null);
      
      const currentLandings = savedLandings.length > 0 ? savedLandings : (userProfile.savedLandingPages || []);
      const updatedLandings = currentLandings.filter(l => l.id !== id);
      
      addDebugLog("Landings restantes: " + updatedLandings.length);
      
      // Update local state immediately
      setSavedLandings(updatedLandings);

      try {
          addDebugLog("Guardando perfil...");
          await saveSettings({ 
            ...userProfile, 
            savedLandingPages: updatedLandings 
          });
          
          if (currentLandingId === id) {
              setGeneratedContent('');
              setIndustry('');
              setCurrentLandingId(null);
              setPublishedUrl(null);
              setCustomSlug('');
          }
          addDebugLog("Borrado exitoso");
          addNotification("Landing eliminada con éxito", "SUCCESS");
      } catch (error) {
          addDebugLog("Error al borrar: " + (error as any).message);
          console.error("Delete error:", error);
          setSavedLandings(currentLandings);
          addNotification("Error al guardar cambios", "ERROR");
      } finally {
          setIsDeleting(null);
      }
  };

  return (
    <div className="max-w-full mx-auto p-1 md:p-2 animate-fadeIn h-full flex flex-col overflow-hidden">
      <div className="glass-panel rounded-xl p-3 md:p-4 shadow-2xl relative overflow-hidden border border-slate-700/50 flex flex-col h-full">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-700 shrink-0">
           <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-500/20 rounded-full border border-emerald-500/30">
                        <LayoutIcon className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-white leading-tight">Generador de Landing Pages</h2>
                    <p className="text-slate-400 text-[9px] md:text-[10px]">Crea el texto perfecto para vender TUS servicios de IA a un nicho específico.</p>
                </div>
           </div>
           
           {publishedUrl && (
               <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl animate-fadeIn">
                   <div className="flex flex-col">
                       <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Publicado en:</span>
                       <a href={publishedUrl} target="_blank" rel="noreferrer" className="text-xs text-white hover:text-emerald-300 underline flex items-center gap-1">
                           {publishedUrl} <LinkIcon className="w-3 h-3" />
                       </a>
                   </div>
                   <button onClick={() => { navigator.clipboard.writeText(publishedUrl); addNotification("URL copiada", "SUCCESS"); }} className="p-2 hover:bg-emerald-500/20 rounded-lg text-emerald-400 transition-colors">
                       <CopyIcon className="w-4 h-4" />
                   </button>
               </div>
           )}
        </div>

        <div className="flex flex-col md:flex-row gap-3 h-full overflow-hidden">
            
            {/* Input Section */}
            <div className="w-full md:w-[25%] shrink-0 flex flex-col gap-2 overflow-y-auto pr-1 scrollbar-thin">
                <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-700">
                    <div className="space-y-2.5 mb-2.5">
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">
                                Industria / Nicho Objetivo
                            </label>
                            <input
                                type="text"
                                value={industry}
                                onChange={(e) => setIndustry(e.target.value)}
                                placeholder="Ej. Agencias de Viajes, Dentistas..."
                                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                            />
                        </div>

                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">
                                Tu Propuesta de Valor
                            </label>
                            <textarea
                                value={valueProposition}
                                onChange={(e) => setValueProposition(e.target.value)}
                                placeholder="Describe qué vendes..."
                                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all h-20 resize-none"
                            />
                        </div>

                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">
                                Prompt Personalizado (Manual)
                            </label>
                            <textarea
                                value={customPrompt}
                                onChange={(e) => setCustomPrompt(e.target.value)}
                                placeholder="Instrucciones adicionales para la IA..."
                                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all h-20 resize-none"
                            />
                        </div>

                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">
                                Objetivo de la Landing
                            </label>
                            <select
                                value={objective}
                                onChange={(e) => setObjective(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                            >
                                <option value="vender">Vender producto/servicio</option>
                                <option value="captar leads">Captar leads (Suscripción)</option>
                                <option value="agendar llamadas">Agendar llamadas / Demo</option>
                                <option value="descargar recurso">Descargar recurso gratuito</option>
                            </select>
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block flex items-center gap-2">
                            <PaletteIcon className="w-3 h-3" /> Estilo Base
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {(['CYBER', 'MINIMAL', 'CORPORATE'] as LandingStyle[]).map(style => (
                                <button
                                    key={style}
                                    type="button"
                                    onClick={() => setLandingStyle(style)}
                                    className={`py-2 px-1 rounded-lg text-[10px] font-bold transition-all border ${
                                        landingStyle === style 
                                        ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'
                                    }`}
                                >
                                    {style}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    <button
                        onClick={handleGenerate}
                        disabled={isLoading}
                        className={`w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all shadow-lg ${
                            isLoading 
                            ? 'bg-slate-700 cursor-not-allowed text-slate-400'
                            : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-500/20'
                        }`}
                    >
                        {isLoading ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Generando...
                            </>
                        ) : (
                            <>
                                <SparklesIcon className="w-5 h-5" />
                                Generar Landing
                            </>
                        )}
                    </button>
                </div>

                {/* Saved Landings List */}
                {savedLandings.length > 0 && (
                    <div className={`relative bg-slate-800/50 p-2.5 rounded-xl border flex-1 overflow-y-auto min-h-[150px] transition-all ${isDeleteMode ? 'border-red-500/50 ring-1 ring-red-500/20' : 'border-slate-700'}`}>
                        {isDeleteMode && <div className="absolute inset-0 bg-red-500/5 pointer-events-none" />}
                        <div className="relative z-10">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                    <FileTextIcon className="w-3 h-3" /> Landings Guardadas
                                </h3>
                                <button 
                                    onPointerDown={(e) => {
                                        e.stopPropagation();
                                        addDebugLog("Click GESTIONAR");
                                        if (!userProfile) {
                                            addDebugLog("Error: No hay perfil");
                                            addNotification("Error: Perfil no cargado", "ERROR");
                                            return;
                                        }
                                        const nextMode = !isDeleteMode;
                                        setIsDeleteMode(nextMode);
                                        addDebugLog("Modo gestión: " + nextMode);
                                        setConfirmDeleteId(null);
                                        addNotification(nextMode ? "Modo gestión activado" : "Modo normal", "INFO");
                                    }}
                                    className={`text-[9px] px-2 py-1 rounded border transition-all font-bold ${
                                        isDeleteMode 
                                        ? 'bg-red-500 border-red-400 text-white shadow-lg' 
                                        : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'
                                    }`}
                                >
                                    {isDeleteMode ? 'SALIR EDICIÓN' : 'GESTIONAR'}
                                </button>
                            </div>
                            <div className="space-y-1.5">
                                {savedLandings.map(landing => (
                                    <div 
                                        key={landing.id}
                                        className={`group flex items-center gap-2 p-1.5 rounded-lg border transition-all ${
                                            currentLandingId === landing.id 
                                            ? 'bg-indigo-600/20 border-indigo-500/50' 
                                            : 'bg-slate-900/50 border-slate-700 hover:border-slate-600'
                                        }`}
                                    >
                                        <div 
                                            onClick={() => !isDeleteMode && handleLoadLanding(landing)}
                                            className={`flex-1 min-w-0 p-1 ${!isDeleteMode ? 'cursor-pointer' : 'opacity-50'}`}
                                            title={isDeleteMode ? "" : "Cargar esta landing"}
                                        >
                                            <div className="text-xs font-medium text-slate-200 truncate">{landing.industry}</div>
                                            <div className="text-[9px] text-slate-500">{new Date(landing.updatedAt).toLocaleDateString()}</div>
                                        </div>
                                        
                                        {isDeleteMode && (
                                            <div className="shrink-0">
                                                <button 
                                                    onPointerDown={(e) => handleDeleteLanding(landing.id, e)}
                                                    className="px-3 py-1.5 text-[10px] font-black text-white bg-red-600 hover:bg-red-700 rounded shadow-md transition-all border border-red-400"
                                                >
                                                    BORRAR
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
                <div className="text-[8px] text-slate-600 mt-2 text-center">v1.0.5</div>
                
                {/* Debug Console */}
                <div className="mt-4 p-2 bg-black/80 rounded-lg border border-slate-700 font-mono text-[8px] text-green-500">
                    <div className="flex justify-between items-center mb-1 border-bottom border-slate-800 pb-1">
                        <span className="text-slate-500">DEBUG LOG:</span>
                        <div className="flex gap-1">
                            <button 
                                onPointerDown={async (e) => {
                                    e.stopPropagation();
                                    if (window.confirm("¿BORRAR TODAS LAS LANDINGS GUARDADAS? Esta acción no se puede deshacer.")) {
                                        addDebugLog("Limpiando todas las landings...");
                                        if (userProfile) {
                                            await saveSettings({ ...userProfile, savedLandingPages: [] });
                                            setSavedLandings([]);
                                            addDebugLog("Limpieza completada.");
                                            window.location.reload();
                                        }
                                    }
                                }}
                                className="text-[7px] px-1 bg-red-900/50 text-red-400 rounded hover:bg-red-800"
                            >
                                LIMPIAR TODO
                            </button>
                            <button 
                                onPointerDown={(e) => {
                                    e.stopPropagation();
                                    addDebugLog("Refrescando perfil...");
                                    window.location.reload();
                                }}
                                className="text-[7px] px-1 bg-slate-800 text-slate-400 rounded hover:bg-slate-700"
                            >
                                REFRESCAR APP
                            </button>
                        </div>
                    </div>
                    {debugLogs.length === 0 ? (
                        <div className="italic text-slate-600">Esperando acciones...</div>
                    ) : (
                        debugLogs.map((log, i) => <div key={i} className="truncate">{log}</div>)
                    )}
                </div>
            </div>

            {/* Output Section */}
            <div className="flex-1 bg-slate-900 border border-slate-700 rounded-xl relative overflow-hidden flex flex-col">
                <div className="flex justify-between items-center p-2 border-b border-slate-800 bg-slate-950">
                    <div className="flex items-center gap-4">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-2">
                            {isEditing ? 'Editor HTML' : showVisualEditor ? 'Editor Visual (No-Code)' : 'Vista Previa'}
                        </span>
                        {generatedContent && (
                            <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
                                <button onClick={() => { setIsEditing(false); setShowVisualEditor(false); }} className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${!isEditing && !showVisualEditor ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}>Vista</button>
                                <button onClick={() => { setIsEditing(false); setShowVisualEditor(true); }} className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${showVisualEditor ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}>Visual</button>
                                <button onClick={() => { setIsEditing(true); setShowVisualEditor(false); }} className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${isEditing ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}>HTML</button>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {generatedContent && (
                            <div className="flex items-center gap-2 bg-slate-900/50 border border-slate-700/50 rounded-lg p-1">
                                <span className="text-[10px] text-slate-500 font-mono pl-2">
                                    {userProfile?.deploymentConfig?.type !== 'NONE' ? 'demiak.es/' : '/l/'}
                                </span>
                                <input 
                                    type="text" 
                                    value={customSlug}
                                    onChange={(e) => setCustomSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                                    placeholder="slug-personalizado"
                                    className="bg-transparent border-none px-2 py-1 text-[10px] text-slate-300 w-28 focus:outline-none"
                                />
                                <button 
                                    onClick={handlePublish}
                                    disabled={isPublishing}
                                    className="flex items-center gap-2 px-3 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold transition-all"
                                >
                                    {isPublishing ? '...' : <RocketIcon className="w-3 h-3" />} Publicar
                                </button>
                            </div>
                        )}
                        {generatedContent && (
                            <button 
                                onClick={handleSave}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors border border-indigo-500"
                            >
                                <SaveIcon className="w-3.5 h-3.5" /> Guardar
                            </button>
                        )}
                        <button 
                            onClick={handleCopy}
                            disabled={!generatedContent}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors border border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Copiar HTML"
                        >
                            <CopyIcon className="w-3.5 h-3.5"/>
                        </button>
                        {generatedContent && (
                            <button 
                                onClick={() => {
                                    const blob = new Blob([generatedContent], { type: 'text/html' });
                                    const url = URL.createObjectURL(blob);
                                    const link = document.createElement('a');
                                    link.href = url;
                                    link.download = `landing_${industry.replace(/\s+/g, '_').toLowerCase() || 'page'}.html`;
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                    URL.revokeObjectURL(url);
                                }}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors border border-slate-600"
                                title="Descargar archivo HTML"
                            >
                                <DownloadIcon className="w-3.5 h-3.5"/>
                            </button>
                        )}
                    </div>
                </div>
                
                <div className="flex-1 overflow-hidden relative bg-slate-900 flex">
                    {generatedContent ? (
                        <>
                            {/* Visual Editor Sidebar */}
                            {showVisualEditor && (
                                <div className="w-64 border-r border-slate-700 bg-slate-950 p-4 overflow-y-auto animate-slideInLeft">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <PaletteIcon className="w-4 h-4" /> Personalizar
                                    </h3>
                                    
                                    <div className="space-y-6">
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-2">Color Primario</label>
                                            <div className="flex items-center gap-3">
                                                <input 
                                                    type="color" 
                                                    value={visualConfig.primaryColor} 
                                                    onChange={(e) => handleVisualChange('primaryColor', e.target.value)}
                                                    className="w-10 h-10 rounded-lg bg-transparent border-none cursor-pointer"
                                                />
                                                <input 
                                                    type="text" 
                                                    value={visualConfig.primaryColor} 
                                                    onChange={(e) => handleVisualChange('primaryColor', e.target.value)}
                                                    className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-2">Color Secundario</label>
                                            <div className="flex items-center gap-3">
                                                <input 
                                                    type="color" 
                                                    value={visualConfig.secondaryColor} 
                                                    onChange={(e) => handleVisualChange('secondaryColor', e.target.value)}
                                                    className="w-10 h-10 rounded-lg bg-transparent border-none cursor-pointer"
                                                />
                                                <input 
                                                    type="text" 
                                                    value={visualConfig.secondaryColor} 
                                                    onChange={(e) => handleVisualChange('secondaryColor', e.target.value)}
                                                    className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-2">Tipografía</label>
                                            <select 
                                                value={visualConfig.fontFamily} 
                                                onChange={(e) => handleVisualChange('fontFamily', e.target.value)}
                                                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-xs text-white"
                                            >
                                                <option value="Inter, sans-serif">Inter (Moderno)</option>
                                                <option value="Georgia, serif">Georgia (Elegante)</option>
                                                <option value="'JetBrains Mono', monospace">JetBrains Mono (Tech)</option>
                                                <option value="'Playfair Display', serif">Playfair (Lujo)</option>
                                                <option value="system-ui, sans-serif">Sistema (Rápido)</option>
                                            </select>
                                        </div>

                                        <div className="pt-4 border-t border-slate-800">
                                            <p className="text-[10px] text-slate-500 italic leading-relaxed">
                                                Los cambios se aplican instantáneamente a la vista previa usando variables CSS dinámicas.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex-1 h-full relative">
                                {isEditing ? (
                                    <textarea
                                        value={generatedContent}
                                        onChange={(e) => setGeneratedContent(e.target.value)}
                                        className="w-full h-full bg-slate-900 text-slate-300 p-6 font-mono text-sm focus:outline-none resize-none"
                                        spellCheck={false}
                                    />
                                ) : (
                                    <div className="h-full w-full bg-white">
                                        <iframe 
                                            srcDoc={generatedContent} 
                                            className="w-full h-full border-none"
                                            title="Landing Page Preview"
                                            sandbox="allow-scripts"
                                        />
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="h-full w-full flex flex-col items-center justify-center text-slate-600 opacity-60 p-6 text-center">
                            <LayoutIcon className="w-16 h-16 mb-4 stroke-1" />
                            <p className="text-sm">Ingresa una industria para generar el contenido de la landing page.</p>
                            <p className="text-xs mt-2 text-slate-500">El resultado se mostrará formateado y listo para editar.</p>
                        </div>
                    )}
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default LandingGenerator;
