
import React, { useState, useEffect, useRef } from 'react';
import { Lead, LeadStatus, Notification, Note, EmailStatus, EmailTemplate, SequenceStep, BuyingSignal } from '../types';
import { verifyEmailAddress, analyzeVisual, generateOutreachSequence, detectBuyingSignals, generateSingleOutreach, analyzeSentiment, cleanEmailBody } from '../services/geminiService'; // Import new services
import { templateStorage } from '../services/storage';
import { useApp } from '../context/AppContext'; 
import OrgChartModal from './OrgChartModal';
import axios from 'axios';
import { MailIcon, SendIcon, CheckCircleIcon, CopyIcon, LinkedInIcon, TargetIcon, LocationIcon, EyeIcon, SearchIcon, TelescopeIcon, PhoneIcon, ChevronLeftIcon, ChevronRightIcon, ChartBarIcon, PencilIcon, SaveIcon, PaperAirplaneIcon, MessageCircleIcon, ShieldCheckIcon, ShieldExclamationIcon, BriefcaseIcon, SparklesIcon, TrashIcon, ListIcon, XMarkIcon, PhotoIcon, UploadIcon, CloudArrowUpIcon, CalendarIcon, ClockIcon, BellAlertIcon, SitemapIcon, SendFillIcon, BoltIcon, LightningIcon, FileTextIcon } from './Icons';

interface OutreachModalProps {
  lead: Lead;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Lead>) => void;
  onFindSimilar?: (lead: Lead) => void; 
  onDeepDive?: (lead: Lead) => Promise<void>; 
  addNotification: (msg: string, type: Notification['type']) => void; 
  hasNext?: boolean;
  hasPrev?: boolean;
  onNext?: () => void;
  onPrev?: () => void;
  currentIndex?: number;
  totalSelected?: number;
}

