
import React, { useState, useRef, useMemo, useCallback, Suspense, lazy } from 'react';
import { AppProvider, useApp } from './context/AppContext'; 
import LeadForm from './components/LeadForm';
import KanbanBoard from './components/KanbanBoard'; 
import LeadListView from './components/LeadListView';
import OutreachModal from './components/OutreachModal';
import Dashboard from './components/Dashboard'; 
import Toast from './components/Toast'; 
import Onboarding from './components/Onboarding'; 
import Auth from './components/Auth'; 
import MapView from './components/MapView'; 
import { Lead, AppState, LeadStatus, SortOption, SearchHistoryItem } from './types';
import { sendToWebhook, generateBattlecard } from './services/geminiService'; 
import { syncLeadToCrm as doCrmSync } from './services/crmService';
import { SparklesIcon, SearchIcon, DownloadIcon, UploadIcon, ListIcon, GridIcon, ArchiveBoxIcon, TableCellsIcon, CloudArrowUpIcon, TelescopeIcon, LightningIcon, ChartBarIcon, PlusIcon, FunnelIcon, HistoryIcon, LayoutIcon, CogIcon, BoltIcon, MapIcon, FileTextIcon } from './components/Icons';

// --- LAZY LOADED COMPONENTS (Code Splitting) ---
const SettingsView = lazy(() => import('./components/SettingsView'));
const LandingGenerator = lazy(() => import('./components/LandingGenerator'));
const TemplatesView = lazy(() => import('./components/TemplatesView'));
const HistoryView = lazy(() => import('./components/HistoryView'));
const FunnelView = lazy(() => import('./components/FunnelView'));
const CompareView = lazy(() => import('./components/CompareView'));
const RoleplayView = lazy(() => import('./components/RoleplayView'));
const BattlecardModal = lazy(() => import('./components/BattlecardModal'));
const FocusView = lazy(() => import('./components/FocusView'));
const ManualLeadModal = lazy(() => import('./components/ManualLeadModal'));

// Loading Fallback Component
const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center h-full text-indigo-400">
    <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-2"></div>
    <span className="text-xs font-mono font-bold uppercase tracking-widest opacity-75">Cargando...</span>
  </div>
);

