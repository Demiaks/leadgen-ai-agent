import React, { useState, useEffect } from 'react';
import { generateLandingCopy } from '../services/geminiService';
import { SparklesIcon, LayoutIcon, CopyIcon, LinkIcon, FileTextIcon, DownloadIcon, SaveIcon, RocketIcon } from './Icons';
import { Notification, SavedLandingPage, UserProfile, LandingStyle, VisualConfig } from '../types';
import axios from 'axios';
import { LandingForm } from './LandingForm';
import { VisualEditor } from './VisualEditor';
import { SavedLandingsList } from './SavedLandingsList';

interface LandingGeneratorProps {
  addNotification: (message: string, type: Notification['type']) => void;
  apiKey?: string;
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
    return html.replace(/:root\s*\{[^}]*\}/, rootStyle);
  };

  const handleVisualChange = React.useCallback((field: keyof VisualConfig, value: string) => {
    const newConfig = { ...visualConfig, [field]: value };
    setVisualConfig(newConfig);
    if (generatedContent) {
        setGeneratedContent(updateHtmlWithVisuals(generatedContent, newConfig));
    }
  }, [visualConfig, generatedContent]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!industry.trim()) {
      addNotification("Por favor ingresa una industria", "ERROR");
      return;
    }

    setIsLoading(true);
    setPublishedUrl(null);
    try {
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
        updatedLandings = updatedLandings.map(l => 
            l.id === currentLandingId ? { ...l, content: generatedContent, updatedAt: now, visualConfig } : l
        );
    } else {
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
      if (window.confirm("¿Estás seguro de que quieres eliminar esta landing?")) {
          executeDelete(id, e);
      }
  };

  const executeDelete = async (id: string, e: React.PointerEvent) => {
      if (e) e.stopPropagation();
      if (!userProfile) return;
      
      const currentLandings = savedLandings.length > 0 ? savedLandings : (userProfile.savedLandingPages || []);
      const updatedLandings = currentLandings.filter(l => l.id !== id);
      
      setSavedLandings(updatedLandings);

      try {
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
          addNotification("Landing eliminada con éxito", "SUCCESS");
      } catch (error) {
          setSavedLandings(currentLandings);
          addNotification("Error al guardar cambios", "ERROR");
      }
  };

  return (
    <div className="max-w-full mx-auto p-1 md:p-2 animate-fadeIn h-full flex flex-col overflow-hidden">
      <div className="glass-panel rounded-xl p-3 md:p-4 shadow-2xl relative overflow-hidden border border-slate-700/50 flex flex-col h-full">
        
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
            
            <div className="w-full md:w-[25%] shrink-0 flex flex-col gap-2 overflow-y-auto pr-1 scrollbar-thin">
                <LandingForm 
                    industry={industry} setIndustry={setIndustry}
                    valueProposition={valueProposition} setValueProposition={setValueProposition}
                    customPrompt={customPrompt} setCustomPrompt={setCustomPrompt}
                    objective={objective} setObjective={setObjective}
                    landingStyle={landingStyle} setLandingStyle={setLandingStyle}
                    handleGenerate={handleGenerate} isLoading={isLoading}
                />
                
                <SavedLandingsList 
                    savedLandings={savedLandings}
                    currentLandingId={currentLandingId}
                    isDeleteMode={isDeleteMode}
                    setIsDeleteMode={setIsDeleteMode}
                    handleLoadLanding={handleLoadLanding}
                    handleDeleteLanding={handleDeleteLanding}
                    addNotification={addNotification}
                    addDebugLog={addDebugLog}
                />
            </div>

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
                            {showVisualEditor && <VisualEditor visualConfig={visualConfig} handleVisualChange={handleVisualChange} />}

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
