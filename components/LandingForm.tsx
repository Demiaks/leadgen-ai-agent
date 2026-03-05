import React from 'react';
import { LandingStyle, VisualConfig } from '../types';
import { SparklesIcon, PaletteIcon } from './Icons';

interface LandingFormProps {
  industry: string;
  setIndustry: (val: string) => void;
  valueProposition: string;
  setValueProposition: (val: string) => void;
  customPrompt: string;
  setCustomPrompt: (val: string) => void;
  objective: string;
  setObjective: (val: string) => void;
  landingStyle: LandingStyle;
  setLandingStyle: (val: LandingStyle) => void;
  handleGenerate: (e: React.FormEvent) => void;
  isLoading: boolean;
}

export const LandingForm: React.FC<LandingFormProps> = ({
  industry, setIndustry, valueProposition, setValueProposition, customPrompt, setCustomPrompt,
  objective, setObjective, landingStyle, setLandingStyle, handleGenerate, isLoading
}) => (
  <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-700">
    <div className="space-y-2.5 mb-2.5">
      <div>
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Industria / Nicho Objetivo</label>
        <input type="text" value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="Ej. Agencias de Viajes, Dentistas..." className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all" />
      </div>
      <div>
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Tu Propuesta de Valor</label>
        <textarea value={valueProposition} onChange={(e) => setValueProposition(e.target.value)} placeholder="Describe qué vendes..." className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all h-20 resize-none" />
      </div>
      <div>
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Prompt Personalizado (Manual)</label>
        <textarea value={customPrompt} onChange={(e) => setCustomPrompt(e.target.value)} placeholder="Instrucciones adicionales para la IA..." className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all h-20 resize-none" />
      </div>
      <div>
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Objetivo de la Landing</label>
        <select value={objective} onChange={(e) => setObjective(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all">
          <option value="vender">Vender producto/servicio</option>
          <option value="captar leads">Captar leads (Suscripción)</option>
          <option value="agendar llamadas">Agendar llamadas / Demo</option>
          <option value="descargar recurso">Descargar recurso gratuito</option>
        </select>
      </div>
    </div>
    <div className="mb-4">
      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block flex items-center gap-2">
        <PaletteIcon className="w-3 h-3" /> Estilo Base
      </label>
      <div className="grid grid-cols-3 gap-2">
        {(['CYBER', 'MINIMAL', 'CORPORATE'] as LandingStyle[]).map(style => (
          <button key={style} type="button" onClick={() => setLandingStyle(style)} className={`py-2 px-1 rounded-lg text-[10px] font-bold transition-all border ${landingStyle === style ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'}`}>
            {style}
          </button>
        ))}
      </div>
    </div>
    <button onClick={handleGenerate} disabled={isLoading} className={`w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all shadow-lg ${isLoading ? 'bg-slate-700 cursor-not-allowed text-slate-400' : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-500/20'}`}>
      {isLoading ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>Generando...</> : <><SparklesIcon className="w-5 h-5" /> Generar Landing</>}
    </button>
  </div>
);
