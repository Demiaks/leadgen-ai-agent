
import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { LeadStatus, Lead } from '../types';
import { ChartBarIcon, CurrencyDollarIcon, TargetIcon, TrophyIcon, PuzzleIcon, PieChartIcon, CloudArrowUpIcon } from './Icons';

interface DashboardProps {
  leads: Lead[];
}

const SimplePieChart: React.FC<{ data: { label: string; value: number; color: string }[] }> = ({ data }) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    let cumulativePercent = 0;
    const getCoordinatesForPercent = (percent: number) => {
        const x = Math.cos(2 * Math.PI * percent);
        const y = Math.sin(2 * Math.PI * percent);
        return [x, y];
    };
    if (total === 0) return <div className="text-xs text-slate-500 text-center">Sin datos</div>;
    return (
        <div className="relative w-32 h-32 filter drop-shadow-[0_0_8px_rgba(0,0,0,0.5)]">
            <svg viewBox="-1 -1 2 2" className="transform -rotate-90 w-full h-full">
                {data.map((slice, i) => {
                    const startPercent = cumulativePercent;
                    const slicePercent = slice.value / total;
                    cumulativePercent += slicePercent;
                    const [startX, startY] = getCoordinatesForPercent(startPercent);
                    const [endX, endY] = getCoordinatesForPercent(cumulativePercent);
                    const largeArcFlag = slicePercent > 0.5 ? 1 : 0;
                    const pathData = [`M 0 0`, `L ${startX} ${startY}`, `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`, `Z`].join(' ');
                    return <path key={i} d={pathData} fill={slice.color} stroke="rgba(255,255,255,0.1)" strokeWidth="0.02" className="hover:opacity-90 transition-opacity cursor-pointer" />;
                })}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-16 h-16 bg-slate-900 rounded-full border border-white/5 shadow-inner"></div>
            </div>
        </div>
    );
};

const BADGES = [
    { id: 'first_lead', icon: '🚀', name: 'Primer Lead', desc: 'Encontraste tu primer prospecto.' },
    { id: 'hot_streak', icon: '🔥', name: 'En Racha', desc: '3 días seguidos.' },
    { id: 'closer', icon: '💼', name: 'Closer', desc: 'Convertiste a "Interesado".' },
    { id: 'master_hunter', icon: '🎯', name: 'Master Hunter', desc: '50+ leads generados.' }
];

