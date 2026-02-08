
import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { SparklesIcon, KeyIcon, MailIcon, LightningIcon } from './Icons';

interface AuthProps {
    onLoginSuccess: () => void;
    onOfflineClick?: () => void; // Optional handler for offline mode
}

const Auth: React.FC<AuthProps> = ({ onLoginSuccess, onOfflineClick }) => {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                alert('¡Registro exitoso! Revisa tu email para confirmar.');
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                onLoginSuccess();
            }
        } catch (error: any) {
            setError(error.message);
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
                <p className="text-slate-400 text-center text-sm mb-8">
                    Accede a LeadGen Pro y guarda tus prospectos en la nube.
                </p>

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
                        {loading ? 'Procesando...' : (isSignUp ? 'Registrarse' : 'Entrar')}
                    </button>
                </form>

                {onOfflineClick && (
                    <div className="mt-4 pt-4 border-t border-slate-700">
                        <button 
                            onClick={onOfflineClick}
                            className="w-full py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            <LightningIcon className="w-4 h-4 text-yellow-400" />
                            Probar Demo (Offline)
                        </button>
                        <p className="text-[10px] text-center text-slate-500 mt-2">
                            Guarda datos solo en este navegador. Sin registro.
                        </p>
                    </div>
                )}

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
