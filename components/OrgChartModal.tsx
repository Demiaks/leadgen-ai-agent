
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
            case 'DECISION_MAKER': return 'border-emerald-500 bg-emerald-900/20 text-emerald-400';
            case 'BLOCKER': return 'border-red-500 bg-red-900/20 text-red-400';
            case 'INFLUENCER': return 'border-yellow-500 bg-yellow-900/20 text-yellow-400';
            default: return 'border-blue-500 bg-blue-900/20 text-blue-400';
        }
    };

    return (
        <div className="fixed inset-0 z-[80] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
            <div className="w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col h-[80vh]">
                
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-600 rounded-lg"><SitemapIcon className="w-6 h-6 text-white"/></div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Comité de Compra</h2>
                            <p className="text-sm text-slate-400">Mapa de influencia de {lead.company}</p>
                        </div>
                    </div>
                    <button onClick={onClose}><XMarkIcon className="w-6 h-6 text-slate-500 hover:text-white"/></button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-8 relative bg-slate-950">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-full">
                            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                            <p className="text-slate-400">Analizando estructura corporativa...</p>
                        </div>
                    ) : nodes.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-500">
                            <SitemapIcon className="w-16 h-16 mb-4 opacity-50"/>
                            <p>No se pudo generar el organigrama.</p>
                            <button onClick={handleGenerate} className="mt-4 text-indigo-400 underline">Reintentar</button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-8">
                            {/* Simple visual tree layout */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                                {nodes.map((node, i) => (
                                    <div key={i} className={`p-4 rounded-xl border-l-4 bg-slate-900 shadow-lg relative group hover:-translate-y-1 transition-transform ${getNodeColor(node.type)}`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-[10px] font-bold uppercase tracking-wide opacity-80">{node.type.replace('_', ' ')}</span>
                                            {node.name === lead.name && <span className="bg-white/10 px-2 py-0.5 rounded text-[9px] text-white">Contacto Actual</span>}
                                        </div>
                                        <h4 className="font-bold text-white text-lg flex items-center gap-2">
                                            <UserCircleIcon className="w-5 h-5"/> {node.name}
                                        </h4>
                                        <p className="text-sm opacity-80 pl-7">{node.role}</p>
                                        
                                        {/* Strategy Hint */}
                                        <div className="mt-3 pt-3 border-t border-white/10 text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                            <TargetIcon className="w-3 h-3"/> 
                                            {node.type === 'DECISION_MAKER' ? 'Foco: ROI y Resultados' : node.type === 'BLOCKER' ? 'Foco: Riesgo y Seguridad' : 'Foco: Usabilidad'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OrgChartModal;
