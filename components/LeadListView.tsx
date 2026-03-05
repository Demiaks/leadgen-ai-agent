
import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { Lead, LeadStatus, SortOption } from '../types';
import { motion } from 'motion/react';
import { List } from 'react-window';
import { 
  Mail, Linkedin, Trash2, Eye, Phone, MessageSquare, 
  Telescope, Swords, CheckCircle, CloudUpload 
} from 'lucide-react';

interface LeadListViewProps {
  leads: Lead[];
  sortBy: SortOption;
  onStartRoleplay?: (lead: Lead) => void; 
  onStartBattlecard?: (lead: Lead) => void; 
}

const getStatusColor = (status: LeadStatus) => {
    switch (status) {
        case LeadStatus.NEW: return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
        case LeadStatus.CONTACTED: return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
        case LeadStatus.QUALIFIED: return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
        case LeadStatus.DISQUALIFIED: return 'bg-red-500/10 text-red-400 border-red-500/20';
        default: return 'bg-slate-500/10 text-slate-400';
    }
};

const getScoreColorClass = (score: number) => score >= 80 ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]' : score >= 50 ? 'bg-yellow-500 shadow-[0_0_10px_rgba(250,204,21,0.3)]' : 'bg-red-500 shadow-[0_0_10px_rgba(244,63,94,0.3)]';
const scoreColor = (score: number) => score >= 80 ? 'text-emerald-400' : score >= 50 ? 'text-yellow-400' : 'text-red-400';

const ScoreIndicator = ({ score }: { score: number }) => {
    const radius = 14;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;
    const color = score >= 80 ? '#10b981' : score >= 50 ? '#facc15' : '#f43f5e';

    return (
        <div className="relative flex items-center justify-center w-10 h-10">
            <svg className="w-10 h-10 transform -rotate-90">
                <circle
                    cx="20"
                    cy="20"
                    r={radius}
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="transparent"
                    className="text-white/5"
                />
                <motion.circle
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    cx="20"
                    cy="20"
                    r={radius}
                    stroke={color}
                    strokeWidth="3"
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeLinecap="round"
                    className="drop-shadow-[0_0_3px_rgba(255,255,255,0.3)]"
                />
            </svg>
            <span className={`absolute text-[10px] font-black font-mono ${scoreColor(score)}`}>
                {score}
            </span>
        </div>
    );
};

