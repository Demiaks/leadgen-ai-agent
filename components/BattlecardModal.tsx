
import React from 'react';
import { Battlecard, Lead } from '../types';
import { XMarkIcon, TargetIcon, SparklesIcon, ShieldExclamationIcon, LightBulbIcon, KeyIcon, SwordsIcon } from './Icons';

interface BattlecardModalProps {
    lead: Lead;
    battlecard: Battlecard;
    onClose: () => void;
}

const BattlecardModal: React.FC<BattlecardModalProps> = ({ lead, battlecard, onClose }) => {
    
    // Personality Type Color Logic
    const getPersonalityColor = (type: string) => {
        switch(type) {
            case 'DRIVER': return 'from-red-600 to-orange-600'; // Dominant
            case 'ANALYTICAL': return 'from-blue-600 to-cyan-600'; // Logical
            case 'EXPRESSIVE': return 'from-yellow-500 to-amber-600'; // Social
            case 'AMIABLE': return 'from-emerald-500 to-teal-600'; // Peaceful
            default: return 'from-indigo-600 to-purple-600';
        }
    };

    return (
        <div className="fixed inset-0 z-[80] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
            <div className="w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-slate-800 bg-slate-950">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-500/20 rounded-lg border border-indigo-500/30">
                            <SwordsIcon className="w-6 h-6 text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white tracking-wide">Ficha de Estrategia</h2>
                            <p className="text-sm text-slate-400">Objetivo: {lead.name} ({lead.company})</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    
                    {/* Top Row: Personality & Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        
                        {/* Personality Card */}
                        <div className={`md:col-span-2 rounded-xl p-5 bg-gradient-to-r ${getPersonalityColor(battlecard.personalityType)} shadow-lg text-white relative overflow-hidden`}>
                            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/20 rounded-full blur-2xl"></div>
                            <div className="flex justify-between items-start relative z-10">
                                <div>
                                    <span className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1 block">Perfil Psicológico</span>
                                    <h3 className="text-2xl font-black mb-2">{battlecard.personalityType}</h3>
                                    <p className="text-sm opacity-90 font-medium leading-relaxed max-w-md">{battlecard.personalityTips}</p>
                                </div>
                                <div className="text-4xl opacity-50">🧠</div>
                            </div>
                        </div>

                        {/* Win Probability */}
                        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 flex flex-col items-center justify-center relative">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Probabilidad de Éxito</span>
                            <div className="text-5xl font-black text-white mb-1">{battlecard.winProbability}%</div>
                            <div className="w-full h-1.5 bg-slate-700 rounded-full mt-2 overflow-hidden">
                                <div className="h-full bg-emerald-500" style={{width: `${battlecard.winProbability}%`}}></div>
                            </div>
                        </div>
                    </div>

                    {/* Middle Row: The Pitch */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* Ice Breakers */}
                        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
                            <h4 className="text-sm font-bold text-indigo-400 uppercase tracking-wide mb-4 flex items-center gap-2">
                                <SparklesIcon className="w-4 h-4" /> Rompehielos (Openers)
                            </h4>
                            <ul className="space-y-3">
                                {battlecard.iceBreakers?.map((ice, i) => (
                                    <li key={i} className="flex gap-3 text-sm text-slate-300">
                                        <span className="bg-indigo-900/50 text-indigo-300 font-bold px-2 py-0.5 rounded text-xs h-fit mt-0.5">{i+1}</span>
                                        <span>{ice}</span>
                                    </li>
                                )) || <li className="text-slate-500 text-sm italic">No generados.</li>}
                            </ul>
                        </div>

                        {/* Value Hook & Golden Question */}
                        <div className="space-y-6">
                            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
                                <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wide mb-2 flex items-center gap-2">
                                    <TargetIcon className="w-4 h-4" /> Gancho de Valor
                                </h4>
                                <p className="text-sm text-white italic font-medium">"{battlecard.valueHook}"</p>
                            </div>
                            
                            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
                                <h4 className="text-sm font-bold text-yellow-400 uppercase tracking-wide mb-2 flex items-center gap-2">
                                    <KeyIcon className="w-4 h-4" /> La Pregunta de Oro
                                </h4>
                                <p className="text-sm text-white font-medium">"{battlecard.goldenQuestion}"</p>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Row: Objection Handling */}
                    <div className="bg-red-900/10 border border-red-500/20 rounded-xl p-5">
                        <h4 className="text-sm font-bold text-red-400 uppercase tracking-wide mb-4 flex items-center gap-2">
                            <ShieldExclamationIcon className="w-4 h-4" /> Defensa Contra Objeción Principal
                        </h4>
                        <div className="flex flex-col md:flex-row gap-6">
                            <div className="flex-1">
                                <span className="text-xs text-red-300/70 font-bold uppercase block mb-1">Si dicen...</span>
                                <p className="text-white font-medium text-sm bg-red-900/20 p-3 rounded-lg border border-red-500/10">"{battlecard.killShotObjection?.objection}"</p>
                            </div>
                            <div className="flex items-center justify-center">
                                <span className="text-2xl text-slate-600">➔</span>
                            </div>
                            <div className="flex-1">
                                <span className="text-xs text-emerald-400/70 font-bold uppercase block mb-1">Responde...</span>
                                <p className="text-emerald-100 font-medium text-sm bg-emerald-900/10 p-3 rounded-lg border border-emerald-500/20">"{battlecard.killShotObjection?.counter}"</p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default BattlecardModal;
