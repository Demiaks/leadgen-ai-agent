
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { EmailTemplate } from '../types';
import { templateStorage } from '../services/storage';
import { generateEmailTemplate } from '../services/geminiService';
import { FileTextIcon, PlusIcon, TrashIcon, SparklesIcon, SaveIcon, XMarkIcon } from './Icons';

const TemplatesView: React.FC = () => {
    const { userProfile, addNotification } = useApp();
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    
    // Editor State
    const [formData, setFormData] = useState({ name: '', subject: '', body: '' });
    const [aiPrompt, setAiPrompt] = useState('');

    useEffect(() => {
        loadTemplates();
    }, []);

    const loadTemplates = async () => {
        const loaded = await templateStorage.getAll();
        setTemplates(loaded);
    };

    const handleCreateNew = () => {
        setSelectedTemplate(null);
        setFormData({ name: 'Nueva Plantilla', subject: '', body: '' });
        setIsEditing(true);
    };

    const handleSelectTemplate = (t: EmailTemplate) => {
        setSelectedTemplate(t);
        setFormData({ name: t.name, subject: t.subject, body: t.body });
        setIsEditing(true);
    };

    const handleSave = async () => {
        if (!formData.name || !formData.body) {
            addNotification("Nombre y cuerpo son requeridos", "ERROR");
            return;
        }

        const newTemplate: EmailTemplate = {
            id: selectedTemplate ? selectedTemplate.id : Date.now().toString(),
            name: formData.name,
            subject: formData.subject,
            body: formData.body,
            variables: ['{{name}}', '{{company}}'] // Simplification for now
        };

        if (selectedTemplate) {
            // Update
            const updated = templates.map(t => t.id === newTemplate.id ? newTemplate : t);
            setTemplates(updated);
            await templateStorage.save(updated);
        } else {
            // Create
            setTemplates([...templates, newTemplate]);
            await templateStorage.add(newTemplate);
        }

        setSelectedTemplate(newTemplate);
        addNotification("Plantilla guardada", "SUCCESS");
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm("¿Eliminar plantilla?")) {
            await templateStorage.delete(id);
            setTemplates(prev => prev.filter(t => t.id !== id));
            if (selectedTemplate?.id === id) {
                setSelectedTemplate(null);
                setIsEditing(false);
            }
            addNotification("Plantilla eliminada", "INFO");
        }
    };

    const handleAiGenerate = async () => {
        if (!aiPrompt.trim()) return;
        setIsGenerating(true);
        try {
            const result = await generateEmailTemplate(aiPrompt, userProfile?.apiKey);
            setFormData(prev => ({ ...prev, subject: result.subject, body: result.body }));
            addNotification("Plantilla generada por IA", "SUCCESS");
        } catch (e) {
            addNotification("Error generando plantilla", "ERROR");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-6 animate-fadeIn h-full flex flex-col">
            <div className="glass-panel rounded-2xl p-0 shadow-2xl relative overflow-hidden border border-slate-700/50 flex flex-col md:flex-row h-full">
                
                {/* Sidebar List */}
                <div className="w-full md:w-1/3 border-r border-slate-700/50 flex flex-col bg-slate-900/50">
                    <div className="p-6 border-b border-slate-700/50 flex justify-between items-center">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <FileTextIcon className="w-5 h-5 text-indigo-400" /> Plantillas
                        </h2>
                        <button onClick={handleCreateNew} className="p-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white shadow-lg shadow-indigo-500/20 transition-all">
                            <PlusIcon className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin">
                        {templates.length === 0 && <div className="text-center text-slate-500 text-sm mt-10">No hay plantillas. Crea una nueva.</div>}
                        {templates.map(t => (
                            <div 
                                key={t.id} 
                                onClick={() => handleSelectTemplate(t)}
                                className={`p-4 rounded-xl cursor-pointer border transition-all group flex justify-between items-center ${selectedTemplate?.id === t.id ? 'bg-indigo-900/20 border-indigo-500/50' : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'}`}
                            >
                                <div>
                                    <div className={`font-bold text-sm ${selectedTemplate?.id === t.id ? 'text-white' : 'text-slate-300'}`}>{t.name}</div>
                                    <div className="text-xs text-slate-500 truncate max-w-[150px]">{t.subject}</div>
                                </div>
                                <button onClick={(e) => handleDelete(t.id, e)} className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-1">
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Editor Area */}
                <div className="flex-1 flex flex-col bg-slate-950/50">
                    {isEditing ? (
                        <>
                            <div className="p-6 border-b border-slate-700/50 flex justify-between items-center bg-slate-900/30">
                                <input 
                                    type="text" 
                                    value={formData.name} 
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    className="bg-transparent text-xl font-bold text-white border-none focus:outline-none placeholder-slate-600 w-full"
                                    placeholder="Nombre de la Plantilla"
                                />
                                <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-sm transition-all shadow-lg shadow-emerald-500/20">
                                    <SaveIcon className="w-4 h-4" /> Guardar
                                </button>
                            </div>

                            {/* AI Generator Box */}
                            <div className="p-6 pb-2">
                                <div className="bg-gradient-to-r from-indigo-900/20 to-purple-900/20 border border-indigo-500/30 rounded-xl p-4 flex gap-4 items-center">
                                    <div className="p-2 bg-indigo-500/20 rounded-lg"><SparklesIcon className="w-5 h-5 text-indigo-400" /></div>
                                    <input 
                                        type="text" 
                                        value={aiPrompt}
                                        onChange={(e) => setAiPrompt(e.target.value)}
                                        placeholder="Ej. Escribe un email frío para vender servicios de SEO a dentistas..."
                                        className="flex-1 bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                                        onKeyDown={(e) => e.key === 'Enter' && handleAiGenerate()}
                                    />
                                    <button 
                                        onClick={handleAiGenerate}
                                        disabled={isGenerating}
                                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50 min-w-[100px]"
                                    >
                                        {isGenerating ? 'Generando...' : 'Magia IA'}
                                    </button>
                                </div>
                            </div>

                            {/* Fields */}
                            <div className="flex-1 p-6 space-y-4 overflow-y-auto">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Asunto</label>
                                    <input 
                                        value={formData.subject}
                                        onChange={(e) => setFormData({...formData, subject: e.target.value})}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-indigo-500 focus:outline-none"
                                        placeholder="Asunto del correo..."
                                    />
                                </div>
                                <div className="space-y-1 flex-1 flex flex-col h-full">
                                    <div className="flex justify-between">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Cuerpo</label>
                                        <div className="flex gap-2 text-[10px] text-slate-400 font-mono">
                                            <span>{`{{name}}`}</span>
                                            <span>{`{{company}}`}</span>
                                            <span>{`{{role}}`}</span>
                                        </div>
                                    </div>
                                    <textarea 
                                        value={formData.body}
                                        onChange={(e) => setFormData({...formData, body: e.target.value})}
                                        className="w-full flex-1 min-h-[300px] bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-300 font-mono text-sm leading-relaxed focus:border-indigo-500 focus:outline-none resize-none"
                                        placeholder="Hola {{name}}, vi que en {{company}}..."
                                    />
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-600">
                            <FileTextIcon className="w-16 h-16 mb-4 opacity-50" />
                            <p className="text-sm">Selecciona una plantilla para editar o crea una nueva.</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default TemplatesView;
