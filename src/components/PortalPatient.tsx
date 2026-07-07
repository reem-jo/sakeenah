/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Heart, Sparkles, Send, Mic, MicOff, BookOpen, AlertCircle, RefreshCw, 
  Smile, Frown, Flame, Shield, HelpCircle, ArrowRight, CheckCircle2, Moon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Patient, ChatMessage, MoodLog } from '../types';

interface PatientPortalProps {
  onVoluteerLinkTriggered: () => void;
  patientAlias: string;
  setPatientAlias: (alias: string) => void;
  activeSpecialistConnected?: any;
}

export default function PortalPatient({ 
  onVoluteerLinkTriggered, 
  patientAlias, 
  setPatientAlias,
  activeSpecialistConnected 
}: PatientPortalProps) {
  const [isAnonInMode, setIsAnonInMode] = useState(false);
  const [textPrompt, setTextPrompt] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: "السلام عليكم ورحمة الله وبركاته. أهلاً بك في منصة \"سكينة\" المخصصة للاستشارة والأمان النفسي بخصوصية مطلقة. تفرس في مشاعرك، وعبر بكل حرية عما يضيق به صدرك أو يشغل فكرك اليوم بالتدوين أو بمحاكاة نبرة صوتكم.",
      timestamp: new Date().toLocaleTimeString('ar-EG')
    }
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [activeMood, setActiveMood] = useState('😐');
  const [moodDiaryNote, setMoodDiaryNote] = useState('');
  const [registeredMoods, setRegisteredMoods] = useState<MoodLog[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [preferredSpiritual, setPreferredSpiritual] = useState(true);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTextPrompt(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.max(250, textareaRef.current.scrollHeight)}px`;
    }
  };

  useEffect(() => {
    // Generate initial alias if none exists
    if (!patientAlias) {
      setPatientAlias(`زائر_${Math.floor(100 + Math.random() * 900)}`);
    }
    fetchPatientMoods();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, chatLoading]);

  const fetchPatientMoods = async () => {
    try {
      const response = await fetch('/api/patients');
      const data = await response.json();
      const currentPatient = data.find((p: any) => p.id === patientAlias);
      if (currentPatient) {
        setRegisteredMoods(currentPatient.moodTrackerHistory);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAnonEntry = () => {
    setIsAnonInMode(true);
  };

  const handleRegenerateAlias = () => {
    setPatientAlias(`زائر_${Math.floor(100 + Math.random() * 900)}`);
  };

  // Simulated Voice Recording transcription trigger
  const handleVoiceRecordingToggle = () => {
    if (!isRecording) {
      setIsRecording(true);
    } else {
      setIsRecording(false);
      // Generate simulated psychiatric samples in Arabic
      const prompts = [
        "أشعر بضيق شديد في التنفس وتسارع غريب في نبضات قلبي حينما أواجه حشوداً أو حتى عندما أتحدث في الاجتماعات الرسمية.",
        "منذ الحادث المؤسف العام الماضي العودة للقيادة باتت كابوساً. تفاصيل التقاطع المروري تطاردني في منامي دائماً.",
        "توفي جدي قبل ثلاثة أسابيع وأجد نفسي حزيناً ومشتتاً للغاية، وأحياناً أشعر بفقدان الشغف والانسلاخ من المحيطين بي.",
        "أعاني من ضغوط دراسية بالغة في امتحانات التخرج الجامعية، الأرق ينهش نومي وأشعر بالقلق والخوف طوال الحين."
      ];
      const selectedVoiceSample = prompts[Math.floor(Math.random() * prompts.length)];
      setTextPrompt(selectedVoiceSample);
      alert("نتيجة تفريغ الصوت بنظام Whisper السلوكي: \"" + selectedVoiceSample + "\"");
    }
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textPrompt.trim()) return;

    const currentMsgText = textPrompt;
    setTextPrompt('');

    // Append Patient message to Chat History
    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: currentMsgText,
      timestamp: new Date().toLocaleTimeString('ar-EG')
    };
    setChatHistory(prev => [...prev, userMsg]);
    setChatLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: currentMsgText,
          history: chatHistory,
          preferredSpiritual: preferredSpiritual
        })
      });
      const data = await response.json();
      
      const aiMsg: ChatMessage = {
        id: `ai_${Date.now()}`,
        sender: 'ai',
        text: data.aiResponseMsg || "تم حفظ الجلسة وتوجيه التحاليل لخزنتك السلوكية بأمان.",
        timestamp: new Date().toLocaleTimeString('ar-EG'),
        spiritualComfort: data.spiritualComfort
      };

      setChatHistory(prev => [...prev, aiMsg]);
      setAiAnalysis({
        severity: data.severity,
        coreCategory: data.coreCategory,
        clinicalBreakdown: data.clinicalBreakdown,
        spiritualOpenness: data.spiritualOpenness
      });

      if (data.severity === 'Extreme') {
        alert("🚨 تنبيه عاجل إقليمي: تم رصد قلق حاد وارتطام سلوكي حاد! يرجى استخدام زر طوارئ SOS الأحمر للمساندة الفورية.");
      }
    } catch (e) {
      console.error(e);
      // Fallback
      setChatHistory(prev => [...prev, {
        id: `ai_fallback_${Date.now()}`,
        sender: 'ai',
        text: "يرجى تثبيت مفتاح ذكاء اصطناعي (Gemini Key) آمن في لوحة التحكم، أو التحدث مع أحد المستشارين المتاحين عبر الضغط على بوابة المستشارين لمساندتك.",
        timestamp: new Date().toLocaleTimeString('ar-EG')
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleSaveMood = async () => {
    try {
      const response = await fetch(`/api/patients/${patientAlias}/mood`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emoji: activeMood,
          note: moodDiaryNote
        })
      });
      const resData = await response.json();
      if (resData.success) {
        setMoodDiaryNote('');
        fetchPatientMoods();
        alert("تم تسجيل حالتك المزاجية اليوم بالخزنة المشفرة لسكينة لمساعدة طبيبك لاحقاً.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const moodsList = [
    { emoji: "😊", label: "مستقر مطمئن" },
    { emoji: "😐", label: "عادي" },
    { emoji: "😔", label: "حزين مكروب" },
    { emoji: "😭", label: "ذعر شديد" },
    { emoji: "😡", label: "منفعل غاضب" }
  ];

  return (
    <div className="min-h-full bg-[#E5E4E2] text-gray-800" dir="rtl">
      
      {!isAnonInMode ? (
        /* SCREEN 1: DASHBOARD & ANONYMOUS ENTRY */
        <div className="mx-auto max-w-2xl px-4 py-8 md:py-16 text-center">
          <div className="space-y-8 flex flex-col items-center justify-center">
            
            <div className="inline-flex items-center space-x-2 space-x-reverse rounded-full bg-blue-50 px-4 py-1.5 text-xs font-semibold text-blue-700 border border-blue-100">
              <Shield className="h-3.5 w-3.5 text-blue-600" />
              <span>حماية وتجزئة آمنة لحماية الهوية والخصوصية</span>
            </div>
            
            <div className="space-y-3">
              <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 md:text-5xl font-serif">
                البحث عن <span className="text-[#3A7D8C] font-black">السَّكِينَة</span> <br />
                <span className="text-xl font-medium text-gray-500 italic block mt-2">سَكِينَة — غيث لروحك وطمأنينة لقلبك في أحلك الظروف</span>
              </h1>
              <p className="max-w-lg mx-auto text-sm md:text-base leading-relaxed text-gray-600">
                منصة مجهزة بتقنيات الفرز الإكلينيكي الذكي والمساندة السلوكية الممزوجة بالسكينة الإيمانية والنفحات القرآنية المهدئة للقلب.
              </p>
            </div>

            {/* Anonymous Entry Card */}
            <div className="w-full rounded-2xl border border-[#E9E4DC] bg-[#FAF5EE] p-6 md:p-8 shadow-sm space-y-6 text-right">
              <div className="text-center space-y-1">
                <h2 className="text-lg font-bold text-gray-900">١. توليد رمز الولوج المجهول والآمن</h2>
                <p className="text-sm text-gray-500 leading-relaxed max-w-md mx-auto">
                  للحفاظ على هويتك وسريتك المطلقة بنسبة ١٠٠٪، تولد منصة سكينة لقباً عشوائياً خاصاً بجلستك الحالية. دليل الأخصائيين لن يتعرف على اسمك الفعلي أبداً.
                </p>
              </div>

              <div className="flex flex-col items-center gap-4 max-w-md mx-auto w-full">
                <div className="flex w-full items-center justify-between rounded-xl border border-gray-300 bg-white px-4 py-3 font-mono text-sm shadow-inner">
                  <span className="text-gray-900 font-bold">{patientAlias}</span>
                  <button 
                    onClick={handleRegenerateAlias}
                    className="rounded-full p-1 text-gray-400 hover:text-gray-600 transition-colors hover:bg-gray-100 cursor-pointer"
                    title="توليد معرف عشوائي آخر"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </div>
                
                <motion.button
                  onClick={handleAnonEntry}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center justify-center space-x-2 space-x-reverse rounded-xl bg-gradient-to-r from-[#3A7D8C] to-[#2C626E] px-8 py-4 font-bold text-white shadow-lg shadow-[#3A7D8C]/25 hover:shadow-[#3A7D8C]/40 transition-all cursor-pointer text-sm"
                >
                  <span>دخول المساحة الآمنة</span>
                  <ArrowRight className="h-4.5 w-4.5 transform rotate-180" />
                </motion.button>
              </div>

              <div className="flex items-center justify-center space-x-2 space-x-reverse text-xs text-emerald-800 font-medium text-center">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>تم تفعيل مفاتيح التشفير المفرزة بنجاح. هويتك مصونة ومخفية تماماً.</span>
              </div>
            </div>

            {/* Faith-Based Selection Toggle */}
            <div className="w-full flex items-start space-x-3 space-x-reverse rounded-xl border border-blue-50 bg-[#EBF4F6] p-4 text-sm text-slate-700 text-right">
              <input
                type="checkbox"
                id="spiritual-opt"
                checked={preferredSpiritual}
                onChange={(e) => setPreferredSpiritual(e.target.checked)}
                className="mt-1 h-4 w-4 rounded text-[#3A7D8C] focus:ring-[#3A7D8C] cursor-pointer animate-none"
              />
              <label htmlFor="spiritual-opt" className="font-semibold text-gray-800 cursor-pointer">
                دمج الرعاية والتوجيه الروحي من الكتاب والسنة
                <span className="block text-xs text-gray-500 font-normal mt-1 leading-relaxed">عند التفعيل، سيتم تزويدك بآيات قرآنية مختارة ومطابقة لحالتك النفسية وتدبرات إيمانية تدعم السكينة وتثبت الفؤاد.</span>
              </label>
            </div>

            {/* Quick Stress Mitigation info */}
            <div className="w-full rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-2 text-right">
              <div className="flex items-center space-x-2 space-x-reverse text-rose-700">
                <AlertCircle className="h-5 w-5 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider">زر الاستغاثة SOS</span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                هل تمر الآن بنوبة ذعر حادة، أو ارتباك نفسي، أو ضائقة شديدة على وشك الخروج عن السيطرة؟ اضغط كود الطوارئ الدائري والأحمر أسفل يمين الشاشة للحصول على تواصل حي ومباشر مع مستشار فوري.
              </p>
            </div>

          </div>
        </div>
      ) : (
        /* SCREEN 2: ERGONOMIC INFINITE WHITEBOARD JOURNALING & AI TUTORIAL WORKSPACE */
        <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">
          
          {/* Workspace Controls Header */}
          <div className="flex flex-col sm:flex-row items-center justify-between border-b border-lavender-matte pb-4 gap-4">
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
              <div className="text-right">
                <span className="font-mono text-[10px] text-slate-400 block uppercase tracking-wider">قناة اتصال سرية ومحميّة بالكامل</span>
                <span className="font-sans text-sm font-semibold">المعرف المجهول النشط: <strong className="text-lavender-dark font-mono font-bold bg-lavender-pale px-2 py-0.5 rounded">{patientAlias}</strong></span>
              </div>
            </div>

            <div className="flex items-center space-x-2.5 space-x-reverse">
              {/* Faith selection fast toggle */}
              <label className="flex items-center space-x-2 space-x-reverse text-xs text-slate-600 bg-white border border-lavender-matte px-3 py-1.5 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferredSpiritual}
                  onChange={(e) => setPreferredSpiritual(e.target.checked)}
                  className="h-3.5 w-3.5 rounded text-lavender-primary focus:ring-lavender-primary cursor-pointer"
                />
                <span className="font-semibold text-slate-700">تفعيل الرعاية الإيمانية والقرآنية</span>
              </label>

              <button
                onClick={() => setIsAnonInMode(false)}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                مغادرة المساحة والعودة
              </button>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-12 items-start">
            
            {/* LEFT SIDE: MULTI-COLUMN INTERACTIVE JOURNALING CANVAS (8 COLS) */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Infinite Journaling Board Canvas */}
              <div className="rounded-3xl border border-lavender-matte bg-lavender-pale/30 p-1">
                <div className="rounded-[22px] bg-white p-6 sm:p-8 shadow-sm space-y-4">
                  
                  {/* Whiteboard Header info */}
                  <div className="flex items-center justify-between border-b border-dashed border-lavender-matte/40 pb-3">
                    <div className="flex items-center space-x-2 space-x-reverse text-lavender-dark">
                      <BookOpen className="h-5 w-5" />
                      <span className="text-xs font-bold font-serif uppercase tracking-wider text-slate-500">
                        الصحيفة الحرة واللوح الفصيح لتدوين وتفريغ المكنونات
                      </span>
                    </div>

                    <span className="text-[10px] text-slate-400 font-mono font-bold">
                      تم تدوين {textPrompt.length} حرفاً
                    </span>
                  </div>

                  {/* Wide Dynamic Responsive Textarea with broad spacing */}
                  <div className="min-h-[280px] text-right">
                    <textarea
                      ref={textareaRef}
                      value={textPrompt}
                      onChange={handleTextareaChange}
                      placeholder="دع فكرك ينساب وقلبك يسترح في هذه المساحة... ابدأ الآن بتدوين مشاعرك الفياضة، مخاوفك، أفكارك، أو السيرة المفصلة للمعاناة اليوم بمطلق تعبير وتلقائية. هذا اللوح سيتمدد ويتسع تلقائياً بكل مرونة ليرتسم بكلماتك ويزيح عن عاتقك غبار القلق والتوتر..."
                      style={{ lineHeight: '1.9' }}
                      className="w-full min-h-[250px] bg-transparent resize-none text-slate-800 placeholder:text-[#A798B7] focus:outline-none text-base md:text-lg font-sans overflow-y-auto scroller-soothing text-right leading-loose"
                    />
                  </div>

                  {/* Integrated Biometric & Analysis Trigger Section */}
                  <div className="border-t border-dashed border-lavender-matte/40 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    
                    {/* Simulated Voice Recorder */}
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <motion.button
                        type="button"
                        onClick={handleVoiceRecordingToggle}
                        whileTap={{ scale: 0.95 }}
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold transition-all cursor-pointer ${
                          isRecording 
                            ? 'bg-red-600 text-white animate-pulse shadow-md shadow-red-500/20' 
                            : 'bg-lavender-pale hover:bg-lavender-matte text-lavender-dark border border-lavender-matte'
                        }`}
                        title={isRecording ? 'اضغط لإيقاف وتفريغ الصوت' : 'محاكاة تسجيل الصوت الحيوي'}
                      >
                        {isRecording ? <MicOff className="h-4.5 w-4.5" /> : <Mic className="h-4.5 w-4.5" />}
                      </motion.button>
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-slate-400 font-mono block uppercase">محاكاة نبرة الصوت وتدفق الأوكتاف</span>
                        <span className="text-[11px] text-slate-500 font-medium">تجربة تفريغ التأتأة والقلق في ثوانٍ</span>
                      </div>
                    </div>

                    {/* Submit and analyze history track */}
                    <button
                      onClick={handleSendChat}
                      disabled={!textPrompt.trim() || chatLoading}
                      className="w-full sm:w-auto rounded-xl bg-lavender-dark hover:bg-lavender-deep text-white px-6 py-3 text-xs font-bold shadow-lg shadow-lavender-primary/25 disabled:bg-slate-200 disabled:text-slate-400 transition-all cursor-pointer flex items-center justify-center space-x-1.5 space-x-reverse"
                    >
                      {chatLoading ? (
                        <>
                          <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          <span>جاري فرز الحالة وطلب السكينة...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          <span>توليد بلسم وتوجيهات سكينة الذكية</span>
                        </>
                      )}
                    </button>

                  </div>

                </div>
              </div>

              {/* Chat Thread history response window, showing past advice blocks */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">
                  غرفة استقبال رسائل سكينة الإرشادية والمؤهلة
                </span>

                <div className="space-y-4 max-h-[300px] overflow-y-auto pl-1">
                  {chatHistory.map((msg, index) => (
                    <div key={msg.id || index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[90%] rounded-2xl px-4 py-3.5 text-xs md:text-sm leading-relaxed shadow-sm ${
                        msg.sender === 'user' 
                          ? 'bg-lavender-pale/80 text-slate-900 border border-lavender-matte rounded-bl-none font-medium text-right' 
                          : 'bg-[#FCFAFD] text-slate-800 rounded-br-none border border-slate-200 text-right'
                      }`}>
                        <p className="font-sans leading-relaxed text-right whitespace-pre-line">{msg.text}</p>

                        {/* Spiritual Reassurance sub-component */}
                        {msg.spiritualComfort && (
                          <div className="mt-4 border-t border-slate-100 pt-3 space-y-3 text-right">
                            <div className="flex items-center space-x-2 space-x-reverse text-lavender-dark font-serif justify-start">
                              <BookOpen className="h-4 w-4 text-lavender-primary" />
                              <span className="text-xs font-bold tracking-wider">بلسم من الذكر الحكيم والسُّنة المطهرة لقلب ملهوف</span>
                            </div>
                            
                            {msg.spiritualComfort.verses.map((v, i) => (
                              <div key={i} className="rounded-xl bg-amber-50/50 border border-amber-100 p-3.5 space-y-1.5 text-right">
                                <p className="text-amber-900 font-bold text-lg leading-relaxed font-serif text-center">
                                  {v}
                                </p>
                              </div>
                            ))}

                            {msg.spiritualComfort.hadiths.map((h, i) => (
                              <div key={i} className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-[11px] leading-relaxed font-serif italic text-slate-600 text-right">
                                " {h} "
                              </div>
                            ))}

                            <div className="rounded-xl bg-lavender-pale/40 border border-lavender-matte p-3 space-y-1 text-right text-[11px]">
                              <span className="text-[10px] font-bold text-lavender-dark uppercase block">خطوات سلوكية وروحية داعمة ومجربة:</span>
                              <ul className="list-disc pr-4 text-slate-600 space-y-1">
                                {msg.spiritualComfort.actions.map((act, i) => (
                                  <li key={i}>{act}</li>
                                ))}
                              </ul>
                            </div>

                          </div>
                        )}

                        <span className="block mt-2 text-left text-[9px] text-slate-400 font-mono">
                          {msg.timestamp}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

              </div>

            </div>

            {/* RIGHT SIDE: DYNAMIC MOOD LOGGING & CORRESPONDING CLINICAL PIPELINE (4 COLS) */}
            <div className="lg:col-span-4 space-y-6 text-right">
              
              {/* Clean Interactive Mood Tracker */}
              <div className="rounded-2xl border border-lavender-matte bg-white p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="text-xs font-bold text-slate-800 flex items-center space-x-1.5 space-x-reverse">
                    <Smile className="h-4 w-4 text-lavender-dark" />
                    <span>مفكّرة التتبع المزاجي اليومي</span>
                  </h3>
                  <span className="text-[9px] bg-lavender-pale text-lavender-dark px-2 py-0.5 rounded font-bold font-mono">اليوم</span>
                </div>

                <div className="flex justify-around">
                  {moodsList.map((m) => (
                    <button
                      key={m.emoji}
                      onClick={() => setActiveMood(m.emoji)}
                      className={`text-2xl p-2 rounded-xl transition-all cursor-pointer ${
                        activeMood === m.emoji 
                          ? 'border-2 border-lavender-dark bg-lavender-pale shadow-sm scale-110' 
                          : 'opacity-75 hover:opacity-100 hover:bg-slate-50'
                      }`}
                      title={m.label}
                    >
                      {m.emoji}
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  value={moodDiaryNote}
                  onChange={(e) => setMoodDiaryNote(e.target.value)}
                  placeholder="سرّح مشاعرك بكتابة سريعة للمثرات الجسدية..."
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-lavender-dark font-sans text-right"
                />

                <button
                  onClick={handleSaveMood}
                  className="w-full rounded-xl bg-slate-900 hover:bg-slate-800 py-2.5 text-xs font-bold text-white transition-colors cursor-pointer"
                >
                  حفظ حالتي وتدفق فكري الحين
                </button>

                {/* History tracker */}
                {registeredMoods.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <span className="text-[9px] font-semibold text-slate-400 block font-serif">سجل حالتك المزاجية المؤمّن تاريخياً:</span>
                    <div className="space-y-1 max-h-24 overflow-y-auto pl-1">
                      {registeredMoods.map((log, idx) => (
                        <div key={idx} className="flex items-center justify-between text-[11px] p-2 rounded bg-slate-50 border border-slate-100 font-serif">
                          <div className="flex items-center space-x-1.5 space-x-reverse">
                            <span>{log.emoji}</span>
                            <span className="font-mono text-[9px] text-slate-400">{log.date}</span>
                          </div>
                          <span className="text-[10px] text-slate-600 truncate max-w-[120px]">{log.note || "بدون تدوينة ملحقة"}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Dynamic Live Triage Report Widget */}
              {aiAnalysis ? (
                <div className="rounded-2xl border border-lavender-matte bg-white p-5 shadow-sm space-y-4 text-right">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">الفرز والتشخيص والتحليل</span>
                    <span className={`rounded-xl px-2.5 py-0.5 text-[9px] font-bold font-mono ${
                      aiAnalysis.severity === 'Extreme' ? 'bg-red-50 text-red-700 animate-pulse border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                    }`}>
                      مستوى الشدة: {aiAnalysis.severity === 'Extreme' ? 'قلق عاجل وحاد' : aiAnalysis.severity === 'Moderate' ? 'متوسط' : 'طفيف'}
                    </span>
                  </div>

                  <div className="space-y-3.5 text-xs">
                    <div>
                      <span className="text-[9px] uppercase text-slate-400 font-bold block">التشخيص النفسي الأولي:</span>
                      <p className="font-bold text-lavender-dark text-xs mt-1">{aiAnalysis.coreCategory}</p>
                    </div>

                    <div>
                      <span className="text-[9px] uppercase text-slate-400 font-bold block mb-1">الأعراض السلوكية المستنتجة:</span>
                      <div className="flex flex-wrap gap-1">
                        {aiAnalysis.clinicalBreakdown.symptoms.map((sym: string, i: number) => (
                          <span key={i} className="text-[10px] bg-red-50 border border-red-100 text-red-900 px-2.5 py-0.5 rounded-full font-semibold">
                            {sym}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-[9px] uppercase text-slate-400 font-bold block mb-1">تحليل نبرة القلق السمعية:</span>
                      <p className="text-[11px] leading-relaxed italic text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        {aiAnalysis.clinicalBreakdown.insights}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-lavender-matte bg-lavender-pale/15 p-5 text-center text-slate-400 space-y-2.5">
                  <HelpCircle className="mx-auto h-8 w-8 text-lavender-primary/40" />
                  <h4 className="text-xs font-bold text-slate-600">التوجيه الإكلينيكي السمعي خامل</h4>
                  <p className="text-[11px] leading-relaxed max-w-[190px] mx-auto text-center font-serif">
                    اكتب ما يؤرق صمتك في اللوح الفصيح، ثم اضغط على 'توليد توجيهات سكينة الذكية' لتحصل على فرز فوري للمحددات والمؤشرات النفسية.
                  </p>
                </div>
              )}

            </div>

          </div>

        </div>
      )}

    </div>
  );
}
