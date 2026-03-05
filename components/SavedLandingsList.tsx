import React from 'react';
import { SavedLandingPage, Notification } from '../types';
import { FileTextIcon } from './Icons';

interface SavedLandingsListProps {
  savedLandings: SavedLandingPage[];
  currentLandingId: string | null;
  isDeleteMode: boolean;
  setIsDeleteMode: (mode: boolean) => void;
  handleLoadLanding: (landing: SavedLandingPage) => void;
  handleDeleteLanding: (id: string, e: React.PointerEvent) => void;
  addNotification: (message: string, type: Notification['type']) => void;
  addDebugLog: (msg: string) => void;
}

export const SavedLandingsList: React.FC<SavedLandingsListProps> = ({
  savedLandings, currentLandingId, isDeleteMode, setIsDeleteMode, handleLoadLanding, handleDeleteLanding, addNotification, addDebugLog
}) => (
  <div className={`relative bg-slate-800/50 p-2.5 rounded-xl border flex-1 overflow-y-auto min-h-[150px] transition-all ${isDeleteMode ? 'border-red-500/50 ring-1 ring-red-500/20' : 'border-slate-700'}`}>
    {isDeleteMode && <div className="absolute inset-0 bg-red-500/5 pointer-events-none" />}
    <div className="relative z-10">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <FileTextIcon className="w-3 h-3" /> Landings Guardadas
        </h3>
        <button 
          onPointerDown={(e) => {
            e.stopPropagation();
            addDebugLog("Click GESTIONAR");
            const nextMode = !isDeleteMode;
            setIsDeleteMode(nextMode);
            addDebugLog("Modo gestión: " + nextMode);
            addNotification(nextMode ? "Modo gestión activado" : "Modo normal", "INFO");
          }}
          className={`text-[9px] px-2 py-1 rounded border transition-all font-bold ${isDeleteMode ? 'bg-red-500 border-red-400 text-white shadow-lg' : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'}`}
        >
          {isDeleteMode ? 'SALIR EDICIÓN' : 'GESTIONAR'}
        </button>
      </div>
      <div className="space-y-1.5">
        {savedLandings.map(landing => (
          <div key={landing.id} className={`group flex items-center gap-2 p-1.5 rounded-lg border transition-all ${currentLandingId === landing.id ? 'bg-indigo-600/20 border-indigo-500/50' : 'bg-slate-900/50 border-slate-700 hover:border-slate-600'}`}>
            <div onClick={() => !isDeleteMode && handleLoadLanding(landing)} className={`flex-1 min-w-0 p-1 ${!isDeleteMode ? 'cursor-pointer' : 'opacity-50'}`} title={isDeleteMode ? "" : "Cargar esta landing"}>
              <div className="text-xs font-medium text-slate-200 truncate">{landing.industry}</div>
              <div className="text-[9px] text-slate-500">{new Date(landing.updatedAt).toLocaleDateString()}</div>
            </div>
            {isDeleteMode && (
              <div className="shrink-0">
                <button onPointerDown={(e) => handleDeleteLanding(landing.id, e)} className="px-3 py-1.5 text-[10px] font-black text-white bg-red-600 hover:bg-red-700 rounded shadow-md transition-all border border-red-400">BORRAR</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  </div>
);
