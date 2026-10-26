import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  date,
  bigint,
  jsonb,
  unique,
  primaryKey,
  pgEnum,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const studentTypeEnum = pgEnum("student_type", ["school", "college"]);
export const appRoleEnum = pgEnum("app_role", ["student", "admin"]);

// 1. Profiles
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().notNull(),
  fullName: text("full_name"),
  username: text("username").unique(),
  avatarUrl: text("avatar_url"),
  bannerUrl: text("banner_url"),
  bio: text("bio"),
  studentType: studentTypeEnum("student_type"),
  institution: text("institution"),
  gradeOrYear: text("grade_or_year"),
  skills: text("skills").array().default(sql`'{}'::text[]`),
  streakCount: integer("streak_count").notNull().default(0),
  impactAccess: boolean("impact_access").notNull().default(false),
  impactPartnerId: uuid("impact_partner_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// 2. User Roles
export const userRoles = pgTable("user_roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  role: appRoleEnum("role").notNull().default("student"),
}, (t) => [
  unique().on(t.userId, t.role),
]);

// 3. Documents
export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  name: text("name").notNull(),
  folder: text("folder").notNull().default("General"),
  storagePath: text("storage_path").notNull(),
  mimeType: text("mime_type"),
  sizeBytes: bigint("size_bytes", { mode: "number" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// 4. Posts & Social
export const posts = pgTable("posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  likesCount: integer("likes_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const postLikes = pgTable("post_likes", {
  postId: uuid("post_id").notNull(),
  userId: uuid("user_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  primaryKey({ columns: [t.postId, t.userId] }),
]);

export const follows = pgTable("follows", {
  followerId: uuid("follower_id").notNull(),
  followingId: uuid("following_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  primaryKey({ columns: [t.followerId, t.followingId] }),
]);

// 5. Quiz Attempts
export const quizAttempts = pgTable("quiz_attempts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  subject: text("subject").notNull(),
  topic: text("topic"),
  difficulty: text("difficulty"),
  score: integer("score").notNull(),
  total: integer("total").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// 6. Bookmarks & Recent Views
export const bookmarks = pgTable("bookmarks", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  itemType: text("item_type").notNull(),
  itemId: text("item_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  unique().on(t.userId, t.itemType, t.itemId),
]);

export const recentViews = pgTable("recent_views", {
  userId: uuid("user_id").notNull(),
  itemType: text("item_type").notNull(),
  itemId: text("item_id").notNull(),
  viewedAt: timestamp("viewed_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  primaryKey({ columns: [t.userId, t.itemType, t.itemId] }),
]);

// 7. Planner Items & Daily Tasks
export const plannerItems = pgTable("planner_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  title: text("title").notNull(),
  date: date("date").notNull(),
  type: text("type").notNull().default("task"),
  subject: text("subject"),
  durationMinutes: integer("duration_minutes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const dailyTasks = pgTable("daily_tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  text: text("text").notNull(),
  done: boolean("done").notNull().default(false),
  taskDate: date("task_date").notNull().default(sql`current_date`),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const studyGoals = pgTable("study_goals", {
  userId: uuid("user_id").primaryKey().notNull(),
  dailyGoalMinutes: integer("daily_goal_minutes").notNull().default(60),
  studiedTodayMinutes: integer("studied_today_minutes").notNull().default(0),
  studiedOn: date("studied_on").notNull().default(sql`current_date`),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// 8. Mistakes & Career Plans
export const mistakes = pgTable("mistakes", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  subject: text("subject").notNull(),
  topic: text("topic"),
  question: text("question").notNull(),
  userAnswer: text("user_answer"),
  correctAnswer: text("correct_answer"),
  explanation: text("explanation"),
  source: text("source").notNull().default("quiz"),
  resolved: boolean("resolved").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const careerPlans = pgTable("career_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  interests: text("interests"),
  marks: text("marks"),
  currentLevel: text("current_level"),
  goal: text("goal"),
  planMarkdown: text("plan_markdown").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// 9. Viva & Mood Logs
export const vivaSessions = pgTable("viva_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  subject: text("subject").notNull(),
  transcript: jsonb("transcript").notNull().default(sql`'[]'::jsonb`),
  score: integer("score"),
  feedback: text("feedback"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const moodLogs = pgTable("mood_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  mood: text("mood").notNull(),
  source: text("source").notNull().default("mentor"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// 10. Learning Sessions & Materials
export const learningSessions = pgTable("learning_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  kind: text("kind"),
  minutes: integer("minutes").notNull().default(0),
  source: text("source"),
  topic: text("topic"),
  completedAt: timestamp("completed_at", { withTimezone: true }).notNull().defaultNow(),
});

export const studyMaterials = pgTable("study_materials", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  subject: text("subject").notNull(),
  course: text("course"),
  semester: text("semester"),
  unit: text("unit"),
  type: text("type").notNull(), // 'note' | 'pyq'
  description: text("description"),
  fileUrl: text("file_url").notNull(),
  uploadedBy: uuid("uploaded_by"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// 11. AI Threads
export const aiThreads = pgTable("ai_threads", {
  userId: uuid("user_id").notNull(),
  channel: text("channel").notNull(), // 'assistant' | 'teacher' | 'mentor' | 'classroom'
  messages: jsonb("messages").notNull().default(sql`'[]'::jsonb`),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  primaryKey({ columns: [t.userId, t.channel] }),
]);

// 12. Learning Credits & Wallet
export const creditEligibility = pgTable("credit_eligibility", {
  userId: uuid("user_id").primaryKey().notNull(),
  classLevel: text("class_level").notNull().default("college"),
  examTrack: text("exam_track"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const creditWallets = pgTable("credit_wallets", {
  userId: uuid("user_id").primaryKey().notNull(),
  balance: integer("balance").notNull().default(0),
  lifetimeEarned: integer("lifetime_earned").notNull().default(0),
  lifetimeSpent: integer("lifetime_spent").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const creditLedger = pgTable("credit_ledger", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  amount: integer("amount").notNull(),
  activity: text("activity").notNull(),
  description: text("description"),
  refKey: text("ref_key"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// 13. NGO & Impact Programs
export const ngoPartners = pgTable("ngo_partners", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  contactEmail: text("contact_email"),
  referralCode: text("referral_code").notNull().unique(),
  seededStudents: integer("seeded_students").notNull().default(0),
  seededActiveStudents: integer("seeded_active_students").notNull().default(0),
  studentsJoined: integer("students_joined").notNull().default(0),
  activeStudents: integer("active_students").notNull().default(0),
  invitedEmails: integer("invited_emails").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const impactApplications = pgTable("impact_applications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().unique(),
  schoolType: text("school_type").notNull(),
  incomeDeclared: boolean("income_declared").notNull().default(false),
  referralCode: text("referral_code"),
  partnerId: uuid("partner_id"),
  status: text("status").notNull().default("approved"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const ngoInvites = pgTable("ngo_invites", {
  id: uuid("id").primaryKey().defaultRandom(),
  partnerId: uuid("partner_id").notNull(),
  email: text("email").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  unique().on(t.partnerId, t.email),
]);

// 14. Feedback
export const studentFeedback = pgTable("student_feedback", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  rating: integer("rating").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const aiAccessBlocks = pgTable("ai_access_blocks", {
  userId: uuid("user_id").primaryKey().notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
