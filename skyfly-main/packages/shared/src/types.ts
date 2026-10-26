export type StudentType = "school" | "college";
export type AppRole = "student" | "admin";

export interface UserProfile {
  id: string;
  fullName: string | null;
  username: string | null;
  avatarUrl: string | null;
  bannerUrl?: string | null;
  bio?: string | null;
  studentType: StudentType | null;
  institution?: string | null;
  gradeOrYear?: string | null;
  skills: string[];
  streakCount: number;
  impactAccess: boolean;
  impactPartnerId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  id: string;
  title: string;
  subject: string;
  semester?: string | null;
  unit?: string | null;
  pages: number;
  downloads: number;
  featured?: boolean;
  popular?: boolean;
  fileUrl?: string;
  uploadedBy?: string | null;
  status?: "pending" | "approved" | "rejected";
  createdAt?: string;
}

export interface Bookmark {
  id: string;
  userId: string;
  itemType: "note" | "quiz" | "subject" | "pyq";
  itemId: string;
  createdAt: string;
}

export interface QuizQuestion {
  q: string;
  options: string[];
  answer: number; // 0-indexed
  explanation?: string;
}

export interface QuizSet {
  id: string;
  subject: string;
  topic: string;
  difficulty: "Easy" | "Medium" | "Hard";
  questions: QuizQuestion[];
}

export interface QuizAttempt {
  id: string;
  userId: string;
  subject: string;
  topic?: string | null;
  difficulty?: string | null;
  score: number;
  total: number;
  createdAt: string;
}

export interface PlannerTask {
  id: string;
  userId: string;
  text: string;
  done: boolean;
  taskDate: string;
  createdAt: string;
}

export interface StudyGoal {
  userId: string;
  dailyGoalMinutes: number;
  studiedTodayMinutes: number;
  studiedOn: string;
  updatedAt: string;
}

export interface MistakeRecord {
  id: string;
  userId: string;
  subject: string;
  topic?: string | null;
  question: string;
  userAnswer?: string | null;
  correctAnswer?: string | null;
  explanation?: string | null;
  source: string;
  resolved: boolean;
  createdAt: string;
}

export interface CareerPlanRecord {
  id: string;
  userId: string;
  interests?: string | null;
  marks?: string | null;
  currentLevel?: string | null;
  goal?: string | null;
  planMarkdown: string;
  createdAt: string;
}

export interface VivaSessionRecord {
  id: string;
  userId: string;
  subject: string;
  transcript: Array<{ role: "examiner" | "student"; text: string; persona?: string }>;
  score?: number | null;
  feedback?: string | null;
  createdAt: string;
}

export interface CreditWallet {
  userId: string;
  balance: number;
  lifetimeEarned: number;
  lifetimeSpent: number;
  updatedAt: string;
}

export interface CreditLedgerEntry {
  id: string;
  userId: string;
  amount: number;
  activity: string;
  description?: string | null;
  refKey?: string | null;
  createdAt: string;
}

export interface NgoPartner {
  id: string;
  name: string;
  contactEmail?: string | null;
  referralCode: string;
  studentsJoined: number;
  activeStudents: number;
  invitedEmails: number;
  createdAt: string;
}

export interface StudentFeedback {
  id: string;
  userId: string;
  rating: number;
  message: string;
  createdAt: string;
}

export interface ImpactTotals {
  students: number;
  questions: number;
  quizzes: number;
  sessions: number;
  accuracy: number | null;
}

// ==========================================
// UDAAN MISSION — Every Child Deserves to Learn
// ==========================================

export type UdaanClassGrade =
  | "Class 6"
  | "Class 7"
  | "Class 8"
  | "Class 9"
  | "Class 10"
  | "Class 11"
  | "Class 12"
  | "Foundation / College";

export type UdaanLanguage = "en" | "hi" | "bilingual";

export type UdaanResourceType =
  | "notes"
  | "summary"
  | "practice_questions"
  | "quiz"
  | "open_textbook";

export type UdaanSourceType = "official_open" | "community_verified";

export interface UdaanResource {
  id: string;
  title: string;
  titleHi?: string;
  classGrade: UdaanClassGrade;
  subject: string;
  chapter: string;
  language: UdaanLanguage;
  resourceType: UdaanResourceType;
  sourceType: UdaanSourceType;
  content: string; // Markdown formatted content for offline viewing
  fileSizeBytes: number;
  downloadCount: number;
  openLicense: string; // e.g. "Creative Commons BY-SA 4.0 / NCERT Open"
  verifiedBy?: string;
  createdAt: string;
}

export type UdaanItemCategory = "books" | "calculator" | "stationery" | "device";
export type UdaanItemCondition = "Brand New" | "Gently Used" | "Fair";
export type UdaanListingStatus = "Available" | "Requested" | "Handed Over";
export type UdaanRole = "Student" | "Teacher" | "Alumni Donor" | "NGO Partner";

export interface UdaanCommunityItem {
  id: string;
  title: string;
  category: UdaanItemCategory;
  itemCondition: UdaanItemCondition;
  generalArea: string; // Locality, City/District ONLY (no private street or house number)
  safeHandoverPoint: string; // E.g. Public Library, Govt School Gate, Panchayat Bhavan
  status: UdaanListingStatus;
  verificationStatus: "Verified Listing" | "Under Review";
  listedByRole: UdaanRole;
  description: string;
  safetyGuidelines: string;
  reportsCount: number;
  createdAt: string;
  confirmedHandoverAt?: string | null;
}

export interface UdaanCommunityRequest {
  id: string;
  listingId: string;
  preferredSafePoint: string;
  message: string;
  requesterRole: "Student" | "Parent/Guardian" | "Teacher";
  status: "Pending" | "Accepted" | "Completed" | "Declined";
  createdAt: string;
}

export interface UdaanCommunityReport {
  id: string;
  listingId: string;
  reason: "inappropriate_content" | "contact_info_exposed" | "misleading_condition" | "safety_concern" | "other";
  details: string;
  createdAt: string;
}

export interface UdaanOpportunity {
  id: string;
  title: string;
  titleHi?: string;
  organization: string;
  level: "Class 9-10" | "Class 11-12" | "College / Undergraduate" | "All Students";
  category: "Scholarship" | "Free Course" | "Competition / Fellowship";
  benefit: string;
  eligibilitySummary: string;
  officialLink: string;
  deadline: string;
  verificationDate: string;
  verificationStatus: "Official Verified" | "Annual Schedule Announced" | "Expired";
  applicationSteps: string[];
}

export interface UdaanAssistantResponse {
  query: string;
  answer: string;
  isLiveAi: boolean;
  source: "live_ai" | "verified_curriculum_knowledge_bank";
  statusBadge: string;
  stepByStepGuidance: string[];
  practiceQuestion?: {
    question: string;
    options?: string[];
    answer: string;
    hint: string;
  };
  offlineAvailable: boolean;
}

