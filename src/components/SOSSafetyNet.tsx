/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Phone, AlertCircle, ShieldAlert, Heart, X, Sparkles, Loader } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Specialist } from '../types';

interface SOSSafetyNetProps {
  onSOSActivated?: (specialist: Specialist) => void;
  patientAlias: string;
}

export default function SOSSafetyNet({ onSOSActivated, patientAlias }: SOSSafetyNetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [matchedDoc, setMatchedDoc] = useState<Specialist | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const triggerSOS = async () => {
    setErrorMsg('');
    setIsSearching(true);
    setCountdown(5);
    setMatchedDoc(null);

    try {
      const response = await fetch('/api/sos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientAlias: patientAlias || 'Guest_721',
          currentAnxiety: 95
        })
      });
      const data = await response.json();
      
      if (data.success) {
        // Mock a 2-second high-fidelity scanning and connection delay for dramatic relief effect
        setTimeout(() => {
          setMatchedDoc(data.matchedSpecialist);
          setIsSearching(false);
          if (onSOSActivated && data.matchedSpecialist) {
            onSOSActivated(data.matchedSpecialist);
          }
        }, 2200);
      } else {
        setTimeout(() => {
          setErrorMsg(data.message || 'جاري التوجيه إلى قنوات المساندة والأرقام الساخنة الوطنية المباشرة...');
          setIsSearching(false);
        }, 1500);
      }
    } catch (e) {
      console.error(e);
      setIsSearching(false);
      setErrorMsg('لم يتم رصد اتصال بالخادم المباشر. تم الانتقال لبروتوكول الطوارئ المحلي.');
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSearching && countdown > 0) {
      interval = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isSearching, countdown]);

  return (
    <>
      {/* Floating Glowing SOS Action Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <motion.button
          id="sos-floating-btn"
          onClick={() => { setIsOpen(true); triggerSOS(); }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-red-600 text-white shadow-2xl shadow-red-500/50 outline-none ring-4 ring-red-300 ring-offset-2 hover:bg-red-700 animate-pulse cursor-pointer"
        >
          <ShieldAlert className="h-8 w-8 text-white" />
        </motion.button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" dir="rtl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl text-right"
            >
              {/* Header */}
              <div className="flex items-center justify-between bg-red-600 px-6 py-4 text-white">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <AlertCircle className="h-5 w-5" />
                  <span className="font-semibold tracking-wide">طوارئ وغرفة أزمات "سكينة" المباشرة</span>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-full p-1 hover:bg-red-700 text-white transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Panel Content */}
              <div className="p-6 text-center">
                {isSearching ? (
                  <div className="space-y-6 py-4">
                    <div className="relative mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-red-50">
                      <div className="absolute inset-0 rounded-full border-4 border-red-500 border-t-transparent animate-spin"></div>
                      <ShieldAlert className="h-10 w-10 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">جاري البحث عن أخصائي متصل الآن</h3>
                      <p className="mt-2 text-sm text-gray-500">
                        المنصة تقوم بتخطي طوابير الانتظار لتوصيل حالتك ومستشعر التوتر النفسي بأقرب خبير متوافر على الخط بشكل سري فوري...
                      </p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-3 font-mono text-xs text-gray-400">
                      خوارزمية الفرز الفوري v2.45 // PINGING_AVAILABILITY
                    </div>
                  </div>
                ) : matchedDoc ? (
                  <div className="space-y-6 py-2 text-center">
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"
                    >
                      <Phone className="h-8 w-8 animate-bounce" />
                    </motion.div>
                    
                    <div>
                      <span className="inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800 animate-pulse">
                        ● تم الاتصال الخط الساخن المباشر
                      </span>
                      <h3 className="mt-3 text-2xl font-bold text-gray-900">{matchedDoc.fullName}</h3>
                      <p className="text-xs text-gray-600 font-medium uppercase tracking-wider">{matchedDoc.roleType}</p>
                      <p className="mt-2 text-sm text-gray-500">
                        مستشار معتمد ومحقق الهوية والشهادات العلمية ({matchedDoc.experienceYears} سنة خبرة). متخصص في الرعاية الإكلينيكية والسلوكية.
                      </p>
                    </div>

                    <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 text-right">
                      <div className="flex items-start space-x-3 space-x-reverse">
                        <Heart className="mt-1 h-5 w-5 shrink-0 text-emerald-600" />
                        <div>
                          <p className="text-xs font-medium text-emerald-950">إرشادات مهدئة من الأخصائي لتطبيقها الآن:</p>
                          <p className="mt-1 text-xs italic text-emerald-800">
                            "السلام عليكم ورحمة الله وبركاته. خذ أنفاساً عميقة وبطيئة وصوب تفكيرك لله سبحانه. القلق زائل والسكينة قادمة، نحن معك ونهتم لأمرك."
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-3 space-x-reverse">
                      <button
                        onClick={() => {
                          alert(`محاكاة تواصل مباشر وآمن مع المستشار: ${matchedDoc.fullName}. يرجى البقاء في مكان مريح وآمن!`);
                        }}
                        className="flex-1 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 cursor-pointer"
                      >
                        بدء اتصال هاتفي مشفر
                      </button>
                      <button
                        onClick={() => setIsOpen(false)}
                        className="flex-1 rounded-xl border border-gray-300 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
                      >
                        إغلاق قناة الطوارئ
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6 py-4">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100 text-yellow-600">
                      <Loader className="h-8 w-8 animate-spin" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">سلك التوجيه التلقائي</h3>
                      <p className="mt-2 text-sm text-gray-600">
                        {errorMsg || 'يرجى الانتظار، جاري تحضير الاتصالات الآمنة مع أخصائي الدعم السلوكي البديل...'}
                      </p>
                    </div>
                    <button
                      onClick={triggerSOS}
                      className="w-full rounded-xl bg-red-600 py-3 text-sm font-semibold text-white hover:bg-red-700 cursor-pointer"
                    >
                      إعادة تجربة بروتوكول التوجيه
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