const Dashboard: React.FC<DashboardProps> = ({ leads }) => {
  const { userProfile } = useApp();
  const [ticketValue, setTicketValue] = useState<number>(1500); 

  const stats = useMemo(() => {
      if (leads.length === 0) return { pipelineValue: 0, avgScore: 0, crmSynced: 0, industryData: [] };

      const activeLeads = leads.filter(l => l.status !== LeadStatus.DISQUALIFIED);
      const pipelineValue = activeLeads.length * ticketValue;
      const totalScore = leads.reduce((sum, lead) => sum + lead.qualificationScore, 0);
      const avgScore = Math.round(totalScore / leads.length);
      const crmSynced = leads.filter(l => l.crmSync?.status === 'SUCCESS').length;

      const industries: Record<string, number> = {};
      leads.forEach(l => { industries[l.industry || 'Otros'] = (industries[l.industry || 'Otros'] || 0) + 1; });
      const sortedIndustries = Object.entries(industries).sort((a,b) => b[1] - a[1]);
      const topIndustries = sortedIndustries.slice(0, 4);
      const otherCount = sortedIndustries.slice(4).reduce((sum, item) => sum + item[1], 0);
      const colors = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#64748b']; 
      const industryData = topIndustries.map((item, index) => ({ label: item[0], value: item[1], color: colors[index] }));
      if (otherCount > 0) industryData.push({ label: 'Otros', value: otherCount, color: colors[4] });

      return { pipelineValue, avgScore, crmSynced, industryData };
  }, [leads, ticketValue]);

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
  const xp = userProfile?.xp || 0;
  const level = userProfile?.level || 1;
  const streak = userProfile?.currentStreak || 0;
  const nextLevelXp = level * 1000;
  const progressPercent = Math.min((xp / nextLevelXp) * 100, 100);
  const unlockedBadges = new Set(userProfile?.badges || []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-fadeIn">
        
        {/* Main Stats Area */}
        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            
            {/* XP Card */}
            <div className="glass-panel rounded-2xl p-6 relative overflow-hidden group border-t border-yellow-500/20 md:col-span-1">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-yellow-500/20 transition-all duration-700"></div>
                 <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className="p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.2)]"><TrophyIcon className="w-5 h-5" /></div>
                    <span className="text-xs font-bold font-mono text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded-full bg-yellow-900/20">Lvl {level}</span>
                 </div>
                 <div className="mb-4 relative z-10">
                     <span className="text-3xl font-black text-white font-mono tracking-tighter block">{streak} <span className="text-sm font-sans font-medium text-slate-400">días</span></span>
                 </div>
                 <div className="w-full bg-slate-800/50 h-1.5 rounded-full overflow-hidden relative z-10">
                     <div className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.5)] transition-all duration-1000" style={{width: `${progressPercent}%`}}></div>
                 </div>
            </div>

            {/* Pipeline Card */}
            <div className="glass-panel rounded-2xl p-6 relative overflow-hidden group border-t border-indigo-500/20 md:col-span-1">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-indigo-500/20 transition-all duration-700"></div>
                <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.2)]"><CurrencyDollarIcon className="w-5 h-5" /></div>
                </div>
                <div className="mb-2 relative z-10">
                    <span className="text-3xl font-black text-white font-mono tracking-tighter block truncate">{formatCurrency(stats.pipelineValue)}</span>
                    <span className="text-xs text-indigo-300 font-medium">Pipeline</span>
                </div>
                <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-2 relative z-10">
                     <span className="text-[10px] uppercase font-bold text-slate-500">Ticket:</span>
                     <input 
                        type="number" 
                        value={ticketValue} 
                        onChange={(e) => setTicketValue(Number(e.target.value))} 
                        className="bg-slate-900/50 border border-white/10 rounded px-2 py-0.5 w-16 text-right text-xs text-white font-mono focus:outline-none focus:border-indigo-500 transition-colors"
                     />
                </div>
            </div>

            {/* Quality Score */}
            <div className="glass-panel rounded-2xl p-6 relative overflow-hidden group border-t border-emerald-500/20 md:col-span-1">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-emerald-500/20 transition-all duration-700"></div>
                <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]"><TargetIcon className="w-5 h-5" /></div>
                </div>
                <div className="mb-4 relative z-10 flex items-baseline gap-1">
                    <span className="text-3xl font-black text-white font-mono tracking-tighter">{stats.avgScore}</span>
                    <span className="text-sm font-medium text-slate-400">/ 100</span>
                </div>
                <div className="w-full bg-slate-800/50 h-1.5 rounded-full overflow-hidden relative z-10">
                     <div className={`h-full rounded-full transition-all duration-1000 ${stats.avgScore > 70 ? 'bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-gradient-to-r from-yellow-600 to-yellow-400'}`} style={{width: `${stats.avgScore}%`}}></div>
                </div>
                 <p className="mt-2 text-[10px] text-emerald-400 font-bold uppercase tracking-wider relative z-10">Score Promedio</p>
            </div>

            {/* CRM Stats */}
            <div className="glass-panel rounded-2xl p-6 relative overflow-hidden group border-t border-blue-500/20 md:col-span-1">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-blue-500/20 transition-all duration-700"></div>
                <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.2)]"><CloudArrowUpIcon className="w-5 h-5" /></div>
                </div>
                <div className="mb-4 relative z-10 flex items-baseline gap-1">
                    <span className="text-3xl font-black text-white font-mono tracking-tighter">{stats.crmSynced}</span>
                    <span className="text-sm font-medium text-slate-400">leads</span>
                </div>
                <div className="w-full bg-slate-800/50 h-1.5 rounded-full overflow-hidden relative z-10">
                     <div className="h-full bg-gradient-to-r from-blue-600 to-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-all duration-1000" style={{width: `${(stats.crmSynced / Math.max(leads.length, 1)) * 100}%`}}></div>
                </div>
                 <p className="mt-2 text-[10px] text-blue-400 font-bold uppercase tracking-wider relative z-10">Sincronizados CRM</p>
            </div>
            
            {/* Chart Area */}
            <div className="md:col-span-4 glass-panel rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-slate-900/50 to-transparent pointer-events-none"></div>
                <div className="relative z-10 flex flex-col gap-2 min-w-[150px]">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><PieChartIcon className="w-4 h-4 text-indigo-500" /> Industrias</h3>
                    <p className="text-sm text-slate-300">Distribución de prospectos por sector.</p>
                </div>
                <div className="relative z-10 flex items-center gap-8 flex-1 w-full justify-center sm:justify-start">
                    <SimplePieChart data={stats.industryData} />
                    <div className="flex flex-col gap-2 max-h-32 overflow-y-auto scrollbar-hide">
                        {stats.industryData.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-3 group">
                                <div className="w-2.5 h-2.5 rounded-sm shadow-[0_0_5px_currentColor]" style={{color: item.color, backgroundColor: item.color}}></div>
                                <span className="text-xs font-medium text-slate-300 w-24 truncate">{item.label}</span>
                                <span className="text-xs font-mono font-bold text-slate-500 group-hover:text-white transition-colors">{Math.round((item.value / leads.length) * 100)}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

        </div>

        {/* Sidebar Widgets (Badges) */}
        <div className="glass-panel rounded-2xl p-6 flex flex-col h-full border-t border-purple-500/20">
             <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                 <PuzzleIcon className="w-4 h-4 text-purple-400" /> Logros
             </h3>
             <div className="flex flex-col gap-3 overflow-y-auto flex-1 scrollbar-hide">
                 {BADGES.map(badge => {
                     const isUnlocked = unlockedBadges.has(badge.id);
                     return (
                         <div key={badge.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-300 ${isUnlocked ? 'bg-purple-500/10 border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.1)]' : 'bg-white/5 border-white/5 opacity-40 grayscale'}`}>
                             <div className="text-2xl">{badge.icon}</div>
                             <div>
                                 <div className={`text-xs font-bold ${isUnlocked ? 'text-white' : 'text-slate-400'}`}>{badge.name}</div>
                                 <div className="text-[10px] text-slate-500 leading-tight mt-0.5">{badge.desc}</div>
                             </div>
                         </div>
                     );
                 })}
             </div>
        </div>
    </div>
  );
};

export default Dashboard;