const AppContent: React.FC = () => {
  const { 
    session, isOfflineMode, setOfflineMode, logout,
    leads, setLeads, userProfile, appState, setAppState,
    selectedLeadIds, toggleSelectAll,
    activeLead, setActiveLead,
    notifications, addNotification, removeNotification,
    handleSearch, updateLead, deleteLead, handleDeepDive,
    updateGamification, resetDashboard, statusMessage,
    searchHistory, setSearchHistory
  } = useApp();

  const [currentView, setCurrentView] = useState<'DASHBOARD' | 'SETTINGS' | 'LANDING' | 'TEMPLATES' | 'HISTORY' | 'FUNNEL'>('DASHBOARD');
  const [viewMode, setViewMode] = useState<'BOARD' | 'LIST' | 'MAP'>('BOARD'); 
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [showFocusMode, setShowFocusMode] = useState(false);
  const [roleplayLead, setRoleplayLead] = useState<Lead | null>(null);
  const [battlecardLead, setBattlecardLead] = useState<Lead | null>(null); 
  const [isGeneratingBattlecard, setIsGeneratingBattlecard] = useState(false); 
  const [showCompare, setShowCompare] = useState(false);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<LeadStatus | 'ALL'>('ALL');
  const [minScore, setMinScore] = useState<number>(0);
  const [selectedIndustry, setSelectedIndustry] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('SCORE_DESC');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
     if (userProfile && !userProfile.badges?.includes('onboarding_complete') && leads.length === 0 && appState === AppState.IDLE) {
         // setShowOnboarding(true); 
     }
  }, [userProfile]);

  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      if (searchTerm) {
          const term = searchTerm.toLowerCase();
          if (!(lead.name.toLowerCase().includes(term) || lead.company.toLowerCase().includes(term))) return false;
      }
      if (filterStatus !== 'ALL' && lead.status !== filterStatus) return false;
      if (lead.qualificationScore < minScore) return false;
      if (selectedIndustry !== 'ALL' && lead.industry !== selectedIndustry) return false;
      return true;
    });
  }, [leads, searchTerm, filterStatus, minScore, selectedIndustry]);

  // --- MEMOIZED HANDLERS ---

  const handleOpenBattlecard = useCallback(async (lead: Lead) => {
      if (lead.battlecard) {
          setBattlecardLead(lead);
      } else {
          setIsGeneratingBattlecard(true);
          addNotification("Generando estrategia...", "INFO");
          try {
              const battlecard = await generateBattlecard(lead, userProfile?.apiKey);
              updateLead(lead.id, { battlecard });
              const updatedLead = { ...lead, battlecard };
              setBattlecardLead(updatedLead);
              addNotification("Estrategia generada", "SUCCESS");
          } catch (error) {
              addNotification("Error al generar estrategia", "ERROR");
          } finally {
              setIsGeneratingBattlecard(false);
          }
      }
  }, [userProfile?.apiKey, updateLead, addNotification]);

  const handleStartRoleplay = useCallback((lead: Lead) => {
      setRoleplayLead(lead);
  }, []);

  const handleSelectWinner = useCallback((lead: Lead) => {
      setActiveLead(lead);
      setShowCompare(false);
  }, [setActiveLead]);

  const handleBulkDeepDive = async () => {
    if (selectedLeadIds.size === 0) return;
    setIsBulkProcessing(true);
    addNotification(`Investigando ${selectedLeadIds.size} leads...`, 'INFO');
    const leadsToProcess = leads.filter(l => selectedLeadIds.has(l.id) && !l.isDeepDived);
    for (const lead of leadsToProcess) {
        try { await handleDeepDive(lead); } catch (e) { console.error(e); }
    }
    setIsBulkProcessing(false);
    updateGamification(10 * selectedLeadIds.size);
    addNotification("Investigación masiva completada", "SUCCESS");
  };

  const handleBulkCrmExport = async () => {
    if (selectedLeadIds.size === 0) return;
    if (!userProfile) return;
    
    if (!userProfile.hubspotKey && !userProfile.salesforceKey && !userProfile.webhookUrl) {
        addNotification("Configura un CRM en Ajustes primero", "ERROR");
        setCurrentView('SETTINGS');
        return;
    }

    setIsBulkProcessing(true);
    const leadsToProcess = leads.filter(l => selectedLeadIds.has(l.id) && (!l.crmSync || l.crmSync.status !== 'SUCCESS'));
    
    if (leadsToProcess.length === 0) {
        addNotification("Los leads seleccionados ya están sincronizados", "INFO");
        setIsBulkProcessing(false);
        return;
    }

    addNotification(`Exportando ${leadsToProcess.length} leads al CRM...`, 'INFO');
    
    let successCount = 0;
    for (const lead of leadsToProcess) {
        try {
            const updatedLead = await doCrmSync(lead, userProfile);
            updateLead(lead.id, updatedLead);
            successCount++;
        } catch (e) { console.error(e); }
    }
    
    setIsBulkProcessing(false);
    addNotification(`${successCount} leads exportados correctamente`, successCount > 0 ? "SUCCESS" : "WARNING");
    updateGamification(20 * successCount);
  };

  const handleAddManualLead = (lead: Lead) => {
      setLeads(prev => [lead, ...prev]);
      setAppState(AppState.COMPLETE);
      setShowManualModal(false);
      addNotification("Lead creado manualmente", "SUCCESS");
      updateGamification(10);
  };

  const handleExportJSON = () => {
      if (leads.length === 0) return;
      const dataStr = JSON.stringify(leads, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `leadgen_backup_${new Date().toISOString().slice(0,10)}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const handleImportClick = () => fileInputRef.current?.click();
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedLeads = JSON.parse(event.target?.result as string);
        if (Array.isArray(importedLeads) && importedLeads.length > 0) {
            setLeads(importedLeads);
            setAppState(AppState.COMPLETE);
            addNotification(`${importedLeads.length} leads restaurados`, "SUCCESS");
        }
      } catch (err) { addNotification("Error al leer JSON", "ERROR"); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };
  
  const handleCSVImportClick = () => csvInputRef.current?.click();
  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { /* ... */ };

  const handleRestoreHistory = (item: SearchHistoryItem) => {
      setLeads(item.leads);
      setAppState(AppState.COMPLETE);
      addNotification("Búsqueda restaurada del historial", "SUCCESS");
      setCurrentView('DASHBOARD');
  };

  const handleDeleteHistory = (id: string) => {
      setSearchHistory(prev => prev.filter(h => h.id !== id));
      addNotification("Eliminado del historial", "INFO");
  };

  if (!session && !isOfflineMode) {
      return <Auth onLoginSuccess={() => {}} onOfflineClick={() => setOfflineMode(true)} />;
  }

  const SidebarButton = ({ icon: Icon, label, active, onClick, extraClass = "" }: any) => (
      <button 
        onClick={onClick} 
        className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-3 group relative overflow-hidden ${active ? 'bg-white/5 text-white shadow-lg border border-white/10' : 'text-slate-400 hover:text-white hover:bg-white/5'} ${extraClass}`}
      >
          {active && <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 rounded-l-xl"></div>}
          <Icon className={`w-4 h-4 transition-colors ${active ? 'text-indigo-400' : 'text-slate-500 group-hover:text-indigo-300'}`} />
          <span>{label}</span>
      </button>
  );

  return (
    <div className="h-screen flex text-slate-100 font-sans overflow-hidden">
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" style={{ display: 'none' }} />
      <input type="file" ref={csvInputRef} onChange={handleCsvFileChange} accept=".csv" style={{ display: 'none' }} />
      
      <Toast notifications={notifications} removeNotification={removeNotification} />
      
      <Suspense fallback={null}>
        {showOnboarding && <Onboarding onComplete={() => { setShowOnboarding(false); updateGamification(0, 'onboarding_complete'); }} />}
        {showManualModal && <ManualLeadModal onClose={() => setShowManualModal(false)} onSave={handleAddManualLead} />}
        {showFocusMode && <FocusView onClose={() => setShowFocusMode(false)} />}
        {showCompare && (
            <CompareView leads={leads.filter(l => selectedLeadIds.has(l.id))} onClose={() => setShowCompare(false)} onSelectWinner={handleSelectWinner} />
        )}
        {roleplayLead && (
            <div className="fixed inset-0 z-[60] bg-slate-950/80 backdrop-blur-sm">
               <RoleplayView lead={roleplayLead} onClose={() => setRoleplayLead(null)} apiKey={userProfile?.apiKey} onFinish={(score) => { updateGamification(score); setRoleplayLead(null); }} />
            </div>
        )}
        {battlecardLead && battlecardLead.battlecard && (
            <BattlecardModal lead={battlecardLead} battlecard={battlecardLead.battlecard} onClose={() => setBattlecardLead(null)} />
        )}
      </Suspense>

      {activeLead && (
        <OutreachModal 
          lead={activeLead} 
          onClose={() => setActiveLead(null)} 
          onUpdate={updateLead}
          onDeepDive={handleDeepDive}
          addNotification={addNotification}
          hasNext={leads.findIndex(l => l.id === activeLead.id) < leads.length - 1}
          hasPrev={leads.findIndex(l => l.id === activeLead.id) > 0}
          onNext={() => { 
              const idx = leads.findIndex(l => l.id === activeLead?.id);
              if (idx < leads.length - 1) setActiveLead(leads[idx + 1]);
          }}
          onPrev={() => { 
              const idx = leads.findIndex(l => l.id === activeLead?.id);
              if (idx > 0) setActiveLead(leads[idx - 1]);
          }}
          currentIndex={leads.findIndex(l => l.id === activeLead.id)}
          totalSelected={leads.length}
        />
      )}
      
      {isGeneratingBattlecard && (
          <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center animate-fadeIn">
              <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
              <h3 className="text-xl font-bold text-white font-mono tracking-tight">ANALIZANDO ESTRATEGIA...</h3>
              <p className="text-slate-400 text-sm">Procesando psicología del prospecto.</p>
          </div>
      )}

      {/* SIDEBAR */}
      <aside className="w-72 glass-panel border-r-0 border-r border-white/5 flex flex-col hidden md:flex z-20 m-4 rounded-2xl">
             <div className="p-6 border-b border-white/5 flex items-center gap-3">
                 <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                    <SparklesIcon className="w-5 h-5 text-white" />
                 </div>
                 <div>
                    <h1 className="font-bold text-lg text-white leading-none">LeadGen <span className="text-indigo-400">Pro</span></h1>
                    <span className="text-[10px] text-slate-500 font-mono tracking-widest">AI COMMAND CENTER</span>
                 </div>
             </div>
             
             <div className="p-4 flex-1 overflow-y-auto space-y-8 scrollbar-hide">
                 <div className="space-y-1">
                     <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Principal</p>
                     <SidebarButton icon={ListIcon} label="Dashboard" active={currentView === 'DASHBOARD'} onClick={() => setCurrentView('DASHBOARD')} />
                     <SidebarButton icon={FunnelIcon} label="Pipeline" active={currentView === 'FUNNEL'} onClick={() => setCurrentView('FUNNEL')} />
                     <SidebarButton icon={HistoryIcon} label="Historial" active={currentView === 'HISTORY'} onClick={() => setCurrentView('HISTORY')} />
                 </div>

                 <div className="space-y-1">
                     <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Herramientas</p>
                     <SidebarButton icon={LayoutIcon} label="Generador Landing" active={currentView === 'LANDING'} onClick={() => setCurrentView('LANDING')} />
                     <SidebarButton icon={FileTextIcon} label="Plantillas Email" active={currentView === 'TEMPLATES'} onClick={() => setCurrentView('TEMPLATES')} />
                     <SidebarButton icon={CogIcon} label="Configuración" active={currentView === 'SETTINGS'} onClick={() => setCurrentView('SETTINGS')} />
                     <button onClick={() => setShowManualModal(true)} className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-3 text-emerald-400 hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/20 mt-2">
                        <PlusIcon className="w-4 h-4" />
                        <span>Nuevo Lead</span>
                     </button>
                 </div>
                 
                 {/* Filters Widget */}
                 {currentView === 'DASHBOARD' && (appState === AppState.COMPLETE || leads.length > 0) && (
                     <div className="bg-slate-900/40 p-4 rounded-xl border border-white/5">
                         <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2"><FunnelIcon className="w-3 h-3"/> Filtros Activos</h3>
                         <div className="space-y-4">
                             <div className="space-y-1">
                                <label className="text-[10px] text-slate-500 font-bold uppercase">Estado</label>
                                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)} className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-indigo-500 transition-colors">
                                    <option value="ALL">Todos</option>
                                    <option value={LeadStatus.NEW}>Nuevos</option>
                                    <option value={LeadStatus.CONTACTED}>Contactados</option>
                                    <option value={LeadStatus.QUALIFIED}>Interesados</option>
                                </select>
                             </div>
                             <div className="space-y-2">
                                <div className="flex justify-between text-[10px] uppercase font-bold text-slate-500"><label>Calidad Min</label><span className="text-indigo-400">{minScore}%</span></div>
                                <input type="range" min="0" max="90" step="10" value={minScore} onChange={(e) => setMinScore(Number(e.target.value))} className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"/>
                             </div>
                         </div>
                     </div>
                 )}
             </div>

             <div className="p-4 border-t border-white/5">
                 {currentView === 'DASHBOARD' && leads.length > 0 && (
                    <button onClick={resetDashboard} className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-bold text-white shadow-lg shadow-indigo-500/20 transition-all mb-4 flex items-center justify-center gap-2">
                        <SearchIcon className="w-3.5 h-3.5" /> 
                        Nueva Búsqueda
                    </button>
                 )}
                 <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-[10px] text-slate-400 font-mono">{isOfflineMode ? 'DEMO MODE' : 'ONLINE'}</span>
                    </div>
                    <button onClick={() => logout()} className="text-[10px] text-red-400 hover:text-red-300 font-bold uppercase tracking-wider">Salir</button>
                 </div>
             </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <Suspense fallback={<LoadingSpinner />}>
            {currentView === 'SETTINGS' && <div className="h-full overflow-y-auto pt-6"><SettingsView /></div>}
            {currentView === 'LANDING' && <div className="h-full overflow-y-auto pt-6"><LandingGenerator addNotification={addNotification} apiKey={userProfile?.apiKey} /></div>}
            {currentView === 'TEMPLATES' && <div className="h-full overflow-y-auto pt-6"><TemplatesView /></div>}
            {currentView === 'HISTORY' && <div className="h-full overflow-y-auto pt-6"><HistoryView history={searchHistory} onRestore={handleRestoreHistory} onDelete={handleDeleteHistory} /></div>}
            {currentView === 'FUNNEL' && <div className="h-full overflow-y-auto pt-6"><FunnelView leads={leads} /></div>}
        </Suspense>

        {currentView === 'DASHBOARD' && (
        <>
            {(appState === AppState.COMPLETE || leads.length > 0) && (
                <header className="h-20 shrink-0 flex items-center justify-between px-8 z-20">
                    <div className="flex items-center relative w-full max-w-lg group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <SearchIcon className="h-4 w-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                        </div>
                        <input 
                            type="text" 
                            placeholder="Buscar por nombre o empresa..." 
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)} 
                            className="block w-full pl-10 pr-3 py-2.5 border border-white/10 rounded-xl leading-5 bg-white/5 text-slate-300 placeholder-slate-500 focus:outline-none focus:bg-slate-900/80 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all" 
                        />
                    </div>

                    <div className="flex items-center gap-4">
                        <button onClick={() => setShowFocusMode(true)} className="glass-button px-4 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-2 shadow-lg shadow-indigo-500/10">
                            <BoltIcon className="w-4 h-4 text-yellow-400" />
                            MODO ENFOQUE
                        </button>

                        <div className="h-6 w-px bg-white/10 mx-2"></div>

                        <div className="relative group z-50">
                            <button className="glass-button p-2 rounded-lg text-slate-400 hover:text-white"><ArchiveBoxIcon className="w-5 h-5" /></button>
                            <div className="absolute right-0 top-full mt-2 w-56 glass-panel rounded-xl p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform origin-top-right">
                                <button onClick={handleCSVImportClick} className="w-full px-3 py-2 text-xs text-left text-slate-300 hover:bg-white/5 rounded-lg transition-colors flex items-center gap-2 mb-1"><TableCellsIcon className="w-3.5 h-3.5 text-emerald-400"/> Importar CSV</button>
                                <button onClick={handleImportClick} className="w-full px-3 py-2 text-xs text-left text-slate-300 hover:bg-white/5 rounded-lg transition-colors flex items-center gap-2"><CloudArrowUpIcon className="w-3.5 h-3.5 text-yellow-400"/> Restaurar JSON</button>
                                <button onClick={handleExportJSON} className="w-full px-3 py-2 text-xs text-left text-slate-300 hover:bg-white/5 rounded-lg transition-colors flex items-center gap-2"><DownloadIcon className="w-3.5 h-3.5 text-indigo-400"/> Exportar JSON</button>
                            </div>
                        </div>
                        
                        {selectedLeadIds.size > 0 && (
                            <div className="flex items-center gap-1 bg-indigo-500/20 border border-indigo-500/30 px-3 py-1.5 rounded-xl animate-fadeIn">
                                <span className="text-xs font-bold text-indigo-300 mr-2">{selectedLeadIds.size}</span>
                                <button onClick={handleBulkDeepDive} className="p-1.5 hover:bg-indigo-500/20 rounded-lg text-indigo-300 transition-colors" title="Deep Dive Masivo"><TelescopeIcon className="w-4 h-4"/></button>
                                <button onClick={handleBulkCrmExport} className="p-1.5 hover:bg-indigo-500/20 rounded-lg text-indigo-300 transition-colors" title="Sync CRM"><CloudArrowUpIcon className="w-4 h-4"/></button>
                            </div>
                        )}
                        
                        {selectedLeadIds.size >= 2 && (<button onClick={() => setShowCompare(true)} className="glass-button px-3 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-2"><ChartBarIcon className="w-4 h-4 text-purple-400" /> Comparar</button>)}
                        
                        <div className="flex bg-white/5 rounded-xl p-1 border border-white/5">
                            <button onClick={() => setViewMode('BOARD')} className={`p-2 rounded-lg transition-all ${viewMode === 'BOARD' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}><GridIcon className="w-4 h-4"/></button>
                            <button onClick={() => setViewMode('LIST')} className={`p-2 rounded-lg transition-all ${viewMode === 'LIST' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}><ListIcon className="w-4 h-4"/></button>
                            <button onClick={() => setViewMode('MAP')} className={`p-2 rounded-lg transition-all ${viewMode === 'MAP' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}><MapIcon className="w-4 h-4"/></button>
                        </div>
                    </div>
                </header>
            )}

            <div className="flex-1 overflow-y-auto px-8 pb-8 scrollbar-thin">
                {appState === AppState.IDLE && leads.length === 0 && (
                    <div className="flex flex-col items-center justify-center min-h-[80vh] animate-fadeIn">
                        <div className="text-center mb-10 max-w-2xl relative">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl -z-10"></div>
                            <h2 className="text-6xl font-black tracking-tighter mb-6 text-white drop-shadow-2xl">
                                LEADGEN <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">PRO</span>
                            </h2>
                            <p className="text-lg text-slate-400 mb-8 max-w-lg mx-auto font-light">
                                Sistema autónomo de prospección B2B. <br/>
                                <span className="text-indigo-400 font-mono text-xs">v4.0.0 // AI AGENT ACTIVE</span>
                            </p>
                            <div className="flex gap-4 justify-center">
                                <button onClick={handleCSVImportClick} className="glass-button px-6 py-3 rounded-xl text-sm font-bold text-white flex items-center gap-2 hover:scale-105 transition-transform"><TableCellsIcon className="w-4 h-4 text-emerald-400"/> Importar CSV</button>
                                <button onClick={handleImportClick} className="glass-button px-6 py-3 rounded-xl text-sm font-bold text-slate-300 flex items-center gap-2 hover:scale-105 transition-transform"><UploadIcon className="w-4 h-4"/> Restaurar Backup</button>
                            </div>
                        </div>
                        <LeadForm />
                    </div>
                )}

                {(appState === AppState.SEARCHING || appState === AppState.PROCESSING) && (
                    <div className="flex flex-col items-center justify-center h-full">
                        <div className="relative">
                             <div className="w-24 h-24 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                             <div className="absolute inset-0 flex items-center justify-center">
                                 <BoltIcon className="w-8 h-8 text-indigo-400 animate-pulse" />
                             </div>
                        </div>
                        <h3 className="text-xl font-bold text-white mt-8 tracking-tight">{statusMessage}</h3>
                        <p className="text-slate-500 text-sm mt-2 font-mono">PROCESANDO DATOS EN TIEMPO REAL...</p>
                    </div>
                )}

                {(appState === AppState.COMPLETE || (appState === AppState.IDLE && leads.length > 0)) && (
                    <div className="animate-fadeIn pb-10 h-full flex flex-col gap-6">
                        <Dashboard leads={filteredLeads} />
                        
                        <div className="glass-panel p-1 rounded-2xl flex-1 min-h-[500px] overflow-hidden flex flex-col relative">
                             <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                                <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                    Resultados en Vivo
                                </h2>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs text-slate-500 font-mono">{filteredLeads.length} ITEMS</span>
                                    <div className="h-4 w-px bg-white/10"></div>
                                    <div className="flex items-center gap-2 cursor-pointer hover:text-white text-slate-400 transition-colors" onClick={() => toggleSelectAll(filteredLeads)}>
                                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${filteredLeads.length > 0 && selectedLeadIds.size === filteredLeads.length ? 'bg-indigo-600 border-indigo-600' : 'border-slate-600 bg-slate-800'}`}>
                                            {filteredLeads.length > 0 && selectedLeadIds.size === filteredLeads.length && <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>}
                                        </div>
                                        <span className="text-xs font-bold uppercase">Seleccionar Todo</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 overflow-hidden relative">
                                {viewMode === 'BOARD' ? (
                                    <div className="absolute inset-0 p-4 overflow-x-auto">
                                        <KanbanBoard 
                                            leads={filteredLeads} 
                                            sortBy={sortBy} 
                                            onStartRoleplay={handleStartRoleplay} 
                                            onStartBattlecard={handleOpenBattlecard} 
                                        />
                                    </div>
                                ) : viewMode === 'LIST' ? (
                                    <div className="absolute inset-0 overflow-hidden">
                                        <LeadListView 
                                            leads={filteredLeads} 
                                            sortBy={sortBy} 
                                            onStartRoleplay={handleStartRoleplay}
                                            onStartBattlecard={handleOpenBattlecard} 
                                        />
                                    </div>
                                ) : (
                                    <div className="absolute inset-0">
                                        <MapView leads={filteredLeads} onSelectLead={setActiveLead} />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
        )}
      </main>
    </div>
  );
};

const App: React.FC = () => {
    return (
        <AppProvider>
            <AppContent />
        </AppProvider>
    );
};

export default App;
