import { z } from "zod";

export const ProfileUpdateSchema = z.object({
  fullName: z.string().min(1).max(100).optional(),
  bio: z.string().max(500).optional(),
  institution: z.string().max(100).optional(),
  gradeOrYear: z.string().max(50).optional(),
  studentType: z.enum(["school", "college"]).optional(),
  skills: z.array(z.string()).optional(),
});

export const NoteCreateSchema = z.object({
  title: z.string().min(2).max(150),
  subject: z.string().min(2).max(80),
  semester: z.string().max(50).optional(),
  unit: z.string().max(50).optional(),
  fileUrl: z.string().url().optional(),
  description: z.string().max(1000).optional(),
});

export const NoteFilterSchema = z.object({
  query: z.string().optional(),
  subject: z.string().optional(),
  semester: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
});

export const BookmarkCreateSchema = z.object({
  itemType: z.enum(["note", "quiz", "subject", "pyq"]),
  itemId: z.string().min(1),
});

export const QuizAttemptCreateSchema = z.object({
  subject: z.string().min(1),
  topic: z.string().optional(),
  difficulty: z.enum(["Easy", "Medium", "Hard"]).optional(),
  score: z.number().int().min(0),
  total: z.number().int().min(1),
});

export const PlannerTaskCreateSchema = z.object({
  text: z.string().min(1).max(200),
  taskDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const PlannerTaskUpdateSchema = z.object({
  done: z.boolean().optional(),
  text: z.string().min(1).max(200).optional(),
});

export const StudyGoalUpdateSchema = z.object({
  dailyGoalMinutes: z.number().int().min(10).max(720),
});

export const CreditAwardSchema = z.object({
  activity: z.enum([
    "study_goal_completed",
    "daily_task_completed",
    "practice_questions",
    "quiz_completed",
    "mock_test_completed",
    "score_improved",
    "streak_milestone",
    "mistake_resolved",
  ]),
  refKey: z.string().optional(),
  description: z.string().optional(),
});

export const CreditSpendSchema = z.object({
  amount: z.number().int().positive(),
  purpose: z.string().min(2).max(200),
});

export const StudentFeedbackSchema = z.object({
  rating: z.number().int().min(1).max(5),
  message: z.string().min(5).max(2000),
});

export const CareerPlanGenerateSchema = z.object({
  interests: z.string().min(2).max(1000),
  marks: z.string().max(500).optional(),
  currentLevel: z.string().min(1).max(50),
  goal: z.string().max(500).optional(),
});

export const CameraSolveSchema = z.object({
  imageDataUrl: z.string().min(10),
  note: z.string().max(500).optional(),
});

export const LessonBuildSchema = z.object({
  pdfText: z.string().min(20),
  language: z.string().min(2).max(50),
  subject: z.string().optional(),
});

export const VivaTurnSchema = z.object({
  subject: z.string().min(1),
  mode: z.enum(["exam", "teach"]),
  persona: z.string().optional(),
  messages: z.array(
    z.object({
      role: z.enum(["examiner", "student"]),
      text: z.string(),
      persona: z.string().optional(),
    }),
  ),
  studentAnswer: z.string().min(1),
});

export const NgoPartnerCreateSchema = z.object({
  name: z.string().min(2).max(100),
  contactEmail: z.string().email().optional(),
  referralCode: z.string().min(3).max(20).toUpperCase(),
});

export const NgoImportStudentsSchema = z.object({
  partnerId: z.string().uuid(),
  emails: z.array(z.string().email()).min(1).max(500),
});

// ==========================================
// UDAAN MISSION SCHEMAS WITH PRIVACY SAFEGUARDS
// ==========================================

// Safeguards: Reject raw phone numbers (10 digits) and email addresses in community descriptions
const PHONE_PATTERN = /\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b|\b[6-9]\d{9}\b/;
const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;

export const UdaanResourceFilterSchema = z.object({
  query: z.string().optional(),
  classGrade: z.string().optional(),
  subject: z.string().optional(),
  language: z.enum(["en", "hi", "bilingual"]).optional(),
  resourceType: z.enum(["notes", "summary", "practice_questions", "quiz", "open_textbook"]).optional(),
  sourceType: z.enum(["official_open", "community_verified"]).optional(),
  limit: z.coerce.number().min(1).max(100).default(30),
  offset: z.coerce.number().min(0).default(0),
});

export const UdaanCommunityItemCreateSchema = z.object({
  title: z.string().min(3).max(100),
  category: z.enum(["books", "calculator", "stationery", "device"]),
  itemCondition: z.enum(["Brand New", "Gently Used", "Fair"]),
  generalArea: z
    .string()
    .min(3)
    .max(100)
    .refine(
      (val) => !PHONE_PATTERN.test(val) && !EMAIL_PATTERN.test(val),
      "General area must not contain phone numbers or email addresses. Specify only city, locality or general zone."
    ),
  safeHandoverPoint: z
    .string()
    .min(3)
    .max(120)
    .refine(
      (val) => !PHONE_PATTERN.test(val) && !EMAIL_PATTERN.test(val),
      "Handover point must be a public location (e.g., School Gate, Public Library, Community Hall) and must not include personal phone numbers."
    ),
  description: z
    .string()
    .min(5)
    .max(500)
    .refine(
      (val) => !PHONE_PATTERN.test(val) && !EMAIL_PATTERN.test(val),
      "For student safety, private phone numbers and personal emails are forbidden in public descriptions."
    ),
  listedByRole: z.enum(["Student", "Teacher", "Alumni Donor", "NGO Partner"]).default("Student"),
});

export const UdaanCommunityItemRequestSchema = z.object({
  preferredSafePoint: z
    .string()
    .min(2)
    .max(100)
    .refine(
      (val) => !PHONE_PATTERN.test(val),
      "Please designate a public school or library location for handover. Do not share raw personal numbers."
    ),
  message: z.string().min(3).max(300),
  requesterRole: z.enum(["Student", "Parent/Guardian", "Teacher"]).default("Student"),
});

export const UdaanCommunityReportSchema = z.object({
  reason: z.enum([
    "inappropriate_content",
    "contact_info_exposed",
    "misleading_condition",
    "safety_concern",
    "other",
  ]),
  details: z.string().min(3).max(500),
});

export const UdaanOpportunityFilterSchema = z.object({
  query: z.string().optional(),
  level: z.string().optional(),
  category: z.string().optional(),
});

export const UdaanAssistantQuerySchema = z.object({
  query: z.string().min(2).max(1000),
  subject: z.string().optional(),
  language: z.enum(["en", "hi"]).default("en"),
});

