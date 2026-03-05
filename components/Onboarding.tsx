
import React, { useState } from 'react';
import { SearchIcon, TelescopeIcon, ChartBarIcon, SparklesIcon, ChevronRightIcon, CheckCircleIcon } from './Icons';

interface OnboardingProps {
    onComplete: () => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
    const [step, setStep] = useState(0);

    const steps = [
        {
            title: "Bienvenido a LeadGen Pro",
            desc: "Tu agente de ventas autónomo impulsado por IA. Vamos a configurarlo en 3 pasos.",
            icon: <SparklesIcon className="w-12 h-12 text-indigo-500" />
        },
        {
            title: "1. Búsqueda Inteligente",
            desc: "Define tu cliente ideal (ej. 'Dentistas en Madrid'). La IA navegará por la web para encontrar empresas reales.",
            icon: <SearchIcon className="w-12 h-12 text-emerald-500" />
        },
        {
            title: "2. Deep Dive & Análisis",
            desc: "Usamos agentes especializados para analizar webs, encontrar stack tecnológico y detectar dolores de negocio.",
            icon: <TelescopeIcon className="w-12 h-12 text-amber-500" />
        },
        {
            title: "3. Outreach Automático",
            desc: "La IA redacta correos hiper-personalizados para cada lead. Solo tienes que revisar y enviar.",
            icon: <ChartBarIcon className="w-12 h-12 text-blue-500" />
        }
    ];

    const handleNext = () => {
        if (step < steps.length - 1) {
            setStep(step + 1);
        } else {
            onComplete();
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 -mr-10 -mt-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl"></div>
                <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl"></div>

                {/* Progress Bar */}
                <div className="flex gap-2 mb-8">
                    {steps.map((_, i) => (
                        <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${i <= step ? 'bg-indigo-500' : 'bg-slate-800'}`}></div>
                    ))}
                </div>

                {/* Content */}
                <div className="flex flex-col items-center text-center space-y-6 mb-8 min-h-[200px]">
                    <div className="p-4 bg-slate-800/50 rounded-full ring-1 ring-slate-700 shadow-lg animate-fadeIn" key={`icon-${step}`}>
                        {steps[step].icon}
                    </div>
                    <div className="animate-fadeIn" key={`text-${step}`}>
                        <h2 className="text-2xl font-bold text-white mb-2">{steps[step].title}</h2>
                        <p className="text-slate-400 leading-relaxed">{steps[step].desc}</p>
                    </div>
                </div>

                {/* Actions */}
                <button 
                    onClick={handleNext}
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition-transform active:scale-95"
                >
                    {step === steps.length - 1 ? (
                        <>Comenzar <CheckCircleIcon className="w-5 h-5" /></>
                    ) : (
                        <>Siguiente <ChevronRightIcon className="w-5 h-5" /></>
                    )}
                </button>
            </div>
        </div>
    );
};

export default Onboarding;
