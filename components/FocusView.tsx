
import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { Lead, LeadStatus } from '../types';
import { XMarkIcon, CheckCircleIcon, ArrowLeftIcon, ArrowRightIcon, ArrowUpIcon, BoltIcon, TargetIcon, CpuIcon, LocationIcon, SparklesIcon } from './Icons';

interface FocusViewProps {
  onClose: () => void;
}

const FocusView: React.FC<FocusViewProps> = ({ onClose }) => {
  const { leads, updateLead, addNotification } = useApp();
  const [queue, setQueue] = useState<Lead[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<'left' | 'right' | 'up' | null>(null);
  const [stats, setStats] = useState({ approved: 0, rejected: 0, contacted: 0 });

  useEffect(() => {
     // Filter only leads that are NEW or haven't been processed in this session
     const newLeads = leads.filter(l => l.status === LeadStatus.NEW);
     setQueue(newLeads);
  }, []); // Run once on mount

  const handleAction = useCallback((status: LeadStatus, dir: 'left' | 'right' | 'up') => {
      if (currentIndex >= queue.length) return;
      const lead = queue[currentIndex];
      setDirection(dir);
      
      // Update local stats
      setStats(prev => ({
          ...prev,
          approved: status === LeadStatus.QUALIFIED ? prev.approved + 1 : prev.approved,
          rejected: status === LeadStatus.DISQUALIFIED ? prev.rejected + 1 : prev.rejected,
          contacted: status === LeadStatus.CONTACTED ? prev.contacted + 1 : prev.contacted
      }));

      // Delay actual update to allow animation to play
      setTimeout(() => {
          updateLead(lead.id, { status });
          setDirection(null);
          setCurrentIndex(prev => prev + 1);
      }, 300);
  }, [currentIndex, queue, updateLead]);

  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if (currentIndex >= queue.length) return;
          
          switch(e.key) {
              case 'ArrowLeft':
                  handleAction(LeadStatus.DISQUALIFIED, 'left');
                  break;
              case 'ArrowRight':
                  handleAction(LeadStatus.QUALIFIED, 'right');
                  break;
              case 'ArrowUp':
              case ' ': // Spacebar
                  e.preventDefault();
                  handleAction(LeadStatus.CONTACTED, 'up');
                  break;
              case 'Escape':
                  onClose();
                  break;
          }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleAction, currentIndex, queue.length, onClose]);

  const progress = Math.min(((currentIndex) / queue.length) * 100, 100);
  const currentLead = queue[currentIndex];

  if (queue.length === 0) {
      return (
        <div className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
            <div className="text-center max-w-md">
                <div className="bg-slate-800 p-6 rounded-full inline-flex mb-6 shadow-lg shadow-indigo-500/20">
                    <BoltIcon className="w-12 h-12 text-yellow-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">¡Todo al día!</h2>
                <p className="text-slate-400 mb-8">No hay leads nuevos para procesar en modo enfoque.</p>
                <button onClick={onClose} className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all">
                    Volver al Dashboard
                </button>
            </div>
        </div>
      );
  }

  if (currentIndex >= queue.length) {
      return (
        <div className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
            <div className="text-center max-w-md bg-slate-800/50 border border-slate-700 p-8 rounded-2xl shadow-2xl">
                <h2 className="text-3xl font-bold text-white mb-2">🎉 Sesión Completada</h2>
                <p className="text-slate-400 mb-8">Has procesado {queue.length} leads en tiempo récord.</p>
                
                <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="bg-emerald-900/20 p-3 rounded-xl border border-emerald-500/20">
                        <div className="text-2xl font-bold text-emerald-400">{stats.approved}</div>
                        <div className="text-[10px] text-emerald-200 uppercase">Aprobados</div>
                    </div>
                    <div className="bg-yellow-900/20 p-3 rounded-xl border border-yellow-500/20">
                        <div className="text-2xl font-bold text-yellow-400">{stats.contacted}</div>
                        <div className="text-[10px] text-yellow-200 uppercase">Contactados</div>
                    </div>
                    <div className="bg-red-900/20 p-3 rounded-xl border border-red-500/20">
                        <div className="text-2xl font-bold text-red-400">{stats.rejected}</div>
                        <div className="text-[10px] text-red-200 uppercase">Descartados</div>
                    </div>
                </div>

                <button onClick={onClose} className="w-full px-8 py-3 bg-white text-slate-900 hover:bg-slate-200 rounded-xl font-bold transition-all">
                    Finalizar
                </button>
            </div>
        </div>
      );
  }

  const scoreColor = currentLead.qualificationScore > 70 ? 'text-emerald-400' : currentLead.qualificationScore > 40 ? 'text-yellow-400' : 'text-red-400';
  const borderColor = currentLead.qualificationScore > 70 ? 'border-emerald-500' : currentLead.qualificationScore > 40 ? 'border-yellow-500' : 'border-red-500';

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="h-16 px-6 flex items-center justify-between bg-slate-900 border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-2">
                <BoltIcon className="w-5 h-5 text-yellow-400 animate-pulse" />
                <span className="font-bold text-white tracking-wide">Modo Enfoque</span>
            </div>
            <div className="flex-1 max-w-md mx-4">
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 transition-all duration-300 ease-out" style={{ width: `${progress}%` }}></div>
                </div>
                <div className="text-center text-[10px] text-slate-500 mt-1 font-mono">
                    {currentIndex + 1} de {queue.length}
                </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
                <XMarkIcon className="w-6 h-6" />
            </button>
        </div>

        {/* Main Area */}
        <div className="flex-1 flex items-center justify-center p-4 relative overflow-hidden">
            
            {/* Background Hint Arrows */}
            <div className={`absolute left-10 top-1/2 -translate-y-1/2 transition-all duration-300 ${direction === 'left' ? 'scale-125 opacity-100' : 'opacity-10'}`}>
                <div className="p-4 rounded-full bg-red-500/20 border-2 border-red-500 text-red-500">
                    <ArrowLeftIcon className="w-12 h-12" />
                </div>
            </div>
            <div className={`absolute right-10 top-1/2 -translate-y-1/2 transition-all duration-300 ${direction === 'right' ? 'scale-125 opacity-100' : 'opacity-10'}`}>
                <div className="p-4 rounded-full bg-emerald-500/20 border-2 border-emerald-500 text-emerald-500">
                    <ArrowRightIcon className="w-12 h-12" />
                </div>
            </div>
            <div className={`absolute top-10 left-1/2 -translate-x-1/2 transition-all duration-300 ${direction === 'up' ? 'scale-125 opacity-100' : 'opacity-10'}`}>
                <div className="p-4 rounded-full bg-yellow-500/20 border-2 border-yellow-500 text-yellow-500">
                    <ArrowUpIcon className="w-12 h-12" />
                </div>
            </div>

            {/* The Card */}
            <div 
                className={`w-full max-w-2xl bg-slate-900 border-2 ${borderColor} rounded-3xl shadow-2xl p-8 relative transition-all duration-300 ease-out transform
                ${direction === 'left' ? '-translate-x-[150%] rotate-[-15deg] opacity-0' : ''}
                ${direction === 'right' ? 'translate-x-[150%] rotate-[15deg] opacity-0' : ''}
                ${direction === 'up' ? '-translate-y-[150%] opacity-0' : ''}
                `}
            >
                {/* Card Header */}
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h1 className="text-3xl font-black text-white mb-2 leading-tight">{currentLead.company}</h1>
                        <div className="flex items-center gap-3">
                            <span className="text-lg text-indigo-400 font-medium">{currentLead.role}</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
                            <span className="text-slate-300">{currentLead.name}</span>
                        </div>
                    </div>
                    <div className="flex flex-col items-end">
                        <div className={`text-4xl font-black ${scoreColor} mb-1`}>{currentLead.qualificationScore}</div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">IA Score</div>
                    </div>
                </div>

                {/* Card Body */}
                <div className="space-y-6">
                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                        <div className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-2"><SparklesIcon className="w-3 h-3 text-indigo-400" /> El Análisis</div>
                        <p className="text-slate-200 text-base leading-relaxed">
                            {currentLead.reasoning || currentLead.auditObservation || "No hay análisis detallado disponible."}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <div className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-2"><TargetIcon className="w-3 h-3 text-red-400" /> Dolores Detectados</div>
                            <div className="flex flex-wrap gap-2">
                                {currentLead.painPoints?.map((pain, i) => (
                                    <span key={i} className="px-2 py-1 bg-red-900/10 text-red-300 border border-red-500/20 rounded text-xs font-medium">
                                        {pain}
                                    </span>
                                )) || <span className="text-slate-600 text-xs italic">Ninguno detectado</span>}
                            </div>
                        </div>
                        <div>
                            <div className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-2"><CpuIcon className="w-3 h-3 text-blue-400" /> Tech Stack</div>
                            <div className="flex flex-wrap gap-2">
                                {currentLead.techStack?.slice(0,4).map((tech, i) => (
                                    <span key={i} className="px-2 py-1 bg-blue-900/10 text-blue-300 border border-blue-500/20 rounded text-xs font-medium">
                                        {tech}
                                    </span>
                                )) || <span className="text-slate-600 text-xs italic">Desconocido</span>}
                            </div>
                        </div>
                    </div>

                    {currentLead.address && (
                        <div className="flex items-center gap-2 text-slate-500 text-sm">
                            <LocationIcon className="w-4 h-4" /> {currentLead.address}
                        </div>
                    )}
                </div>

                {/* Keyboard Hints Footer */}
                <div className="mt-8 pt-6 border-t border-slate-800 flex justify-between items-center text-xs font-bold text-slate-500">
                    <div className="flex items-center gap-2">
                        <kbd className="px-2 py-1 bg-slate-800 rounded border border-slate-700 text-slate-300">←</kbd>
                        <span>Descartar</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <kbd className="px-2 py-1 bg-slate-800 rounded border border-slate-700 text-slate-300">Space</kbd>
                        <span>Contactar</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <kbd className="px-2 py-1 bg-slate-800 rounded border border-slate-700 text-slate-300">→</kbd>
                        <span>Aprobar</span>
                    </div>
                </div>
            </div>

            {/* Mobile Touch Controls (Visible only on small screens conceptually, but rendered for all here) */}
            <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-6 md:hidden">
                <button onClick={() => handleAction(LeadStatus.DISQUALIFIED, 'left')} className="p-4 bg-red-600 rounded-full shadow-lg text-white"><XMarkIcon className="w-8 h-8" /></button>
                <button onClick={() => handleAction(LeadStatus.CONTACTED, 'up')} className="p-4 bg-yellow-500 rounded-full shadow-lg text-white"><ArrowUpIcon className="w-8 h-8" /></button>
                <button onClick={() => handleAction(LeadStatus.QUALIFIED, 'right')} className="p-4 bg-emerald-600 rounded-full shadow-lg text-white"><CheckCircleIcon className="w-8 h-8" /></button>
            </div>

        </div>
    </div>
  );
};

export default FocusView;
