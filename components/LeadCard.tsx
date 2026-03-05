
import React, { useState } from 'react';
import { Lead, LeadStatus } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MapPin, Trash2, Eye, Sparkles, Linkedin, Phone, Cpu, 
  MessageSquare, Target, ArrowRightLeft, Swords, CheckCircle 
} from 'lucide-react';

interface LeadCardProps {
  lead: Lead;
  isSelected: boolean;
  compact?: boolean; 
  onToggleSelect: () => void;
  onUpdateLead: (id: string, updates: Partial<Lead>) => void;
  onDelete: () => void;
  onClick?: () => void; 
  onStartRoleplay?: (lead: Lead) => void;
  onOpenBattlecard?: (lead: Lead) => void; 
}

const LeadCard: React.FC<LeadCardProps> = ({ 
  lead, 
  isSelected, 
  onToggleSelect, 
  onUpdateLead, 
  onDelete,
  onClick,
  onStartRoleplay,
  onOpenBattlecard
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const [showSeoDetails, setShowSeoDetails] = useState(false);

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10b981'; // Emerald
    if (score >= 50) return '#facc15'; // Yellow
    return '#f43f5e'; // Rose
  };

  const scoreColor = getScoreColor(lead.qualificationScore);
  const isHighQuality = lead.qualificationScore >= 80;
  
  // Dimensions for the Radial SVG
  const size = 44; 
  const center = size / 2;
  const radius = 17; 
  const strokeWidth = 3;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (lead.qualificationScore / 100) * circumference;

  const gradientId = `score-gradient-${lead.id}`;

  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick) onClick();
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onUpdateLead(lead.id, { status: e.target.value as LeadStatus });
  };

  return (
    <motion.div 
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        whileHover={{ y: -4 }}
        className={`glass-panel rounded-xl p-4 transition-all duration-300 relative group will-change-transform
        ${isSelected 
            ? 'border-indigo-500/50 bg-indigo-500/10 shadow-[0_0_20px_rgba(99,102,241,0.2)]' 
            : isHighQuality
                ? 'border-emerald-500/30 hover:border-emerald-400/50 hover:shadow-[0_0_25px_rgba(16,185,129,0.15)] animate-breathing-glow'
                : 'hover:border-white/20 hover:bg-white/5 hover:shadow-xl'
        }
        `}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onClick}
    >
      
      {/* Selection & Header */}
      <div className="flex justify-between items-start gap-3 mb-3">
        <div className="flex gap-3 overflow-hidden items-start">
             <div className="pt-1" onClick={(e) => e.stopPropagation()}>
                <div className={`w-4 h-4 rounded border flex items-center justify-center cursor-pointer transition-colors ${isSelected ? 'bg-indigo-500 border-indigo-500' : 'border-slate-600 bg-slate-800/50 hover:border-indigo-400'}`} onClick={onToggleSelect}>
                    {isSelected && <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>}
                </div>
            </div>
            <div className="min-w-0 flex-1">
                <h3 className="font-bold text-white text-sm truncate leading-tight group-hover:text-indigo-300 transition-colors" title={lead.name}>
                    {lead.name}
                </h3>
                <div className="flex flex-col mt-0.5">
                    <span className="text-xs font-medium text-slate-300 truncate" title={lead.company}>{lead.company}</span>
                    <span className="text-[10px] text-slate-500 truncate font-mono">{lead.role}</span>
                </div>
            </div>
        </div>
        
        {/* Radial Progress Score */}
        <div className="relative flex items-center justify-center w-11 h-11 shrink-0">
            <svg className="w-full h-full transform -rotate-90 overflow-visible" viewBox={`0 0 ${size} ${size}`}>
                <defs>
                    <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor={lead.qualificationScore >= 80 ? '#10b981' : lead.qualificationScore >= 50 ? '#facc15' : '#f43f5e'} />
                        <stop offset="100%" stopColor={lead.qualificationScore >= 80 ? '#34d399' : lead.qualificationScore >= 50 ? '#fbbf24' : '#fb7185'} />
                    </linearGradient>
                </defs>
                <circle cx={center} cy={center} r={radius} stroke="rgba(255,255,255,0.05)" strokeWidth={strokeWidth} fill="transparent" />
                <motion.circle
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: strokeDashoffset }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    cx={center}
                    cy={center}
                    r={radius}
                    stroke={`url(#${gradientId})`}
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                    style={{ filter: isHighQuality ? `drop-shadow(0 0 6px ${scoreColor}88)` : 'none' }}
                />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
                <span className={`text-[10px] font-black font-mono leading-none ${isHighQuality ? 'text-white' : 'text-slate-300'}`}>
                    {lead.qualificationScore}
                </span>
            </div>
        </div>
      </div>

      {/* Tags Row */}
      <div className="flex flex-wrap gap-2 mb-3 min-h-[24px]">
         {lead.crmSync && lead.crmSync.status === 'SUCCESS' && (
             <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border flex items-center gap-1 backdrop-blur-md ${lead.crmSync.platform === 'HUBSPOT' ? 'bg-[#ff7a59]/10 text-[#ff7a59] border-[#ff7a59]/20' : 'bg-[#00a1e0]/10 text-[#00a1e0] border-[#00a1e0]/20'}`}>
                 <CheckCircle className="w-2.5 h-2.5" /> {lead.crmSync.platform === 'HUBSPOT' ? 'HubSpot' : lead.crmSync.platform === 'SALESFORCE' ? 'Salesforce' : 'CRM'}
             </span>
         )}

         {lead.isDeepDived && (
             <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex items-center gap-1 backdrop-blur-md">
                 <Sparkles className="w-2.5 h-2.5" /> VERIFIED
             </span>
         )}

         {/* Pain Points Display */}
         {lead.painPoints && lead.painPoints.length > 0 && (
            <span 
                className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-500/10 text-red-300 border border-red-500/20 flex items-center gap-1 backdrop-blur-md cursor-help transition-colors hover:bg-red-500/20"
                title={lead.painPoints.length > 1 ? lead.painPoints.join('\n') : undefined}
            >
                <Target className="w-2.5 h-2.5" /> 
                {lead.painPoints[0]}
                {lead.painPoints.length > 1 && <span className="opacity-75 ml-0.5">+{lead.painPoints.length - 1}</span>}
            </span>
         )}

         {lead.techStack && lead.techStack.length > 0 && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-500/10 text-blue-300 border border-blue-500/20 flex items-center gap-1 backdrop-blur-md">
                <Cpu className="w-2.5 h-2.5" /> {lead.techStack[0]}
            </span>
         )}

         {lead.sentimentAnalysis && (
            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border flex items-center gap-1 backdrop-blur-md ${
                lead.sentimentAnalysis.sentiment === 'POSITIVE' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' :
                lead.sentimentAnalysis.sentiment === 'NEGATIVE' ? 'bg-rose-500/10 text-rose-300 border-rose-500/20' :
                'bg-slate-500/10 text-slate-300 border-slate-500/20'
            }`}>
                <MessageSquare className="w-2.5 h-2.5" /> {lead.sentimentAnalysis.sentiment}
            </span>
         )}
      </div>

      {/* Footer Info */}
      <div className="pt-3 border-t border-white/5 flex justify-between items-center text-[10px] text-slate-500">
          <div className="flex items-center gap-3 w-full">
            {lead.address && (
                <span className="flex items-center gap-1 truncate max-w-[50%]">
                    <MapPin className="w-3 h-3 text-slate-600" /> 
                    {lead.address.split(',')[0]}
                </span>
            )}
            
            <div className="flex-1"></div>

            {lead.seoAnalysis && (
                <button 
                    onClick={(e) => { e.stopPropagation(); setShowSeoDetails(!showSeoDetails); }}
                    className={`flex items-center gap-1 font-mono font-bold px-1.5 py-0.5 rounded transition-colors ${lead.seoAnalysis.overallScore < 50 ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'}`}
                >
                    SEO:{lead.seoAnalysis.overallScore}
                </button>
            )}
          </div>
      </div>

      <AnimatePresence>
          {showSeoDetails && lead.seoAnalysis && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                  <div className="pt-3 mt-3 border-t border-white/5 space-y-2">
                      <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-slate-500 uppercase">Análisis SEO</span>
                          <span className="text-[10px] font-mono text-slate-400">{lead.seoAnalysis.overallScore}/100</span>
                      </div>
                      
                      {lead.seoAnalysis.issues && lead.seoAnalysis.issues.length > 0 && (
                          <div className="space-y-1">
                              <p className="text-[9px] font-bold text-red-400 uppercase">Problemas:</p>
                              <ul className="list-disc list-inside">
                                  {lead.seoAnalysis.issues.slice(0, 3).map((issue, i) => (
                                      <li key={i} className="text-[9px] text-slate-400 leading-tight">{issue}</li>
                                  ))}
                              </ul>
                          </div>
                      )}

                      {lead.seoAnalysis.recommendations && lead.seoAnalysis.recommendations.length > 0 && (
                          <div className="space-y-1">
                              <p className="text-[9px] font-bold text-emerald-400 uppercase">Recomendaciones:</p>
                              <ul className="list-disc list-inside">
                                  {lead.seoAnalysis.recommendations.slice(0, 3).map((rec, i) => (
                                      <li key={i} className="text-[9px] text-slate-400 leading-tight">{rec}</li>
                                  ))}
                              </ul>
                          </div>
                      )}
                  </div>
              </motion.div>
          )}
      </AnimatePresence>

      {/* HOVER QUICK ACTIONS (Floating Glass Panel) */}
      <div className={`absolute right-2 top-12 flex flex-col gap-1.5 transition-all duration-300 transform ${isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none'}`}>
          <div className="relative group/move p-1.5 glass-button rounded-lg text-slate-300 hover:text-white cursor-pointer" title="Mover">
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <select
                    value={lead.status}
                    onChange={(e) => { e.stopPropagation(); handleStatusChange(e); }}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                >
                    <option value={LeadStatus.NEW}>Nuevos</option>
                    <option value={LeadStatus.CONTACTED}>Contactados</option>
                    <option value={LeadStatus.QUALIFIED}>Interesados</option>
                    <option value={LeadStatus.DISQUALIFIED}>Descartados</option>
                </select>
          </div>

          {onStartRoleplay && (
            <button 
                onClick={(e) => { e.stopPropagation(); onStartRoleplay(lead); }}
                className="p-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg shadow-lg shadow-violet-500/20 border border-violet-400/30 transition-all"
                title="Roleplay"
            >
                <MessageSquare className="w-3.5 h-3.5" />
            </button>
          )}

          {onOpenBattlecard && (
            <button 
                onClick={(e) => { e.stopPropagation(); onOpenBattlecard(lead); }}
                className="p-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg shadow-lg shadow-amber-500/20 border border-amber-400/30 transition-all"
                title="Battlecard"
            >
                <Swords className="w-3.5 h-3.5" />
            </button>
          )}
          
          <button 
            onClick={handleViewDetails}
            className="p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-lg shadow-indigo-500/20 border border-indigo-400/30 transition-all"
            title="Ver"
          >
              <Eye className="w-3.5 h-3.5" />
          </button>
          
          {lead.linkedinUrl && (
             <a 
                href={lead.linkedinUrl} 
                target="_blank" 
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="p-1.5 bg-[#0077b5] hover:bg-[#006097] text-white rounded-lg shadow-lg border border-[#0077b5]/50 transition-all"
                title="LinkedIn"
            >
                <Linkedin className="w-3.5 h-3.5" />
             </a>
          )}

           <button 
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-1.5 glass-button hover:bg-red-500/20 hover:border-red-500/40 text-slate-400 hover:text-red-400 rounded-lg transition-all"
            title="Eliminar"
          >
              <Trash2 className="w-3.5 h-3.5" />
          </button>
      </div>

    </motion.div>
  );
};

export default React.memo(LeadCard);
