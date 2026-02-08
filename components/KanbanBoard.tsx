
import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Lead, LeadStatus, SortOption } from '../types';
import LeadCard from './LeadCard';

interface KanbanBoardProps {
  leads: Lead[];
  sortBy: SortOption;
  onStartRoleplay?: (lead: Lead) => void;
  onStartBattlecard?: (lead: Lead) => void; 
}

const COLUMNS: { id: LeadStatus; title: string; color: string; bg: string }[] = [
  { id: LeadStatus.NEW, title: 'Nuevos', color: 'border-blue-500', bg: 'bg-blue-500/5' },
  { id: LeadStatus.CONTACTED, title: 'Contactados', color: 'border-yellow-500', bg: 'bg-yellow-500/5' },
  { id: LeadStatus.QUALIFIED, title: 'Interesados', color: 'border-emerald-500', bg: 'bg-emerald-500/5' },
  { id: LeadStatus.DISQUALIFIED, title: 'Descartados', color: 'border-red-500', bg: 'bg-red-500/5' },
];

const KanbanBoard: React.FC<KanbanBoardProps> = ({ leads, sortBy, onStartRoleplay, onStartBattlecard }) => {
  const { selectedLeadIds, toggleSelectLead, updateLead, deleteLead, setActiveLead } = useApp();

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('leadId', id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, status: LeadStatus) => {
    const id = e.dataTransfer.getData('leadId');
    if (id) {
        updateLead(id, { status });
    }
  };

  const columnsData = useMemo(() => {
      return COLUMNS.map(col => {
          const colLeads = leads.filter(l => l.status === col.id);
          const sorted = [...colLeads].sort((a, b) => {
               if (sortBy === 'SCORE_DESC') return b.qualificationScore - a.qualificationScore;
               if (sortBy === 'SCORE_ASC') return a.qualificationScore - b.qualificationScore;
               if (sortBy === 'NAME_ASC') return a.name.localeCompare(b.name);
               return 0;
          });
          return { ...col, leads: sorted };
      });
  }, [leads, sortBy]);

  return (
    <div className="flex flex-col md:flex-row gap-4 h-full overflow-x-auto pb-4">
      {columnsData.map(col => (
          <div 
            key={col.id} 
            className={`flex-1 min-w-[320px] flex flex-col glass-panel rounded-2xl border-t-2 ${col.color.replace('border', 'border-t')} transition-colors`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, col.id)}
          >
            <div className={`p-4 border-b border-white/5 rounded-t-xl flex justify-between items-center ${col.bg}`}>
              <h3 className="font-bold text-slate-200 text-xs uppercase tracking-widest">{col.title}</h3>
              <span className="bg-white/10 text-slate-300 text-xs px-2.5 py-0.5 rounded-full font-mono font-bold">{col.leads.length}</span>
            </div>

            <div className="p-3 space-y-3 flex-1 overflow-y-auto max-h-[70vh] scrollbar-thin">
              {col.leads.map(lead => (
                <div key={lead.id} draggable onDragStart={(e) => handleDragStart(e, lead.id)} className="cursor-grab active:cursor-grabbing animate-fadeIn">
                  <LeadCard 
                    lead={lead}
                    isSelected={selectedLeadIds.has(lead.id)}
                    onToggleSelect={() => toggleSelectLead(lead.id)}
                    onUpdateLead={updateLead}
                    onDelete={() => deleteLead(lead.id)}
                    compact={true} 
                    onClick={() => setActiveLead(lead)} 
                    onStartRoleplay={onStartRoleplay}
                    onOpenBattlecard={onStartBattlecard}
                  />
                </div>
              ))}
              {col.leads.length === 0 && (
                <div className="h-32 border-2 border-dashed border-white/5 rounded-xl flex items-center justify-center text-slate-600 text-xs italic m-2">
                    Arrastra prospectos aquí
                </div>
              )}
            </div>
          </div>
      ))}
    </div>
  );
};

export default KanbanBoard;
