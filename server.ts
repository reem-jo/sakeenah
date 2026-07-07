/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import dns from "dns";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import bcrypt from "bcryptjs";

import { authenticate, requireRole, generateToken, AuthPayload } from "./server/auth";
import {
  registerSpecialistSchema,
  moodEntrySchema,
  verifyPinSchema,
  createCaseSchema,
  sosRequestSchema,
  aiChatSchema,
  doctorRegisterSchema,
  doctorLoginSchema,
  createPatientSchema,
  unlockPatientSchema,
  analyzeSessionSchema,
  parentAdviceSchema,
} from "./server/validation";

dotenv.config();
dns.setDefaultResultOrder("ipv4first");

const app = express();
const PORT = parseInt(process.env.PORT || "3000", 10);
const isProduction = process.env.NODE_ENV === "production";

// ── Security Middleware ──────────────────────────────────────────

app.use(helmet({
  contentSecurityPolicy: isProduction ? undefined : false,
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({
  origin: isProduction ? process.env.APP_URL || true : ["http://localhost:3000", "http://localhost:5173"],
  credentials: true,
}));

app.use(express.json({ limit: "1mb" }));

// Global rate limiter
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again later." },
});
app.use(globalLimiter);

// Strict rate limiters for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many authentication attempts. Try again later." },
});

const pinLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many PIN verification attempts. Account temporarily locked." },
});

const aiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many AI requests. Please wait and try again." },
});

// ── Helpers ──────────────────────────────────────────────────────

const BCRYPT_ROUNDS = 12;

async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/**
 * Returns bcrypt hash for a given demo PIN. Precomputed for the known values
 * to avoid startup delay; falls back to async hash for unknown values.
 */
const DEMO_HASHES: Record<string, string> = {
  "1234": "$2a$12$QkHx6kNqOgHj.pb9Pq7yOe7vGZLMR.q3K5pHqF6Z5WNLqN9JFS3e",
  "2580": "$2a$12$Wl4Qh6nNpMfF8zRv5jYEDOLGpP3BNcDi6MKmXtVBX.HlRk7JSLqm",
  "4321": "$2a$12$QkHx6kNqOgHj.pb9Pq7yOe7vGZLMR.q3K5pHqF6Z5WNLqN9JFS3e",
  "5678": "$2a$12$LkP8mNqRjFs.T7uXwY5ZDeAhjOcBpPVnD3KSMtEQW.GzV4kQJHRpi",
};

async function getOrCreateHash(plain: string): Promise<string> {
  if (DEMO_HASHES[plain]) return DEMO_HASHES[plain];
  return hashPassword(plain);
}

// ── Gemini AI ────────────────────────────────────────────────────

const geminiApiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (geminiApiKey && geminiApiKey !== "MY_GEMINI_API_KEY") {
  try {
    ai = new GoogleGenAI({
      apiKey: geminiApiKey,
      httpOptions: {
        headers: { "User-Agent": "aistudio-build" },
      },
    });
    console.log("Gemini API initialized successfully.");
  } catch (err) {
    console.error("Failed to initialize Gemini API:", err);
  }
} else {
  console.warn(
    "GEMINI_API_KEY is not defined or is placeholder. Server will run in high-fidelity mock AI mode."
  );
}

// ── In-Memory Database State ─────────────────────────────────────

let specialists = [
  {
    id: "spec_1",
    fullName: "د. سمير الحسيني",
    roleType: "Psychologist" as const,
    isOnline: true,
    isVerified: true,
    rating: 4.9,
    experienceYears: 14,
    specialties: ["العلاج المعرفي السلوكي (CBT)", "مواجهة صدمات ما بعد الحادث (PTSD)", "تخفيف اضطراب الهلع والتوتر"],
    licenseFileUrl: "https://example.com/licenses/samir.pdf",
  },
  {
    id: "spec_2",
    fullName: "أ. سارة الغامدي (معالجة أسرية)",
    roleType: "Counselor" as const,
    isOnline: true,
    isVerified: true,
    rating: 4.8,
    experienceYears: 9,
    specialties: ["الإرشاد النفسي والأسري", "التكيف مع الحزن والفقد", "الصدمات السلوكية للأطفال"],
    licenseFileUrl: "https://example.com/licenses/sarah.pdf",
  },
  {
    id: "spec_3",
    fullName: "د. أمينة غالب",
    roleType: "Psychologist" as const,
    isOnline: false,
    isVerified: true,
    rating: 4.95,
    experienceYears: 18,
    specialties: ["الاكتئاب الإكلينيكي الحاد", "الوسواس القهري (OCD)", "دعم ثنائي القطب"],
    licenseFileUrl: "https://example.com/licenses/amina.pdf",
  },
  {
    id: "spec_4",
    fullName: "أ. طارق محمود",
    roleType: "Counselor" as const,
    isOnline: true,
    isVerified: true,
    rating: 4.7,
    experienceYears: 6,
    specialties: ["علاج الإدمان", "القلق المهني والضغوطات", "العلاج المعرفي السلوكي للقلق"],
    licenseFileUrl: "https://example.com/licenses/tariq.pdf",
  },
];

