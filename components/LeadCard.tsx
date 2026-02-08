
import React, { useState } from 'react';
import { Lead, LeadStatus } from '../types';
import { LocationIcon, TrashIcon, EyeIcon, SparklesIcon, LinkedInIcon, PhoneIcon, CpuIcon, ChatBubbleIcon, TargetIcon, ExchangeIcon, SwordsIcon, CheckCircleIcon } from './Icons';

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

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10b981'; // Emerald
    if (score >= 50) return '#facc15'; // Yellow
    return '#f43f5e'; // Rose
  };

  const scoreColor = getScoreColor(lead.qualificationScore);
  const isHighQuality = lead.qualificationScore >= 80;
  
  // Dimensions for the Radial SVG
  const size = 42; 
  const center = size / 2;
  const radius = 16; 
  const strokeWidth = 2.5;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (lead.qualificationScore / 100) * circumference;

  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick) onClick();
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onUpdateLead(lead.id, { status: e.target.value as LeadStatus });
  };

  return (
    <div 
        className={`glass-panel rounded-xl p-4 transition-all duration-300 relative group will-change-transform
        ${isSelected 
            ? 'border-indigo-500/50 bg-indigo-500/10 shadow-[0_0_20px_rgba(99,102,241,0.2)]' 
            : isHighQuality
                ? 'border-emerald-500/30 hover:border-emerald-400/50 hover:shadow-[0_0_25px_rgba(16,185,129,0.15)] hover:-translate-y-1 animate-breathing-glow'
                : 'hover:border-white/20 hover:bg-white/5 hover:shadow-xl hover:-translate-y-1'
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
        <div className="relative flex items-center justify-center w-10 h-10 shrink-0">
            <svg className="w-full h-full transform -rotate-90 overflow-visible" viewBox={`0 0 ${size} ${size}`}>
                <circle cx={center} cy={center} r={radius} stroke="rgba(255,255,255,0.1)" strokeWidth={strokeWidth} fill="transparent" />
                <circle
                    cx={center}
                    cy={center}
                    r={radius}
                    stroke={scoreColor}
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                    style={{ filter: isHighQuality ? `drop-shadow(0 0 4px ${scoreColor})` : 'none' }}
                />
            </svg>
            <span className={`absolute text-[10px] font-bold font-mono ${isHighQuality ? 'text-white' : 'text-slate-400'}`}>
                {lead.qualificationScore}
            </span>
        </div>
      </div>

      {/* Tags Row */}
      <div className="flex flex-wrap gap-2 mb-3 min-h-[24px]">
         {lead.crmSync && lead.crmSync.status === 'SUCCESS' && (
             <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border flex items-center gap-1 backdrop-blur-md ${lead.crmSync.platform === 'HUBSPOT' ? 'bg-[#ff7a59]/10 text-[#ff7a59] border-[#ff7a59]/20' : 'bg-[#00a1e0]/10 text-[#00a1e0] border-[#00a1e0]/20'}`}>
                 <CheckCircleIcon className="w-2.5 h-2.5" /> {lead.crmSync.platform === 'HUBSPOT' ? 'HubSpot' : lead.crmSync.platform === 'SALESFORCE' ? 'Salesforce' : 'CRM'}
             </span>
         )}

         {lead.isDeepDived && (
             <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex items-center gap-1 backdrop-blur-md">
                 <SparklesIcon className="w-2.5 h-2.5" /> VERIFIED
             </span>
         )}

         {lead.techStack && lead.techStack.length > 0 && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-500/10 text-blue-300 border border-blue-500/20 flex items-center gap-1 backdrop-blur-md">
                <CpuIcon className="w-2.5 h-2.5" /> {lead.techStack[0]}
            </span>
         )}
      </div>

      {/* Footer Info */}
      <div className="pt-3 border-t border-white/5 flex justify-between items-center text-[10px] text-slate-500">
          <div className="flex items-center gap-3 w-full">
            {lead.address && (
                <span className="flex items-center gap-1 truncate max-w-[50%]">
                    <LocationIcon className="w-3 h-3 text-slate-600" /> 
                    {lead.address.split(',')[0]}
                </span>
            )}
            
            <div className="flex-1"></div>

            {lead.seoAnalysis && (
                <span className={`flex items-center gap-1 font-mono font-bold ${lead.seoAnalysis.overallScore < 50 ? 'text-red-400' : 'text-emerald-400'}`}>
                    SEO:{lead.seoAnalysis.overallScore}
                </span>
            )}
          </div>
      </div>

      {/* HOVER QUICK ACTIONS (Floating Glass Panel) */}
      <div className={`absolute right-2 top-12 flex flex-col gap-1.5 transition-all duration-300 transform ${isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none'}`}>
          <div className="relative group/move p-1.5 glass-button rounded-lg text-slate-300 hover:text-white cursor-pointer" title="Mover">
                <ExchangeIcon className="w-3.5 h-3.5" />
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
                <ChatBubbleIcon className="w-3.5 h-3.5" />
            </button>
          )}

          {onOpenBattlecard && (
            <button 
                onClick={(e) => { e.stopPropagation(); onOpenBattlecard(lead); }}
                className="p-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg shadow-lg shadow-amber-500/20 border border-amber-400/30 transition-all"
                title="Battlecard"
            >
                <SwordsIcon className="w-3.5 h-3.5" />
            </button>
          )}
          
          <button 
            onClick={handleViewDetails}
            className="p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-lg shadow-indigo-500/20 border border-indigo-400/30 transition-all"
            title="Ver"
          >
              <EyeIcon className="w-3.5 h-3.5" />
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
                <LinkedInIcon className="w-3.5 h-3.5" />
             </a>
          )}

           <button 
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-1.5 glass-button hover:bg-red-500/20 hover:border-red-500/40 text-slate-400 hover:text-red-400 rounded-lg transition-all"
            title="Eliminar"
          >
              <TrashIcon className="w-3.5 h-3.5" />
          </button>
      </div>

    </div>
  );
};

export default React.memo(LeadCard);
