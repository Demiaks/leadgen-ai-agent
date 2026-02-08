
import React, { useState } from 'react';
import { Lead, LeadStatus } from '../types';
import { UserCircleIcon, BriefcaseIcon, LocationIcon, MailIcon, PhoneIcon, LinkIcon, LinkedInIcon, XMarkIcon, SaveIcon, TargetIcon, PuzzleIcon } from './Icons';

interface ManualLeadModalProps {
    onClose: () => void;
    onSave: (lead: Lead) => void;
}

const ROLES = [
  "CEO / Fundador",
  "Dueño de Negocio",
  "Director General",
  "Director de Marketing (CMO)",
  "Director Comercial / Ventas",
  "Director de Tecnología (CTO)",
  "Director de Recursos Humanos",
  "Director Financiero (CFO)",
  "Gerente de E-commerce",
  "Gerente de Operaciones",
  "Gerente de Compras"
];

const ManualLeadModal: React.FC<ManualLeadModalProps> = ({ onClose, onSave }) => {
    const [formData, setFormData] = useState({
        name: '',
        role: '',
        company: '',
        email: '',
        phone: '',
        linkedin: '',
        website: '',
        address: '',
        status: LeadStatus.NEW,
        note: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Construct new lead object
        const newLead: Lead = {
            id: `manual-${Date.now()}`,
            name: formData.name || 'Sin Nombre',
            role: formData.role || 'Desconocido',
            company: formData.company || 'Empresa Manual',
            qualificationScore: 50, // Neutral start
            reasoning: "Lead creado manualmente.",
            status: formData.status as LeadStatus,
            emailGuess: formData.email,
            phone: formData.phone,
            linkedinUrl: formData.linkedin,
            sourceUrl: formData.website,
            address: formData.address,
            notes: formData.note ? [{ id: Date.now().toString(), content: formData.note, createdAt: Date.now() }] : [],
            painPoints: [],
            techStack: [],
            outreach: { subjectVariants: [], email: "", linkedin: "", phone: "" },
            history: [{ id: Date.now().toString(), timestamp: Date.now(), action: 'Lead Created Manually', user: 'User' }]
        };

        onSave(newLead);
    };

    return (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl relative flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="flex justify-between items-center p-5 border-b border-slate-700 bg-slate-800/50 rounded-t-2xl">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <UserCircleIcon className="w-6 h-6 text-indigo-500" />
                        Crear Lead Manual
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                    
                    {/* Section 1: Identity */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
                             <TargetIcon className="w-3.5 h-3.5" /> Identidad
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-300">Nombre Completo <span className="text-red-400">*</span></label>
                                <div className="relative">
                                    <UserCircleIcon className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                                    <input required name="name" value={formData.name} onChange={handleChange} className="w-full bg-slate-800 border border-slate-600 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" placeholder="Ej. Juan Pérez" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-300">Rol / Cargo <span className="text-red-400">*</span></label>
                                <div className="relative">
                                    <BriefcaseIcon className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                                    <input 
                                        required 
                                        list="manual-role-options"
                                        name="role" 
                                        value={formData.role} 
                                        onChange={handleChange} 
                                        className="w-full bg-slate-800 border border-slate-600 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" 
                                        placeholder="Ej. CEO" 
                                    />
                                    <datalist id="manual-role-options">
                                        {ROLES.map(role => (
                                            <option key={role} value={role} />
                                        ))}
                                    </datalist>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Company */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
                             <PuzzleIcon className="w-3.5 h-3.5" /> Empresa
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-300">Nombre Empresa <span className="text-red-400">*</span></label>
                                <input required name="company" value={formData.company} onChange={handleChange} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" placeholder="Ej. Acme Inc." />
                            </div>
                             <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-300">Sitio Web</label>
                                <div className="relative">
                                    <LinkIcon className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                                    <input name="website" value={formData.website} onChange={handleChange} className="w-full bg-slate-800 border border-slate-600 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" placeholder="ejemplo.com" />
                                </div>
                            </div>
                             <div className="space-y-1 md:col-span-2">
                                <label className="text-xs font-medium text-slate-300">Dirección / Ubicación</label>
                                <div className="relative">
                                    <LocationIcon className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                                    <input name="address" value={formData.address} onChange={handleChange} className="w-full bg-slate-800 border border-slate-600 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" placeholder="Madrid, España" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Contact */}
                    <div className="space-y-4">
                         <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
                             <MailIcon className="w-3.5 h-3.5" /> Datos de Contacto
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-300">Email Corporativo</label>
                                <div className="relative">
                                    <MailIcon className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                                    <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full bg-slate-800 border border-slate-600 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" placeholder="nombre@empresa.com" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-300">Teléfono</label>
                                <div className="relative">
                                    <PhoneIcon className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                                    <input name="phone" value={formData.phone} onChange={handleChange} className="w-full bg-slate-800 border border-slate-600 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" placeholder="+34 600..." />
                                </div>
                            </div>
                             <div className="space-y-1 md:col-span-2">
                                <label className="text-xs font-medium text-slate-300">Perfil LinkedIn</label>
                                <div className="relative">
                                    <LinkedInIcon className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                                    <input name="linkedin" value={formData.linkedin} onChange={handleChange} className="w-full bg-slate-800 border border-slate-600 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" placeholder="linkedin.com/in/usuario" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 4: Details */}
                    <div className="space-y-4">
                         <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
                             <TargetIcon className="w-3.5 h-3.5" /> Detalles Iniciales
                        </h3>
                        <div className="grid grid-cols-1 gap-4">
                             <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-300">Estado Inicial</label>
                                <select name="status" value={formData.status} onChange={handleChange} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500">
                                    <option value={LeadStatus.NEW}>Nuevo</option>
                                    <option value={LeadStatus.CONTACTED}>Contactado</option>
                                    <option value={LeadStatus.QUALIFIED}>Interesado</option>
                                    <option value={LeadStatus.DISQUALIFIED}>Descartado</option>
                                </select>
                            </div>
                             <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-300">Nota Rápida (Opcional)</label>
                                <textarea name="note" value={formData.note} onChange={handleChange} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 resize-none h-20" placeholder="Escribe detalles clave..." />
                            </div>
                        </div>
                    </div>

                </form>

                {/* Footer */}
                <div className="p-4 border-t border-slate-700 bg-slate-800/30 flex justify-end gap-3 rounded-b-2xl">
                    <button onClick={onClose} className="px-4 py-2 text-sm text-slate-400 hover:text-white font-medium transition-colors">Cancelar</button>
                    <button onClick={handleSubmit} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-lg shadow-lg shadow-indigo-500/20 flex items-center gap-2 transition-transform active:scale-95">
                        <SaveIcon className="w-4 h-4" />
                        Guardar Lead
                    </button>
                </div>

            </div>
        </div>
    );
};

export default ManualLeadModal;