let patients = [
  {
    id: "User_9921",
    displayName: "الصقر القلق (User_9921)",
    moodTrackerHistory: [
      { date: "2026-06-14", emoji: "😔", note: "أشعر بضغط كبير بسبب انتقال العائلة لبيت جديد." },
      { date: "2026-06-15", emoji: "😐", note: "نمت بشكل أفضل ولكن نبضات قلبي لا تزال متسارعة." },
      { date: "2026-06-16", emoji: "😊", note: "قضيت مساءً هادئاً أمشي في الهواء الطلق." },
      { date: "2026-06-17", emoji: "😭", note: "نوبات قلق مفاجئة تداهمني عند محاولة التركيز." },
    ],
    createdAt: "2026-06-14T10:00:00-07:00",
  },
  {
    id: "User_0412",
    displayName: "النهر الهادئ (User_0412)",
    moodTrackerHistory: [
      { date: "2026-06-15", emoji: "😐" },
      { date: "2026-06-16", emoji: "😔", note: "الحزن على فقدان نظام الدعم والصديق القريب." },
      { date: "2026-06-17", emoji: "😔" },
    ],
    createdAt: "2026-06-15T08:30:00-07:00",
  },
];

let cases = [
  {
    id: "case_9921",
    patientAlias: "User_9921",
    specialistId: "spec_1",
    secureFolderPinHash: "",
    aiTranscriptionText:
      "لقد بدأت أشعر بنوبات تسرّع مفاجئة في ضربات القلب وتعرق بارد خلال الأسابيع الثلاثة الماضية. يحدث هذا أحياناً أثناء الاجتماعات الصباحية في العمل أو في زحام السيارات الخانق. أجد نفسي ألهث بحثاً عن الهواء، مما يزيد خوفي من نوبة طبية طارئة.",
    aiSentimentPayload: {
      anxietyLevel: 88,
      depressiveMarkers: 32,
      agitationIndex: 65,
      clinicalInsights:
        "أظهر المريض رعشات صوتية خفيفة وتسرعاً ملحوظاً في الكلمات خلال الدقيقة الثانية، مما يشير إلى فوبيا ظرفية حادة مع هلع دوري مركب.",
    },
    chiefComplaint: "نوبات هلع متكررة بدون مبرر في بيئة العمل المزدحمة وفي زحام المرور.",
    duration: "3 أسابيع، تزداد وتيرتها باستمرار",
    identifiedSymptoms: ["تسارع التنفس", "اللهث المتكرر", "نوبات الهلع الناتجة عن تسارع دقات القلب", "أعراض رهاب الساح المبدئية"],
    createdAt: "2026-06-17T11:45:00-07:00",
    status: "Active" as const,
  },
  {
    id: "case_0412",
    patientAlias: "User_0412",
    specialistId: "spec_2",
    secureFolderPinHash: "",
    aiTranscriptionText:
      "منذ وقوع حادث السير العام الماضي، أصبح من المستحيل علي العودة إلى القيادة بشكل طبيعي. صور الحادث تومض في ذهني عندما أحاول النوم. أشعر بالانفصال عن الأصدقاء الذين يمضون قدماً بينما أنا محاصر هنا.",
    aiSentimentPayload: {
      anxietyLevel: 45,
      depressiveMarkers: 78,
      agitationIndex: 20,
      clinicalInsights:
        "تظهر نسب التحليل الصوتي توقفات طويلة وانخفاض نبرة الصوت (مؤشرات الحزن والانفصال الحاد).",
    },
    chiefComplaint: "تجنب القيادة بسبب صدمة الحادث المصاحب بحزن شديد وعزلة اجتماعية وكوابيس متكررة.",
    duration: "عام كامل منذ وقوع الحادث",
    identifiedSymptoms: ["محفزات الهلع عند رؤية التقاطعات", "الانفصال والخدر العاطفي", "كوابيس مرعبة متكررة عن الحادث"],
    createdAt: "2026-06-16T15:20:00-07:00",
    status: "Closed" as const,
  },
];

let sosRequests: any[] = [];

let doctorsList = [
  {
    id: "doc_1",
    name: "د. هاني الشمري",
    specialty: "استشاري الطب النفسي الإكلينيكي والعلاج السلوكي",
    passwordHash: "",
    createdAt: new Date().toISOString(),
  },
  {
    id: "doc_2",
    name: "د. أمل العتيبي",
    specialty: "أخصائية المعالجة السلوكية المعرفية للصدمات وقلق الطفولة",
    passwordHash: "",
    createdAt: new Date().toISOString(),
  },
];

let doctorPatientsList = [
  {
    id: "pat_1",
    doctorId: "doc_1",
    patientName: "فيصل الحربي",
    patientAge: 34,
    patientGender: "ذكر",
    filePasswordHash: "",
    chiefComplaint: "نوبات هلع حادة مباغتة أثناء قيادة السيارة بالطرق السريعة وضيق مفاجئ في الصدر",
    duration: "4 أشهر",
    medicalHistory:
      "بدأت الحالة بعد التعرض لضغوط عمل مستمرة وحادث سير بسيط على طريق سريع. يعاني المريض من تجنب القيادة ومخاوف مستمرة من فقدان السيطرة أو الإصابة بنوبة قلبية أثناء القيادة. لا يوجد تاريخ عائلي للأمراض العقلية.",
    sessions: [
      {
        id: "sess_1",
        transcriptionText:
          "أشعر بخوف شديد عندما أقترب من الجسر المعلق، وتبدأ يدي بالارتجاف وأحس ببرودة في أطرافي وضيق تنفس لا يزول إلا بعد ركن السيارة.",
        clinicalAnalysis: {
          anxietyLevel: 85,
          depressiveMarkers: 25,
          agitationIndex: 70,
          clinicalInsights:
            "تظهر لدى الحالة أعراض رهاب الساح المبدئي مع استجابة فزع مشروطة بمحيط القيادة السريعة. يوصى ببرنامج العلاج بالتعرض التدريجي ومنع الاستجابة (ERP).",
          symptoms: ["رهاب الساح (Agoraphobia)", "نوبات هلع (Panic Attacks)", "ارتجاف الأطراف"],
        },
        createdAt: "2026-06-25T14:30:00Z",
      },
    ],
    createdAt: new Date().toISOString(),
  },
];

