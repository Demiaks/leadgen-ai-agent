import React from 'react';
import { VisualConfig } from '../types';
import { PaletteIcon } from './Icons';

interface VisualEditorProps {
  visualConfig: VisualConfig;
  handleVisualChange: (field: keyof VisualConfig, value: string) => void;
}

export const VisualEditor: React.FC<VisualEditorProps> = ({ visualConfig, handleVisualChange }) => (
  <div className="w-64 border-r border-slate-700 bg-slate-950 p-4 overflow-y-auto animate-slideInLeft">
    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
      <PaletteIcon className="w-4 h-4" /> Personalizar
    </h3>
    <div className="space-y-6">
      <div>
        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-2">Color Primario</label>
        <div className="flex items-center gap-3">
          <input type="color" value={visualConfig.primaryColor} onChange={(e) => handleVisualChange('primaryColor', e.target.value)} className="w-10 h-10 rounded-lg bg-transparent border-none cursor-pointer" />
          <input type="text" value={visualConfig.primaryColor} onChange={(e) => handleVisualChange('primaryColor', e.target.value)} className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono" />
        </div>
      </div>
      <div>
        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-2">Color Secundario</label>
        <div className="flex items-center gap-3">
          <input type="color" value={visualConfig.secondaryColor} onChange={(e) => handleVisualChange('secondaryColor', e.target.value)} className="w-10 h-10 rounded-lg bg-transparent border-none cursor-pointer" />
          <input type="text" value={visualConfig.secondaryColor} onChange={(e) => handleVisualChange('secondaryColor', e.target.value)} className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono" />
        </div>
      </div>
      <div>
        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-2">Tipografía</label>
        <select value={visualConfig.fontFamily} onChange={(e) => handleVisualChange('fontFamily', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-xs text-white">
          <option value="Inter, sans-serif">Inter (Moderno)</option>
          <option value="Georgia, serif">Georgia (Elegante)</option>
          <option value="'JetBrains Mono', monospace">JetBrains Mono (Tech)</option>
          <option value="'Playfair Display', serif">Playfair (Lujo)</option>
          <option value="system-ui, sans-serif">Sistema (Rápido)</option>
        </select>
      </div>
      <div className="pt-4 border-t border-slate-800">
        <p className="text-[10px] text-slate-500 italic leading-relaxed">Los cambios se aplican instantáneamente a la vista previa usando variables CSS dinámicas.</p>
      </div>
    </div>
  </div>
);
