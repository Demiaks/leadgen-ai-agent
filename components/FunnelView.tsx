
import React, { useMemo } from 'react';
import { Lead, LeadStatus } from '../types';
import { FunnelIcon, TargetIcon, UsersIcon, CheckCircleIcon, TrashIcon } from './Icons';

interface FunnelViewProps {
  leads: Lead[];
}

const FunnelView: React.FC<FunnelViewProps> = ({ leads }) => {
  const stats = useMemo(() => {
    // 1. Total Base: New + Contacted + Qualified (Ignore Disqualified for the top of funnel usually, or include to show leakage)
    // Strategy: Top is Total leads generated.
    const total = leads.length;
    const active = leads.filter(l => l.status !== LeadStatus.DISQUALIFIED).length;
    
    const countNew = leads.filter(l => l.status === LeadStatus.NEW).length;
    const countContacted = leads.filter(l => l.status === LeadStatus.CONTACTED).length;
    const countQualified = leads.filter(l => l.status === LeadStatus.QUALIFIED).length;
    const countDisqualified = leads.filter(l => l.status === LeadStatus.DISQUALIFIED).length;

    // Funnel Steps (Cumulative logic)
    // Step 1: All Active Leads (Total Opportunity)
    const step1 = active; 
    // Step 2: Engaged (Contacted + Qualified) -> Passed "New" stage
    const step2 = countContacted + countQualified; 
    // Step 3: Success (Qualified)
    const step3 = countQualified;

    return {
      total,
      active,
      step1,
      step2,
      step3,
      countNew,
      countContacted,
      countQualified,
      countDisqualified
    };
  }, [leads]);

  // Calculations for bar widths (relative to step1)
  const getWidth = (val: number) => {
      if (stats.step1 === 0) return '0%';
      // Ensure min visual width of 35% so text and icons are always visible
      const percentage = (val / stats.step1) * 100;
      return `${Math.max(percentage, 35)}%`; 
  };

  const getConversion = (current: number, prev: number) => {
      if (prev === 0) return 0;
      return Math.round((current / prev) * 100);
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 animate-fadeIn h-full flex flex-col overflow-hidden">
        <div className="glass-panel rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden border border-slate-700/50 flex flex-col h-full">
            
            {/* Header */}
            <div className="flex items-center gap-4 mb-4 pb-4 border-b border-slate-700 shrink-0">
                <div className="p-3 bg-blue-500/20 rounded-full border border-blue-500/30">
                    <FunnelIcon className="w-8 h-8 text-blue-400" />
                </div>
                <div>
                    <h2 className="text-xl md:text-2xl font-bold text-white">Pipeline Funnel</h2>
                    <p className="text-slate-400 text-xs md:text-sm">Visualiza la eficiencia de tu proceso de conversión.</p>
                </div>
            </div>

            {leads.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-500 opacity-60">
                    <FunnelIcon className="w-16 h-16 mb-4 stroke-1" />
                    <p className="text-sm">Genera leads para ver el embudo.</p>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-between overflow-hidden">
                    
                    {/* FUNNEL CONTAINER - Fits available space */}
                    <div className="w-full max-w-4xl flex flex-col justify-center gap-0 relative flex-1">
                        
                        {/* STEP 1: DETECTED (Active) */}
                        <div className="relative group w-full flex justify-center py-2">
                            <div 
                                className="h-14 md:h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg shadow-blue-900/20 flex items-center justify-between px-6 transition-all duration-700 ease-out z-10 min-w-[200px]"
                                style={{ width: '100%' }}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-1.5 bg-white/10 rounded-lg"><TargetIcon className="w-5 h-5 text-white"/></div>
                                    <span className="font-bold text-white text-sm md:text-lg tracking-wide">Oportunidades</span>
                                </div>
                                <span className="font-mono text-2xl md:text-3xl font-bold text-white">{stats.step1}</span>
                            </div>
                        </div>
                        
                        {/* Connector 1 */}
                        <div className="h-8 w-full flex justify-center items-center relative">
                            <div className="absolute h-full w-0.5 bg-slate-700/50"></div>
                            <div className="z-10 bg-slate-800 text-[10px] font-mono text-emerald-400 font-bold border border-slate-700 px-2 py-0.5 rounded-full shadow-sm">
                                {getConversion(stats.step2, stats.step1)}% Conv.
                            </div>
                        </div>

                        {/* STEP 2: ENGAGED */}
                        <div className="relative group w-full flex justify-center py-2">
                            <div 
                                className="h-14 md:h-16 bg-gradient-to-r from-yellow-500 to-amber-600 rounded-xl shadow-lg shadow-amber-900/20 flex items-center justify-between px-6 transition-all duration-700 ease-out z-10 min-w-[200px]"
                                style={{ width: getWidth(stats.step2) }}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-1.5 bg-white/10 rounded-lg"><UsersIcon className="w-5 h-5 text-white"/></div>
                                    <span className="font-bold text-white text-sm md:text-lg tracking-wide whitespace-nowrap">Engaged</span>
                                </div>
                                <span className="font-mono text-2xl md:text-3xl font-bold text-white pl-4">{stats.step2}</span>
                            </div>
                        </div>

                         {/* Connector 2 */}
                         <div className="h-8 w-full flex justify-center items-center relative">
                            <div className="absolute h-full w-0.5 bg-slate-700/50"></div>
                            <div className="z-10 bg-slate-800 text-[10px] font-mono text-emerald-400 font-bold border border-slate-700 px-2 py-0.5 rounded-full shadow-sm">
                                {getConversion(stats.step3, stats.step2)}% Cierre
                            </div>
                        </div>

                        {/* STEP 3: QUALIFIED */}
                        <div className="relative group w-full flex justify-center py-2">
                            <div 
                                className="h-14 md:h-16 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl shadow-lg shadow-emerald-900/20 flex items-center justify-between px-6 transition-all duration-700 ease-out z-10 min-w-[200px]"
                                style={{ width: getWidth(stats.step3) }}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-1.5 bg-white/10 rounded-lg"><CheckCircleIcon className="w-5 h-5 text-white"/></div>
                                    <span className="font-bold text-white text-sm md:text-lg tracking-wide whitespace-nowrap">Calificados</span>
                                </div>
                                <span className="font-mono text-2xl md:text-3xl font-bold text-white pl-4">{stats.step3}</span>
                            </div>
                        </div>

                    </div>

                    {/* METRICS FOOTER */}
                    <div className="mt-4 w-full grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 max-w-4xl shrink-0">
                        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-3 md:p-4 flex items-center justify-between hover:bg-slate-800 transition-colors">
                            <div>
                                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Total Generados</p>
                                <p className="text-xl md:text-2xl font-bold text-white">{stats.total}</p>
                            </div>
                            <div className="h-10 w-10 bg-slate-700/50 rounded-full flex items-center justify-center text-slate-400 font-serif italic text-lg">∑</div>
                        </div>
                        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-3 md:p-4 flex items-center justify-between hover:bg-slate-800 transition-colors group">
                            <div>
                                <p className="text-[10px] text-red-400/80 uppercase font-bold tracking-widest mb-1">Leads Perdidos</p>
                                <p className="text-xl md:text-2xl font-bold text-red-400">{stats.countDisqualified}</p>
                            </div>
                            <div className="h-10 w-10 bg-red-900/10 rounded-full flex items-center justify-center text-red-500 group-hover:bg-red-900/20 transition-colors">
                                <TrashIcon className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-3 md:p-4 flex items-center justify-between hover:bg-slate-800 transition-colors group">
                            <div>
                                <p className="text-[10px] text-emerald-400/80 uppercase font-bold tracking-widest mb-1">Tasa Global Éxito</p>
                                <p className="text-xl md:text-2xl font-bold text-emerald-400">{getConversion(stats.step3, stats.total)}%</p>
                            </div>
                            <div className="h-10 w-10 bg-emerald-900/10 rounded-full flex items-center justify-center text-emerald-500 group-hover:bg-emerald-900/20 transition-colors font-bold text-base">%</div>
                        </div>
                    </div>

                </div>
            )}
        </div>
    </div>
  );
};

export default FunnelView;
