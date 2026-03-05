
import React, { useEffect, useState } from 'react';
import { Lead, OrgNode } from '../types';
import { generateOrgChart } from '../services/geminiService';
import { XMarkIcon, SitemapIcon, UserCircleIcon, TargetIcon, SparklesIcon } from './Icons';

interface OrgChartModalProps {
    lead: Lead;
    onClose: () => void;
    apiKey?: string;
    onUpdateLead: (id: string, updates: Partial<Lead>) => void;
}

const OrgChartModal: React.FC<OrgChartModalProps> = ({ lead, onClose, apiKey, onUpdateLead }) => {
    const [nodes, setNodes] = useState<OrgNode[]>(lead.orgChart || []);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (nodes.length === 0 && apiKey) {
            handleGenerate();
        }
    }, []);

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const newNodes = await generateOrgChart(lead, apiKey);
            setNodes(newNodes);
            onUpdateLead(lead.id, { orgChart: newNodes });
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const getNodeColor = (type: string) => {
        switch(type) {
            case 'DECISION_MAKER': return 'border-emerald-500 bg-emerald-900/20 text-emerald-400 shadow-emerald-500/10';
            case 'BLOCKER': return 'border-red-500 bg-red-900/20 text-red-400 shadow-red-500/10';
            case 'INFLUENCER': return 'border-yellow-500 bg-yellow-900/20 text-yellow-400 shadow-yellow-500/10';
            default: return 'border-blue-500 bg-blue-900/20 text-blue-400 shadow-blue-500/10';
        }
    };

    // Grouping logic
    const departments = nodes.reduce((acc, node) => {
        const dept = node.department || 'General';
        if (!acc[dept]) acc[dept] = [];
        acc[dept].push(node);
        return acc;
    }, {} as Record<string, OrgNode[]>);

    return (
        <div className="fixed inset-0 z-[80] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4 animate-fadeIn">
            <div className="w-full max-w-6xl bg-slate-900 border border-slate-700/50 rounded-3xl shadow-2xl flex flex-col h-[85vh] overflow-hidden">
                
                {/* Header */}
                <div className="flex justify-between items-center px-8 py-6 border-b border-slate-800 bg-slate-900/50">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-600/20 border border-indigo-500/30 rounded-2xl shadow-lg shadow-indigo-500/10">
                            <SitemapIcon className="w-8 h-8 text-indigo-400"/>
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white tracking-tight">Estructura de Poder</h2>
                            <p className="text-sm text-slate-400 font-medium">Mapa estratégico de influencia en {lead.company}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={handleGenerate} disabled={loading} className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-2 px-4 py-2 rounded-xl border border-indigo-500/20 hover:bg-indigo-500/10 transition-all">
                            <SparklesIcon className="w-4 h-4" /> {loading ? 'Analizando...' : 'Recalcular Mapa'}
                        </button>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-800 transition-colors"><XMarkIcon className="w-7 h-7 text-slate-500 hover:text-white"/></button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-8 relative bg-slate-950 scrollbar-hide">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-full space-y-6">
                            <div className="relative">
                                <div className="w-20 h-20 border-4 border-indigo-500/20 rounded-full"></div>
                                <div className="w-20 h-20 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                                <div className="absolute inset-0 flex items-center justify-center"><SitemapIcon className="w-8 h-8 text-indigo-400 animate-pulse" /></div>
                            </div>
                            <div className="text-center">
                                <p className="text-white font-bold text-lg">Agente Investigador activado</p>
                                <p className="text-slate-500 text-sm">Escaneando LinkedIn y registros corporativos...</p>
                            </div>
                        </div>
                    ) : nodes.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-4">
                            <SitemapIcon className="w-20 h-20 opacity-20"/>
                            <div className="text-center">
                                <p className="text-lg font-bold">Mapa no disponible</p>
                                <p className="text-sm">No se pudo reconstruir la estructura organizacional.</p>
                            </div>
                            <button onClick={handleGenerate} className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-500 transition-all">Generar Ahora</button>
                        </div>
                    ) : (
                        <div className="space-y-12">
                            {Object.entries(departments).map(([dept, deptNodes]) => (
                                <div key={dept} className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] whitespace-nowrap">{dept}</h3>
                                        <div className="h-px bg-slate-800 w-full"></div>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                        {deptNodes.map((node, i) => (
                                            <div key={i} className={`group p-5 rounded-2xl border-l-4 bg-slate-900/50 backdrop-blur-sm border border-slate-800/50 shadow-xl relative hover:-translate-y-1 hover:bg-slate-900 transition-all duration-300 ${getNodeColor(node.type)}`}>
                                                <div className="flex justify-between items-start mb-3">
                                                    <div className="flex flex-col">
                                                        <span className="text-[9px] font-black uppercase tracking-wider opacity-60 mb-1">{node.type.replace('_', ' ')}</span>
                                                        <h4 className="font-bold text-white text-base leading-tight group-hover:text-indigo-300 transition-colors">{node.name}</h4>
                                                    </div>
                                                    <div className={`p-2 rounded-lg bg-slate-800/50 border border-white/5`}>
                                                        <UserCircleIcon className="w-5 h-5"/>
                                                    </div>
                                                </div>
                                                
                                                <p className="text-xs text-slate-400 font-medium mb-4">{node.role}</p>
                                                
                                                {/* Strategy Hint */}
                                                <div className="pt-3 border-t border-white/5 space-y-2">
                                                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                                                        <TargetIcon className="w-3 h-3 text-indigo-500"/> 
                                                        ESTRATEGIA RECOMENDADA
                                                    </div>
                                                    <p className="text-[10px] text-slate-300 leading-relaxed italic">
                                                        {node.type === 'DECISION_MAKER' ? 'Enfocar en ROI, escalabilidad y visión de largo plazo.' : 
                                                         node.type === 'BLOCKER' ? 'Neutralizar con pruebas de seguridad y casos de éxito del sector.' : 
                                                         node.type === 'INFLUENCER' ? 'Ganar su confianza con demos técnicas y facilidad de uso.' : 
                                                         'Demostrar ahorro de tiempo en tareas operativas diarias.'}
                                                    </p>
                                                </div>

                                                {node.name === lead.name && (
                                                    <div className="absolute -top-2 -right-2 bg-indigo-600 text-white text-[9px] font-black px-2 py-1 rounded-lg shadow-lg shadow-indigo-500/20 border border-indigo-400/30">
                                                        CONTACTO ACTUAL
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                
                {/* Footer Legend */}
                <div className="px-8 py-4 bg-slate-900/80 border-t border-slate-800 flex items-center justify-between">
                    <div className="flex gap-6">
                        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500"></div><span className="text-[10px] font-bold text-slate-400 uppercase">Decisor</span></div>
                        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-yellow-500"></div><span className="text-[10px] font-bold text-slate-400 uppercase">Influenciador</span></div>
                        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500"></div><span className="text-[10px] font-bold text-slate-400 uppercase">Bloqueador</span></div>
                        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500"></div><span className="text-[10px] font-bold text-slate-400 uppercase">Usuario</span></div>
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium italic">Datos inferidos mediante análisis de red profesional e IA.</p>
                </div>
            </div>
        </div>
    );
};

export default OrgChartModal;