const OutreachModal: React.FC<OutreachModalProps> = ({ 
    lead, onClose, onUpdate, onFindSimilar, onDeepDive, addNotification,
    hasNext, hasPrev, onNext, onPrev, currentIndex, totalSelected
}) => {
  const { userProfile, handleCrmExport, handlePredictIntent } = useApp(); 
  const [activeTab, setActiveTab] = useState<'EMAIL' | 'LINKEDIN' | 'PHONE' | 'NOTES' | 'VISUAL' | 'SEQUENCE' | 'SIGNALS' | 'REPLY'>('EMAIL');
  
  // States
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: lead.name, company: lead.company, role: lead.role, emailGuess: lead.emailGuess || "", linkedinUrl: lead.linkedinUrl || "", address: lead.address || "" });
  const [newNote, setNewNote] = useState("");
  const [subject, setSubject] = useState(lead.outreach?.subject || "");
  const [htmlBody, setHtmlBody] = useState(lead.outreach?.email || "");
  const [viewMode, setViewMode] = useState<'PREVIEW' | 'CODE'>('PREVIEW');
  const [showTemplates, setShowTemplates] = useState(false);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [templateName, setTemplateName] = useState("");
  const [isGeneratingSequence, setIsGeneratingSequence] = useState(false);
  const [isGeneratingProposal, setIsGeneratingProposal] = useState(false);
  const [activeSequenceStep, setActiveSequenceStep] = useState<number>(0);
  const [linkedinMsg, setLinkedinMsg] = useState(lead.outreach?.linkedin || "");
  const [phoneScript, setPhoneScript] = useState(lead.outreach?.phone || "");
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [isDeepDiving, setIsDeepDiving] = useState(false);
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [showOrgChart, setShowOrgChart] = useState(false);
  const [isSending, setIsSending] = useState(false); // Simulated sending state
  const [isSyncingCrm, setIsSyncingCrm] = useState(false);
  const [signals, setSignals] = useState<BuyingSignal[]>(lead.buyingSignals || []);
  const [loadingSignals, setLoadingSignals] = useState(false);
  const [isRunningWarRoom, setIsRunningWarRoom] = useState(false);
  const [isAnalyzingCall, setIsAnalyzingCall] = useState(false);
  const [isPredictingIntent, setIsPredictingIntent] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isAnalyzingReply, setIsAnalyzingReply] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSubject(lead.outreach?.subject || lead.outreach?.subjectVariants?.[0] || `Propuesta para ${lead.company}`);
    setHtmlBody(lead.outreach?.email || "");
    setLinkedinMsg(lead.outreach?.linkedin || "");
    setPhoneScript(lead.outreach?.phone || "");
    setSignals(lead.buyingSignals || []);
    setEditForm({ name: lead.name, company: lead.company, role: lead.role, emailGuess: lead.emailGuess || "", linkedinUrl: lead.linkedinUrl || "", address: lead.address || "" });
  }, [lead.id]); // Only reset when switching leads

  useEffect(() => { templateStorage.getAll().then(setTemplates); }, []);

  // --- ACTIONS ---

  const handleSimulateSend = async () => {
      setIsSending(true);
      await new Promise(r => setTimeout(r, 1500)); // Fake network delay
      setIsSending(false);
      onUpdate(lead.id, { status: LeadStatus.CONTACTED });
      addNotification(`Correo enviado a ${lead.emailGuess} (Simulado)`, "SUCCESS");
      
      // Schedule next step if sequence exists
      if (lead.outreach?.sequence && activeSequenceStep < lead.outreach.sequence.length - 1) {
          addNotification("Siguiente paso programado en 3 días", "INFO");
      }
  };

  const handleCrmClick = async () => {
      setIsSyncingCrm(true);
      await handleCrmExport(lead);
      setIsSyncingCrm(false);
  };

  const handleCheckSignals = async () => {
      setLoadingSignals(true);
      const newSignals = await detectBuyingSignals(lead, userProfile?.apiKey);
      setSignals(newSignals);
      onUpdate(lead.id, { buyingSignals: newSignals });
      setLoadingSignals(false);
      if (newSignals.length > 0) addNotification(`${newSignals.length} señales detectadas`, "SUCCESS");
      else addNotification("No se detectaron señales nuevas", "INFO");
  };

  const handleAnalyzeReply = async () => {
      if (!replyText.trim()) {
          addNotification("Pega la respuesta del cliente primero", "ERROR");
          return;
      }
      setIsAnalyzingReply(true);
      addNotification("Analizando sentimiento...", "INFO");
      try {
          const analysis = await analyzeSentiment(replyText, userProfile?.apiKey);
          onUpdate(lead.id, { sentimentAnalysis: analysis });
          addNotification("Análisis completado", "SUCCESS");
      } catch (err) {
          addNotification("Error al analizar respuesta", "ERROR");
      } finally {
          setIsAnalyzingReply(false);
      }
  };

  const handleApplyTemplate = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const tId = e.target.value;
      const template = templates.find(t => t.id === tId);
      if (!template) return;

      // Replace variables
      let finalBody = template.body;
      let finalSubject = template.subject;

      // Basic replacements
      const replacements: Record<string, string> = {
          '{{name}}': lead.name,
          '{{company}}': lead.company,
          '{{role}}': lead.role,
          '{{industry}}': lead.industry || 'tu industria',
          '{{city}}': lead.location || 'tu ciudad',
          '{{calendly}}': userProfile?.calendlyUrl || 'demiak.es'
      };

      for (const [key, val] of Object.entries(replacements)) {
          finalBody = finalBody.split(key).join(val);
          finalSubject = finalSubject.split(key).join(val);
      }

      setHtmlBody(finalBody);
      setSubject(finalSubject);
      
      // Persist changes
      onUpdate(lead.id, { 
          outreach: { 
              ...lead.outreach, 
              email: finalBody, 
              subject: finalSubject 
          } 
      });
      
      addNotification(`Plantilla "${template.name}" aplicada`, "SUCCESS");
  };

  // ... (Existing handlers: handleCopyText, handleSendMailto, handleVerifyEmail, etc. kept same)
  const handleCopyText = (text: string, label: string) => { navigator.clipboard.writeText(text); addNotification(`${label} copiado`, "SUCCESS"); };
  const stripHtml = (html: string) => { const tmp = document.createElement("DIV"); tmp.innerHTML = html; return tmp.textContent || tmp.innerText || ""; };
  
  const handleSendEmailBackend = async () => {
      if (!lead.emailGuess) {
          addNotification("El lead no tiene un email configurado", "ERROR");
          return;
      }
      
      setIsSending(true);
      try {
          const response = await axios.post('/api/send-email', {
              to: lead.emailGuess,
              subject: subject,
              html: htmlBody,
              text: stripHtml(htmlBody)
          });
          
          if (response.data.success) {
              addNotification(`Email enviado a ${lead.emailGuess}`, "SUCCESS");
              if (response.data.previewUrl) {
                  console.log("Email Preview URL:", response.data.previewUrl);
                  addNotification("Revisa la consola para el enlace de prueba", "INFO");
              }
              onUpdate(lead.id, { status: LeadStatus.CONTACTED });
          } else {
              throw new Error(response.data.error || 'Error desconocido');
          }
      } catch (error: any) {
          console.error("Error sending email:", error);
          const errorMsg = error.response?.data?.error || error.message;
          addNotification(`Error al enviar: ${errorMsg}`, "ERROR");
      } finally {
          setIsSending(false);
      }
  };

  const handleSendMailto = () => {
      if (!lead.emailGuess) {
          addNotification("El lead no tiene un email configurado", "ERROR");
          return;
      }
      
      const plainTextBody = stripHtml(htmlBody);
      const mailtoLink = `mailto:${lead.emailGuess}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(plainTextBody)}`;
      
      // Open default mail client
      window.location.href = mailtoLink;
      
      // Update status
      onUpdate(lead.id, { status: LeadStatus.CONTACTED });
      addNotification(`Abriendo cliente de correo para ${lead.emailGuess}`, "SUCCESS");
  };
  const handleVerifyEmail = async () => { /* ...existing logic... */ };
  const saveTimeoutRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const debouncedUpdate = (id: string, updates: Partial<Lead>, key: string) => {
      if (saveTimeoutRef.current[key]) {
          clearTimeout(saveTimeoutRef.current[key]);
      }
      saveTimeoutRef.current[key] = setTimeout(() => {
          onUpdate(id, updates);
          delete saveTimeoutRef.current[key];
      }, 500);
  };

  const handleSubjectChange = (newSubject: string) => { 
      setSubject(newSubject); 
      debouncedUpdate(lead.id, { outreach: { subject: newSubject } }, 'subject'); 
  };
  
  const handleEmailBodyChange = (newBody: string) => { 
      setHtmlBody(newBody); 
      debouncedUpdate(lead.id, { outreach: { email: newBody } }, 'email'); 
  };
  
  const handleLinkedinChange = (newMsg: string) => { 
      setLinkedinMsg(newMsg); 
      debouncedUpdate(lead.id, { outreach: { linkedin: newMsg } }, 'linkedin'); 
  };
  const handleDeepDiveClick = async () => { if (!onDeepDive) return; setIsDeepDiving(true); try { await onDeepDive(lead); addNotification("Investigación completada", "SUCCESS"); } catch { addNotification("Error", "ERROR"); } finally { setIsDeepDiving(false); } };
  
  const toggleEditMode = () => { if (isEditing) { onUpdate(lead.id, editForm); addNotification("Actualizado", "SUCCESS"); } setIsEditing(!isEditing); };
  const handleAddNote = () => { if (!newNote.trim()) return; onUpdate(lead.id, { notes: [...(lead.notes || []), { id: Date.now().toString(), content: newNote, createdAt: Date.now() }] }); setNewNote(""); };
  const handleGenerateSequence = async () => { setIsGeneratingSequence(true); try { const sequence = await generateOutreachSequence(lead, userProfile?.apiKey); onUpdate(lead.id, { outreach: { sequence } }); } catch { addNotification("Error", "ERROR"); } finally { setIsGeneratingSequence(false); } };
  
  const handleGenerateProposal = async () => {
    setIsGeneratingProposal(true);
    addNotification("Generando propuesta personalizada...", "INFO");
    try {
        const result = await generateSingleOutreach(lead, userProfile?.apiKey, userProfile?.calendlyUrl);
        const cleanedEmail = result.email ? cleanEmailBody(result.email, result.subject || '') : '';
        if (cleanedEmail) setHtmlBody(cleanedEmail);
        if (result.subject) setSubject(result.subject);
        if (result.linkedin) setLinkedinMsg(result.linkedin);
        if (result.phone) setPhoneScript(result.phone);
        
        onUpdate(lead.id, { 
            outreach: { 
                email: cleanedEmail || htmlBody,
                subject: result.subject || subject,
                linkedin: result.linkedin || linkedinMsg,
                phone: result.phone || phoneScript
            } 
        });
        addNotification("Propuesta generada con éxito", "SUCCESS");
    } catch {
        addNotification("Error al generar propuesta", "ERROR");
    } finally {
        setIsGeneratingProposal(false);
    }
  };

  const handleUpdateSequenceStep = (index: number, field: string, value: string) => { if (!lead.outreach?.sequence) return; const seq = [...lead.outreach.sequence]; seq[index] = { ...seq[index], [field]: value } as any; onUpdate(lead.id, { outreach: { ...lead.outreach, sequence: seq } }); };
  
  // Visual Logic
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => { /* ... */ };
  const runVisualAnalysis = async () => { /* ... */ };
  
  // Template Logic
  const saveTemplate = async () => { /* ... */ };
  const loadTemplate = (t: EmailTemplate) => { /* ... */ };
  const deleteTemplate = async (id: string) => { /* ... */ };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fadeIn">
      {showOrgChart && <OrgChartModal lead={lead} onClose={() => setShowOrgChart(false)} apiKey={userProfile?.apiKey} onUpdateLead={onUpdate} />}
      
      <div className="bg-slate-900 border border-slate-700 w-full max-w-6xl h-[90vh] rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden relative">
        
        {/* Navigation Overlay */}
        {(hasNext || hasPrev) && (
            <div className="absolute top-0 left-0 right-0 h-14 pointer-events-none z-50 flex justify-center items-center">
                 <div className="bg-slate-800/90 border border-slate-600 rounded-full px-4 py-1.5 flex items-center gap-4 pointer-events-auto shadow-xl backdrop-blur-md">
                    <button onClick={onPrev} disabled={!hasPrev} className={`p-1 rounded-full ${!hasPrev ? 'text-slate-600' : 'text-white hover:bg-slate-600'}`}><ChevronLeftIcon className="w-5 h-5" /></button>
                    <span className="text-xs font-bold text-slate-200">Lead {currentIndex !== undefined ? currentIndex + 1 : 0} de {totalSelected}</span>
                    <button onClick={onNext} disabled={!hasNext} className={`p-1 rounded-full ${!hasNext ? 'text-slate-600' : 'text-white hover:bg-slate-600'}`}><ChevronRightIcon className="w-5 h-5" /></button>
                 </div>
            </div>
        )}

        {/* LEFT SIDEBAR */}
        <div className="w-full md:w-1/4 bg-slate-950 p-0 border-r border-slate-800 overflow-y-auto hidden md:flex flex-col">
          {/* Identity Header */}
          <div className="p-5 border-b border-slate-800 bg-slate-900/50 relative group">
                <button onClick={toggleEditMode} className="absolute right-4 top-4 p-1.5 rounded-full text-slate-500 hover:bg-slate-800 hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-all">{isEditing ? <SaveIcon className="w-4 h-4 text-emerald-400" /> : <PencilIcon className="w-4 h-4" />}</button>
                {isEditing ? (
                    <div className="space-y-3 animate-fadeIn mt-2">
                        <input value={editForm.company} onChange={(e) => setEditForm({...editForm, company: e.target.value})} className="w-full bg-slate-800 border border-indigo-500 rounded px-2 py-1.5 text-sm font-bold text-white" />
                        <input value={editForm.role} onChange={(e) => setEditForm({...editForm, role: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-300" />
                        <input value={editForm.address} onChange={(e) => setEditForm({...editForm, address: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-[10px] text-slate-400" />
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shrink-0">{lead.company.charAt(0)}</div>
                            <div className="min-w-0"><h3 className="text-base font-bold text-white leading-tight truncate" title={lead.company}>{lead.company}</h3><p className="text-indigo-400 text-xs font-medium truncate">{lead.role}</p></div>
                        </div>
                        {lead.address && <div className="flex items-center gap-1.5 text-slate-500 text-[11px] px-1"><LocationIcon className="w-3.5 h-3.5 shrink-0" /><span className="truncate">{lead.address}</span></div>}
                        <div className="flex gap-2 mt-1">
                             <span className="bg-slate-800 text-slate-300 text-[10px] px-2 py-0.5 rounded border border-slate-700">Score: <strong className={lead.qualificationScore > 70 ? "text-emerald-400" : "text-yellow-400"}>{lead.qualificationScore}</strong></span>
                             {lead.isDeepDived && <span className="bg-emerald-900/30 text-emerald-400 text-[10px] px-2 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1"><SparklesIcon className="w-3 h-3" /> Deep Dive</span>}
                        </div>
                    </div>
                )}
          </div>

          <div className="p-5 space-y-6 flex-1">
            {/* Actions */}
            <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setShowOrgChart(true)} className="py-2 px-2 rounded-lg text-[10px] font-bold bg-slate-900 border border-slate-700 hover:border-indigo-500 hover:text-white text-slate-400 transition-colors flex flex-col items-center gap-1"><SitemapIcon className="w-4 h-4"/> Organigrama</button>
                <button onClick={handleCheckSignals} className="py-2 px-2 rounded-lg text-[10px] font-bold bg-slate-900 border border-slate-700 hover:border-amber-500 hover:text-white text-slate-400 transition-colors flex flex-col items-center gap-1 relative">
                    <BellAlertIcon className="w-4 h-4"/> 
                    {loadingSignals ? 'Escaneando...' : 'Señales'}
                    {signals.length > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>}
                </button>
            </div>

            {/* Diagnosis */}
            <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-1"><TargetIcon className="w-3.5 h-3.5 text-indigo-500" /> Diagnóstico</h4>
                <div className="bg-slate-900 border border-indigo-500/20 rounded-lg p-3 relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500"></div>
                    <p className="text-xs text-indigo-200 italic leading-relaxed">"{lead.auditObservation || 'Análisis pendiente...'}"</p>
                </div>
                
                {/* Buying Intent Prediction */}
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 space-y-2">
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Intención de Compra</span>
                        {lead.intentScore !== undefined ? (
                            <span className={`text-xs font-bold ${lead.intentScore > 70 ? 'text-emerald-400' : 'text-yellow-400'}`}>{lead.intentScore}%</span>
                        ) : (
                            <button onClick={() => handlePredictIntent(lead)} disabled={isPredictingIntent} className="text-[10px] text-indigo-400 hover:text-indigo-300 underline">Analizar</button>
                        )}
                    </div>
                    {lead.intentReason && <p className="text-[10px] text-slate-400 leading-tight">{lead.intentReason}</p>}
                </div>

                {lead.painPoints && <div className="flex flex-wrap gap-2">{lead.painPoints.map((pain, idx) => (<span key={idx} className="text-[10px] bg-red-900/20 text-red-300 border border-red-500/30 px-2 py-1 rounded-md">{pain}</span>))}</div>}
            </div>

            {/* SEO */}
            <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-1"><ChartBarIcon className="w-3.5 h-3.5 text-emerald-500" /> Salud Digital</h4>
                {lead.seoAnalysis ? (<div className="bg-slate-900 border border-slate-800 rounded-lg p-3 space-y-2"><div className="flex justify-between items-center pb-2 border-b border-slate-800"><span className="text-xs text-slate-400">Score Global</span><span className={`text-sm font-bold ${lead.seoAnalysis.overallScore > 70 ? 'text-emerald-400' : 'text-yellow-400'}`}>{lead.seoAnalysis.overallScore}/100</span></div><div className="text-[10px] text-red-300 flex gap-1 mt-1"><span className="text-red-500">⚠</span> {lead.seoAnalysis.mainIssue}</div></div>) : (<div className="text-center py-3 text-xs text-slate-600 bg-slate-900 rounded border border-slate-800 border-dashed">Sin datos SEO.</div>)}
            </div>

            {/* Contact */}
            <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-1"><MessageCircleIcon className="w-3.5 h-3.5 text-blue-500" /> Contacto</h4>
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-white font-medium"><div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] text-slate-400">{lead.name.charAt(0)}</div>{lead.name}</div>
                    {lead.emailGuess && (<div className="flex items-center justify-between text-xs p-2 rounded border bg-slate-900 border-slate-700 text-slate-300"><span className="font-mono truncate max-w-[120px]">{lead.emailGuess}</span></div>)}
                </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Content Area */}
        <div className="flex-1 flex flex-col bg-slate-900 relative">
          
          {/* Header & Tabs */}
          <div className="p-0 border-b border-slate-700 bg-slate-800/30 pt-10 md:pt-0">
             <div className="flex justify-between items-center p-4 pb-2">
                    <h3 className="font-bold text-white flex items-center gap-2">
                        <span className="bg-indigo-600 p-1.5 rounded-lg shadow-lg shadow-indigo-500/20">
                            {activeTab === 'EMAIL' && <MailIcon className="w-4 h-4 text-white" />}
                            {activeTab === 'SIGNALS' && <BellAlertIcon className="w-4 h-4 text-white" />}
                            {activeTab === 'SEQUENCE' && <CalendarIcon className="w-4 h-4 text-white" />}
                            {activeTab === 'LINKEDIN' && <LinkedInIcon className="w-4 h-4 text-white" />}
                            {activeTab === 'PHONE' && <PhoneIcon className="w-4 h-4 text-white" />}
                            {activeTab === 'VISUAL' && <PhotoIcon className="w-4 h-4 text-white" />}
                            {activeTab === 'NOTES' && <ListIcon className="w-4 h-4 text-white" />}
                            {activeTab === 'REPLY' && <MessageCircleIcon className="w-4 h-4 text-white" />}
                        </span>
                        {activeTab === 'EMAIL' && 'Editor de Email'}
                        {activeTab === 'SIGNALS' && 'Monitor de Señales'}
                        {activeTab === 'SEQUENCE' && 'Agente de Seguimiento'}
                        {activeTab === 'LINKEDIN' && 'Estrategia LinkedIn'}
                        {activeTab === 'PHONE' && 'Script de Llamada'}
                        {activeTab === 'VISUAL' && 'Auditoría Visual'}
                        {activeTab === 'NOTES' && 'Notas del Lead'}
                        {activeTab === 'REPLY' && 'Analizar Respuesta'}
                    </h3>
                <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
             </div>

              <div className="flex px-4 gap-6 overflow-x-auto scrollbar-hide">
                <button onClick={() => setActiveTab('EMAIL')} className={`pb-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${activeTab === 'EMAIL' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>Email</button>
                <button onClick={() => setActiveTab('SEQUENCE')} className={`pb-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${activeTab === 'SEQUENCE' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>Secuencia</button>
                <button onClick={() => setActiveTab('SIGNALS')} className={`pb-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${activeTab === 'SIGNALS' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>Señales {signals.length > 0 && <span className="bg-red-500 text-white text-[9px] px-1 rounded-full">{signals.length}</span>}</button>
                <button onClick={() => setActiveTab('LINKEDIN')} className={`pb-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${activeTab === 'LINKEDIN' ? 'border-[#0077b5] text-[#0077b5]' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>LinkedIn</button>
                <button onClick={() => setActiveTab('PHONE')} className={`pb-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${activeTab === 'PHONE' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>Llamada</button>
                <button onClick={() => setActiveTab('VISUAL')} className={`pb-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${activeTab === 'VISUAL' ? 'border-violet-500 text-violet-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>Visual</button>
                <button onClick={() => setActiveTab('NOTES')} className={`pb-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${activeTab === 'NOTES' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>Notas</button>
                <button onClick={() => setActiveTab('REPLY')} className={`pb-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 ${activeTab === 'REPLY' ? 'border-rose-500 text-rose-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>
                    Respuesta
                    <span className="bg-rose-500 text-white text-[8px] px-1 rounded-sm animate-pulse">NEW</span>
                </button>
              </div>
          </div>

          <div className="flex-1 overflow-hidden relative bg-slate-950 flex flex-row">
            
            {/* SIGNALS TAB */}
            {activeTab === 'SIGNALS' && (
                <div className="w-full p-8 animate-fadeIn overflow-y-auto">
                    {loadingSignals ? (
                        <div className="text-center text-slate-500 mt-10"><div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-2"></div>Buscando noticias...</div>
                    ) : signals.length === 0 ? (
                        <div className="text-center text-slate-500 mt-10 flex flex-col items-center"><BellAlertIcon className="w-12 h-12 opacity-50 mb-2"/>No hay señales recientes.<button onClick={handleCheckSignals} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm">Escanear Ahora</button></div>
                    ) : (
                        <div className="grid gap-4">
                            {signals.map((signal, i) => (
                                <div key={i} className="bg-slate-900 border border-slate-700 p-4 rounded-xl flex items-start gap-4 hover:bg-slate-800 transition-colors">
                                    <div className={`p-2 rounded-lg ${signal.type === 'FUNDING' ? 'bg-emerald-900/50 text-emerald-400' : signal.type === 'HIRING' ? 'bg-blue-900/50 text-blue-400' : 'bg-slate-800 text-slate-400'}`}>
                                        <BoltIcon className="w-6 h-6"/>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-800 border border-slate-600 uppercase">{signal.type}</span>
                                            <span className="text-xs text-slate-500">{new Date(signal.detectedAt).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-slate-200 text-sm">{signal.description}</p>
                                        <div className="mt-2 text-xs font-bold text-emerald-500">+ {signal.scoreImpact} Score Impact</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* EMAIL TAB */}
            {activeTab === 'EMAIL' && (
                <div className="flex flex-col h-full flex-1 min-w-0">
                     <div className="p-4 border-b border-slate-800 bg-slate-900/50">
                        <div className="flex justify-between items-center mb-3">
                            <button 
                                onClick={handleGenerateProposal}
                                disabled={isGeneratingProposal}
                                className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 rounded-lg text-[10px] font-bold transition-all disabled:opacity-50"
                            >
                                <SparklesIcon className="w-3 h-3" /> {isGeneratingProposal ? 'Generando...' : 'Regenerar con IA'}
                            </button>
                            <div className="relative inline-block w-48">
                                <select 
                                    onChange={handleApplyTemplate}
                                    defaultValue=""
                                    className="w-full bg-slate-800 border border-slate-600 rounded-lg py-1.5 px-3 text-xs text-white focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer"
                                >
                                    <option value="" disabled>Cargar Plantilla...</option>
                                    {templates.map(t => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                                <div className="absolute right-3 top-2 pointer-events-none text-slate-400">
                                    <FileTextIcon className="w-3 h-3" />
                                </div>
                            </div>
                        </div>

                        {/* Subject Input */}
                        <div className="flex items-center gap-3 bg-slate-900 p-2 rounded-lg border border-slate-700 mb-2">
                            <span className="text-slate-500 text-sm font-bold px-2">Asunto:</span>
                            <input type="text" value={subject} onChange={(e) => handleSubjectChange(e.target.value)} className="bg-transparent border-none text-white text-sm w-full focus:outline-none" />
                        </div>
                        {/* Fake Sender Info */}
                        <div className="flex items-center gap-2 text-xs text-slate-500 px-2">
                            <span>De: <strong>{lead.senderEmail || 'tu@email.com'}</strong></span>
                            <span>•</span>
                            <span>Para: <strong>{lead.emailGuess || 'cliente@empresa.com'}</strong></span>
                        </div>
                     </div>

                     <div className="flex-1 overflow-y-auto">
                        <textarea className="w-full h-full bg-[#1e1e1e] text-blue-300 p-4 font-mono text-sm focus:outline-none resize-none leading-relaxed" value={htmlBody} onChange={(e) => handleEmailBodyChange(e.target.value)} spellCheck={false} />
                     </div>
                </div>
            )}

            {/* SEQUENCE TAB */}
            {activeTab === 'SEQUENCE' && (
                <div className="w-full flex flex-col h-full">
                    {!lead.outreach?.sequence ? (
                        <div className="flex flex-col items-center justify-center h-full"><button onClick={handleGenerateSequence} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold flex items-center gap-2">{isGeneratingSequence ? 'Generando...' : <><CalendarIcon className="w-5 h-5"/> Generar Secuencia</>}</button></div>
                    ) : (
                        <div className="flex h-full">
                            <div className="w-64 bg-slate-900 border-r border-slate-800 p-4 space-y-2">
                                {lead.outreach.sequence.map((step, idx) => (
                                    <div key={idx} onClick={() => setActiveSequenceStep(idx)} className={`p-3 rounded-lg cursor-pointer ${activeSequenceStep === idx ? 'bg-indigo-900/20 border border-indigo-500/50' : 'hover:bg-slate-800 border border-transparent'}`}>
                                        <div className="text-xs font-bold text-slate-400 uppercase">Día {step.day}</div>
                                        <div className="text-sm font-medium text-white truncate">{step.subject}</div>
                                        <div className="text-[10px] mt-1 flex items-center gap-1 text-slate-500">{step.status === 'SENT' ? <CheckCircleIcon className="w-3 h-3 text-emerald-500"/> : <ClockIcon className="w-3 h-3"/>} {step.status || 'Pendiente'}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex-1 p-6 bg-slate-950">
                                <div className="bg-slate-900 border border-slate-800 rounded-xl h-full p-4 flex flex-col">
                                    <input className="bg-transparent text-white font-bold text-lg mb-4 border-b border-slate-700 pb-2 focus:outline-none" value={lead.outreach.sequence[activeSequenceStep].subject} onChange={e => handleUpdateSequenceStep(activeSequenceStep, 'subject', e.target.value)} />
                                    <textarea className="flex-1 bg-transparent text-slate-300 resize-none focus:outline-none font-mono text-sm" value={lead.outreach.sequence[activeSequenceStep].body} onChange={e => handleUpdateSequenceStep(activeSequenceStep, 'body', e.target.value)} />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* VISUAL TAB */}
            {activeTab === 'VISUAL' && (
                <div className="w-full p-8 animate-fadeIn overflow-y-auto">
                    <div className="max-w-4xl mx-auto space-y-8">
                        <div className="bg-slate-900 border border-slate-700 p-8 rounded-3xl text-center space-y-6">
                            <div className="flex flex-col items-center gap-4">
                                <div className="p-4 bg-violet-500/10 rounded-full border border-violet-500/20">
                                    <PhotoIcon className="w-12 h-12 text-violet-400" />
                                </div>
                                <div>
                                    <h4 className="text-white font-bold text-xl">Auditoría Visual IA</h4>
                                    <p className="text-slate-400 text-sm max-w-md mx-auto mt-2">Sube una captura de pantalla de la web o landing del cliente para recibir un análisis de diseño y conversión.</p>
                                </div>
                            </div>
                            
                            <div className="flex justify-center">
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    className="hidden" 
                                    accept="image/*" 
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        setIsAnalyzingImage(true);
                                        addNotification("Analizando diseño visual...", "INFO");
                                        try {
                                            const reader = new FileReader();
                                            reader.readAsDataURL(file);
                                            reader.onloadend = async () => {
                                                const base64 = (reader.result as string).split(',')[1];
                                                const analysis = await analyzeVisual(base64, userProfile?.apiKey);
                                                onUpdate(lead.id, { visualAnalysis: { ...analysis, screenshot: reader.result as string } });
                                                addNotification("Análisis visual completado", "SUCCESS");
                                            };
                                        } catch (err) {
                                            addNotification("Error al analizar imagen", "ERROR");
                                        } finally {
                                            setIsAnalyzingImage(false);
                                        }
                                    }} 
                                />
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isAnalyzingImage}
                                    className="px-8 py-4 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl font-bold flex items-center gap-3 shadow-xl shadow-violet-500/20 transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {isAnalyzingImage ? 'Analizando...' : <><CloudArrowUpIcon className="w-6 h-6" /> Subir Captura</>}
                                </button>
                            </div>
                        </div>

                        {lead.visualAnalysis && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-slideUp">
                                <div className="space-y-4">
                                    <div className="bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden shadow-2xl">
                                        <div className="p-4 border-b border-slate-800 bg-slate-800/50 flex justify-between items-center">
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Captura del Cliente</span>
                                            <span className="text-[10px] text-slate-500">Analizado por Gemini Vision</span>
                                        </div>
                                        <img src={lead.visualAnalysis.screenshot} alt="Visual Audit" className="w-full h-auto" />
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="bg-slate-900 border border-slate-700 p-6 rounded-3xl space-y-6">
                                        <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                                            <h5 className="text-white font-bold flex items-center gap-2"><SparklesIcon className="w-4 h-4 text-violet-400" /> Resultados del Análisis</h5>
                                            <div className="flex flex-col items-end">
                                                <span className="text-[10px] text-slate-500 uppercase font-black">Score Diseño</span>
                                                <span className={`text-2xl font-black ${lead.visualAnalysis.designScore > 70 ? 'text-emerald-400' : lead.visualAnalysis.designScore > 40 ? 'text-yellow-400' : 'text-red-400'}`}>{lead.visualAnalysis.designScore}</span>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div>
                                                <div className="text-[10px] text-slate-500 uppercase font-black mb-2 tracking-widest">Problemas de UX</div>
                                                <div className="flex flex-wrap gap-2">
                                                    {lead.visualAnalysis.uxIssues.map((issue, i) => (
                                                        <span key={i} className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1 rounded-full font-bold">{issue}</span>
                                                    ))}
                                                </div>
                                            </div>

                                            <div>
                                                <div className="text-[10px] text-slate-500 uppercase font-black mb-2 tracking-widest">Bloqueadores de Conversión</div>
                                                <div className="flex flex-wrap gap-2">
                                                    {lead.visualAnalysis.conversionBlockers.map((blocker, i) => (
                                                        <span key={i} className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1 rounded-full font-bold">{blocker}</span>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="p-4 bg-violet-500/5 border border-violet-500/10 rounded-2xl">
                                                <div className="text-[10px] text-violet-400 uppercase font-black mb-2 tracking-widest">Feedback Estratégico</div>
                                                <p className="text-xs text-slate-300 leading-relaxed italic">"{lead.visualAnalysis.aiFeedback}"</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'LINKEDIN' && (
                <div className="p-8 animate-fadeIn h-full flex flex-col">
                    <div className="max-w-3xl mx-auto w-full flex flex-col h-full space-y-4">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-[#0077b5]/10 rounded-lg">
                                    <LinkedInIcon className="w-5 h-5 text-[#0077b5]" />
                                </div>
                                <div>
                                    <h4 className="text-white font-bold">Mensaje de LinkedIn</h4>
                                    <p className="text-slate-500 text-xs">Personalizado para conectar con {lead.name}</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => handleCopyText(linkedinMsg, "Mensaje de LinkedIn")}
                                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                            >
                                <CopyIcon className="w-5 h-5" />
                            </button>
                        </div>
                        <textarea 
                            className="flex-1 w-full bg-slate-900 border border-slate-800 text-slate-200 p-6 rounded-3xl focus:outline-none focus:border-[#0077b5] transition-all resize-none leading-relaxed text-sm shadow-inner" 
                            value={linkedinMsg} 
                            onChange={e => handleLinkedinChange(e.target.value)} 
                            placeholder="Generando mensaje para LinkedIn..."
                        />
                        <div className="flex justify-end">
                             <p className="text-[10px] text-slate-500 font-medium italic">Los cambios se guardan automáticamente al escribir.</p>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'PHONE' && (
                <div className="p-8 animate-fadeIn h-full flex flex-col">
                    <div className="max-w-3xl mx-auto w-full flex flex-col h-full space-y-4">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-500/10 rounded-lg">
                                    <PhoneIcon className="w-5 h-5 text-emerald-400" />
                                </div>
                                <div>
                                    <h4 className="text-white font-bold">Script de Llamada</h4>
                                    <p className="text-slate-500 text-xs">Guion optimizado para una llamada en frío con {lead.name}</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => handleCopyText(phoneScript, "Script de llamada")}
                                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                            >
                                <CopyIcon className="w-5 h-5" />
                            </button>
                        </div>
                        <textarea 
                            className="flex-1 w-full bg-slate-900 border border-slate-800 text-slate-200 p-6 rounded-3xl focus:outline-none focus:border-emerald-500 transition-all resize-none leading-relaxed text-sm shadow-inner" 
                            value={phoneScript} 
                            onChange={e => {
                                setPhoneScript(e.target.value);
                                debouncedUpdate(lead.id, { outreach: { ...lead.outreach, phone: e.target.value } }, 'phone');
                            }} 
                            placeholder="Generando script de llamada..."
                        />
                    </div>
                </div>
            )}

            {activeTab === 'NOTES' && (
                <div className="p-8 animate-fadeIn h-full flex flex-col">
                    <div className="max-w-3xl mx-auto w-full flex flex-col h-full space-y-6">
                        <div className="flex flex-col gap-4">
                            <h4 className="text-white font-bold flex items-center gap-2"><ListIcon className="w-5 h-5 text-amber-400" /> Notas Internas</h4>
                            <div className="flex gap-2">
                                <input 
                                    value={newNote} 
                                    onChange={e => setNewNote(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleAddNote()}
                                    placeholder="Añadir una nota importante..."
                                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 transition-all"
                                />
                                <button onClick={handleAddNote} className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold transition-all">Añadir</button>
                            </div>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                            {(!lead.notes || lead.notes.length === 0) ? (
                                <div className="text-center py-12 text-slate-600 italic">No hay notas para este lead.</div>
                            ) : (
                                lead.notes.map(note => (
                                    <div key={note.id} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl relative group">
                                        <p className="text-slate-300 text-sm leading-relaxed">{note.content}</p>
                                        <div className="mt-2 text-[10px] text-slate-500 flex justify-between items-center">
                                            <span>{new Date(note.createdAt).toLocaleString()}</span>
                                            <button 
                                                onClick={() => onUpdate(lead.id, { notes: lead.notes?.filter(n => n.id !== note.id) })}
                                                className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-all"
                                            >
                                                <TrashIcon className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'REPLY' && (
                <div className="p-8 animate-fadeIn h-full flex flex-col overflow-y-auto">
                    <div className="max-w-3xl mx-auto w-full flex flex-col space-y-6">
                        <div className="flex flex-col gap-4">
                            <h4 className="text-white font-bold flex items-center gap-2"><MessageCircleIcon className="w-5 h-5 text-rose-400" /> Analizar Respuesta</h4>
                            <p className="text-xs text-slate-400">Pega la respuesta del cliente para analizar su sentimiento y obtener sugerencias sobre cómo continuar.</p>
                            
                            <textarea 
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="Pega aquí el correo de respuesta del cliente..."
                                className="w-full h-32 bg-slate-900 border border-slate-700 rounded-xl p-4 text-sm text-slate-200 focus:outline-none focus:border-rose-500 resize-none"
                            />
                            
                            <div className="flex justify-end">
                                <button 
                                    onClick={handleAnalyzeReply}
                                    disabled={isAnalyzingReply || !replyText.trim()}
                                    className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-xl font-bold flex items-center gap-2 transition-all"
                                >
                                    {isAnalyzingReply ? 'Analizando...' : <><SparklesIcon className="w-4 h-4" /> Analizar Sentimiento</>}
                                </button>
                            </div>
                        </div>

                        {lead.sentimentAnalysis && (
                            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 space-y-6 animate-slideUp">
                                <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                                    <h5 className="text-white font-bold">Resultado del Análisis</h5>
                                    <div className={`px-3 py-1 rounded-full text-xs font-bold border ${
                                        lead.sentimentAnalysis.sentiment === 'POSITIVE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                        lead.sentimentAnalysis.sentiment === 'NEGATIVE' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                        'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                    }`}>
                                        {lead.sentimentAnalysis.sentiment} ({lead.sentimentAnalysis.score}/100)
                                    </div>
                                </div>
                                
                                <div>
                                    <div className="text-[10px] text-slate-500 uppercase font-black mb-2 tracking-widest">Resumen</div>
                                    <p className="text-sm text-slate-300 leading-relaxed">{lead.sentimentAnalysis.summary}</p>
                                </div>
                                
                                <div className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-xl">
                                    <div className="text-[10px] text-rose-400 uppercase font-black mb-2 tracking-widest">Siguiente Paso Sugerido</div>
                                    <p className="text-sm text-slate-200 leading-relaxed font-medium">{lead.sentimentAnalysis.nextStep}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-slate-700 bg-slate-800/30 flex justify-between items-center gap-4">
             <button 
                onClick={handleCrmClick}
                disabled={isSyncingCrm || lead.crmSync?.status === 'SUCCESS'}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold text-xs transition-all border ${lead.crmSync?.status === 'SUCCESS' ? 'bg-emerald-900/20 text-emerald-400 border-emerald-500/30 cursor-default' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-600'}`}
             >
                 {isSyncingCrm ? 'Sincronizando...' : lead.crmSync?.status === 'SUCCESS' ? 'Sync Completado' : <><LightningIcon className="w-4 h-4 text-yellow-400" /> Exportar CRM</>}
             </button>

             <div className="flex gap-3 ml-auto">
                {activeTab === 'EMAIL' ? (
                    <button onClick={handleSendEmailBackend} disabled={isSending} className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-500/25 transition-transform active:scale-95 disabled:opacity-50">
                        {isSending ? 'Enviando...' : <><SendFillIcon className="w-4 h-4" /> Enviar por Email</>}
                    </button>
                ) : (
                    <button onClick={handleSimulateSend} disabled={isSending} className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-500/25 transition-transform active:scale-95 disabled:opacity-50">
                        {isSending ? 'Enviando...' : <><SendFillIcon className="w-4 h-4" /> Enviar Ahora</>}
                    </button>
                )}
             </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default OutreachModal;