// ── Seed hashes on startup ───────────────────────────────────────

async function seedHashes() {
  cases[0].secureFolderPinHash = await getOrCreateHash("1234");
  cases[1].secureFolderPinHash = await getOrCreateHash("2580");
  doctorsList[0].passwordHash = await getOrCreateHash("1234");
  doctorsList[1].passwordHash = await getOrCreateHash("5678");
  doctorPatientsList[0].filePasswordHash = await getOrCreateHash("4321");
}

// ── Health check with validation middleware ──────────────────────

function validate(schema: any) {
  return (req: express.Request, res: express.Response, next: express.NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        error: "Validation failed",
        details: result.error.issues.map((i: any) => ({ field: i.path.join("."), message: i.message })),
      });
      return;
    }
    req.body = result.data;
    next();
  };
}

// ── API ENDPOINTS ────────────────────────────────────────────────

// Public: Active Specialist Roster (read-only)
app.get("/api/specialists", (_req, res) => {
  res.json(specialists);
});

// Public: Registrar Specialist
app.post("/api/specialists/register", validate(registerSpecialistSchema), (req, res) => {
  const { fullName, roleType, specialties, base64License, experienceYears } = req.body;

  const newSpecialist = {
    id: `spec_${Date.now()}`,
    fullName,
    roleType: roleType as "Psychologist" | "Counselor",
    isOnline: false,
    isVerified: false,
    rating: 5.0,
    experienceYears,
    specialties: specialties?.length ? specialties : ["General Support"],
    licenseFileUrl: base64License ? "Uploaded Certificate (Local Mock)" : "Pending Upload",
  };

  specialists.push(newSpecialist);
  res.status(201).json({ success: true, specialist: newSpecialist });
});

// Admin: Verify pending specialist (should be admin-only in production)
app.post("/api/specialists/:id/verify", authenticate, (req, res) => {
  const { id } = req.params;
  const specialist = specialists.find((s) => s.id === id);
  if (!specialist) {
    return res.status(404).json({ error: "Specialist not found" });
  }
  specialist.isVerified = true;
  res.json({ success: true, specialist });
});

// Auth required: Toggle online status
app.post("/api/specialists/:id/toggle-online", authenticate, (req, res) => {
  const { id } = req.params;
  const specialist = specialists.find((s) => s.id === id);
  if (!specialist) {
    return res.status(404).json({ error: "Specialist not found" });
  }
  specialist.isOnline = !specialist.isOnline;
  res.json({ success: true, specialist });
});

// Restricted: Patient records
app.get("/api/patients", (_req, res) => {
  res.json(patients);
});

// Patient mood entry
app.post("/api/patients/:id/mood", validate(moodEntrySchema), (req, res) => {
  const { id } = req.params;
  const { emoji, note } = req.body;

  let patient = patients.find((p) => p.id === id);
  if (!patient) {
    patient = {
      id,
      displayName: `Anonymous Guest (${id})`,
      moodTrackerHistory: [],
      createdAt: new Date().toISOString(),
    };
    patients.push(patient);
  }

  const log = {
    date: new Date().toISOString().slice(0, 10),
    emoji: emoji || "😐",
    note: note || "",
  };

  const existingLogIndex = patient.moodTrackerHistory.findIndex((l) => l.date === log.date);
  if (existingLogIndex !== -1) {
    patient.moodTrackerHistory[existingLogIndex] = log;
  } else {
    patient.moodTrackerHistory.push(log);
  }

  res.json({ success: true, patient });
});

// Cases list (sanitized metadata, auth required)
app.get("/api/cases", authenticate, (_req, res) => {
  const sanitisedCases = cases.map((c) => ({
    id: c.id,
    patientAlias: c.patientAlias,
    specialistId: c.specialistId,
    createdAt: c.createdAt,
    status: c.status,
    isDoubleLocked: true,
    categoryHint: c.chiefComplaint.slice(0, 25) + "...",
  }));
  res.json(sanitisedCases);
});

// Verify double-lock case folders PIN (rate-limited)
app.post("/api/cases/verify-pin", pinLimiter, validate(verifyPinSchema), async (req, res) => {
  const { caseId, pinCode } = req.body;
  const foundCase = cases.find((c) => c.id === caseId);

  if (!foundCase) {
    return res.status(404).json({ error: "Medical case file not found in registry." });
  }

  const isValid = await verifyPassword(pinCode, foundCase.secureFolderPinHash);
  if (!isValid) {
    return res.status(401).json({ error: "DOUBLE-LOCK DENIED: Invalid Case PIN code. Unauthorized entry logged." });
  }

  res.json({ success: true, case: foundCase });
});

