
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useApp } from '../context/AppContext';
import { UserProfile } from '../types';
import { UserCircleIcon, SaveIcon, TargetIcon, SparklesIcon, LightningIcon, LinkIcon, KeyIcon, CalendarIcon, ShieldCheckIcon, CloudArrowUpIcon } from './Icons';

const SettingsView: React.FC = () => {
  const { userProfile, saveSettings, addNotification } = useApp();
  const [isTesting, setIsTesting] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    name: '', email: '', website: '', valueProposition: '', landingPage: '', jobTitle: '', apiKey: '', customInstructions: '', emailSignature: '', webhookUrl: '', calendlyUrl: '', googleAnalyticsId: '', facebookPixelId: '', hubspotKey: '', salesforceKey: '', salesforceInstanceUrl: '', scoringWeights: { techStack: 20, socialPresence: 20, seoHealth: 20, intentSignals: 20, companySize: 20 },
    deploymentConfig: { type: 'NONE', host: '', port: 22, username: '', password: '', path: '/public_html/' }
  });

  useEffect(() => {
    if (userProfile) {
      setProfile({
        ...userProfile,
        name: userProfile.name ?? '',
        email: userProfile.email ?? '',
        website: userProfile.website || 'demiak.es',
        valueProposition: userProfile.valueProposition ?? '',
        landingPage: userProfile.landingPage ?? '',
        jobTitle: userProfile.jobTitle ?? '',
        apiKey: userProfile.apiKey ?? '',
        customInstructions: userProfile.customInstructions ?? '',
        emailSignature: userProfile.emailSignature ?? '',
        webhookUrl: userProfile.webhookUrl ?? '',
        calendlyUrl: userProfile.calendlyUrl ?? '',
        googleAnalyticsId: userProfile.googleAnalyticsId ?? '',
        facebookPixelId: userProfile.facebookPixelId ?? '',
        privacyPolicyUrl: userProfile.privacyPolicyUrl ?? '',
        cookiesPolicyUrl: userProfile.cookiesPolicyUrl ?? '',
        legalNoticeUrl: userProfile.legalNoticeUrl ?? '',
        deploymentConfig: userProfile.deploymentConfig ?? { type: 'NONE', host: '', port: 22, username: '', password: '', path: '/public_html/' },
        hubspotKey: userProfile.hubspotKey ?? '',
        salesforceKey: userProfile.salesforceKey ?? '',
        salesforceInstanceUrl: userProfile.salesforceInstanceUrl ?? '',
        scoringWeights: userProfile.scoringWeights ?? { techStack: 20, socialPresence: 20, seoHealth: 20, intentSignals: 20, companySize: 20 }
      });
    }
  }, [userProfile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setProfile(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };
  
  const handleScoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setProfile(prev => ({ ...prev, scoringWeights: { ...prev.scoringWeights!, [name]: parseInt(value) } }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Ensure URLs have protocol
    const finalProfile = { ...profile };
    if (finalProfile.calendlyUrl && !finalProfile.calendlyUrl.startsWith('http')) {
        finalProfile.calendlyUrl = `https://${finalProfile.calendlyUrl}`;
    }
    if (finalProfile.website && !finalProfile.website.startsWith('http')) {
        finalProfile.website = `https://${finalProfile.website}`;
    }
    
    saveSettings(finalProfile);
  };

  const handleTestConnection = async () => {
    if (!profile.deploymentConfig || profile.deploymentConfig.type === 'NONE') return;
    
    setIsTesting(true);
    addNotification("Probando conexión...", "INFO");
    
    try {
        const response = await axios.post('/api/test-deployment', { config: profile.deploymentConfig });
        if (response.data.success) {
            addNotification(response.data.message, "SUCCESS");
        }
    } catch (error: any) {
        const errorMsg = error.response?.data?.error || error.message;
        addNotification(`Error de conexión: ${errorMsg}`, "ERROR");
    } finally {
        setIsTesting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 animate-fadeIn">
      <div className="glass-panel rounded-2xl p-8 shadow-2xl relative overflow-hidden border border-slate-700/50">
        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-700">
           <div className="p-3 bg-indigo-500/20 rounded-full border border-indigo-500/30"><UserCircleIcon className="w-8 h-8 text-indigo-400" /></div>
           <div><h2 className="text-2xl font-bold text-white">Configuración Avanzada</h2><p className="text-slate-400 text-sm">Gestiona tu identidad, CRM y llaves de API.</p></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Identity Section */}
          <div className="space-y-6">
              <h3 className="text-sm font-bold text-indigo-300 uppercase tracking-wide border-b border-slate-700 pb-2">Identidad Básica</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2"><label className="text-sm font-medium text-slate-300">Tu Nombre Completo</label><input type="text" name="name" value={profile.name} onChange={handleChange} className="w-full bg-slate-900/80 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
                <div className="space-y-2"><label className="text-sm font-medium text-slate-300">Cargo / Título</label><input type="text" name="jobTitle" value={profile.jobTitle} onChange={handleChange} className="w-full bg-slate-900/80 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
                <div className="space-y-2 md:col-span-2"><label className="text-sm font-medium text-slate-300">Email de Envío</label><input type="email" name="email" value={profile.email} onChange={handleChange} className="w-full bg-slate-900/80 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
                <div className="space-y-2"><label className="text-sm font-medium text-slate-300">Sitio Web</label><input type="text" name="website" value={profile.website} onChange={handleChange} className="w-full bg-slate-900/80 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
                <div className="space-y-2"><label className="text-sm font-medium text-slate-300">URL CTA</label><input type="text" name="landingPage" value={profile.landingPage} onChange={handleChange} className="w-full bg-slate-900/80 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
                <div className="space-y-2 md:col-span-2"><label className="text-sm font-medium text-slate-300">Tu Propuesta de Valor (Default)</label><textarea name="valueProposition" value={profile.valueProposition} onChange={handleChange} placeholder="Describe qué vendes y qué problema resuelves..." className="w-full bg-slate-900/80 border border-slate-600 rounded-lg px-4 py-3 text-white h-24 resize-none text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
              </div>
          </div>

          {/* Marketing & Tracking Section */}
          <div className="space-y-6">
              <h3 className="text-sm font-bold text-indigo-300 uppercase tracking-wide border-b border-slate-700 pb-2 flex items-center gap-2">
                <TargetIcon className="w-4 h-4" /> Marketing & Tracking
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Google Analytics ID (G-XXXXXXX)</label>
                  <input type="text" name="googleAnalyticsId" value={profile.googleAnalyticsId} onChange={handleChange} placeholder="G-XXXXXXXXXX" className="w-full bg-slate-900/80 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Facebook Pixel ID</label>
                  <input type="text" name="facebookPixelId" value={profile.facebookPixelId} onChange={handleChange} placeholder="1234567890" className="w-full bg-slate-900/80 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
          </div>

          {/* CRM Integrations */}
          <div className="space-y-6">
             <h3 className="text-sm font-bold text-indigo-300 uppercase tracking-wide border-b border-slate-700 pb-2 flex items-center gap-2"><LightningIcon className="w-4 h-4" /> Integraciones CRM</h3>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* HubSpot */}
                 <div className="bg-[#ff7a59]/10 border border-[#ff7a59]/20 p-4 rounded-xl space-y-3">
                     <div className="flex items-center gap-2 mb-2">
                         <div className="w-6 h-6 bg-[#ff7a59] rounded flex items-center justify-center text-white font-bold text-xs">H</div>
                         <h4 className="text-white font-bold">HubSpot</h4>
                     </div>
                     <div className="space-y-1">
                         <label className="text-xs font-medium text-[#ff7a59]">Private App Access Token</label>
                         <input type="password" name="hubspotKey" value={profile.hubspotKey} onChange={handleChange} placeholder="pat-na1-..." className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-xs font-mono" />
                     </div>
                 </div>

                 {/* Salesforce */}
                 <div className="bg-[#00a1e0]/10 border border-[#00a1e0]/20 p-4 rounded-xl space-y-3">
                     <div className="flex items-center gap-2 mb-2">
                         <div className="w-6 h-6 bg-[#00a1e0] rounded flex items-center justify-center text-white font-bold text-xs">S</div>
                         <h4 className="text-white font-bold">Salesforce</h4>
                     </div>
                     <div className="space-y-1">
                         <label className="text-xs font-medium text-[#00a1e0]">Access Token</label>
                         <input type="password" name="salesforceKey" value={profile.salesforceKey} onChange={handleChange} placeholder="00D..." className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-xs font-mono" />
                     </div>
                     <div className="space-y-1">
                         <label className="text-xs font-medium text-[#00a1e0]">Instance URL</label>
                         <input type="text" name="salesforceInstanceUrl" value={profile.salesforceInstanceUrl} onChange={handleChange} placeholder="https://your-domain.my.salesforce.com" className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-xs" />
                     </div>
                 </div>
             </div>

             <div className="space-y-2 mt-2">
                <label className="text-sm font-medium text-slate-300">Generic Webhook URL (Fallback)</label>
                <input type="url" name="webhookUrl" value={profile.webhookUrl} onChange={handleChange} placeholder="https://hooks.zapier.com/..." className="w-full bg-slate-900/80 border border-slate-600 rounded-lg px-4 py-3 text-white font-mono text-sm" />
             </div>

             <div className="space-y-2 mt-4 p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-xl">
                <div className="flex items-center gap-2 mb-1">
                    <CalendarIcon className="w-4 h-4 text-indigo-400" />
                    <label className="text-sm font-bold text-slate-200 uppercase tracking-tight">Calendly URL (Agendamiento)</label>
                </div>
                <p className="text-[10px] text-slate-500 mb-2 italic">Este enlace se incluirá automáticamente en los correos generados por la IA.</p>
                <input type="url" name="calendlyUrl" value={profile.calendlyUrl || ''} onChange={handleChange} placeholder="https://calendly.com/tu-usuario" className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white font-mono text-sm focus:border-indigo-500 transition-colors" />
             </div>

             {/* Legal & Compliance Section */}
             <div className="space-y-4 mt-6 p-4 bg-slate-800/30 border border-slate-700 rounded-xl">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <ShieldCheckIcon className="w-4 h-4 text-emerald-400" /> Legal & Cumplimiento (Landing Pages)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-medium text-slate-400">Aviso Legal URL</label>
                        <input type="url" name="legalNoticeUrl" value={profile.legalNoticeUrl || ''} onChange={handleChange} placeholder="https://demiak.es/aviso-legal" className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-xs text-white focus:border-indigo-500" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-medium text-slate-400">Privacidad URL</label>
                        <input type="url" name="privacyPolicyUrl" value={profile.privacyPolicyUrl || ''} onChange={handleChange} placeholder="https://demiak.es/privacidad" className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-xs text-white focus:border-indigo-500" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-medium text-slate-400">Cookies URL</label>
                        <input type="url" name="cookiesPolicyUrl" value={profile.cookiesPolicyUrl || ''} onChange={handleChange} placeholder="https://demiak.es/cookies" className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-xs text-white focus:border-indigo-500" />
                    </div>
                </div>
             </div>

             {/* Hosting & Deployment Section */}
             <div className="space-y-4 mt-6 p-4 bg-indigo-900/20 border border-indigo-500/20 rounded-xl">
                <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-widest flex items-center gap-2">
                    <CloudArrowUpIcon className="w-4 h-4 text-indigo-400" /> Hosting Demiak.es (Auto-Subida)
                </h4>
                <p className="text-[10px] text-slate-400">Configura tu servidor para que las landings se suban automáticamente al darle a "Publicar".</p>
                
                <div className="bg-amber-500/10 border border-amber-500/20 p-2 rounded mb-4">
                    <p className="text-[9px] text-amber-200 flex items-center gap-1">
                        <SparklesIcon className="w-3 h-3" /> 
                        <strong>¿Error de Timeout?</strong> Prueba a cambiar entre SFTP (Puerto 22) y FTP (Puerto 21). Asegúrate de que tu hosting permita conexiones externas.
                    </p>
                </div>
                
                <div className="flex gap-4 mb-4">
                    {['NONE', 'SFTP', 'FTP', 'WEBHOOK'].map((type) => (
                        <button
                            key={type}
                            type="button"
                            onClick={() => {
                                const defaultPort = type === 'SFTP' ? 22 : type === 'FTP' ? 21 : 80;
                                setProfile(prev => ({ 
                                    ...prev, 
                                    deploymentConfig: { 
                                        ...prev.deploymentConfig!, 
                                        type: type as any,
                                        port: prev.deploymentConfig?.type === type ? prev.deploymentConfig.port : defaultPort
                                    } 
                                }));
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${profile.deploymentConfig?.type === type ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                        >
                            {type === 'NONE' ? 'Desactivado' : type}
                        </button>
                    ))}
                </div>

                {(profile.deploymentConfig?.type === 'SFTP' || profile.deploymentConfig?.type === 'FTP') && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">
                        <div className="space-y-1">
                            <label className="text-[10px] font-medium text-slate-400">Host (IP o Dominio)</label>
                            <input type="text" value={profile.deploymentConfig?.host || ''} onChange={(e) => setProfile(prev => ({ ...prev, deploymentConfig: { ...prev.deploymentConfig!, host: e.target.value } }))} placeholder={profile.deploymentConfig?.type === 'SFTP' ? 'sftp.demiak.es' : 'ftp.demiak.es'} className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-xs text-white" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-medium text-slate-400">Puerto</label>
                            <input type="number" value={profile.deploymentConfig?.port || ''} onChange={(e) => setProfile(prev => ({ ...prev, deploymentConfig: { ...prev.deploymentConfig!, port: parseInt(e.target.value) } }))} placeholder={profile.deploymentConfig?.type === 'SFTP' ? '22' : '21'} className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-xs text-white" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-medium text-slate-400">Usuario</label>
                            <input type="text" value={profile.deploymentConfig?.username || ''} onChange={(e) => setProfile(prev => ({ ...prev, deploymentConfig: { ...prev.deploymentConfig!, username: e.target.value } }))} placeholder="usuario_ftp" className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-xs text-white" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-medium text-slate-400">Contraseña</label>
                            <input type="password" value={profile.deploymentConfig?.password || ''} onChange={(e) => setProfile(prev => ({ ...prev, deploymentConfig: { ...prev.deploymentConfig!, password: e.target.value } }))} placeholder="••••••••" className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-xs text-white" />
                        </div>
                        {profile.deploymentConfig?.type === 'FTP' && (
                            <div className="flex items-center gap-2 md:col-span-2">
                                <input 
                                    type="checkbox" 
                                    id="ftp-secure"
                                    checked={profile.deploymentConfig?.secure || false} 
                                    onChange={(e) => setProfile(prev => ({ ...prev, deploymentConfig: { ...prev.deploymentConfig!, secure: e.target.checked } }))}
                                    className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
                                />
                                <label htmlFor="ftp-secure" className="text-[10px] font-medium text-slate-400">Usar FTPS (Conexión Segura TLS)</label>
                            </div>
                        )}
                        <div className="space-y-1 md:col-span-2">
                            <label className="text-[10px] font-medium text-slate-400">Ruta Remota (Carpeta donde se subirán)</label>
                            <input type="text" value={profile.deploymentConfig?.path || ''} onChange={(e) => setProfile(prev => ({ ...prev, deploymentConfig: { ...prev.deploymentConfig!, path: e.target.value } }))} placeholder="/public_html/landings/" className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-xs text-white font-mono" />
                        </div>
                        <div className="md:col-span-2 flex justify-end">
                            <button 
                                type="button"
                                onClick={handleTestConnection}
                                disabled={isTesting}
                                className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 px-3 py-1.5 rounded-lg border border-indigo-500/30 hover:bg-indigo-500/10 transition-all disabled:opacity-50"
                            >
                                {isTesting ? 'Probando...' : 'Probar Conexión'}
                            </button>
                        </div>
                    </div>
                )}

                {profile.deploymentConfig?.type === 'WEBHOOK' && (
                    <div className="space-y-4 animate-fadeIn">
                        <div className="space-y-1">
                            <label className="text-[10px] font-medium text-slate-400">URL del Script Receptor (PHP/Node)</label>
                            <input type="url" value={profile.deploymentConfig?.webhookUrl || ''} onChange={(e) => setProfile(prev => ({ ...prev, deploymentConfig: { ...prev.deploymentConfig!, webhookUrl: e.target.value } }))} placeholder="https://demiak.es/deploy.php" className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-xs text-white" />
                        </div>
                        <div className="p-3 bg-slate-900 rounded-lg border border-slate-700">
                            <p className="text-[10px] text-slate-400 mb-2">El script recibirá un POST con: <code className="text-indigo-400">{"{ html, slug }"}</code></p>
                        </div>
                    </div>
                )}
             </div>
          </div>

          {/* AI Settings */}
          <div className="space-y-6">
               <h3 className="text-sm font-bold text-indigo-300 uppercase tracking-wide border-b border-slate-700 pb-2 flex items-center gap-2"><SparklesIcon className="w-4 h-4" /> Personalización de IA</h3>
               
               <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-700 space-y-6">
                  <h4 className="text-white font-bold text-sm flex items-center gap-2"><TargetIcon className="w-4 h-4 text-indigo-400" /> Pesos de Scoring Personalizados</h4>
                  <p className="text-xs text-slate-400">Ajusta qué factores son más importantes para calificar tus leads.</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                      { id: 'techStack', label: 'Stack Tecnológico', color: 'bg-blue-500' },
                      { id: 'socialPresence', label: 'Presencia Social', color: 'bg-emerald-500' },
                      { id: 'seoHealth', label: 'Salud SEO', color: 'bg-amber-500' },
                      { id: 'intentSignals', label: 'Señales de Intención', color: 'bg-rose-500' },
                      { id: 'companySize', label: 'Tamaño de Empresa', color: 'bg-indigo-500' }
                    ].map(weight => (
                      <div key={weight.id} className="space-y-2">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-slate-300">{weight.label}</span>
                          <span className="text-white">{(profile.scoringWeights as any)[weight.id]}%</span>
                        </div>
                        <input 
                          type="range" 
                          name={weight.id} 
                          min="0" 
                          max="100" 
                          value={(profile.scoringWeights as any)[weight.id]} 
                          onChange={handleScoreChange}
                          className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        />
                      </div>
                    ))}
                  </div>
               </div>

               <div className="space-y-2"><label className="text-sm font-medium text-slate-300">Instrucciones del Sistema</label><textarea name="customInstructions" value={profile.customInstructions} onChange={handleChange} className="w-full bg-slate-900/80 border border-slate-600 rounded-lg px-4 py-3 text-white h-24 resize-none text-sm" /></div>
               
               <div className="space-y-2 mt-4 pt-4 border-t border-slate-800">
                    <div className="flex justify-between items-center"><label className="text-sm font-medium text-slate-300">Gemini API Key <span className="text-red-400">*</span></label><a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-[10px] text-indigo-400 hover:text-indigo-300 underline">Conseguir Key</a></div>
                    <input type="password" name="apiKey" value={profile.apiKey} onChange={handleChange} placeholder="AIzaSy..." className="w-full bg-slate-900/80 border border-slate-600 rounded-lg px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-indigo-500" />
            </div>
          </div>

          <div className="pt-6 border-t border-slate-700 flex justify-end">
             <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-indigo-500/20 flex items-center gap-2 transition-all transform hover:scale-105"><SaveIcon className="w-5 h-5" /> Guardar Configuración</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettingsView;
