
import React from 'react';
import { SearchHistoryItem, Lead, Notification } from '../types';
import { HistoryIcon, ArchiveBoxIcon, RefreshIcon, TrashIcon, LocationIcon, TargetIcon } from './Icons';

interface HistoryViewProps {
  history: SearchHistoryItem[];
  onRestore: (item: SearchHistoryItem) => void;
  onDelete: (id: string) => void;
}

const HistoryView: React.FC<HistoryViewProps> = ({ history, onRestore, onDelete }) => {
  
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('es-ES', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const safeHistory = history || []; // Safety fallback

  return (
    <div className="max-w-5xl mx-auto p-6 animate-fadeIn h-full flex flex-col">
      <div className="glass-panel rounded-2xl p-8 shadow-2xl relative overflow-hidden border border-slate-700/50 flex flex-col h-full">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-700 shrink-0">
           <div className="p-3 bg-indigo-500/20 rounded-full border border-indigo-500/30">
                <HistoryIcon className="w-8 h-8 text-indigo-400" />
           </div>
           <div>
               <h2 className="text-2xl font-bold text-white">Historial de Búsquedas</h2>
               <p className="text-slate-400 text-sm">Recupera resultados anteriores instantáneamente.</p>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin">
            {safeHistory.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-60">
                    <ArchiveBoxIcon className="w-16 h-16 mb-4 stroke-1" />
                    <p className="text-sm">No hay búsquedas guardadas aún.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {safeHistory.map((item) => (
                        <div key={item.id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 hover:bg-slate-800 transition-colors group flex flex-col md:flex-row md:items-center justify-between gap-4">
                            
                            {/* Info */}
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-xs font-mono text-slate-500 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                                        {formatDate(item.timestamp)}
                                    </span>
                                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${item.criteria.searchType === 'MAPS' ? 'bg-emerald-900/30 text-emerald-400' : 'bg-indigo-900/30 text-indigo-400'}`}>
                                        {item.criteria.searchType === 'MAPS' ? 'Google Maps' : 'Web Search'}
                                    </span>
                                </div>
                                
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    {item.criteria.targetPersona || item.criteria.industry}
                                    <span className="text-slate-500 font-normal text-sm">en</span>
                                    <span className="text-indigo-300">{item.criteria.location}</span>
                                </h3>
                                
                                <div className="flex gap-4 mt-2 text-xs text-slate-400">
                                     <span className="flex items-center gap-1">
                                        <TargetIcon className="w-3 h-3" /> {item.leadCount} Prospectos
                                     </span>
                                     <span className="flex items-center gap-1">
                                        <ArchiveBoxIcon className="w-3 h-3" /> ID: {item.id.slice(-6)}
                                     </span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-3 shrink-0">
                                <button 
                                    onClick={() => onRestore(item)}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-lg shadow-indigo-500/20 transition-transform hover:scale-105"
                                >
                                    <RefreshIcon className="w-4 h-4" /> Restaurar
                                </button>
                                <button 
                                    onClick={() => onDelete(item.id)}
                                    className="p-2.5 rounded-lg bg-slate-900 hover:bg-red-900/30 text-slate-500 hover:text-red-400 border border-slate-700 hover:border-red-500/30 transition-colors"
                                    title="Eliminar del historial"
                                >
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>

      </div>
    </div>
  );
};

export default HistoryView;