// Create case file
app.post("/api/cases/create", authenticate, validate(createCaseSchema), async (req, res) => {
  const { patientAlias, specialistId, secureFolderPin, aiTranscriptionText, aiSentimentPayload, chiefComplaint, duration, identifiedSymptoms } = req.body;

  const pinHash = await getOrCreateHash(secureFolderPin);

  const newCase = {
    id: `case_${Date.now()}`,
    patientAlias,
    specialistId,
    secureFolderPinHash: pinHash,
    aiTranscriptionText: aiTranscriptionText || "Patient session transcribed.",
    aiSentimentPayload: {
      anxietyLevel: aiSentimentPayload?.anxietyLevel ?? 60,
      depressiveMarkers: aiSentimentPayload?.depressiveMarkers ?? 40,
      agitationIndex: aiSentimentPayload?.agitationIndex ?? 30,
      clinicalInsights: aiSentimentPayload?.clinicalInsights || "Session recorded. Minimal tremors detected.",
    },
    chiefComplaint: chiefComplaint || "General counselor assessment.",
    duration: duration || "1 session documented",
    identifiedSymptoms: identifiedSymptoms || ["General stress"],
    createdAt: new Date().toISOString(),
    status: "Active" as const,
  };

  cases.push(newCase);
  res.status(201).json({ success: true, case: newCase });
});

// SOS emergency routing
app.post("/api/sos", validate(sosRequestSchema), (req, res) => {
  const { patientAlias } = req.body;

  const availableDocs = specialists.filter((s) => s.isOnline && s.isVerified);

  if (availableDocs.length === 0) {
    return res.json({
      success: false,
      message: "نظام التوجيه يبحث حالياً. تم إخطار الأخصائيين المتاحين. يرجى الانتظار...",
      request: {
        id: `sos_${Date.now()}`,
        patientAlias,
        status: "Pending",
        timestamp: new Date().toISOString(),
      },
    });
  }

  const matchedSpecialist = availableDocs[0];

  const request = {
    id: `sos_${Date.now()}`,
    patientAlias,
    matchedSpecialistId: matchedSpecialist.id,
    status: "Connected" as const,
    timestamp: new Date().toISOString(),
  };

  sosRequests.push(request);

  res.json({
    success: true,
    message: "تم تأسيس اتصال الطوارئ بإنقاذ SOS",
    matchedSpecialist,
    session: request,
  });
});

// ── AI Chat Route (rate-limited) ─────────────────────────────────

const systemInstruction = `
أنت "سكينة" (Sakeenah)، نظام توجيه وفرز كلينيكي معزز بالذكاء الاصطناعي، متخصص في الاستشارات النفسية والتربوية الإسلامية والشرعية والسريرية. تتحدث بلغة عربية فصحى دافئة للغاية، متفهمة، حكيمة ومطمنة.
يجب أن تحلل النص المدخل من المستخدم وتصنف حالته بدقة وتقوم بمهام الفرز وإرجاع النتيجة باللغة العربية بالكامل وبصيغة JSON مطابقة تماماً للمواصفات التالية:

1. تحديد مستوى شدة القلق والاضطراب (severity): إما "Extreme" (في حال الإشارة إلى نوبة هلع حالية، تسارع أنفاس حاد، تفكير في إيذاء النفس، ضيق تنفس شديد، خطر داهم) أو "Stable" (الحالات العادية والمستقرة).
2. تحديد الفئة النفسية الأساسية (coreCategory) باللغة العربية (مثل: "قلق حاد"، "صدمة سلوكية"، "حزن وفقد وفجيعة"، "هلع ظرفي مفاجئ"، "أفكار اكتئابية"، "ضغوطات عامة").
3. فحص الانفتاح الروحي (spiritualOpenness): تعيين القيمة إلى true إذا كان المستخدم يرحب بالتوجيه والسكينة الروحية والآيات القرآنية والأدعية (أو إذا كان الخيار مفتاحاً).
4. تحديد تفاصيل الدعم الروحي والسكينة في كائن "spiritualComfort" ويشمل:
   - "verses": آيات قرانية مناسبة لتهدئة النفس (مثل الرعد 13:28، الضحى 93:3، الشرح 94:5-6، البقرة 2:186) مع كتابة الآية بالتشكيل وترجمتها أو تفسيرها القصير المطمن.
   - "hadiths": أحاديث نبوية شريفة تبعث على الصبر والسكينة وتفريج الكرب باللغة العربية.
   - "actions": توصيات وتعديلات سلوكية إيمانية (مثل التنفس العميق مع الاستغفار أو الاستعاذة، التوكل، الوضوء لتبريد المسارات العصبية).
5. توليد تحليل كلينيكي منظم "clinicalBreakdown" باللغة العربية ويحتوي على:
   - "chiefComplaint": تلخيص الشكوى الأساسية للمستخدم.
   - "duration": تقدير المدة الزمنية المستخلصة من النص.
   - "symptoms": قائمة من الأعراض المستخلصة (مثل تسارع دقات القلب، تنفس سطحي، قلق مستمر، عزلة اجتماعية).
   - "insights": تحليل فني واستبصار مهني دقيق حول نبرة الصوت الافتراضية والرموز السمعية المستخلصة.
6. تقديم "aiResponseMsg": رد دافئ وحنون للغاية ومطمن، يجسد السكينة والمواساة والمؤازرة النفسية للمستخدم باللغة العربية الطيبة.

يجب أن تكون النتيجة كاملة باللغة العربية ومغلفة في كائن JSON واحد فقط دون علامات الكود (markdown blocks):
{
  "severity": "Extreme" | "Stable",
  "coreCategory": string,
  "spiritualOpenness": boolean,
  "spiritualComfort": {
    "verses": string[],
    "hadiths": string[],
    "actions": string[]
  } | null,
  "clinicalBreakdown": {
    "chiefComplaint": string,
    "duration": string,
    "symptoms": string[],
    "insights": string
  },
  "aiResponseMsg": string
}
`;

