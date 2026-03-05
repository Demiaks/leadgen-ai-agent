
import React, { useState } from 'react';
import { supabase, SUPABASE_URL } from '../services/supabaseClient';
import { SparklesIcon, KeyIcon, MailIcon, LightningIcon, ShieldCheckIcon } from './Icons';

interface AuthProps {
    onLoginSuccess: () => void;
    onOfflineClick?: () => void; 
}

const Auth: React.FC<AuthProps> = ({ onLoginSuccess, onOfflineClick }) => {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isMockMode = SUPABASE_URL.includes('placeholder') || localStorage.getItem('force_mock_mode') === 'true';

    const toggleMockMode = () => {
        const newValue = !isMockMode;
        localStorage.setItem('force_mock_mode', newValue.toString());
        window.location.reload();
    };

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;
                if (!isMockMode) alert('¡Registro exitoso! Revisa tu email para confirmar.');
                else onLoginSuccess(); // Auto enter in mock mode
            } else {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                onLoginSuccess();
            }
        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleQuickAdmin = async () => {
        const adminEmail = 'desarrollodemiak@gmail.com';
        const adminPass = 'admin123';
        setEmail(adminEmail);
        setPassword(adminPass);
        setLoading(true);
        setError(null);
        try {
            // Try sign in first
            const { error: signInError } = await supabase.auth.signInWithPassword({ email: adminEmail, password: adminPass });
            if (!signInError) {
                onLoginSuccess();
                return;
            }
            
            // If sign in fails (likely user not found in mock), try sign up
            const { error: signUpError } = await supabase.auth.signUp({ email: adminEmail, password: adminPass });
            if (signUpError) throw signUpError;
            
            onLoginSuccess();
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="bg-slate-800 border border-slate-700 p-8 rounded-2xl shadow-2xl max-w-md w-full relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl"></div>
                
                <div className="flex justify-center mb-6">
                    <div className="bg-gradient-to-br from-indigo-500 to-violet-600 p-3 rounded-xl shadow-lg shadow-indigo-500/20">
                        <SparklesIcon className="w-8 h-8 text-white" />
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-center text-white mb-2">
                    {isSignUp ? 'Crear Cuenta' : 'Iniciar Sesión'}
                </h2>
                
                {isMockMode && (
                    <div className="mb-6 bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 text-center">
                        <p className="text-indigo-400 text-xs font-bold flex items-center justify-center gap-2 mb-1">
                            <ShieldCheckIcon className="w-4 h-4"/> MODO DEMOSTRACIÓN (LOCAL)
                        </p>
                        <p className="text-slate-400 text-[10px] leading-relaxed">
                            Los datos se guardan en tu navegador. Puedes usar cualquier email y contraseña sin verificación.
                        </p>
                        <button 
                            onClick={toggleMockMode}
                            className="mt-2 text-[9px] text-indigo-300 hover:text-white underline uppercase tracking-widest font-bold"
                        >
                            Cambiar a Modo Real (Supabase)
                        </button>
                    </div>
                )}

                {!isMockMode && (
                    <div className="mb-6 bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 text-center">
                        <p className="text-slate-400 text-[10px] mb-2">
                            Conectado a Supabase Real. Requiere verificación de email si está activa.
                        </p>
                        <button 
                            onClick={toggleMockMode}
                            className="text-[9px] text-indigo-400 hover:text-indigo-300 underline uppercase tracking-widest font-bold"
                        >
                            Forzar Modo Local (Sin Verificación)
                        </button>
                    </div>
                )}

                <form onSubmit={handleAuth} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase">Email</label>
                        <div className="relative">
                            <MailIcon className="w-5 h-5 text-slate-500 absolute left-3 top-3" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-600 rounded-lg py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-indigo-500"
                                placeholder="tu@email.com"
                                required
                            />
                        </div>
                    </div>
                    
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase">Contraseña</label>
                        <div className="relative">
                            <KeyIcon className="w-5 h-5 text-slate-500 absolute left-3 top-3" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-600 rounded-lg py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-indigo-500"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition-colors shadow-lg shadow-indigo-500/20 disabled:opacity-50"
                    >
                        {loading ? 'Procesando...' : (isSignUp ? 'Crear Cuenta' : 'Entrar')}
                    </button>

                    <button
                        type="button"
                        onClick={handleQuickAdmin}
                        disabled={loading}
                        className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-indigo-300 font-bold rounded-lg transition-colors border border-indigo-500/30 flex items-center justify-center gap-2"
                    >
                        <LightningIcon className="w-4 h-4" /> Acceso Rápido Admin
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-slate-400">
                    {isSignUp ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}
                    <button 
                        onClick={() => setIsSignUp(!isSignUp)}
                        className="ml-2 text-indigo-400 hover:text-white font-bold transition-colors"
                    >
                        {isSignUp ? 'Inicia Sesión' : 'Regístrate'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Auth;
