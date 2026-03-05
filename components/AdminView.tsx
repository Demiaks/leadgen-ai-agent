
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Shield, Users, Database, Activity, Trash2, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

const AdminView: React.FC = () => {
    const { leads, userProfile, deleteLead, resetDashboard, addNotification } = useApp();
    const [confirmReset, setConfirmReset] = useState(false);

    const stats = [
        { label: 'Total Leads', value: leads.length, icon: Database, color: 'text-blue-400' },
        { label: 'Usuarios Activos', value: 1, icon: Users, color: 'text-emerald-400' },
        { label: 'Estado Sistema', value: 'Operativo', icon: Activity, color: 'text-indigo-400' },
    ];

    const handleSyncProfile = async () => {
        if (!userProfile) return;
        addNotification("Sincronizando perfil con Supabase...", "INFO");
        try {
            const { profileStorage } = await import('../services/storage');
            await profileStorage.save(userProfile);
            addNotification("Perfil sincronizado con éxito", "SUCCESS");
        } catch (e) {
            addNotification("Error al sincronizar. Revisa la consola.", "ERROR");
        }
    };

    const handleGlobalReset = () => {
        if (confirmReset) {
            resetDashboard();
            addNotification("Sistema reseteado globalmente", "SUCCESS");
            setConfirmReset(false);
        } else {
            setConfirmReset(true);
            setTimeout(() => setConfirmReset(false), 3000);
        }
    };

    return (
        <div className="p-8 space-y-8 animate-fadeIn">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        <Shield className="w-8 h-8 text-indigo-500" /> Panel de Control Maestro
                    </h2>
                    <p className="text-slate-400 mt-1">Bienvenido, {userProfile?.name}. Tienes acceso de Super Administrador.</p>
                </div>
                <div className="flex gap-4">
                    <button 
                        onClick={handleSyncProfile}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20"
                    >
                        <Activity className="w-4 h-4" /> Sincronizar Perfil
                    </button>
                    <button 
                        onClick={handleGlobalReset}
                        className={`px-6 py-2 rounded-xl font-bold flex items-center gap-2 transition-all ${confirmReset ? 'bg-red-600 text-white animate-pulse' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                    >
                        <Trash2 className="w-4 h-4" /> {confirmReset ? '¿Seguro? Haz clic de nuevo' : 'Resetear Todo'}
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-xl bg-slate-800 ${stat.color}`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                        </div>
                        <div className="text-3xl font-black text-white">{stat.value}</div>
                        <div className="text-sm text-slate-500 font-bold uppercase tracking-wider mt-1">{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* Lead Management Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
                <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-white">Gestión de Leads Global</h3>
                    <span className="text-xs bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-full font-bold border border-indigo-500/20">
                        {leads.length} Registros
                    </span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-800/50 text-[10px] uppercase font-black text-slate-500 tracking-widest">
                            <tr>
                                <th className="px-6 py-4">Lead</th>
                                <th className="px-6 py-4">Empresa</th>
                                <th className="px-6 py-4">Score</th>
                                <th className="px-6 py-4">Estado</th>
                                <th className="px-6 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {leads.map((lead) => (
                                <tr key={lead.id} className="hover:bg-slate-800/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-bold text-white">{lead.name}</div>
                                        <div className="text-xs text-slate-500">{lead.role}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-400">{lead.company}</td>
                                    <td className="px-6 py-4">
                                        <span className={`text-sm font-black ${lead.qualificationScore > 70 ? 'text-emerald-400' : 'text-yellow-400'}`}>
                                            {lead.qualificationScore}%
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-slate-800 text-slate-400 border border-slate-700">
                                            {lead.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button 
                                            onClick={() => deleteLead(lead.id)}
                                            className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {leads.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500 italic">
                                        No hay leads en la base de datos global.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Admin Logs / System Health */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-amber-500" /> Alertas del Sistema
                    </h3>
                    <div className="space-y-4">
                        <div className="flex gap-3 p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl">
                            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                            <div>
                                <div className="text-xs font-bold text-amber-200">Uso de API Gemini</div>
                                <div className="text-[10px] text-amber-500/70">El uso de tokens ha aumentado un 15% en las últimas 24h.</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminView;