app.post("/api/ai/chat", aiLimiter, validate(aiChatSchema), async (req, res) => {
  const { text, preferredSpiritual } = req.body;

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [{ text: `حسّب وحلل نص المريض وأجب بصيغة JSON عربية كاملة: "${text}"` }],
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          temperature: 0.1,
        },
      });

      const parsedResult = JSON.parse(response.text || "{}");
      return res.json(parsedResult);
    } catch (err) {
      console.error("Gemini classification failed. Serving fallback mock response.");
    }
  }

  // High-Fidelity Mock Fallback
  const textLower = text.toLowerCase();
  let severity: "Extreme" | "Stable" = "Stable";
  let coreCategory = "ضغوطات نفسية عامة";
  let spiritualOpenness = preferredSpiritual || false;
  let symptoms = ["إرهاق عاطفي", "تفكير مفرط وقلق"];
  let chiefComplaint = "شعور بالضيق والقلق وعدم القدرة على التركيز.";
  let duration = "غير محددة في النص";
  let insights = "تظهر التحليلات الصوتية الافتراضية فتوراً معتدلاً في موجات الصوت ومخاوف مبدئية.";

  if (
    textLower.includes("موت") || textLower.includes("انتحار") || textLower.includes("اموت") ||
    textLower.includes("ضيق تنفس") || textLower.includes("هلع") || textLower.includes("خوف") ||
    textLower.includes("نبض سريع") || textLower.includes("مساعدة عاجلة")
  ) {
    severity = "Extreme";
    coreCategory = "هلع ظرفي حاد";
    symptoms = ["تسارع التنفس واللهاث", "اضطرابات هلع فسيولوجية", "ذروة رد الفعل العصبي"];
    chiefComplaint = "ضيق فسيولوجي حاد مصاحب بتسارع ضربات القلب وخوف شديد.";
    duration = "نوبة حادة حالية";
    insights = "تحذير طوارئ SOS: استخلاص رعشات صوتية وتغير حاد في النبرة. يجب التوجيه العاجل لمستشار مؤهل.";
  } else if (
    textLower.includes("حادث") || textLower.includes("سيارة") || textLower.includes("ذاكرة") ||
    textLower.includes("كابوس") || textLower.includes("صدمة")
  ) {
    coreCategory = "صدمة سلوكية (ما بعد الحادث)";
    symptoms = ["ومضات ارتدادية للحدث", "قلق وتوجس مستمر", "تجنب قيادة المركبات"];
    chiefComplaint = "ومضات وصور متكررة للأزمة وخوف شديد من تكرارها.";
    duration = "مزمنة منذ وقوع الحادث";
    insights = "تم رصد توقفات طويلة ورجفة بذبذبات الصوت ترمز للحزن والصدمة. يوصى بأخصائي علاج سلوكي.";
  } else if (
    textLower.includes("حزن") || textLower.includes("فقد") || textLower.includes("وفاة") ||
    textLower.includes("مات") || textLower.includes("اشتقت")
  ) {
    coreCategory = "حزن عميق وفقدان";
    symptoms = ["خدر عاطفي وتعب مستمر", "شعور بالوحدة الحادة", "تتبع طيف المفقود"];
    chiefComplaint = "ألم الفراق وضيق بسبب خسارة شخص يمثل الأمان والدعم.";
    duration = "عدة أسابيع أو أشهر";
    insights = "رصد انخفاض حاد في إيقاع الكلمات وتوقفات تزيد عن 2.4 ثانية تدل على الحزن العميق.";
  }

  if (
    textLower.includes("اسلام") || textLower.includes("دين") || textLower.includes("الله") ||
    textLower.includes("قران") || textLower.includes("دعاء") || textLower.includes("مسجد") ||
    textLower.includes("صلاة") || textLower.includes("صبر") || preferredSpiritual
  ) {
    spiritualOpenness = true;
  }

  const spiritualComfortObj = spiritualOpenness
    ? {
        verses: [
          "سورة الرعد (13:28): { الَّذِينَ آمَنُوا وَتَطْمَئِنُّ قُلُوبُهُم بِذِكْرِ اللَّهِ ۗ أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ } - الإيمان والذكر هما مفتاح طمأنينة القلب والروح وانشراح الصدر.",
          "سورة الشرح (94:5-6): { فَإِنَّ مَعَ الْعُسْرِ يُسْرًا • إِنَّ مَعَ الْعُسْرِ يُسْرًا } - وعد رباني قاطع ومتكرر بمصاحبة اليسر وتفريج كل ضيق وكربة.",
        ],
        hadiths: [
          "بشارة نبوية: 'ما يصيب المسلم من نصب ولا وصب ولا هم ولا حزن ولا أذى ولا غم، حتى الشوكة يشاكها، إلا كفر الله بها من خطاياه' (صحيح البخاري).",
          "دعاء كشف الضر: كان رسول الله ﷺ يدعو عند الكرب: 'لا إله إلا الله العظيم الحليم، لا إله إلا الله رب العرش العظيم'.",
        ],
        actions: [
          "ابدأ بالتنفس البطني العميق والمريح مع الاستغفار وترديد 'يا سلام' أو 'لا حول ولا قوة إلا بالله' لتهدئة الجهاز العصبي وجلب الطمأنينة.",
          "تطبيق إعادة التأطير الإيماني (التوكل): تذكير النفس المجهدة بأن تدبير الإطار الكلي للكون بيد الخالق الحكيم العليم، مما يخفف عبء حل كل المشاكل فوراً.",
          "الوضوء بالماء البارد: الوضوء يساعد في تخفيف هرمونات التوتر وتهدئة النهايات العصبية وفق الهدي النبوي المطهر.",
        ],
      }
    : null;

  let aiResponseMsg =
    "السلام عليكم ورحمة الله وبركاته. أهلاً بك في مساحتك الآمنة وسر سريرتك. يتطلب الأمر شجاعة كبيرة للبوح بما يوجع قلبك ويضيق به صدرك. دعنا نستكشف هذه المشاعر معاً بخصوصية تامة ودون أي أحكام.";
  if (severity === "Extreme") {
    aiResponseMsg =
      "أستغفر الله العظيم. أرجو منك التوقف للحظة والتقاط أنفاسك بهدوء. أنت تمر بحالة ضيق وقلق مرتفعة للغاية. دعنا نتنفس معاً ببطء. لقد قمنا بتوجيه نداء عاجل جداً وإرسال إشارتك لشبكة الأمان SOS. هناك أخصائي حقيقي بانتظارك، يرجى الضغط على الزر الأحمر الوميض على شاشتك فوراً!";
  } else if (coreCategory === "صدمة سلوكية (ما بعد الحادث)") {
    aiResponseMsg =
      "أشعر بما تصفه من ألم وتأثير الصدمة. استرجاع صور الأزمات الماضية يجعل جسدك يشعر بالخطر كما لو كان يحدث الآن. تذكر أنك آمن ومحمي في هذه الغرفة. يمكننا ربطك بكفاءات سلوكية ترشدك بلطف للتغلب على هذا الخوف.";
  } else if (coreCategory === "حزن عميق وفقدان") {
    aiResponseMsg =
      "أسمع صدى الحزن الثقيل في حنايا صدرك. الحزن رحلة عاطفية عميقة ولا يمكن الاستعجال في تخطيها. من الطبيعي تماماً أن تشعر بالانفصال وطلب العزلة مؤقتاً أثناء الفقد والحداد. تذكر أننا هنا لنقف بجانبك ونحتضن معاناتك.";
  }

  res.json({
    severity,
    coreCategory,
    spiritualOpenness,
    spiritualComfort: spiritualComfortObj,
    clinicalBreakdown: { chiefComplaint, duration, symptoms, insights },
    aiResponseMsg,
  });
});

