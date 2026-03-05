
import React, { useState } from 'react';
import { AI_AGENCY_SERVICES } from '../constants/services';
import { AIService } from '../../types';
import { Sparkles, TrendingUp, Users, Zap, Shield, ChevronRight, Info, Scale } from 'lucide-react';
import { motion } from 'motion/react';

const ServicesView: React.FC = () => {
    const [selectedProfile, setSelectedProfile] = useState<'ALL' | 'DELEGADOR' | 'VISIONARIO' | 'TECNICO'>('ALL');

    const filteredServices = selectedProfile === 'ALL' 
        ? AI_AGENCY_SERVICES 
        : AI_AGENCY_SERVICES.filter(s => s.recommendedProfile === selectedProfile);

    return (
        <div className="p-8 space-y-8 animate-fadeIn overflow-y-auto h-full">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        <Zap className="w-8 h-8 text-yellow-400" /> Catálogo de Servicios IA
                    </h2>
                    <p className="text-slate-400 mt-1">Soluciones estratégicas para escalar tu agencia o negocio.</p>
                </div>
                
                <div className="flex bg-slate-900/50 p-1 rounded-xl border border-slate-800">
                    {(['ALL', 'DELEGADOR', 'VISIONARIO', 'TECNICO'] as const).map((profile) => (
                        <button
                            key={profile}
                            onClick={() => setSelectedProfile(profile)}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                                selectedProfile === profile 
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                                : 'text-slate-500 hover:text-slate-300'
                            }`}
                        >
                            {profile === 'ALL' ? 'Todos' : profile}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredServices.map((service, idx) => (
                    <motion.div 
                        key={service.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden flex flex-col group hover:border-indigo-500/50 transition-all hover:shadow-2xl hover:shadow-indigo-500/10"
                    >
                        <div className="p-6 space-y-4 flex-1">
                            <div className="flex justify-between items-start">
                                <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                                    <Sparkles className="w-6 h-6" />
                                </div>
                                <span className={`text-[10px] font-black px-3 py-1 rounded-full border ${
                                    service.recommendedProfile === 'DELEGADOR' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                    service.recommendedProfile === 'VISIONARIO' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                                    'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                }`}>
                                    {service.recommendedProfile}
                                </span>
                            </div>

                            <div>
                                <h3 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors">{service.name}</h3>
                                <p className="text-slate-400 text-sm mt-2 leading-relaxed">{service.description}</p>
                            </div>

                            <div className="space-y-3 pt-4 border-t border-slate-800">
                                <div className="flex items-center gap-3">
                                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                                    <div>
                                        <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest">ROI Estimado</div>
                                        <div className="text-xs text-slate-200 font-bold">{service.roi}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Info className="w-4 h-4 text-indigo-400" />
                                    <div>
                                        <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Tip Estratégico</div>
                                        <div className="text-xs text-slate-300 italic">"{service.scalingTip}"</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-800/50 p-6 border-t border-slate-800 grid grid-cols-2 gap-4">
                            <div>
                                <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Setup</div>
                                <div className="text-sm font-bold text-white">{service.setupCost}</div>
                            </div>
                            <div>
                                <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Mensualidad</div>
                                <div className="text-sm font-bold text-white">{service.monthlyCost}</div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Comparison Table Section */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden mt-12">
                <div className="p-6 border-b border-slate-800 flex items-center gap-3">
                    <Scale className="w-6 h-6 text-indigo-500" />
                    <h3 className="text-lg font-bold text-white">Comparativa Rápida</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-800/50 text-[10px] uppercase font-black text-slate-500 tracking-widest">
                            <tr>
                                <th className="px-6 py-4">Servicio</th>
                                <th className="px-6 py-4">Inversión Inicial</th>
                                <th className="px-6 py-4">Mensualidad</th>
                                <th className="px-6 py-4">Perfil</th>
                                <th className="px-6 py-4">Impacto ROI</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {AI_AGENCY_SERVICES.map((service) => (
                                <tr key={service.id} className="hover:bg-slate-800/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-bold text-white">{service.name}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-400">{service.setupCost}</td>
                                    <td className="px-6 py-4 text-sm text-slate-400">{service.monthlyCost}</td>
                                    <td className="px-6 py-4">
                                        <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-slate-800 text-slate-400 border border-slate-700">
                                            {service.recommendedProfile}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-emerald-400 font-medium">{service.roi}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ServicesView;
