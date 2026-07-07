/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend
} from 'recharts';
import { 
  FileText, Activity, ShieldAlert, Sparkles, MessageSquare, Clipboard, ArrowLeft, 
  Check, Play, Pause, Save, Calendar, Clock, Lock
} from 'lucide-react';
import { CaseFile } from '../types';

interface DoctorDashboardProps {
  unlockedCase: CaseFile;
  onBackToRegistry: () => void;
}

export default function PortalDoctorDashboard({ unlockedCase, onBackToRegistry }: DoctorDashboardProps) {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [sessionNotes, setSessionNotes] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  const payload = unlockedCase.aiSentimentPayload;

  // Render distress metrics in chart format (translated names)
  const chartData = [
    { name: 'مستوى القلق والتوتر', score: payload?.anxietyLevel || 50, color: '#DC2626' },
    { name: 'مؤشرات الحزن والانفصال', score: payload?.depressiveMarkers || 50, color: '#2563EB' },
    { name: 'مستوى الانفعال والتهيج', score: payload?.agitationIndex || 50, color: '#D97706' }
  ];

  // Radar data format (translated subjects)
  const radarData = [
    { subject: 'رعشة الصوت', A: payload?.anxietyLevel || 50, fullMark: 100 },
    { subject: 'طول السكتات', A: payload?.depressiveMarkers || 50, fullMark: 100 },
    { subject: 'سرعة الكلمات', A: payload?.agitationIndex || 50, fullMark: 100 },
    { subject: 'تردد النبرة', A: Math.max(10, (payload?.anxietyLevel || 50) - 15), fullMark: 100 },
    { subject: 'رتابة الصوت', A: Math.max(10, (payload?.depressiveMarkers || 50) + 12), fullMark: 100 }
  ];

  const handleUpdateNotes = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 text-right" dir="rtl">
      
      {/* Return header */}
      <div className="mb-6 flex flex-col sm:flex-row items-center justify-between border-b border-gray-200 pb-4 gap-3">
        <div className="flex items-center space-x-3 space-x-reverse justify-start">
          <button 
            onClick={onBackToRegistry}
            className="rounded-lg border border-gray-300 p-2 text-gray-600 hover:bg-gray-100 cursor-pointer transition-colors"
            title="العودة لسجل الحالات"
          >
            <ArrowLeft className="h-5 w-5 transform rotate-180" />
          </button>
          <div>
            <span className="text-xs bg-red-100 text-red-900 border border-red-200 px-2.5 py-1 rounded font-bold uppercase tracking-wider font-mono ml-2">
              🔒 تم فك تشفير دوسيه الخزنة المزدوجة بنجاح
            </span>
            <h1 className="text-2xl font-bold text-gray-900 font-serif">
               ملف الحالة رقم: <span className="font-mono">{unlockedCase.id}</span> — {unlockedCase.patientAlias}
            </h1>
          </div>
        </div>

        <button 
          onClick={onBackToRegistry}
          className="rounded-xl bg-gray-950 text-white px-4 py-2 text-xs font-bold hover:bg-gray-800 transition-colors cursor-pointer flex items-center space-x-1.5 space-x-reverse"
        >
          <Lock className="h-3.5 w-3.5" />
          <span>تأمين وقفل الدوسيه</span>
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-12 text-right">
        
        {/* Left Column: Clinical History Block (7 cols) */}
        <div className="md:col-span-7 space-y-6">
          
          {/* Clinical History Text Block */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-5">
            <div className="flex items-center space-x-2 space-x-reverse text-[#3A7D8C] border-b border-gray-100 pb-3 justify-start">
              <FileText className="h-5.5 w-5.5" />
              <h3 className="text-base font-bold text-gray-950 font-serif">السجل الإلكتروني الموحد للاستشارات السلوكية (EMHR)</h3>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 text-xs text-right">
              <div className="rounded-xl bg-slate-50 p-3 border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold text-gray-400 block uppercase font-serif">الشكوى والمظاهر الأساسية</span>
                <p className="font-black text-gray-950 mt-1">{unlockedCase.chiefComplaint === 'Panic' ? 'نوبة فزع حاد' : unlockedCase.chiefComplaint === 'Anxiety' ? 'قلق وتوتر دراسي' : unlockedCase.chiefComplaint === 'Grief' ? 'حزن وصدمة حادة' : 'أرق مزمن وضغوط'}</p>
              </div>

              <div className="rounded-xl bg-slate-50 p-3 border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold text-gray-400 block uppercase font-serif">مدة الحالة والمعاناة</span>
                <p className="font-semibold text-gray-950 mt-1">{unlockedCase.duration}</p>
              </div>

              <div className="rounded-xl bg-slate-50 p-3 border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold text-gray-400 block uppercase font-serif">تاريخ التدوين والتسجيل</span>
                <p className="font-semibold text-gray-950 mt-1 font-mono">
                  {new Date(unlockedCase.createdAt).toLocaleDateString('ar-EG')}
                </p>
              </div>
            </div>

            {/* Identified Symptoms */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-gray-500 block tracking-wider font-serif">
                الأعراض والمؤشرات النفسية المستنتجة:
              </span>
              <div className="flex flex-wrap gap-2 justify-start">
                {unlockedCase.identifiedSymptoms.map((sym, idx) => (
                  <span 
                    key={idx} 
                    className="rounded-full bg-red-50 border border-red-100 text-red-800 px-3 py-1 text-xs font-semibold"
                  >
                    {sym}
                  </span>
                ))}
              </div>
            </div>

            {/* Transcription text */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-gray-500 tracking-wider">
                <span>تفريغ محادثة نبرة المريض (عبر خوارزمية Whisper السمعية)</span>
                <span className="text-emerald-700 font-semibold flex items-center space-x-1 space-x-reverse"><span>● مفكوك تشفيرها</span></span>
              </div>
              
              <div className="rounded-2xl border border-gray-200 bg-gray-50/50 p-4 relative text-right">
                
                {/* Audio player simulator */}
                <div className="flex items-center space-x-3 space-x-reverse mb-3 border-b border-gray-200 pb-2.5 justify-start">
                  <button 
                    onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-[#3A7D8C] text-white hover:bg-[#2C626E] transition-all cursor-pointer"
                  >
                    {isPlayingAudio ? <Pause className="h-4.5 w-4.5" /> : <Play className="h-4.5 w-4.5 fill-current mr-0.5" />}
                  </button>
                  <span className="text-[11px] font-medium font-mono text-gray-500">
                    {isPlayingAudio ? "جاري بث نبرة المريض الصوتية وتحليل الأوكتافات (24kHz)..." : "محاكاة الاستماع للتسجيل الصوتي لنبرة المريض"}
                  </span>
                </div>

                <p className="text-xs text-gray-800 leading-relaxed font-sans italic text-right">
                  " {unlockedCase.aiTranscriptionText} "
                </p>
              </div>
            </div>

            {/* Clinic Action Log */}
            <div className="space-y-2.5 text-right">
              <label className="text-[11px] font-bold text-gray-500 block tracking-wider">
                ملاحظات الطبيب / الأخصائي السريّة وتوصيات خطة التعافي:
              </label>
              <textarea
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                placeholder="دوّن الملاحظات العيادية، التشخيصية، المؤثرات التي لاحظتها، والخطوات التعديلية لمساعدتها في جلسات المريض القادمة..."
                rows={3}
                className="w-full rounded-2xl border border-gray-300 p-3 text-xs text-gray-950 focus:outline-[#3A7D8C] text-right"
              />
              <button
                onClick={handleUpdateNotes}
                className="w-full rounded-xl bg-gray-950 hover:bg-gray-900 py-3 text-xs font-bold text-white flex items-center justify-center space-x-1 space-x-reverse shadow transition-colors cursor-pointer"
              >
                {isSaved ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-500" />
                    <span>تم حفظ ملاحظات المعالجة وتحديث الدوسيه بنجاح!</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>حفظ وتحديث ملاحظات الجلسة بالملف الموحد</span>
                  </>
                )}
              </button>
            </div>

          </div>

        </div>

        {/* Right Column: Emotional Distress Radar & AI insights (5 cols) */}
        <div className="md:col-span-5 space-y-6">
          
          {/* Audio & Semantic Analysis Panel */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-5 text-right">
            <div className="flex items-center space-x-2 space-x-reverse text-[#3A7D8C] border-b border-gray-100 pb-3 justify-start">
              <Activity className="h-5.5 w-5.5" />
              <h3 className="text-base font-bold text-gray-950 font-serif font-serif">رادار تحليل النبرات السلوكية والاضطراب</h3>
            </div>

            {/* Radar distress breakdown */}
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid stroke="#E2E8F0" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#475569' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 8 }} />
                  <Radar 
                    name="متجهات الضيق والنبرة" 
                    dataKey="A" 
                    stroke="#3A7D8C" 
                    fill="#3A7D8C" 
                    fillOpacity={0.4} 
                  />
                  <Tooltip formatter={(value) => [`${value}%`, 'Score']} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Progress breakdown representation */}
            <div className="space-y-3 pt-2 text-right">
              <span className="text-[10px] font-bold text-gray-400 tracking-wider block">
                مقياس شدة الأعراض والخلل السلوكي اللغوي:
              </span>

              {chartData.map((d) => (
                <div key={d.name} className="space-y-1">
                  <div className="flex justify-between text-xs font-sans">
                    <span className="font-semibold text-gray-700">{d.name}</span>
                    <span className="font-mono font-bold" style={{ color: d.color }}>{d.score}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div 
                      className="h-full rounded-full animate-pulse" 
                      style={{ width: `${d.score}%`, backgroundColor: d.color }} 
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* AI Clinical Insights text box */}
            <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 space-y-2 text-right">
              <div className="flex items-center space-x-1.5 space-x-reverse text-xs font-bold text-slate-800 justify-start">
                <Sparkles className="h-4.5 w-4.5 text-[#3A7D8C]" />
                <span>رأي وتحليلات محرك سكينة المعرفي الفوري (AI):</span>
              </div>
              <p className="text-[11px] leading-relaxed text-gray-600 font-sans italic text-right whitespace-pre-line">
                "{payload?.clinicalInsights}"
              </p>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
