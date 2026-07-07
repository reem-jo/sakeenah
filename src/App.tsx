/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Heart, Shield, User, Clipboard, UserCheck, Activity, Moon, HelpCircle, 
  Home, Lock, ShieldAlert, Sparkles, BookOpen, Layers, Users, Baby, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import PortalPatient from './components/PortalPatient';
import PortalProvider from './components/PortalProvider';
import PortalParents from './components/PortalParents';
import PortalDoctorDashboard from './components/PortalDoctorDashboard';
import PortalDoctorCabinet from './components/PortalDoctorCabinet';
import SOSSafetyNet from './components/SOSSafetyNet';
import { Specialist, CaseFile } from './types';

export default function App() {
  const [activePortal, setActivePortal] = useState<'splash' | 'gateway' | 'patient' | 'counselor' | 'psychiatrist' | 'parents' | 'dashboard'>('splash');
  const [patientAlias, setPatientAlias] = useState('');
  const [unlockedCase, setUnlockedCase] = useState<CaseFile | null>(null);
  
  // Simulated connected specialist after SOS activates
  const [sosMatchedSpecialist, setSosMatchedSpecialist] = useState<Specialist | null>(null);

  const handleCaseUnlocked = (caseDetails: CaseFile) => {
    setUnlockedCase(caseDetails);
    setActivePortal('dashboard');
  };

  const handleSOSActivated = (specialist: Specialist) => {
    setSosMatchedSpecialist(specialist);
  };

  // Helper to change portal state smoothly
  const navigateTo = (portal: typeof activePortal) => {
    if (portal !== 'dashboard') {
      setUnlockedCase(null);
    }
    setActivePortal(portal);
  };

  return (
    <div className="min-h-screen bg-[#E5E4E2] flex flex-col font-sans transition-colors duration-300" dir="rtl">
      
      {/* Dynamic Global Compliance Alert Bar with Arabic */}
      <div className="bg-lavender-pale/80 border-b border-lavender-matte text-lavender-dark text-center py-2 px-4 text-[10px] md:text-[11px] font-bold tracking-wide font-mono flex items-center justify-center space-x-2 space-x-reverse shrink-0">
        <Shield className="h-4 w-4 text-lavender-primary" />
        <span className="uppercase font-serif">نظام آمن للحماية والخصوصية // الهوية مخفية تماماً — للإستخدام التجريبي</span>
      </div>

      {/* Main Elegant Header Navigation Wrapper with Lavender glassmorphism */}
      <header className="bg-white/80 backdrop-blur-md border-b border-lavender-matte sticky top-0 z-40 px-6 py-4 flex flex-col xl:flex-row items-center justify-between gap-4">
        
        {/* Brand identity typography */}
        <div className="flex items-center space-x-3 space-x-reverse cursor-pointer" onClick={() => navigateTo('splash')}>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-lavender-primary to-lavender-dark text-white shadow-md shadow-lavender-primary/35">
            <Heart className="h-6 w-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-baseline space-x-1.5 space-x-reverse">
              <span className="text-xl font-black text-slate-900 tracking-tight font-serif uppercase">سَكِينَة</span>
              <span className="text-xs font-semibold text-lavender-dark font-mono italic">Sakeenah</span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono tracking-wider">منصة الرعاية النفسية والتربوية المدعومة بالذكاء الاصطناعي</p>
          </div>
        </div>

        {/* Global tab controllers / Quick Navigation Keys in Arabic */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 bg-white p-1.5 rounded-2xl border border-gray-200 shadow-sm">
          
          <button
            onClick={() => navigateTo('splash')}
            className={`flex items-center space-x-1 space-x-reverse px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer border ${
              activePortal === 'splash'
                ? 'bg-[#E5E4E2] text-slate-900 border-slate-400 shadow-sm'
                : 'bg-[#E5E4E2]/40 text-slate-600 border-transparent hover:bg-[#E5E4E2] hover:text-slate-800'
            }`}
            title="شاشة البداية"
          >
            <Home className="h-3.5 w-3.5" />
            <span>البداية</span>
          </button>

          <button
            onClick={() => navigateTo('gateway')}
            className={`flex items-center space-x-1 space-x-reverse px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer border ${
              activePortal === 'gateway'
                ? 'bg-[#E5E4E2] text-slate-900 border-slate-400 shadow-sm'
                : 'bg-[#E5E4E2]/40 text-slate-600 border-transparent hover:bg-[#E5E4E2] hover:text-slate-800'
            }`}
            title="بوابات الوصول"
          >
            <Layers className="h-3.5 w-3.5" />
            <span>بوابات الوصول</span>
          </button>

          <span className="h-5 w-[1px] bg-gray-200 mx-1 hidden md:block" />

          {/* Patient Button */}
          <button
            onClick={() => navigateTo('patient')}
            className={`flex items-center space-x-1.5 space-x-reverse px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer border ${
              activePortal === 'patient'
                ? 'bg-[#E5E4E2] text-[#3A7D8C] border-[#3A7D8C] shadow-sm'
                : 'bg-[#E5E4E2]/40 text-slate-600 border-transparent hover:bg-[#E5E4E2] hover:text-[#3A7D8C]'
            }`}
            title="المساحة الآمنة للمريض"
          >
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>بوابة المريض</span>
          </button>

          {/* Counselor Button */}
          <button
            onClick={() => navigateTo('counselor')}
            className={`flex items-center space-x-1 space-x-reverse px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer border ${
              activePortal === 'counselor'
                ? 'bg-[#E5E4E2] text-[#3A7D8C] border-[#3A7D8C] shadow-sm'
                : 'bg-[#E5E4E2]/40 text-slate-600 border-transparent hover:bg-[#E5E4E2] hover:text-[#3A7D8C]'
            }`}
            title="دليل مستشاري السلوك"
          >
            <UserCheck className="h-3.5 w-3.5" />
            <span>بوابة المستشار</span>
          </button>

          {/* Psychiatrist Button */}
          <button
            onClick={() => navigateTo('psychiatrist')}
            className={`flex items-center space-x-1 space-x-reverse px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer border ${
              activePortal === 'psychiatrist'
                ? 'bg-[#E5E4E2] text-[#3A7D8C] border-[#3A7D8C] shadow-sm'
                : 'bg-[#E5E4E2]/40 text-slate-600 border-transparent hover:bg-[#E5E4E2] hover:text-[#3A7D8C]'
            }`}
            title="الملفات الإكلينيكية للأطباء"
          >
            <Lock className="h-3.5 w-3.5" />
            <span>بوابة الطبيب</span>
          </button>

          {/* Parent Button */}
          <button
            onClick={() => navigateTo('parents')}
            className={`flex items-center space-x-1 space-x-reverse px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer border ${
              activePortal === 'parents'
                ? 'bg-[#E5E4E2] text-[#3A7D8C] border-[#3A7D8C] shadow-sm'
                : 'bg-[#E5E4E2]/40 text-slate-600 border-transparent hover:bg-[#E5E4E2] hover:text-[#3A7D8C]'
            }`}
            title="مستشار أولياء الأمور والأسرة"
          >
            <Baby className="h-3.5 w-3.5" />
            <span>بوابة الوالدين</span>
          </button>

          {unlockedCase && (
            <button
              onClick={() => navigateTo('dashboard')}
              className={`flex items-center space-x-1 space-x-reverse px-3.5 py-2 text-xs font-bold rounded-xl animate-bounce transition-all cursor-pointer bg-red-600 text-white shadow`}
            >
              <Activity className="h-4 w-4 animate-spin" />
              <span>الملف مفكوك التشفير / لوحة الطبيب</span>
            </button>
          )}

        </div>

      </header>

      {/* Main Core Container */}
      <main className="flex-1 w-full overflow-y-auto">
        
        <AnimatePresence mode="wait">
          
          {/* Welcome / Splash Screen */}
          {activePortal === 'splash' && (
            <motion.div
              key="splash-screen"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="flex items-center justify-center py-12 px-4 min-h-[750px]"
            >
              <div className="max-w-2xl w-full text-center space-y-8 bg-white border border-lavender-matte rounded-[36px] p-8 md:p-12 shadow-xl shadow-lavender-primary/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-full h-2 bg-gradient-to-r from-lavender-primary via-lavender-dark to-lavender-matte" />
                
                {/* Circular Radiating Peace Logo */}
                <div className="flex justify-center">
                  <div className="relative">
                    {/* Echoing animation rings */}
                    <div className="absolute inset-0 rounded-full bg-lavender-primary/10 animate-ping" />
                    <div className="absolute -inset-4 rounded-full bg-lavender-matte/20 animate-pulse [animation-duration:3s]" />
                    
                    <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-tr from-lavender-primary to-lavender-dark text-white shadow-lg shadow-lavender-dark/30">
                      <Heart className="h-12 w-12 stroke-[1.8]" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight font-serif uppercase">
                    منصة سَكِينَة <span className="text-lavender-dark text-2xl md:text-3xl block mt-2 font-mono italic">Sakeenah Platform</span>
                  </h1>
                  <p className="text-xs font-bold font-mono tracking-widest text-lavender-primary uppercase">
                    مساحة تكنولوجية آمنة للطمأنينة والتوازن النفسي والتربوي برعاية مجهولة تماماً
                  </p>
                </div>

                {/* Welcoming message */}
                <div className="space-y-4 max-w-lg mx-auto py-4 border-y border-dashed border-slate-100">
                  <p className="text-xl md:text-2xl font-serif text-slate-800 leading-relaxed font-semibold">
                    "مرحباً بك في مساحتك الآمنة. نحن هنا للاستماع إليك بخصوصية تامة وبدون أي أحكام."
                  </p>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    نصون أمان سرائركم بنظم تشفير كاملة وخدمات توجيه سلوكي ونفسي إيمانية هادفة، لمساعدتكم ومساندتكم في مواجهة الصدمات والضغوطات اليومية.
                  </p>
                </div>

                {/* Start Journey Now Button with gorgeous Lavender glow */}
                <div className="pt-4">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigateTo('gateway')}
                    className="inline-flex items-center space-x-3 space-x-reverse rounded-2xl bg-gradient-to-r from-lavender-dark to-lavender-primary text-white font-bold text-base px-8 py-4 shadow-lg shadow-lavender-primary/30 transition-all hover:brightness-105 cursor-pointer"
                  >
                    <span>ابدأ رحلتك للتعافي والراحة الآن</span>
                    <ChevronRight className="h-5 w-5 transform rotate-180" />
                  </motion.button>
                </div>

                {/* Secure Badge */}
                <p className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">
                  🔒 حماية وتشفير متكامل لخزائن الملفات // الهوية مجهولة بالكامل بدون أي أثر رقمي
                </p>

              </div>
            </motion.div>
          )}

          {/* The Gateway / Selection Screen (4 portals) */}
          {activePortal === 'gateway' && (
            <motion.div
              key="gateway-screen"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-6xl mx-auto px-6 py-12 space-y-10"
            >
              
              {/* Elegant header */}
              <div className="text-center space-y-3">
                <span className="text-xs bg-lavender-pale border border-lavender-matte text-lavender-dark font-bold font-serif uppercase px-3 py-1 rounded-full">
                  بوابات النفاذ والاستشارة لمجتمع سكينة الداعم
                </span>
                <h2 className="text-3xl md:text-4xl font-serif font-black text-slate-900 leading-tight">
                  اختر <span className="text-lavender-dark">بوابة الوصول المخصصة لك</span>
                </h2>
                <p className="text-slate-500 text-xs md:text-sm max-w-xl mx-auto font-medium">
                  نحن نوفر مستويات متعددة من النفاذ لحماية خصوصيتك ولتنظيم كابلات الدعم النفسي والإرشاد الأسري الفعال.
                </p>
              </div>

              {/* 4 Cards Layout */}
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 pt-4">
                
                {/* 1. Patient Portal Card */}
                <motion.div 
                  whileHover={{ y: -6 }}
                  className="rounded-3xl border border-lavender-matte bg-white p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all h-[360px]"
                >
                  <div className="space-y-4">
                    <div className="h-12 w-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                      <span className="text-2xl">🧘‍♀️</span>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-lg font-bold text-slate-900 font-serif flex items-center justify-between">
                        <span>بوابة المريض</span>
                        <span className="text-xs text-lavender-dark font-serif font-mono">Patient</span>
                      </h3>
                      <p className="text-xs leading-relaxed text-slate-500">
                        مساحة تعبير آمنة ومجهولة لكتابة ما يثقل صدرك. ابدأ المحادثة فوراً واحصل على فرز ذكي وتشخيص روحي كلينيكي فوري.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => navigateTo('patient')}
                    className="w-full text-center rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white py-2.5 text-xs font-bold transition-all shadow-sm cursor-pointer"
                  >
                    دخول مساحة المريض
                  </button>
                </motion.div>

                {/* 2. Counselor Portal Card */}
                <motion.div 
                  whileHover={{ y: -6 }}
                  className="rounded-3xl border border-lavender-matte bg-white p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all h-[360px]"
                >
                  <div className="space-y-4">
                    <div className="h-12 w-12 rounded-2xl bg-lavender-pale border border-lavender-matte flex items-center justify-center text-lavender-dark">
                      <span className="text-2xl">🤝</span>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-lg font-bold text-slate-900 font-serif flex items-center justify-between">
                        <span>قائمة المستشارين</span>
                        <span className="text-xs text-lavender-dark font-serif font-mono">Counselors</span>
                      </h3>
                      <p className="text-xs leading-relaxed text-slate-500">
                        استعرض دليل مستشاري السلوك المتطوعين، واطلع على جداول العمل اليومية، أو تقدم بطلب توثيق شهاداتك للانضمام لفريقنا الروحاني والسلوكي.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => navigateTo('counselor')}
                    className="w-full text-center rounded-xl bg-gradient-to-r from-lavender-dark to-lavender-primary text-white py-2.5 text-xs font-bold transition-all shadow-sm cursor-pointer"
                  >
                    تصفح دليل المستشارين
                  </button>
                </motion.div>

                {/* 3. Psychiatrist Portal Card */}
                <motion.div 
                  whileHover={{ y: -6 }}
                  className="rounded-3xl border border-lavender-matte bg-white p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all h-[360px]"
                >
                  <div className="space-y-4">
                    <div className="h-12 w-12 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600">
                      <span className="text-2xl">🔒</span>
                    </div>
                    
                    <div className="space-y-2">
                       <h3 className="text-lg font-bold text-slate-900 font-serif flex items-center justify-between">
                        <span>بوابة الأطباء</span>
                        <span className="text-xs text-lavender-dark font-serif font-mono">Psychiatrists</span>
                      </h3>
                      <p className="text-xs leading-relaxed text-slate-500">
                        خزائن مشددة وسرية لتقييم الحالات الإكلينيكية والاضطرابات. فك تشفير البيانات السمعية وتفاصيل الجلسات باستعمال كود PIN الآمن والمزدوج.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => navigateTo('psychiatrist')}
                    className="w-full text-center rounded-xl bg-slate-900 hover:bg-slate-800 text-white py-2.5 text-xs font-bold transition-all shadow-sm cursor-pointer"
                  >
                    فتح خزائن الأطباء
                  </button>
                </motion.div>

                {/* 4. Parents Portal Card */}
                <motion.div 
                  whileHover={{ y: -6 }}
                  className="rounded-3xl border border-lavender-matte bg-white p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all h-[360px]"
                >
                  <div className="space-y-4">
                    <div className="h-12 w-12 rounded-2xl bg-amber-50 border border-amber-150 flex items-center justify-center text-amber-600">
                      <span className="text-2xl">🧸</span>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-lg font-bold text-slate-900 font-serif flex items-center justify-between">
                        <span>بوابة الوالدين</span>
                        <span className="text-xs text-lavender-dark font-serif font-mono">Parents</span>
                      </h3>
                      <p className="text-xs leading-relaxed text-slate-500">
                        لتقييم مستويات القلق والتوتر لدى الأبناء والبنات. احصل على توجيهات سلوكية وعائلية واستشارات تربوية معززة بالذكاء الاصطناعي والمبادئ الإسلامية.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => navigateTo('parents')}
                    className="w-full text-center rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 text-white py-2.5 text-xs font-bold transition-all shadow-sm cursor-pointer"
                  >
                    طلب التوجيه العائلي
                  </button>
                </motion.div>

              </div>

              {/* Informational reassurance band */}
              <div className="rounded-2xl bg-lavender-matte/30 border border-lavender-matte p-5 text-center text-xs text-slate-600 font-medium font-serif">
                <p>
                  هل تعاني من ضغوط شديدة؟ تفعيل زر طوارئ SOS الأحمر والوميض في أسفل الشاشة يقوم بتأمين فرز إكلينيكي وتوجيه مباشر لأقرب مستشار متاح على مدار الساعة فوراً.
                </p>
              </div>

            </motion.div>
          )}

          {/* Portal Patient View */}
          {activePortal === 'patient' && (
            <motion.div
              key="patient-page"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="h-full"
            >
              <PortalPatient 
                onVoluteerLinkTriggered={() => navigateTo('counselor')}
                patientAlias={patientAlias}
                setPatientAlias={setPatientAlias}
                activeSpecialistConnected={sosMatchedSpecialist}
              />
            </motion.div>
          )}

          {/* Portal Counselor View */}
          {activePortal === 'counselor' && (
            <motion.div
              key="counselor-page"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="h-full"
            >
              {/* Show clinical registration and search */}
              <PortalProvider 
                onCaseFileUnlocked={handleCaseUnlocked}
                patientAlias={patientAlias}
              />
            </motion.div>
          )}

          {/* Portal Psychiatrist View */}
          {activePortal === 'psychiatrist' && (
            <motion.div
              key="psychiatrist-page"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="h-full"
            >
              {/* Show the comprehensive secure Doctor Patient Cabinet */}
              <PortalDoctorCabinet 
                onBackToRegistry={() => navigateTo('gateway')}
              />
            </motion.div>
          )}

          {/* Portal Parents View */}
          {activePortal === 'parents' && (
            <motion.div
              key="parents-page"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="h-full"
            >
              <PortalParents 
                patientAlias={patientAlias}
              />
            </motion.div>
          )}

          {/* Portal Doctor Dashboard View */}
          {activePortal === 'dashboard' && unlockedCase && (
            <motion.div
              key="dashboard-page"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="h-full"
            >
              <PortalDoctorDashboard 
                unlockedCase={unlockedCase}
                onBackToRegistry={() => {
                  setUnlockedCase(null);
                  navigateTo('psychiatrist');
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

      </main>

      {/* Global Persistent Floating SOS safety component */}
      <SOSSafetyNet 
        onSOSActivated={handleSOSActivated}
        patientAlias={patientAlias}
      />

      {/* Footer info element with Arabic supportive message */}
      <footer className="bg-white border-t border-lavender-matte py-5 px-6 shrink-0 text-center flex flex-col md:flex-row items-center justify-between text-xs text-slate-400 gap-3">
        <div className="text-right space-y-1">
          <p className="font-mono text-[9px] uppercase tracking-wider text-slate-500 font-bold">
            معمارية نظام سكينة v3.1 // نظام التشفير والخزائن المزدوجة المعتمد
          </p>
          <p className="text-[11px]">
            البيانات محمية بواسطة خوارزميات التجزئة الآمنة وممارسات أمنية محسّنة لحماية الخصوصية.
          </p>
        </div>
        <p className="text-[11px]">
          هل تحتاج إلى مساعدة عاجلة ونوعية في أرض الواقع؟ اتصل بالخطوط الوطنية الساخنة مباشرة: <strong className="text-lavender-dark font-extrabold hover:underline">911 / 999</strong>
        </p>
      </footer>

    </div>
  );
}
