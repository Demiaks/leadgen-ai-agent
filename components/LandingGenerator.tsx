
import React, { useState } from 'react';
import { generateLandingCopy } from '../services/geminiService';
import { SparklesIcon, LayoutIcon, CopyIcon, LinkIcon } from './Icons';
import { Notification } from '../types';

interface LandingGeneratorProps {
  addNotification: (message: string, type: Notification['type']) => void;
  apiKey?: string; // Accept API Key
}

const LandingGenerator: React.FC<LandingGeneratorProps> = ({ addNotification, apiKey }) => {
  const [industry, setIndustry] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!industry.trim()) {
      addNotification("Por favor ingresa una industria", "ERROR");
      return;
    }

    setIsLoading(true);
    try {
      // Pass the API key to the service
      const content = await generateLandingCopy(industry, apiKey);
      setGeneratedContent(content);
      addNotification("Copy generado exitosamente", "SUCCESS");
    } catch (error) {
      addNotification("Error al generar el contenido", "ERROR");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedContent);
    addNotification("Contenido copiado al portapapeles", "SUCCESS");
  };

  return (
    <div className="max-w-5xl mx-auto p-6 animate-fadeIn h-full flex flex-col">
      <div className="glass-panel rounded-2xl p-8 shadow-2xl relative overflow-hidden border border-slate-700/50 flex flex-col h-full">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-700 shrink-0">
           <div className="p-3 bg-emerald-500/20 rounded-full border border-emerald-500/30">
                <LayoutIcon className="w-8 h-8 text-emerald-400" />
           </div>
           <div>
               <h2 className="text-2xl font-bold text-white">Generador de Landing Pages</h2>
               <p className="text-slate-400 text-sm">Crea el texto perfecto para tu web de captación basado en soluciones de IA.</p>
           </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6 h-full overflow-hidden">
            
            {/* Input Section */}
            <div className="w-full md:w-1/3 shrink-0 flex flex-col gap-4">
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                    <label className="text-sm font-bold text-slate-300 mb-2 block">
                        Industria / Nicho
                    </label>
                    <input
                        type="text"
                        value={industry}
                        onChange={(e) => setIndustry(e.target.value)}
                        placeholder="Ej. Agencias de Viajes, Dentistas, Real Estate..."
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all mb-4"
                    />
                    
                    <button
                        onClick={handleGenerate}
                        disabled={isLoading}
                        className={`w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all shadow-lg ${
                            isLoading 
                            ? 'bg-slate-700 cursor-not-allowed text-slate-400'
                            : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-500/20'
                        }`}
                    >
                        {isLoading ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Generando...
                            </>
                        ) : (
                            <>
                                <SparklesIcon className="w-5 h-5" />
                                Generar Copy
                            </>
                        )}
                    </button>
                </div>

                <div className="bg-indigo-900/20 border border-indigo-500/30 p-4 rounded-xl text-xs text-indigo-300 leading-relaxed">
                    <strong className="block mb-2 text-indigo-200">Nueva Estructura Incluida:</strong>
                    <ul className="list-disc pl-4 space-y-1 text-slate-400">
                        <li>Hero Section (Dolor Principal)</li>
                        <li>Problema Central & Pérdida ($)</li>
                        <li>Cambio de Enfoque (IA vs Tradicional)</li>
                        <li>Solución Enfocada a Resultados</li>
                        <li>Cómo Funciona (Diagnóstico -> Optimización)</li>
                        <li><strong>Escenario de ROI (Números Reales)</strong></li>
                        <li><strong>Prueba: Autoridad del Sistema</strong></li>
                        <li>CTA + Micro-Garantía</li>
                        <li>Formulario de Diagnóstico (Audit)</li>
                    </ul>
                </div>
            </div>

            {/* Output Section */}
            <div className="flex-1 bg-slate-900 border border-slate-700 rounded-xl relative overflow-hidden flex flex-col">
                <div className="flex justify-between items-center p-3 border-b border-slate-800 bg-slate-950">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-2">Resultado</span>
                    <div className="flex gap-2">
                        <a 
                            href="https://app.base44.com/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border border-indigo-500 bg-indigo-600 hover:bg-indigo-500 text-white"
                        >
                            <LinkIcon className="w-3.5 h-3.5"/> Ir a Base44
                        </a>
                        <button 
                            onClick={handleCopy}
                            disabled={!generatedContent}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors border border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <CopyIcon className="w-3.5 h-3.5"/> Copiar Texto
                        </button>
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
                    {generatedContent ? (
                        <div className="prose prose-invert prose-sm max-w-none text-slate-300 whitespace-pre-wrap font-sans">
                            {generatedContent}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-60">
                            <LayoutIcon className="w-16 h-16 mb-4 stroke-1" />
                            <p className="text-sm">Ingresa una industria para generar el contenido.</p>
                        </div>
                    )}
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default LandingGenerator;
