/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  UserCheck, ShieldCheck, Lock, FolderKey, FileText, Upload, Plus, Check, Star, 
  ToggleLeft, ToggleRight, Loader, Eye, AlertCircle, RefreshCw, Key, HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Specialist } from '../types';

interface ProviderPortalProps {
  onCaseFileUnlocked: (caseDetails: any) => void;
  patientAlias: string;
}

export default function PortalProvider({ onCaseFileUnlocked, patientAlias }: ProviderPortalProps) {
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [authToken, setAuthToken] = useState<string | null>(null);
  
  // Registration Form State
  const [fullName, setFullName] = useState('');
  const [roleType, setRoleType] = useState<'Psychologist' | 'Counselor'>('Psychologist');
  const [experienceYears, setExperienceYears] = useState('5');
  const [specialtiesText, setSpecialtiesText] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [licenceBase64, setLicenceBase64] = useState('');
  const [registrationSuccessMsg, setRegistrationSuccessMsg] = useState('');

  // Symmetrical Double-Lock cases list state
  const [secureCases, setSecureCases] = useState<any[]>([]);
  const [activePINInputs, setActivePINInputs] = useState<{ [caseId: string]: string }>({});
  const [unlockedCaseError, setUnlockedCaseError] = useState<{ [caseId: string]: string }>({});

  useEffect(() => {
    fetchSpecialists();
    fetchSecureCases();
  }, []);

  const fetchSpecialists = async () => {
    try {
      const response = await fetch('/api/specialists');
      const data = await response.json();
      setSpecialists(data);
    } catch (e) {
      console.error("Failed to fetch specialists", e);
    }
  };

  const fetchSecureCases = async () => {
    try {
      const response = await fetch('/api/cases', { headers: authHeaders() });
      if (response.status === 401) {
        console.warn("Authentication required for cases access");
        return;
      }
      const data = await response.json();
      setSecureCases(data);
    } catch (e) {
      console.error("Failed to fetch cases list", e);
    }
  };

  // Register professional specialist
  const handleRegisterSpecialist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName) return;

    try {
      const response = await fetch('/api/specialists/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          roleType,
          experienceYears,
          specialties: specialtiesText ? specialtiesText.split(',').map(s => s.trim()) : ["الإرشاد العيادي"],
          base64License: licenceBase64 || "simulated_license_payload_string"
        })
      });
      const data = await response.json();
      if (data.success) {
        setFullName('');
        setSpecialtiesText('');
        setUploadedFileName('');
        setRegistrationSuccessMsg("تم تسجيل تفاصيل مزاولة ترخيصكم وإرسالها لفريق التدقيق الصحي لسكينة بنجاح! حسابك حالياً بانتظار التحقق والموافقة التشفيرية المعتمدة.");
        fetchSpecialists();
        setTimeout(() => setRegistrationSuccessMsg(''), 6000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Trigger quick verification for verification demo
  const handleSimulatedVerifyAdmin = async (id: string) => {
    try {
      const response = await fetch(`/api/specialists/${id}/verify`, {
        method: 'POST',
        headers: authHeaders(),
      });
      const data = await response.json();
      if (data.success) {
        fetchSpecialists();
        alert("تم تدقيق ترخيص الأخصائي وشهادات مزاولة المهنة بنجاح من لدن الإشراف الصحي والموافقة عليها. الحالة المعتمدة: معتمد (Verified)");
      }
    } catch (e) {
      console.log(e);
    }
  };

  // Toggle online/routing availability status
  const handleToggleOnlineStatus = async (id: string) => {
    try {
      const response = await fetch(`/api/specialists/${id}/toggle-online`, {
        method: 'POST',
        headers: authHeaders(),
      });
      const data = await response.json();
      if (data.success) {
        fetchSpecialists();
      }
    } catch (e) {
      console.log(e);
    }
  };

  const authHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    return headers;
  };

  // Double-Lock secure patient records vault check
  const handleDoubleLockVerification = async (caseId: string) => {
    const pin = activePINInputs[caseId];
    if (!pin) {
      setUnlockedCaseError(prev => ({ ...prev, [caseId]: "كود PIN مطلوب للمصادقة المزدوجة وفك التشفير" }));
      return;
    }

    try {
      const response = await fetch('/api/cases/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId,
          pinCode: pin
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Clear Error states
        setUnlockedCaseError(prev => ({ ...prev, [caseId]: '' }));
        // Callback to unlock full clinical analysis dashboard container!
        onCaseFileUnlocked(data.case);
        alert("🔒 تم فك تشغيل الخزنة المزدوجة بنجاح! تم فك تشفير وتصدير الملف النفسي والتحليلي السريري للحالة المعنية.");
      } else {
        setUnlockedCaseError(prev => ({ ...prev, [caseId]: data.error || "فشل التحقق من رمز PIN المزدوج" }));
      }
    } catch (err) {
      console.error(err);
      setUnlockedCaseError(prev => ({ ...prev, [caseId]: "خطأ في الاتصال بالملف السريري المشفر" }));
    }
  };

  // File drag & upload simulator
  const simulateFileUpload = () => {
    const fakeFiles = [
      "Psychology_Licence_Saudi_Commission_Health_48123.pdf",
      "American_Board_Clinical_Psychology_Verified.jpeg",
      "Masters_Counseling_Ministry_Education.png"
    ];
    const pickedFile = fakeFiles[Math.floor(Math.random() * fakeFiles.length)];
    setUploadedFileName(pickedFile);
    setLicenceBase64("data:application/pdf;base64,mockLicenseVerificationString");
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 text-right" dir="rtl">
      
      <div className="mb-8 flex flex-col items-center justify-center text-center space-y-3">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 font-serif">
          بوابة الإنضمام <span className="text-[#3A7D8C]">للأطباء والمستشارين</span>
        </h1>
        <p className="text-sm text-gray-500 font-medium max-w-2xl mx-auto leading-relaxed">
          انضم إلى فريق مستشاري سكينة وساهم بخبرتك الطبية في تقديم استشارات تطوعية موثوقة، لدعم المحتاجين وإحداث أثر إيجابي في المجتمع.
        </p>
      </div>

      <div className="max-w-4xl mx-auto space-y-6 text-right">
        
        {/* Verification landing & Specialist listing database */}
        <div className="space-y-6">
          
          {/* Dynamic Specialist Registry Dashboard */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4 text-right">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="text-lg font-bold text-gray-900 flex items-center space-x-2 space-x-reverse">
                <UserCheck className="h-5 w-5 text-[#3A7D8C]" />
                <span>دليل وسجلات الأخصائيين المعتمدين والمصرحين حالياً</span>
              </h2>
              <span className="rounded bg-[#EBF4F6] px-3 py-0.5 text-xs font-bold text-[#3A7D8C]">
                {specialists.length} أخصائيين
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 max-h-[300px] overflow-y-auto">
              {specialists.map((spec) => (
                <div 
                  key={spec.id} 
                  className={`rounded-xl border p-4 space-y-3 transition-colors text-right ${
                    spec.isOnline 
                      ? 'border-emerald-200 bg-emerald-50/20' 
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="text-right">
                      <h4 className="font-bold text-sm text-gray-900">{spec.fullName}</h4>
                      <p className="text-[11px] text-gray-500 tracking-wide font-semibold mt-1">
                        {spec.roleType === 'Psychologist' ? 'أخصائي نفسي عيادي' : 'أخصائي إرشاد نفسي وسلوكي'} ({spec.experienceYears} سنة خبرة)
                      </p>
                    </div>

                    <div className="flex items-center space-x-1 space-x-reverse text-amber-500">
                      <Star className="h-3 w-3 fill-current" />
                      <span className="text-xs font-bold font-mono">{spec.rating}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 justify-start">
                    {spec.specialties.slice(0, 2).map((s, idx) => (
                      <span key={idx} className="text-[10px] bg-slate-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                        {s}
                      </span>
                    ))}
                  </div>

                  {/* Specialist Admin actions */}
                  <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                    <div className="flex items-center space-x-1.5 space-x-reverse">
                      <button
                        onClick={() => handleToggleOnlineStatus(spec.id)}
                        className="p-1 rounded text-gray-400 hover:text-gray-600 cursor-pointer"
                        title="تبديل حالة التواجد المباشر"
                      >
                        {spec.isOnline ? (
                          <span className="flex items-center space-x-1 space-x-reverse font-mono text-[10px] text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded-full">
                            <span>● مستعد للاستجابة السريعة</span>
                          </span>
                        ) : (
                          <span className="flex items-center space-x-1 space-x-reverse font-mono text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                            <span>غير متاح الآن</span>
                          </span>
                        )}
                      </button>
                    </div>

                    {!spec.isVerified ? (
                      <button
                        onClick={() => handleSimulatedVerifyAdmin(spec.id)}
                        className="rounded-lg bg-orange-100 text-orange-950 px-2 py-1 text-[10px] font-bold border border-orange-200 flex items-center space-x-1 space-x-reverse hover:bg-orange-200 cursor-pointer"
                      >
                        <ShieldCheck className="h-3.5 w-3.5 text-orange-600" />
                        <span>مراجعة واعتماد الترخيص</span>
                      </button>
                    ) : (
                      <span className="text-[10px] text-emerald-800 font-bold flex items-center space-x-1 space-x-reverse">
                        <ShieldCheck className="h-4.5 w-4.5 text-emerald-600" />
                        <span>معتمد ومحقق</span>
                      </span>
                    )}

                  </div>

                </div>
              ))}
            </div>

          </div>

          {/* Secure Onboarding Register Request Form */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm text-right">
            <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center space-x-2 space-x-reverse text-right">
              <Upload className="h-5 w-5 text-[#3A7D8C]" />
              <span>تقديم الأوراق والانضمام لقوائم مستشاري سكينة وعياداتها</span>
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              أرفق وثيقة ترخيص العمل النفسي أو تصريح مزاولة المهنة المعتمد. فور التحقق منها والتدقيق الرسمي، سينضم ملفك لطاقم طوارئ سكينة السلوكي التفاعلي ومتابعة ملفات الحالات المشفّرة.
            </p>

            {registrationSuccessMsg && (
              <div className="mb-4 rounded-xl bg-cyan-50 border border-cyan-200 p-4 text-xs font-semibold text-cyan-900 flex items-start space-x-2 space-x-reverse text-right">
                <Check className="h-4 w-4 text-cyan-600 shrink-0 mt-0.5" />
                <span>{registrationSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleRegisterSpecialist} className="space-y-4 text-xs text-right">
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">الاسم الطبي الكامل (كما هو مسجل بالترخيص):</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="مثال: د. معاذ الراشد"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:outline-[#3A7D8C] text-right"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">تصنيف المهام السلوكية والسريرية:</label>
                  <select
                    value={roleType}
                    onChange={(e) => setRoleType(e.target.value as any)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:outline-[#3A7D8C] text-right"
                  >
                    <option value="Psychologist">أخصائي نفسي عيادي (علاج معرفي سلوكي)</option>
                    <option value="Counselor">أخصائي إرشاد نفسي وسلوكي (إرشاد وتعديل سلوك)</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">سنوات الخبرة العملية المعتمدة:</label>
                  <input
                    type="number"
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(e.target.value)}
                    min="1"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:outline-[#3A7D8C] text-right"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">التركيز والمحاور السلوكية المستهدفة:</label>
                  <input
                    type="text"
                    value={specialtiesText}
                    onChange={(e) => setSpecialtiesText(e.target.value)}
                    placeholder="مثل: علاج الفقد والأسى، نوبات هلع، الدعم والسكينة الإيمانية"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:outline-[#3A7D8C] text-right"
                  />
                </div>
              </div>

              {/* Secure certification upload compartment */}
              <div 
                onClick={simulateFileUpload}
                className="rounded-xl border-2 border-dashed border-gray-300 p-4 text-center hover:bg-gray-50/50 cursor-pointer"
              >
                <Plus className="mx-auto h-6 w-6 text-gray-400" />
                <p className="mt-1 font-bold text-gray-700">انقر هنا أو اسحب وثيقة ترخيص العمل أو مزاولة المهنة لرفعها وإرفاقها</p>
                <p className="text-[10px] text-gray-450 font-mono mt-0.5">يدعم صيغ PDF، أو الصور الرقمية المعتمدة لسرعة المصادقة</p>
                
                {uploadedFileName && (
                  <div className="mt-3 inline-flex items-center space-x-1 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1 rounded">
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span>تم إرفاق المستند: {uploadedFileName}</span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-[#3A7D8C] hover:bg-[#2F6572] text-white font-bold py-3 uppercase tracking-wider shadow cursor-pointer text-xs"
              >
                تقديم ملف التوثيق والترخيص المشفر للإدارة الصحية
              </button>

            </form>

          </div>

        </div>

      </div>

    </div>
  );
}
