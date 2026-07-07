/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Heart, Shield, AlertCircle, Sparkles, Send, BookOpen, Smile, HelpCircle, 
  ArrowRight, CheckCircle2, Moon, Baby, BrainCircuit, Users, HeartHandshake, Check 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ParentsPortalProps {
  patientAlias: string;
}

export default function PortalParents({ patientAlias }: ParentsPortalProps) {
  const [childAge, setChildAge] = useState('14');
  const [parentPrompt, setParentPrompt] = useState('');
  const [adviceHistory, setAdviceHistory] = useState<any[]>([]);
  const [adviceLoading, setAdviceLoading] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState('Anxiety');

  const handleFetchAdvice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parentPrompt.trim()) return;

    setAdviceLoading(true);
    const userQuery = parentPrompt;
    setParentPrompt('');

    try {
      // Fetch advice from server-side Gemini Proxy
      const response = await fetch('/api/ai/parent-advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          age: childAge,
          topic: selectedTopic,
          text: userQuery
        })
      });
      const data = await response.json();
      
      setAdviceHistory(prev => [
        {
          query: userQuery,
          age: childAge,
          topic: selectedTopic,
          reply: data.advice,
          copingTactic: data.copingTactic,
          spiritualComfort: data.spiritualComfort,
          timestamp: new Date().toLocaleTimeString('ar-EG')
        },
        ...prev
      ]);
    } catch (err) {
      console.error(err);
      // Fallback structured guide in Arabic
      setAdviceHistory(prev => [
        {
          query: userQuery,
          age: childAge,
          topic: selectedTopic,
          reply: `للأبناء واليافعين في سن ${childAge} الذين يعانون من ${selectedTopic}، من الضروري بناء بيئة مأمونة عاطفياً وطمأنينة ثابتة داخل الأسرة. يجب عليك الاستماع الفعال لهم بعطف ودون تقديم وعظ أو لوم مباشر تزامناً مع ثورتهم النفسية.`,
          copingTactic: [
            "خفف من حدة ردود فعل طفلك بمساعدته على ممارسة تمرين أخذ الأنفاس العميقة ببطء.",
            "خصص وقتاً يومياً ثابتاً للترابط الفردي المباشر والخالي تماماً من الشاشات الإلكترونية.",
            "احترم وقدر هموم طفلك وصعوباته (كالضغوط الدراسية أو تهميش الرفاق) قبل المسارعة بتقديم نصائح عملية."
          ],
          spiritualComfort: "ذكّر طفلك بلطف وعطف بقول الله تعالى في سورة الشرح: ﴿فَإِنَّ مَعَ العُسرِ يُسرًا ۝ إِنَّ مَعَ العُسرِ يُسرًا﴾. واشرح له كيف أن الابتلاء والمشقة يتبعهما فرج من الله سبحانه ليرتبط قلبه بالله.",
          timestamp: new Date().toLocaleTimeString('ar-EG')
        },
        ...prev
      ]);
    } finally {
      setAdviceLoading(false);
    }
  };

  const sampleScenarios = [
    { title: "توتر الامتحانات والقلق الدراسي", query: "طفلي ينطوي على نفسه تماماً ويرفض التواصل أو مناقشة واجباته تزامناً مع فترات الاختبارات المدرسية الموحدة.", age: "16", topic: "Anxiety" },
    { title: "تأثير صدمة الفقدان والحزن", query: "الاضطراب والأسى العاطفي الذي تلا وفاة جده ولد لديه مستويات عميقة من الانفصال والتشتت الحاد.", age: "11", topic: "Grief" },
    { title: "رهاب المشاركة المدرسية والذعر الدائم", query: "يعاني من خفقان سريع في نبضات القلب وخوف جارف عند تكليفه بتقديم مشاريع أمام صف مدرسي ممتلئ.", age: "13", topic: "Panic" }
  ];

  return (
    <div className="min-h-full bg-lavender-pale/40 text-slate-800 p-4 sm:p-8" dir="rtl">
      <div className="mx-auto max-w-5xl space-y-8">
        
        {/* Header Branding Panel */}
        <div className="rounded-3xl bg-lavender-matte/30 border border-lavender-matte px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm text-right">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 space-x-reverse rounded-full bg-lavender-primary/15 px-3 py-1 text-xs font-semibold text-lavender-dark">
              <Baby className="h-3.5 w-3.5" />
              <span>منصة التوجيه السلوكي والتربوي لصحة أطفالنا النفسية</span>
            </div>
            <h1 className="text-3xl font-bold font-serif text-slate-900 leading-tight">
              مستشار وبوابة <span className="text-lavender-dark">أولياء الأمور</span> الإرشادية
            </h1>
            <p className="max-w-xl text-xs md:text-sm leading-relaxed text-slate-600">
              دعم ومساندة العوائل في فحص مستويات القلق لدى الأطفال، واستجابة الصدمات والحزن، وضغوط المراهقات السلوكية. نساعدك في تمهيد جسر التعافي بخصوصية وأمان.
            </p>
          </div>
          
          <div className="h-16 w-16 rounded-full bg-lavender-primary/10 flex items-center justify-center text-lavender-dark border border-lavender-matte animate-pulse shrink-0">
            <HeartHandshake className="h-8 w-8" />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-12 text-right">
          
          {/* Left Block: Interactive Parents Advisor Terminal (7 cols) */}
          <div className="md:col-span-7 flex flex-col rounded-2xl border border-lavender-matte bg-white shadow-sm overflow-hidden min-h-[500px]">
            
            {/* Console Header */}
            <div className="bg-lavender-pale/60 border-b border-lavender-matte px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-2.5 space-x-reverse">
                <BrainCircuit className="h-5 w-5 text-lavender-dark" />
                <span className="text-sm font-bold text-slate-900">وحدة التوجيه الفوري والذكاء التربوي</span>
              </div>
              
              <div className="text-[10px] bg-white border border-lavender-matte py-1 px-2.5 rounded-full font-mono text-lavender-dark font-bold">
                تحليل عاطفي سلوكي // SECURE
              </div>
            </div>

            {/* Input Config Form */}
            <form onSubmit={handleFetchAdvice} className="p-6 border-b border-slate-100 bg-slate-50/50 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-650 mb-1">عمر الطفل / اليافع (سنوات):</label>
                  <input
                    type="number"
                    min="3"
                    max="21"
                    value={childAge}
                    onChange={(e) => setChildAge(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-lavender-dark"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-650 mb-1">المظهر السلوكي الأساسي المؤرق:</label>
                  <select
                    value={selectedTopic}
                    onChange={(e) => setSelectedTopic(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-lavender-dark text-right"
                  >
                    <option value="Anxiety">القلق الحاد والتوتر الاجتماعي</option>
                    <option value="Grief">استجابة الفراق / حزن مبرح عميق</option>
                    <option value="Academic Stress">الاحتراق والجمود بسبب الأداء الدراسي</option>
                    <option value="Behavioral Outbursts">الانفعالات الحادة وصعوبة تنظيم المشاعر</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-650 mb-1">صف مشاعر طفلك، تصرفاته، أو مسببات توتره بوضوح:</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={parentPrompt}
                    onChange={(e) => setParentPrompt(e.target.value)}
                    placeholder="مثال: يرفض طفلي الحديث أو النزول لتناول العشاء والامتحانات تقترب، ويصاحب ذلك كوابيس نوم..."
                    className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-lavender-dark text-right"
                  />
                  <button
                    type="submit"
                    disabled={!parentPrompt.trim() || adviceLoading}
                    className="rounded-xl bg-lavender-dark text-white px-5 py-2.5 text-xs font-bold hover:bg-lavender-deep transition-colors disabled:bg-slate-200 disabled:text-slate-400 cursor-pointer flex items-center space-x-1 space-x-reverse"
                  >
                    <span>فحص</span>
                    <Send className="h-3 w-3 transform rotate-180" />
                  </button>
                </div>
              </div>

              {/* Sample Shortcuts */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono text-slate-400 font-bold block uppercase">سيناريوهات نموذجية شائعة للتحقق:</span>
                <div className="flex flex-wrap gap-1.5">
                  {sampleScenarios.map((sc, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setChildAge(sc.age);
                        setSelectedTopic(sc.topic);
                        setParentPrompt(sc.query);
                      }}
                      className="text-[10px] bg-lavender-pale/50 hover:bg-lavender-matte border border-lavender-matte text-slate-700 font-medium px-2 py-1 rounded-lg transition-colors cursor-pointer"
                    >
                      {sc.title} (عمر {sc.age} سنة)
                    </button>
                  ))}
                </div>
              </div>
            </form>

            {/* Advisory Results feed */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-lavender-pale/10">
              
              {adviceLoading && (
                <div className="flex items-center justify-center space-x-2.5 py-12">
                  <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-lavender-primary border-t-transparent" />
                  <span className="text-xs font-mono text-slate-500">جاري صياغة الاستراتيجية التربوية والبلسم النفسي للوالدين...</span>
                </div>
              )}

              <AnimatePresence>
                {adviceHistory.length === 0 && !adviceLoading && (
                  <div className="text-center py-12 space-y-2 text-slate-400">
                    <HelpCircle className="mx-auto h-8 w-8 text-lavender-primary/40 animate-bounce" />
                    <p className="text-xs font-bold text-slate-600">لا يوجد سجل طلبات استشارة حالية</p>
                    <p className="text-[11px] max-w-sm mx-auto text-center font-serif leading-relaxed">
                      حدد المشكلة السلوكية ومواصفات عمر اليافع، ثم حدد الأعراض ليمكن لـسكينة هيكلة أفضل مناهج المساعدة العائلية والسريرية المعتمدة إسلامياً.
                    </p>
                  </div>
                )}

                {adviceHistory.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-slate-200 bg-white p-4 space-y-4 shadow-sm"
                  >
                    <div className="flex items-center justify-between border-b border-dashed border-slate-100 pb-2">
                      <div className="flex items-center space-x-2 space-x-reverse justify-start">
                        <span className="rounded bg-lavender-pale border border-lavender-matte text-lavender-dark font-sans text-[10px] font-bold px-2 py-0.5">
                          العمر: {item.age} سنوات • {item.topic === 'Anxiety' ? 'قلق وتوتر' : item.topic === 'Grief' ? 'حزن وفقدان' : item.topic === 'Academic Stress' ? 'احتراق دراسي' : 'صعوبة انفعال'}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium truncate max-w-[170px]">
                          التدوين: "{item.query}"
                        </span>
                      </div>
                      <span className="text-[9px] text-slate-405 font-mono">{item.timestamp}</span>
                    </div>

                    <div className="text-xs text-slate-700 space-y-3">
                      <p className="leading-relaxed font-sans mt-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-right whitespace-pre-line text-slate-800">
                        {item.reply}
                      </p>

                      {/* Coping actionable advice points */}
                      {item.copingTactic && item.copingTactic.length > 0 && (
                        <div className="space-y-2 pt-1.5 border-t border-slate-100 text-right">
                          <span className="text-[10px] font-bold text-lavender-dark uppercase tracking-wider block">الإجراءات السلوكية والتربوية المقترحة لتطبيقها اليوم:</span>
                          <ul className="space-y-1.5 text-[11px] pr-1">
                            {item.copingTactic.map((t: string, idx: number) => (
                              <li key={idx} className="flex items-start space-x-2 space-x-reverse">
                                <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                                <span className="text-slate-600 leading-normal">{t}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Spiritual connection if any query exists */}
                      {item.spiritualComfort && (
                        <div className="rounded-lg bg-amber-50/50 border border-amber-100 p-3.5 mt-2.5 text-right">
                          <span className="text-[10px] font-sans text-amber-900 font-bold block mb-1">الربط والتهيئة السلوكية الإيمانية (التوكل والصبر)</span>
                          <p className="text-[11.5px] leading-relaxed italic text-amber-950 font-serif">
                            "{item.spiritualComfort}"
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

            </div>

          </div>

          {/* Right Block: Practical Parenting Guides & Child Mood Card (5 cols) */}
          <div className="md:col-span-5 space-y-6">
            
            {/* Quick Interactive Interactive Child Behavior Audit Check */}
            <div className="rounded-2xl border border-lavender-matte bg-white p-5 shadow-sm space-y-4">
              <div className="pb-2 border-b border-slate-100 text-right">
                <h3 className="text-sm font-bold text-slate-900">سجل استقصاء واكتشاف بوادر الاكتئاب للأطفال</h3>
                <p className="text-[10px] text-slate-400 font-medium">قيم السلوكيات العاطفية والمظاهر السلوكية التي أبداها طفلك بوضوح خلال الأسبوعين الماضيين</p>
              </div>

              <div className="space-y-3 text-xs text-right">
                {[
                  { label: "الانزواء والانسحاب من اللعب والأنشطة والعزوف عن الأصدقاء", weight: "مقياس الحزن والانسحاب" },
                  { label: "كثرة الشكايات من آلام غير عضوية مبهمة (كآلام البطن أو الصداع المتكرر)", weight: "الهلع الجسدي Somatic" },
                  { label: "تواتر الفزع اللامبرر في النوم والكوابيس أو شلل النوم المؤقت", weight: "مؤشر اضطرابات ما بعد الصدمة" },
                  { label: "صعوبة الانقياد الدراسي وتأجج الصدامات اللفظية والعدوانية المفاجئة", weight: "مستشعر القلق والضغط المتراكم" }
                ].map((beh, idx) => (
                  <label key={idx} className="flex items-start space-x-3 space-x-reverse p-2 rounded-xl border border-slate-100 bg-slate-50/30 hover:bg-lavender-pale/20 transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 text-lavender-dark focus:ring-lavender-primary shrink-0 mt-0.5 cursor-pointer text-right"
                    />
                    <div>
                      <span className="font-semibold text-slate-800 text-[11px] block">{beh.label}</span>
                      <span className="text-[9px] text-lavender-dark uppercase font-bold font-mono">{beh.weight}</span>
                    </div>
                  </label>
                ))}
              </div>

              <div className="rounded-xl bg-lavender-pale/40 border border-lavender-matte p-3 text-center">
                <span className="text-[11px] text-slate-600 italic block font-serif">
                  «كلّكم راعٍ وكلّكم مسؤول عن رعيّته، والأولاد في الإسلام أمانة عظيمة ووديعة وجب رعاتها وتثبيتها»
                </span>
              </div>
            </div>

            {/* Quick Family Healing Local Resources Card */}
            <div className="rounded-2xl border border-lavender-matte bg-[#FCFAFD] p-5 shadow-sm space-y-4 text-right">
              <div className="flex items-center space-x-2 space-x-reverse text-lavender-dark justify-start">
                <BookOpen className="h-5 w-5" />
                <span className="text-xs font-bold uppercase tracking-wider">مصادر تربوية وتكتيكات سلوكية للأسرة</span>
              </div>

              <div className="space-y-3 text-right">
                {[
                  { title: "حلقات الاستماع الحي والمتعاطف", desc: "ادعم طفلك عن طريق تمرين التنفس (٤-٧-٨) المهدئ قبل مبادأته بالحوار المفتوح. استمع له لتفهم مشاعره لا لترد." },
                  { title: "فك الارتباط بين الأداء الدراسي والاستحقاق النفسي", desc: "أكد لطفلك أن قيمه الذاتية والروحية لا تختزل في ورقة الامتحان، بل تكمن في الجهد الجاد والسلوك القويم." },
                  { title: "إدارة فرط التعرض السام للشاشات الرقمية والألعاب", desc: "نظم جولات مشي عائلية خالية تماماً من الهاتف أو اللاب توب في الحدائق العامة الهادئة تزامناً مع ساعة الغروب الجالبة للطبيعة." }
                ].map((res, i) => (
                  <div key={i} className="text-xs border-r-2 border-lavender-primary pr-3 py-0.5 space-y-0.5 text-right">
                    <h4 className="font-bold text-slate-900">{res.title}</h4>
                    <p className="text-[11px] text-slate-500 leading-normal">{res.desc}</p>
                  </div>
                ))}
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
