
import React, { useState } from 'react';
import { Lead, LeadStatus } from '../types';
import { MapIcon, LocationIcon, TargetIcon } from './Icons';

interface MapViewProps {
    leads: Lead[];
    onSelectLead: (lead: Lead) => void;
}

const MapView: React.FC<MapViewProps> = ({ leads, onSelectLead }) => {
    const [hoveredLead, setHoveredLead] = useState<Lead | null>(null);

    // Filter only valid leads
    const activeLeads = leads.filter(l => l.status !== LeadStatus.DISQUALIFIED);

    return (
        <div className="flex flex-col h-full bg-slate-950 overflow-hidden relative rounded-2xl border border-white/5 shadow-inner">
            {/* Header Overlay */}
            <div className="absolute top-4 left-4 z-20 glass-panel p-4 rounded-xl shadow-2xl max-w-xs border border-white/10">
                <h3 className="text-white font-bold flex items-center gap-2">
                    <MapIcon className="w-5 h-5 text-emerald-500 animate-pulse" />
                    Radar de Prospección
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                    Visualización táctica de leads basada en densidad geográfica estimada.
                </p>
                <div className="mt-3 flex gap-3 text-[10px]">
                    <span className="flex items-center gap-1.5 text-slate-300 font-mono"><span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_5px_currentColor]"></span> High</span>
                    <span className="flex items-center gap-1.5 text-slate-300 font-mono"><span className="w-2 h-2 rounded-full bg-yellow-500 shadow-[0_0_5px_currentColor]"></span> Mid</span>
                    <span className="flex items-center gap-1.5 text-slate-300 font-mono"><span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_5px_currentColor]"></span> Low</span>
                </div>
            </div>

            {/* Radar Grid Visuals */}
            <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
                {/* Concentric Circles */}
                <div className="w-[800px] h-[800px] border border-emerald-500/10 rounded-full absolute"></div>
                <div className="w-[600px] h-[600px] border border-emerald-500/10 rounded-full absolute"></div>
                <div className="w-[400px] h-[400px] border border-emerald-500/20 rounded-full absolute"></div>
                <div className="w-[200px] h-[200px] border border-emerald-500/30 rounded-full absolute bg-emerald-900/5"></div>
                
                {/* Crosshairs */}
                <div className="w-full h-[1px] bg-emerald-500/20 absolute"></div>
                <div className="h-full w-[1px] bg-emerald-500/20 absolute"></div>
                
                {/* Scanning line animation */}
                <div className="w-[500px] h-[500px] bg-gradient-to-r from-transparent via-transparent to-emerald-500/20 absolute top-1/2 left-1/2 origin-top-left animate-radar-scan rounded-full clip-path-radar"></div>
            </div>

            {/* Map Area */}
            <div className="flex-1 relative cursor-crosshair z-10">
                {activeLeads.map((lead) => {
                    // Use mock coordinates (0-100) mapped to %
                    const x = lead.coordinates?.x || 50;
                    const y = lead.coordinates?.y || 50;
                    
                    const colorClass = lead.qualificationScore > 80 ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 
                                       lead.qualificationScore > 50 ? 'bg-yellow-500 shadow-[0_0_10px_#eab308]' : 
                                       'bg-blue-500 shadow-[0_0_10px_#3b82f6]';

                    return (
                        <div 
                            key={lead.id}
                            className="absolute group"
                            style={{ left: `${x}%`, top: `${y}%` }}
                            onMouseEnter={() => setHoveredLead(lead)}
                            onMouseLeave={() => setHoveredLead(null)}
                            onClick={() => onSelectLead(lead)}
                        >
                            <div className={`w-3 h-3 rounded-full cursor-pointer transform transition-all hover:scale-150 ${colorClass}`}></div>
                            <div className={`absolute -bottom-1 -right-1 w-full h-full rounded-full ${colorClass} opacity-30 animate-ping duration-1000`}></div>
                            
                            {/* Connector Line to Tooltip logic could go here */}
                        </div>
                    );
                })}
            </div>

            {/* Hover Tooltip */}
            {hoveredLead && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 glass-panel p-4 rounded-xl shadow-2xl z-30 min-w-[220px] animate-fadeIn border border-white/10">
                    <div className="flex justify-between items-start mb-1">
                        <h4 className="font-bold text-white text-sm truncate max-w-[150px]">{hoveredLead.company}</h4>
                        <span className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded ${hoveredLead.qualificationScore > 70 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                            {hoveredLead.qualificationScore}
                        </span>
                    </div>
                    <p className="text-xs text-indigo-300 truncate font-medium">{hoveredLead.role}</p>
                    <div className="flex items-center gap-1 mt-3 text-[10px] text-slate-400 border-t border-white/5 pt-2">
                        <LocationIcon className="w-3 h-3" /> {hoveredLead.address || hoveredLead.location}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MapView;
