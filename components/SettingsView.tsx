
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { UserProfile } from '../types';
import { UserCircleIcon, SaveIcon, TargetIcon, SparklesIcon, LightningIcon, LinkIcon, KeyIcon } from './Icons';

const SettingsView: React.FC = () => {
  const { userProfile, saveSettings } = useApp();
  const [profile, setProfile] = useState<UserProfile>({
    name: '', email: '', website: '', landingPage: '', jobTitle: '', apiKey: '', customInstructions: '', emailSignature: '', webhookUrl: '', hubspotKey: '', salesforceKey: '', salesforceInstanceUrl: '', scoringWeights: { techStack: 30, socialPresence: 30, seoHealth: 40 }
  });

  useEffect(() => {
    if (userProfile) {
      setProfile({
        ...userProfile,
        name: userProfile.name ?? '',
        email: userProfile.email ?? '',
        website: userProfile.website ?? '',
        landingPage: userProfile.landingPage ?? '',
        jobTitle: userProfile.jobTitle ?? '',
        apiKey: userProfile.apiKey ?? '',
        customInstructions: userProfile.customInstructions ?? '',
        emailSignature: userProfile.emailSignature ?? '',
        webhookUrl: userProfile.webhookUrl ?? '',
        hubspotKey: userProfile.hubspotKey ?? '',
        salesforceKey: userProfile.salesforceKey ?? '',
        salesforceInstanceUrl: userProfile.salesforceInstanceUrl ?? '',
        scoringWeights: userProfile.scoringWeights ?? { techStack: 30, socialPresence: 30, seoHealth: 40 }
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
    saveSettings(profile);
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
          </div>

          {/* AI Settings */}
          <div className="space-y-6">
               <h3 className="text-sm font-bold text-indigo-300 uppercase tracking-wide border-b border-slate-700 pb-2 flex items-center gap-2"><SparklesIcon className="w-4 h-4" /> Personalización de IA</h3>
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
