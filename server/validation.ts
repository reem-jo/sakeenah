import { z } from "zod";

export const registerSpecialistSchema = z.object({
  fullName: z.string().min(2).max(100).trim(),
  roleType: z.enum(["Psychologist", "Counselor"]),
  experienceYears: z.coerce.number().int().min(0).max(60).default(3),
  specialties: z.array(z.string().max(100)).optional().default(["General Support"]),
  base64License: z.string().max(10 * 1024 * 1024).optional(), // 10MB limit
});

export const moodEntrySchema = z.object({
  emoji: z.string().max(10).optional().default("😐"),
  note: z.string().max(2000).optional().default(""),
});

export const verifyPinSchema = z.object({
  caseId: z.string().min(1).max(100),
  pinCode: z.string().min(1).max(20),
});

export const createCaseSchema = z.object({
  patientAlias: z.string().min(1).max(100),
  specialistId: z.string().min(1).max(100),
  secureFolderPin: z.string().min(4).max(20),
  aiTranscriptionText: z.string().max(10000).optional(),
  aiSentimentPayload: z.object({
    anxietyLevel: z.number().min(0).max(100).optional(),
    depressiveMarkers: z.number().min(0).max(100).optional(),
    agitationIndex: z.number().min(0).max(100).optional(),
    clinicalInsights: z.string().max(2000).optional(),
  }).optional(),
  chiefComplaint: z.string().max(500).optional(),
  duration: z.string().max(200).optional(),
  identifiedSymptoms: z.array(z.string().max(200)).max(20).optional(),
});

export const sosRequestSchema = z.object({
  patientAlias: z.string().min(1).max(100),
  currentAnxiety: z.number().min(0).max(100).optional(),
});

export const aiChatSchema = z.object({
  text: z.string().min(1).max(10000).trim(),
  history: z.array(z.any()).max(100).optional(),
  preferredSpiritual: z.boolean().optional().default(true),
});

export const doctorRegisterSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  specialty: z.string().min(2).max(200).trim(),
  password: z.string().min(4).max(100),
});

export const doctorLoginSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  password: z.string().min(1).max(100),
});

export const createPatientSchema = z.object({
  patientName: z.string().min(1).max(100).trim(),
  patientAge: z.coerce.number().int().min(0).max(150).default(30),
  patientGender: z.enum(["ذكر", "أنثى", "غير محدد"]).default("غير محدد"),
  filePassword: z.string().min(4).max(100),
  chiefComplaint: z.string().max(1000).optional().default("تحت التقييم السلوكي المبدئي"),
  duration: z.string().max(200).optional().default("حديث الانتساب"),
});

export const unlockPatientSchema = z.object({
  filePassword: z.string().min(1).max(100),
});

export const analyzeSessionSchema = z.object({
  transcriptionText: z.string().min(1).max(10000),
});

export const parentAdviceSchema = z.object({
  age: z.coerce.number().int().min(1).max(25).default(12),
  topic: z.string().max(100).optional(),
  text: z.string().min(1).max(10000).trim(),
});
