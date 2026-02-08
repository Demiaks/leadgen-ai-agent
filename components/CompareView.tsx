
import React from 'react';
import { Lead } from '../types';
import { CheckCircleIcon, XMarkIcon, TrophyIcon, ChartBarIcon } from './Icons';

interface CompareViewProps {
  leads: Lead[];
  onClose: () => void;
  onSelectWinner: (lead: Lead) => void;
}

const CompareView: React.FC<CompareViewProps> = ({ leads, onClose, onSelectWinner }) => {
  if (leads.length === 0) return null;

  // Attributes to compare
  const attributes = [
    { label: 'Score IA', render: (l: Lead) => <span className={`font-bold ${l.qualificationScore > 70 ? 'text-emerald-400' : 'text-yellow-400'}`}>{l.qualificationScore}</span> },
    { label: 'Empresa', render: (l: Lead) => l.company },
    { label: 'Rol', render: (l: Lead) => l.role },
    { label: 'Estado', render: (l: Lead) => l.status },
    { label: 'Tech Stack', render: (l: Lead) => l.techStack?.join(', ') || '-' },
    { label: 'SEO Score', render: (l: Lead) => l.seoAnalysis?.overallScore || 'N/A' },
    { label: 'Dolores', render: (l: Lead) => (
        <ul className="list-disc pl-4 text-xs text-left">
            {l.painPoints?.map((p, i) => <li key={i}>{p}</li>)}
        </ul>
    )},
    { label: 'Email', render: (l: Lead) => l.emailGuess ? <span className="text-emerald-400">Sí</span> : <span className="text-red-400">No</span> },
  ];

  // Find highest score
  const highestScore = Math.max(...leads.map(l => l.qualificationScore));

  return (
    <div className="fixed inset-0 z-[70] bg-slate-900/95 backdrop-blur-md flex flex-col animate-fadeIn">
        {/* Header */}
        <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-950">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <ChartBarIcon className="w-5 h-5 text-indigo-500" />
                Modo Comparativo
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400">
                <XMarkIcon className="w-6 h-6" />
            </button>
        </div>

        {/* Comparison Table */}
        <div className="flex-1 overflow-auto p-6">
            <div className="flex gap-4 min-w-max mx-auto justify-center">
                {/* Labels Column */}
                <div className="flex flex-col gap-0 pt-[72px]"> 
                    {attributes.map((attr, idx) => (
                        <div key={idx} className="h-16 flex items-center justify-end px-4 text-sm font-bold text-slate-500 border-b border-slate-800/50">
                            {attr.label}
                        </div>
                    ))}
                </div>

                {/* Lead Columns */}
                {leads.map(lead => (
                    <div key={lead.id} className={`w-72 flex flex-col bg-slate-800/50 rounded-xl border-2 ${lead.qualificationScore === highestScore ? 'border-yellow-500/50 shadow-lg shadow-yellow-900/20' : 'border-slate-700'} overflow-hidden relative`}>
                        {lead.qualificationScore === highestScore && (
                            <div className="absolute top-0 left-0 right-0 bg-yellow-500/20 text-yellow-400 text-[10px] font-bold text-center py-0.5 border-b border-yellow-500/30">
                                ⭐ Mejor Opción
                            </div>
                        )}
                        
                        {/* Column Header */}
                        <div className="p-4 bg-slate-900/80 text-center border-b border-slate-700 pt-6">
                            <div className="w-12 h-12 mx-auto rounded-full bg-slate-700 flex items-center justify-center text-lg font-bold text-white mb-2">
                                {lead.name.charAt(0)}
                            </div>
                            <h3 className="font-bold text-white truncate">{lead.name}</h3>
                            <button 
                                onClick={() => onSelectWinner(lead)}
                                className="mt-2 w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded shadow-lg transition-colors"
                            >
                                Seleccionar
                            </button>
                        </div>

                        {/* Attributes */}
                        {attributes.map((attr, idx) => (
                            <div key={idx} className="h-16 flex items-center justify-center px-4 text-sm text-slate-300 border-b border-slate-700/50 text-center">
                                {attr.render(lead)}
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
};

export default CompareView;
