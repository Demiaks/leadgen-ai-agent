
import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Lead, LeadStatus, SortOption } from '../types';
import { MailIcon, LinkedInIcon, TrashIcon, EyeIcon, PhoneIcon, ChatBubbleIcon, TelescopeIcon, SwordsIcon, CheckCircleIcon, CloudArrowUpIcon } from './Icons';

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

const getScoreColorClass = (score: number) => score >= 80 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : score >= 50 ? 'bg-yellow-500' : 'bg-red-500';
const scoreColor = (score: number) => score >= 80 ? 'text-emerald-400' : score >= 50 ? 'text-yellow-400' : 'text-red-400';

const LeadListRow = React.memo(({ lead, isSelected, onToggleSelect, onUpdateLead, onDeleteLead, onOpenLead, onStartRoleplay, onStartBattlecard }: any) => {
    return (
        <tr className={`group hover:bg-white/5 transition-colors cursor-pointer border-b border-white/5 ${isSelected ? 'bg-indigo-500/10' : ''}`} onClick={() => onOpenLead(lead)}>
            <td className="p-4"><input type="checkbox" checked={isSelected} onClick={(e) => e.stopPropagation()} onChange={() => onToggleSelect(lead.id)} className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-indigo-600 focus:ring-indigo-500 cursor-pointer transition-all" /></td>
            <td className="p-4">
                <div className="font-bold text-slate-200 text-sm group-hover:text-white transition-colors">{lead.name}</div>
                <div className="flex gap-1 mt-1">
                    {lead.isDeepDived && <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20"><TelescopeIcon className="w-2.5 h-2.5" /> VERIFIED</span>}
                    {lead.crmSync && lead.crmSync.status === 'SUCCESS' && (
                        <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded border ${lead.crmSync.platform === 'HUBSPOT' ? 'text-[#ff7a59] bg-[#ff7a59]/10 border-[#ff7a59]/20' : 'text-[#00a1e0] bg-[#00a1e0]/10 border-[#00a1e0]/20'}`}>
                            <CheckCircleIcon className="w-2.5 h-2.5" /> CRM
                        </span>
                    )}
                </div>
            </td>
            <td className="p-4">
                <div className="text-sm text-indigo-300 font-medium group-hover:text-indigo-200">{lead.company}</div>
                <div className="text-xs text-slate-500 truncate max-w-[150px] font-mono mt-0.5">{lead.role}</div>
            </td>
            <td className="p-4">
                <div className="flex items-center gap-2 mb-1">
                    <span className={`text-sm font-bold font-mono ${scoreColor(lead.qualificationScore)}`}>{lead.qualificationScore}</span>
                </div>
                <div className="w-20 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${getScoreColorClass(lead.qualificationScore)}`} style={{width: `${lead.qualificationScore}%`}}></div>
                </div>
            </td>
            <td className="p-4 text-center">
                <div className="flex justify-center gap-1.5">
                    <div className={`p-1.5 rounded-md transition-all relative ${lead.emailStatus === 'VERIFIED' ? 'bg-emerald-500/20 text-emerald-400' : lead.emailStatus === 'INVALID' ? 'bg-red-500/20 text-red-400' : lead.emailGuess ? 'bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30' : 'bg-white/5 text-slate-600'}`} title={lead.emailGuess ? `${lead.emailGuess}` : 'Email no encontrado'}><MailIcon className="w-3.5 h-3.5" /></div>
                    <div className={`p-1.5 rounded-md transition-all ${lead.linkedinUrl ? 'bg-[#0077b5]/20 text-[#0077b5] hover:bg-[#0077b5]/30' : 'bg-white/5 text-slate-600'}`} title={lead.linkedinUrl || 'LinkedIn no encontrado'}><LinkedInIcon className="w-3.5 h-3.5" /></div>
                    <div className={`p-1.5 rounded-md transition-all ${lead.phone ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-slate-600'}`} title={lead.phone || 'Teléfono no encontrado'}><PhoneIcon className="w-3.5 h-3.5" /></div>
                </div>
            </td>
            <td className="p-4">
                <div className="relative group/status w-max">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase border tracking-wide flex items-center gap-1 cursor-pointer hover:brightness-110 transition-all ${getStatusColor(lead.status)}`}>
                        {lead.status === 'NEW' ? 'Nuevo' : lead.status === 'CONTACTED' ? 'Contactado' : lead.status === 'QUALIFIED' ? 'Interesado' : 'Descartado'}
                    </span>
                    <select value={lead.status} onChange={(e) => { e.stopPropagation(); onUpdateLead(lead.id, { status: e.target.value as LeadStatus }); }} onClick={(e) => e.stopPropagation()} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"><option value={LeadStatus.NEW}>Nuevos</option><option value={LeadStatus.CONTACTED}>Contactados</option><option value={LeadStatus.QUALIFIED}>Interesados</option><option value={LeadStatus.DISQUALIFIED}>Descartados</option></select>
                </div>
            </td>
            <td className="p-4 text-right">
                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0 duration-200">
                    {onStartBattlecard && <button onClick={(e) => { e.stopPropagation(); onStartBattlecard(lead); }} className="p-1.5 hover:bg-amber-600 hover:text-white rounded-lg text-slate-400 transition-colors" title="Estrategia"><SwordsIcon className="w-4 h-4" /></button>}
                    {onStartRoleplay && <button onClick={(e) => { e.stopPropagation(); onStartRoleplay(lead); }} className="p-1.5 hover:bg-violet-600 hover:text-white rounded-lg text-slate-400 transition-colors" title="Practicar Venta"><ChatBubbleIcon className="w-4 h-4" /></button>}
                    <button onClick={(e) => { e.stopPropagation(); onOpenLead(lead); }} className="p-1.5 hover:bg-indigo-600 hover:text-white rounded-lg text-slate-400 transition-colors" title="Ver Detalles"><EyeIcon className="w-4 h-4" /></button>
                    <button onClick={(e) => { e.stopPropagation(); onDeleteLead(lead.id); }} className="p-1.5 hover:bg-red-500/20 hover:text-red-400 rounded-lg text-slate-400 transition-colors" title="Eliminar"><TrashIcon className="w-4 h-4" /></button>
                </div>
            </td>
        </tr>
    );
});

const LeadListView: React.FC<LeadListViewProps> = ({ leads, sortBy, onStartRoleplay, onStartBattlecard }) => {
  const { selectedLeadIds, toggleSelectLead, updateLead, deleteLead, setActiveLead } = useApp();

  const sortedLeads = useMemo(() => {
      return [...leads].sort((a, b) => {
          if (sortBy === 'SCORE_DESC') return b.qualificationScore - a.qualificationScore;
          if (sortBy === 'SCORE_ASC') return a.qualificationScore - b.qualificationScore;
          if (sortBy === 'NAME_ASC') return a.name.localeCompare(b.name);
          return 0;
      });
  }, [leads, sortBy]);

  return (
    <div className="w-full overflow-hidden glass-panel rounded-2xl flex flex-col h-full shadow-2xl">
        <div className="overflow-auto flex-1 scrollbar-thin">
            <table className="w-full text-left border-collapse">
                <thead className="bg-white/5 sticky top-0 z-10 backdrop-blur-md">
                    <tr>
                        <th className="p-4 w-10"></th>
                        <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Prospecto</th>
                        <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rol & Empresa</th>
                        <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-32">IA Score</th>
                        <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Datos</th>
                        <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Estado</th>
                        <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {sortedLeads.length === 0 ? <tr><td colSpan={7} className="p-10 text-center text-slate-500 italic">No hay resultados.</td></tr> : sortedLeads.map(lead => (
                        <LeadListRow key={lead.id} lead={lead} isSelected={selectedLeadIds.has(lead.id)} onToggleSelect={toggleSelectLead} onUpdateLead={updateLead} onDeleteLead={deleteLead} onOpenLead={setActiveLead} onStartRoleplay={onStartRoleplay} onStartBattlecard={onStartBattlecard} />
                    ))}
                </tbody>
            </table>
        </div>
    </div>
  );
};

export default LeadListView;