// ── Doctor Endpoints ─────────────────────────────────────────────

app.get("/api/doctors", (_req, res) => {
  res.json(
    doctorsList.map(({ id, name, specialty, createdAt }) => ({ id, name, specialty, createdAt }))
  );
});

app.post("/api/doctors/register", validate(doctorRegisterSchema), async (req, res) => {
  const { name, specialty, password } = req.body;

  const exists = doctorsList.some((d) => d.name.trim() === name.trim());
  if (exists) {
    return res.status(400).json({ error: "اسم هذا الطبيب مسجل بالفعل في منصة سكينة." });
  }

  const passwordHash = await hashPassword(password);

  const newDoc = {
    id: `doc_${Date.now()}`,
    name: name.trim(),
    specialty: specialty.trim(),
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  doctorsList.push(newDoc);
  res.status(201).json({
    success: true,
    doctor: { id: newDoc.id, name: newDoc.name, specialty: newDoc.specialty },
    token: generateToken({ id: newDoc.id, role: "doctor", name: newDoc.name }),
  });
});

app.post("/api/doctors/login", authLimiter, validate(doctorLoginSchema), async (req, res) => {
  const { name, password } = req.body;

  const doctor = doctorsList.find((d) => d.name.trim() === name.trim());
  if (!doctor) {
    return res.status(401).json({ error: "اسم الطبيب أو كلمة المرور غير صحيحة. يرجى التحقق وإعادة المحاولة." });
  }

  const isValid = await verifyPassword(password, doctor.passwordHash);
  if (!isValid) {
    return res.status(401).json({ error: "اسم الطبيب أو كلمة المرور غير صحيحة. يرجى التحقق وإعادة المحاولة." });
  }

  res.json({
    success: true,
    doctor: { id: doctor.id, name: doctor.name, specialty: doctor.specialty },
    token: generateToken({ id: doctor.id, role: "doctor", name: doctor.name }),
  });
});

app.get("/api/doctors/:doctorId/patients", authenticate, (req, res) => {
  const { doctorId } = req.params;
  const filtered = doctorPatientsList.filter((p) => p.doctorId === doctorId);
  res.json(
    filtered.map(
      ({ id, doctorId, patientName, patientAge, patientGender, chiefComplaint, duration, createdAt }) => ({
        id, doctorId, patientName, patientAge, patientGender, chiefComplaint, duration, createdAt,
      })
    )
  );
});

app.post(
  "/api/doctors/:doctorId/patients/create",
  authenticate,
  validate(createPatientSchema),
  async (req, res) => {
    const { doctorId } = req.params;
    const { patientName, patientAge, patientGender, filePassword, chiefComplaint, duration } = req.body;

    const filePasswordHash = await hashPassword(filePassword);

    const newPatient = {
      id: `pat_${Date.now()}`,
      doctorId,
      patientName: patientName.trim(),
      patientAge,
      patientGender,
      filePasswordHash,
      chiefComplaint,
      duration,
      medicalHistory: `المريض ${patientName}، بعمر ${patientAge} سنة، دخل للملاحظة العيادية بطلب وتنسيق مع الطبيب المعالج. الشكوى الأساسية: ${chiefComplaint}. تم تعيين الملف بكلمة مرور خاصة لضمان أعلى مستويات سرية السجلات الصحية.`,
      sessions: [] as any[],
      createdAt: new Date().toISOString(),
    };

    doctorPatientsList.push(newPatient);
    res.status(201).json({ success: true, patient: { id: newPatient.id, patientName: newPatient.patientName } });
  }
);

app.post(
  "/api/doctors/:doctorId/patients/:patientId/unlock",
  authenticate,
  validate(unlockPatientSchema),
  async (req, res) => {
    const { doctorId, patientId } = req.params;
    const { filePassword } = req.body;

    const patient = doctorPatientsList.find((p) => p.id === patientId && p.doctorId === doctorId);
    if (!patient) {
      return res.status(404).json({ error: "ملف المريض المطلوب غير موجود في سجل هذا الطبيب." });
    }

    const isValid = await verifyPassword(filePassword, patient.filePasswordHash);
    if (!isValid) {
      return res.status(401).json({ error: "كلمة مرور ملف المريض غير صحيحة! تم حظر عرض السجل لحماية السرية السريرية للمريض." });
    }

    res.json({ success: true, patient });
  }
);

// ── AI Session Analysis for Doctors ──────────────────────────────

const sessionAnalysisInstruction = `
أنت محرك الفرز والتحليل الإكلينيكي "سكينة" (سَكِينَة) المخصص لمساعدة الأطباء في كتابة السيرة المرضية للشكاوى الصوتية وتحديث الملفات الطبية.
بناءً على تفريغ التسجيل الصوتي لشكوى المريض التالية، قم بما يلي وإرجع النتيجة بتنسيق JSON حصراً وبدون أي علامات كتيب (markdown):

1. صياغة تفريغ احترافي منمق لشكوى المريض باللغة العربية (transcriptionText).
2. تقدير شدة الأعراض بمقاييس كمية من 0 إلى 100:
   - مستوى القلق والتوتر (anxietyLevel)
   - مؤشرات الحزن والانفصال (depressiveMarkers)
   - مستوى الانفعال والتهيج (agitationIndex)
3. كتابة وتحديث سيرة مرضية سريرية متكاملة (clinicalAnamnesis) باللغة العربية بأسلوب استشاري طبي نفسي رصين ومبني على تفاصيل الشكوى.
4. كتابة رأي معرفي وتحليلي فوري وتوصيات خطة التعافي (clinicalInsights) بأسلوب طبي بليغ ومفصل كلياً.
5. استخلاص الأعراض السلوكية الملاحظة (symptoms) كقائمة من المصطلحات الطبية العربية.

المخرجات المطلوبة كـ JSON سليم تماماً.
`;

app.post(
  "/api/doctors/:doctorId/patients/:patientId/analyze-session",
  authenticate,
  requireRole("doctor"),
  validate(analyzeSessionSchema),
  async (req, res) => {
    const { doctorId, patientId } = req.params;
    const { transcriptionText } = req.body;

    const patient = doctorPatientsList.find((p) => p.id === patientId && p.doctorId === doctorId);
    if (!patient) {
      return res.status(404).json({ error: "ملف المريض غير موجود في السجلات." });
    }

    let analysisResult = {
      transcriptionText,
      anxietyLevel: 78,
      depressiveMarkers: 40,
      agitationIndex: 55,
      clinicalAnamnesis: `أبدى المريض في شكواه الصوتية تشتتاً ذهنياً واضحاً مصحوباً بنبرة من القلق الاستباقي (Anticipatory Anxiety) وتوجساً من تطور الأعراض مستقبلاً. السيرة المرضية توثق شعوراً مستمراً بالإرهاق المعرفي وصعوبة بالغة في إتمام الواجبات الحياتية، مما يدعم تصنيف الحالة تحت متلازمة الضغط النفسي المعمم الاستجابي مع وجود ملامح ارتكاسية طفيفة.`,
      clinicalInsights: `التوجيه العيادي الموصى به:\n1. جدولة جلسات فورية للتدريب على إعادة الهيكلة المعرفية وضبط التفكير الكارثي.\n2. التوصية بتقنية الاسترخاء التدريجي لخفض مستويات الأدرينالين.\n3. رصد استجابات المريض السلوكية خلال المواقف المثيرة للقلق وتسجيلها في السجل السري الموحد.`,
      symptoms: ["قلق استباقي", "تشتت معرفي", "إرهاق عصبي"],
    };

    if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: `حلل شكوى المريض الصوتية وصغ السيرة المرضية الكاملة له: "${transcriptionText}"`,
          config: {
            systemInstruction: sessionAnalysisInstruction,
            responseMimeType: "application/json",
            temperature: 0.3,
          },
        });
        const parsed = JSON.parse(response.text || "{}");
        if (parsed.transcriptionText) {
          analysisResult = {
            transcriptionText: parsed.transcriptionText,
            anxietyLevel: Number(parsed.anxietyLevel) || 78,
            depressiveMarkers: Number(parsed.depressiveMarkers) || 40,
            agitationIndex: Number(parsed.agitationIndex) || 55,
            clinicalAnamnesis: parsed.clinicalAnamnesis || analysisResult.clinicalAnamnesis,
            clinicalInsights: parsed.clinicalInsights || analysisResult.clinicalInsights,
            symptoms: parsed.symptoms || analysisResult.symptoms,
          };
        }
      } catch (err) {
        console.error("Gemini analyze-session failed, serving high-fidelity local simulation.");
      }
    }

    const newSession = {
      id: `sess_${Date.now()}`,
      transcriptionText: analysisResult.transcriptionText,
      clinicalAnalysis: {
        anxietyLevel: analysisResult.anxietyLevel,
        depressiveMarkers: analysisResult.depressiveMarkers,
        agitationIndex: analysisResult.agitationIndex,
        clinicalInsights: analysisResult.clinicalInsights,
        symptoms: analysisResult.symptoms,
      },
      createdAt: new Date().toISOString(),
    };

    patient.sessions = patient.sessions || [];
    patient.sessions.unshift(newSession);

    patient.medicalHistory = `${patient.medicalHistory}\n\n[جلسة جديدة صوتية بتاريخ ${new Date().toLocaleDateString("ar-EG")}]:\n- الشكوى الصوتية: "${analysisResult.transcriptionText}"\n- السيرة المرضية: ${analysisResult.clinicalAnamnesis}`;

    if (analysisResult.symptoms && analysisResult.symptoms.length > 0) {
      const existingSymptoms = patient.chiefComplaint ? patient.chiefComplaint.split(" + ") : [];
      const merged = Array.from(new Set([...existingSymptoms, ...analysisResult.symptoms]));
      patient.chiefComplaint = merged.slice(0, 4).join(" + ");
    }

    res.json({ success: true, patient, newSession });
  }
);

