
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { SearchCriteria, SearchType } from '../types';
import { TargetIcon, BriefcaseIcon, LocationIcon, SearchIcon, SparklesIcon, CheckCircleIcon, MailIcon, CogIcon, GlobeIcon, UsersIcon, HashtagIcon } from './Icons';

const ROLES = [
  "CEO / Fundador",
  "Dueño de Negocio",
  "Director General",
  "Director de Marketing (CMO)",
  "Director Comercial / Ventas",
  "Director de Tecnología (CTO)",
  "Director de Recursos Humanos",
  "Director Financiero (CFO)",
  "Gerente de E-commerce",
  "Gerente de Operaciones",
  "Gerente de Compras"
];

const INDUSTRIES = [
  "Software / SaaS",
  "Consultoría Estratégica",
  "Marketing & Publicidad",
  "Fintech & Banca",
  "Salud & Biotech",
  "Real Estate / Inmobiliaria",
  "Manufactura & Industria",
  "Logística & Supply Chain",
  "Educación / EdTech",
  "Retail & E-commerce",
  "Legal & Compliance",
  "Recursos Humanos (HR)",
  "Ciberseguridad",
  "Energía & Renovables",
  "Telecomunicaciones",
  "Turismo & Hospitalidad"
];

const LeadForm: React.FC = () => {
  const { handleSearch, appState, userProfile } = useApp();
  const isLoading = appState === 'SEARCHING' || appState === 'PROCESSING';

  const [criteria, setCriteria] = useState<SearchCriteria>({
    searchType: 'WEB',
    targetPersona: '',
    industry: '',
    location: '',
    valueProposition: 'Ayudamos a empresas a ganar más dinero con los mismos leads, usando sistemas de IA que responden, cualifican y hacen seguimiento 24/7 para que no se pierda ni una oportunidad de venta.',
    senderName: '',
    senderEmail: '',
    senderWebsite: '',
    landingPageUrl: '', 
    strategy: 'CONSULTANT',
    competitorUrl: '',
    leadCount: 10
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (userProfile) {
        setCriteria(prev => ({
            ...prev,
            senderName: userProfile.name ?? prev.senderName,
            senderEmail: userProfile.email ?? prev.senderEmail,
            senderWebsite: userProfile.website ?? prev.senderWebsite,
            landingPageUrl: userProfile.landingPage ?? prev.landingPageUrl
        }));
    }
  }, [userProfile]);

  const validateUrl = (url: string): boolean => {
    const pattern = /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;
    return pattern.test(url);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: { [key: string]: string } = {};
    let isValid = true;

    if (criteria.senderWebsite && !validateUrl(criteria.senderWebsite)) {
        newErrors.senderWebsite = "URL inválida";
        isValid = false;
    }
    if (criteria.landingPageUrl && !validateUrl(criteria.landingPageUrl)) {
        newErrors.landingPageUrl = "URL inválida";
        isValid = false;
    }
    if (criteria.searchType === 'COMPETITORS' && (!criteria.competitorUrl || !validateUrl(criteria.competitorUrl))) {
        newErrors.competitorUrl = "Ingresa una URL de competencia válida";
        isValid = false;
    }

    setErrors(newErrors);

    if (isValid) {
        const finalCriteria = { ...criteria };
        if ((criteria.searchType === 'COMPETITORS' || criteria.searchType === 'SOCIAL') && !finalCriteria.industry) {
             finalCriteria.industry = "General";
        }
        handleSearch(finalCriteria);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setCriteria({ ...criteria, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors(prev => ({ ...prev, [e.target.name]: '' }));
  };

  const toggleType = (type: SearchType) => {
    setCriteria(prev => ({ ...prev, searchType: type }));
  };

  return (
    <div className="glass-panel rounded-3xl p-8 w-full max-w-2xl mx-auto shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden backdrop-blur-xl border border-white/10">
      
      {/* Background Ambience */}
      <div className="absolute top-0 right-0 p-4 opacity-20 pointer-events-none">
        <SparklesIcon className="w-64 h-64 text-indigo-500 blur-sm" />
      </div>
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-600/20 rounded-full blur-3xl"></div>

      <h2 className="text-2xl font-black mb-8 flex items-center gap-3 text-white relative z-10">
        <span className="bg-indigo-600 p-2.5 rounded-xl shadow-[0_0_15px_rgba(99,102,241,0.5)]">
          <SearchIcon className="w-6 h-6 text-white" />
        </span>
        Configurar Agente
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
        
        {/* Search Type Selector */}
        <div className="bg-black/20 p-1.5 rounded-xl flex gap-1 mb-6 border border-white/5 backdrop-blur-sm">
          {['WEB', 'MAPS', 'SOCIAL', 'COMPETITORS'].map((type) => (
             <button
                key={type}
                type="button"
                onClick={() => toggleType(type as SearchType)}
                className={`flex-1 py-2.5 px-2 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                  criteria.searchType === type 
                    ? type === 'MAPS' ? 'bg-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]' 
                    : type === 'SOCIAL' ? 'bg-pink-600 text-white shadow-[0_0_15px_rgba(219,39,119,0.4)]'
                    : type === 'COMPETITORS' ? 'bg-amber-600 text-white shadow-[0_0_15px_rgba(217,119,6,0.4)]'
                    : 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {type === 'WEB' && <BriefcaseIcon className="w-3.5 h-3.5" />}
                {type === 'MAPS' && <LocationIcon className="w-3.5 h-3.5" />}
                {type === 'SOCIAL' && <HashtagIcon className="w-3.5 h-3.5" />}
                {type === 'COMPETITORS' && <GlobeIcon className="w-3.5 h-3.5" />}
                {type === 'COMPETITORS' ? 'Rival' : type}
              </button>
          ))}
        </div>

        {/* Identity Card */}
        <div className="bg-white/5 p-5 rounded-2xl border border-white/5 space-y-4 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
            <div className="flex justify-between items-center relative z-10">
                <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-widest flex items-center gap-2">
                    <CheckCircleIcon className="w-4 h-4" /> Identidad del Agente
                </h3>
                {!userProfile && <span className="text-[10px] text-slate-500 flex items-center gap-1 cursor-pointer hover:text-white"><CogIcon className="w-3 h-3"/> Configura tu perfil</span>}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                <div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase">Tu Nombre</label><input type="text" name="senderName" placeholder="Ej. Ana García" className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 focus:bg-black/40 transition-all" value={criteria.senderName} onChange={handleChange} /></div>
                <div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase">Tu Email</label><input type="email" name="senderEmail" placeholder="Ej. ana@miagencia.com" className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 focus:bg-black/40 transition-all" value={criteria.senderEmail} onChange={handleChange} /></div>
                <div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase">Tu Web</label><input type="text" name="senderWebsite" placeholder="Ej. miagencia.com" className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 focus:bg-black/40 transition-all" value={criteria.senderWebsite} onChange={handleChange} /></div>
                <div className="space-y-1"><label className="text-[10px] font-bold text-emerald-400 uppercase">URL CTA</label><input type="text" name="landingPageUrl" placeholder="https://miagencia.com/agendar" className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 focus:bg-black/40 transition-all" value={criteria.landingPageUrl} onChange={handleChange} /></div>
                
                <div className="md:col-span-2 space-y-1 pt-2">
                    <label className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest flex items-center gap-1"><MailIcon className="w-3 h-3"/> Estrategia de Outreach</label>
                    <select name="strategy" value={criteria.strategy} onChange={handleChange} className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 cursor-pointer hover:bg-black/30 transition-all">
                        <option value="CONSULTANT">Consultor Amable (Aporta valor primero)</option>
                        <option value="HUNTER">Venta Directa (Corto y al grano)</option>
                        <option value="PARTNER">Partnerships (Busca alianzas)</option>
                    </select>
                </div>
            </div>
        </div>

        {/* Inputs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-2 uppercase tracking-wide"><TargetIcon className="w-4 h-4 text-indigo-400" /> {criteria.searchType === 'MAPS' ? 'Tipo de Negocio' : criteria.searchType === 'SOCIAL' ? 'Rol o Hashtag' : 'Persona Objetivo'}</label>
            {criteria.searchType === 'WEB' ? (
                <><input list="role-options" name="targetPersona" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:bg-white/10 transition-all" placeholder="Ej. CEO" value={criteria.targetPersona} onChange={handleChange} required /><datalist id="role-options">{ROLES.map(role => (<option key={role} value={role} />))}</datalist></>
            ) : (
                <input type="text" name="targetPersona" placeholder={criteria.searchType === 'SOCIAL' ? "Ej. CEO, #Marketing" : "Ej. Restaurantes"} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:bg-white/10 transition-all" value={criteria.targetPersona} onChange={handleChange} required />
            )}
          </div>

          <div className="space-y-2">
            {criteria.searchType === 'COMPETITORS' ? (
                <><label className="text-xs font-bold text-slate-300 flex items-center gap-2 uppercase tracking-wide"><GlobeIcon className="w-4 h-4 text-amber-400" /> URL Competencia</label><input type="text" name="competitorUrl" placeholder="Ej. agencia-rival.com" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 focus:bg-white/10 transition-all" value={criteria.competitorUrl} onChange={handleChange} /></>
            ) : criteria.searchType === 'SOCIAL' ? (
                 <div className="space-y-2"><label className="text-xs font-bold text-slate-300 flex items-center gap-2 uppercase tracking-wide"><HashtagIcon className="w-4 h-4 text-pink-400" /> Red Preferida</label><input type="text" name="industry" placeholder="Ej. LinkedIn, Twitter" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-pink-500 focus:bg-white/10 transition-all" value={criteria.industry} onChange={handleChange} /></div>
            ) : (
                <>
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-2 uppercase tracking-wide"><BriefcaseIcon className="w-4 h-4 text-indigo-400" /> Industria</label>
                    <input list="industry-options" name="industry" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:bg-white/10 transition-all" placeholder="Ej. Software" value={criteria.industry} onChange={handleChange} required />
                    <datalist id="industry-options">
                        {INDUSTRIES.map(ind => (<option key={ind} value={ind} />))}
                    </datalist>
                </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2"><label className="text-xs font-bold text-slate-300 flex items-center gap-2 uppercase tracking-wide"><LocationIcon className="w-4 h-4 text-indigo-400" /> Ubicación</label><input type="text" name="location" placeholder="Ej. Madrid" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:bg-white/10 transition-all" value={criteria.location} onChange={handleChange} required /></div>
            <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 flex items-center justify-between uppercase tracking-wide"><span className="flex items-center gap-2"><UsersIcon className="w-4 h-4 text-indigo-400" /> Cantidad</span><span className="font-mono text-indigo-400 bg-indigo-500/10 px-2 rounded border border-indigo-500/20">{criteria.leadCount}</span></label>
                <input type="range" min="5" max="50" step="1" value={criteria.leadCount} onChange={(e) => setCriteria({...criteria, leadCount: parseInt(e.target.value)})} className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"/>
            </div>
        </div>

        <div className="space-y-2"><label className="text-xs font-bold text-slate-300 flex items-center gap-2 uppercase tracking-wide"><SparklesIcon className="w-4 h-4 text-indigo-400" /> Propuesta de Valor</label><textarea name="valueProposition" placeholder="Describe brevemente qué vendes y qué problema resuelves." className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white h-24 resize-none focus:outline-none focus:border-indigo-500 focus:bg-white/10 transition-all leading-relaxed" value={criteria.valueProposition} onChange={handleChange} required /></div>

        <button type="submit" disabled={isLoading} className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] shadow-xl ${isLoading ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700' : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-indigo-500/30 border border-indigo-500/50 hover:shadow-indigo-500/50'}`}>
          {isLoading ? (
             <div className="flex items-center gap-2"><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div><span className="animate-pulse">EJECUTANDO AGENTES...</span></div>
          ) : (
             <><SearchIcon className="w-5 h-5" /> INICIAR BÚSQUEDA</>
          )}
        </button>
      </form>
    </div>
  );
};

export default LeadForm;