const LeadListRow = React.memo(({ index, style, sortedLeads, selectedLeadIds, onToggleSelect, onUpdateLead, onDeleteLead, onOpenLead, onStartRoleplay, onStartBattlecard }: any) => {
    const lead = sortedLeads[index];
    if (!lead) return null;
    const isSelected = selectedLeadIds.has(lead.id);
    
    return (
        <div 
          style={style}
          className={`group hover:bg-white/5 transition-colors cursor-pointer border-b border-white/5 flex items-center ${isSelected ? 'bg-indigo-500/10' : ''}`} 
          onClick={() => onOpenLead(lead)}
        >
            <div className="p-4 w-10 shrink-0"><input type="checkbox" checked={isSelected} onClick={(e) => e.stopPropagation()} onChange={() => onToggleSelect(lead.id)} className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-indigo-600 focus:ring-indigo-500 cursor-pointer transition-all" /></div>
            <div className="p-4 flex-1 min-w-[200px]">
                <div className="font-bold text-slate-200 text-sm group-hover:text-white transition-colors truncate">{lead.name}</div>
                <div className="flex gap-1 mt-1">
                    {lead.isDeepDived && <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20"><Telescope className="w-2.5 h-2.5" /> VERIFIED</span>}
                    {lead.crmSync && lead.crmSync.status === 'SUCCESS' && (
                        <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded border ${lead.crmSync.platform === 'HUBSPOT' ? 'text-[#ff7a59] bg-[#ff7a59]/10 border-[#ff7a59]/20' : 'text-[#00a1e0] bg-[#00a1e0]/10 border-[#00a1e0]/20'}`}>
                            <CheckCircle className="w-2.5 h-2.5" /> CRM
                        </span>
                    )}
                </div>
            </div>
            <div className="p-4 flex-1 min-w-[200px]">
                <div className="text-sm text-indigo-300 font-medium group-hover:text-indigo-200 truncate">{lead.company}</div>
                <div className="text-xs text-slate-500 truncate max-w-[150px] font-mono mt-0.5">{lead.role}</div>
            </div>
            <div className="p-4 w-32 shrink-0 flex items-center justify-center">
                <ScoreIndicator score={lead.qualificationScore} />
            </div>
            <div className="p-4 w-32 shrink-0 text-center">
                <div className="flex justify-center gap-1.5">
                    <div className={`p-1.5 rounded-md transition-all relative ${lead.emailStatus === 'VERIFIED' ? 'bg-emerald-500/20 text-emerald-400' : lead.emailStatus === 'INVALID' ? 'bg-red-500/20 text-red-400' : lead.emailGuess ? 'bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30' : 'bg-white/5 text-slate-600'}`} title={lead.emailGuess ? `${lead.emailGuess}` : 'Email no encontrado'}><Mail className="w-3.5 h-3.5" /></div>
                    <div className={`p-1.5 rounded-md transition-all ${lead.linkedinUrl ? 'bg-[#0077b5]/20 text-[#0077b5] hover:bg-[#0077b5]/30' : 'bg-white/5 text-slate-600'}`} title={lead.linkedinUrl || 'LinkedIn no encontrado'}><Linkedin className="w-3.5 h-3.5" /></div>
                    <div className={`p-1.5 rounded-md transition-all ${lead.phone ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-slate-600'}`} title={lead.phone || 'Teléfono no encontrado'}><Phone className="w-3.5 h-3.5" /></div>
                </div>
            </div>
            <div className="p-4 w-40 shrink-0">
                <div className="relative group/status w-max">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase border tracking-wide flex items-center gap-1 cursor-pointer hover:brightness-110 transition-all ${getStatusColor(lead.status)}`}>
                        {lead.status === 'NEW' ? 'Nuevo' : lead.status === 'CONTACTED' ? 'Contactado' : lead.status === 'QUALIFIED' ? 'Interesado' : 'Descartado'}
                    </span>
                    <select value={lead.status} onChange={(e) => { e.stopPropagation(); onUpdateLead(lead.id, { status: e.target.value as LeadStatus }); }} onClick={(e) => e.stopPropagation()} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"><option value={LeadStatus.NEW}>Nuevos</option><option value={LeadStatus.CONTACTED}>Contactados</option><option value={LeadStatus.QUALIFIED}>Interesados</option><option value={LeadStatus.DISQUALIFIED}>Descartados</option></select>
                </div>
            </div>
            <div className="p-4 w-48 shrink-0 text-right">
                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0 duration-200">
                    {onStartBattlecard && <button onClick={(e) => { e.stopPropagation(); onStartBattlecard(lead); }} className="p-1.5 hover:bg-amber-600 hover:text-white rounded-lg text-slate-400 transition-colors" title="Estrategia"><Swords className="w-4 h-4" /></button>}
                    {onStartRoleplay && <button onClick={(e) => { e.stopPropagation(); onStartRoleplay(lead); }} className="p-1.5 hover:bg-violet-600 hover:text-white rounded-lg text-slate-400 transition-colors" title="Practicar Venta"><MessageSquare className="w-4 h-4" /></button>}
                    <button onClick={(e) => { e.stopPropagation(); onOpenLead(lead); }} className="p-1.5 hover:bg-indigo-600 hover:text-white rounded-lg text-slate-400 transition-colors" title="Ver Detalles"><Eye className="w-4 h-4" /></button>
                    <button onClick={(e) => { e.stopPropagation(); onDeleteLead(lead.id); }} className="p-1.5 hover:bg-red-500/20 hover:text-red-400 rounded-lg text-slate-400 transition-colors" title="Eliminar"><Trash2 className="w-4 h-4" /></button>
                </div>
            </div>
        </div>
    );
});

const LeadListView: React.FC<LeadListViewProps> = ({ leads, sortBy, onStartRoleplay, onStartBattlecard }) => {
  const { selectedLeadIds, toggleSelectLead, updateLead, deleteLead, setActiveLead } = useApp();
  const listRef = useRef<HTMLDivElement>(null);
  const [listHeight, setListHeight] = useState(500);

  useEffect(() => {
    if (listRef.current) {
        setListHeight(listRef.current.clientHeight);
    }
    const handleResize = () => {
        if (listRef.current) setListHeight(listRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const sortedLeads = useMemo(() => {
      return [...leads].sort((a, b) => {
          if (sortBy === 'SCORE_DESC') return b.qualificationScore - a.qualificationScore;
          if (sortBy === 'SCORE_ASC') return a.qualificationScore - b.qualificationScore;
          if (sortBy === 'NAME_ASC') return a.name.localeCompare(b.name);
          return 0;
      });
  }, [leads, sortBy]);

  const rowProps = useMemo(() => ({
    sortedLeads,
    selectedLeadIds,
    onToggleSelect: toggleSelectLead,
    onUpdateLead: updateLead,
    onDeleteLead: deleteLead,
    onOpenLead: setActiveLead,
    onStartRoleplay,
    onStartBattlecard
  }), [sortedLeads, selectedLeadIds, toggleSelectLead, updateLead, deleteLead, setActiveLead, onStartRoleplay, onStartBattlecard]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full overflow-hidden glass-panel rounded-2xl flex flex-col h-full shadow-2xl"
    >
        <div className="bg-white/5 sticky top-0 z-10 backdrop-blur-md flex items-center border-b border-white/5">
            <div className="p-4 w-10 shrink-0"></div>
            <div className="p-4 flex-1 min-w-[200px] text-[10px] font-bold text-slate-400 uppercase tracking-widest">Prospecto</div>
            <div className="p-4 flex-1 min-w-[200px] text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rol & Empresa</div>
            <div className="p-4 w-32 shrink-0 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">IA Score</div>
            <div className="p-4 w-32 shrink-0 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Datos</div>
            <div className="p-4 w-40 shrink-0 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Estado</div>
            <div className="p-4 w-48 shrink-0 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Acciones</div>
        </div>
        <div className="flex-1 overflow-hidden" ref={listRef}>
            {sortedLeads.length === 0 ? (
                <div className="p-10 text-center text-slate-500 italic">No hay resultados.</div>
            ) : (
                <List
                    className="w-full h-full"
                    rowCount={sortedLeads.length}
                    rowHeight={80}
                    rowComponent={(props: any) => <LeadListRow {...props} />}
                    rowProps={rowProps}
                    style={{ height: listHeight }}
                />
            )}
        </div>
    </motion.div>
  );
};

export default LeadListView;