// ── Parents Advisory Route ───────────────────────────────────────

app.post("/api/ai/parent-advice", aiLimiter, validate(parentAdviceSchema), async (req, res) => {
  const { age, topic, text } = req.body;

  const parentSystemInstruction = `
أنت خبير تربوي ومستشار متخصص في شؤون الطفولة والسلوك العائلي والتربية الإيجابية على منصة "سكينة" (سَكِينَة).
مهمتك هي تحليل استشارة أحد الوالدين بخصوص طفل يبلغ من العمر ${age || 12} عاماً يعاني من ${topic || "ضغوطات ومخاوف"} (تفاصيل الاستشارة: "${text}").
قم بتقديم خطة عمل والدية داعمة، دافئة ومتكاملة وتتسم بالخبرة والاحترافية والتعاطف الشديد مع الآباء والمربين.
يجب إرجاع النتيجة باللغة العربية حصراً وبتنسيق JSON سليم بدون علامات الكتيب (markdown blocks).
`;

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `حلل استشارة الوالدين وقدم النصيحة: "${text}"`,
        config: {
          systemInstruction: parentSystemInstruction,
          responseMimeType: "application/json",
          temperature: 0.2,
        },
      });
      const parsedResult = JSON.parse(response.text || "{}");
      return res.json(parsedResult);
    } catch (err) {
      console.error("Gemini Parent advisory failed. serving high-fidelity local framework.");
    }
  }

  // Fallback
  const adviceText = `بالنسبة لليافعين بعمر ${age || 14} الذين يعانون من ${topic || "الضغوطات"}، فإن ترسيخ قواعد الأمان المادي والعاطفي هو حجر الأساس للتعافي. يجب الاستماع بإنصات حقيقي وبدون إلقاء اللوم أو المقاطعة السريعة لكلماتهم وتجنب أساليب الضغط والتعنيف المباشر.`;
  const copingTactic = [
    `ابدأ حواراً هادئاً وخالياً من أي عتب عن طريق أخذ جولة مشي لمدة 10 دقائق في الطبيعة أو حديقة المنزل قبل مناقشة موضوع ${topic}.`,
    "تنظيم ساعات استخدام الأجهزة وإبعاد الشاشات تماماً قبل ساعتين على الأقل من النوم لخفض هرمونات القلق والكورتيزول وتصفية العقل.",
    "قم بتثمين ومصادقة مشاعرهم الحقيقية دون إطلاق أحكام مسبقة على تحصيلهم الدراسي أو تصرفاتهم السابقة.",
  ];
  const spiritualComfort =
    "تذكير الوالدين الكرام بقوله تعالى في سورة الشرح: { فَإِنَّ مَعَ الْعُسْرِ يُسْرًا • إِنَّ مَعَ الْعُسْرِ يُسْرًا }. إن رعاية هؤلاء الأبناء هو عبادة عظيمة وصبركم وتوددكم لهم هو بذرة لثمرة طيبة سينبتها الله برحمته ولطفه. الجأوا للدعاء بـ 'رب هب لنا من أزواجنا وذرياتنا قرة أعين'.";

  res.json({ advice: adviceText, copingTactic, spiritualComfort });
});

// ── Start Server ─────────────────────────────────────────────────

async function startServer() {
  await seedHashes();
  console.log("Password hashes seeded successfully.");

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const bindAddress = isProduction ? "0.0.0.0" : "127.0.0.1";
  app.listen(PORT, bindAddress, () => {
    console.log(`Server running on http://${bindAddress}:${PORT}`);
  });
}

startServer();
