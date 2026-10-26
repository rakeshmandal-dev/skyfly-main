import { supabase } from "@/integrations/supabase/client";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: { message: string; code?: string } }> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        success: false,
        error: json.error || { message: res.statusText || "Request failed" },
      };
    }
    return { success: true, data: json as T };
  } catch (err) {
    return {
      success: false,
      error: { message: (err as Error).message || "Network error" },
    };
  }
}

export const apiClient = {
  // Health
  getHealth: () => request<{ status: string }>("/health"),

  // User Profile
  getMe: () => request<{ user: Record<string, unknown> }>("/me"),
  updateProfile: (profile: Record<string, unknown>) =>
    request<{ profile: Record<string, unknown> }>("/me", {
      method: "PATCH",
      body: JSON.stringify(profile),
    }),

  // Notes
  getNotes: (params: { subject?: string; semester?: string; query?: string } = {}) => {
    const q = new URLSearchParams(params as Record<string, string>).toString();
    return request<{ notes: unknown[]; total: number }>(`/notes?${q}`);
  },
  createNote: (note: { title: string; subject: string; semester?: string; unit?: string; fileUrl?: string }) =>
    request<{ note: unknown }>("/notes", { method: "POST", body: JSON.stringify(note) }),
  deleteNote: (id: string) => request(`/notes/${id}`, { method: "DELETE" }),

  // Bookmarks
  getBookmarks: () => request<{ bookmarks: unknown[] }>("/bookmarks"),
  addBookmark: (itemType: string, itemId: string) =>
    request("/bookmarks", { method: "POST", body: JSON.stringify({ itemType, itemId }) }),
  removeBookmark: (id: string) => request(`/bookmarks/${id}`, { method: "DELETE" }),

  // Subjects & Catalog
  getSubjects: () => request<{ subjects: unknown[]; total: number }>("/subjects"),

  // Progress & Readiness
  getProgress: () => request<{ stats: Record<string, unknown> }>("/progress"),

  // Planner
  getPlanner: () => request<{ tasks: unknown[]; goal: Record<string, unknown> }>("/planner"),
  createTask: (text: string, taskDate?: string) =>
    request("/planner", { method: "POST", body: JSON.stringify({ text, taskDate }) }),
  updateTask: (id: string, updates: { done?: boolean; text?: string }) =>
    request(`/planner/${id}`, { method: "PATCH", body: JSON.stringify(updates) }),
  deleteTask: (id: string) => request(`/planner/${id}`, { method: "DELETE" }),
  updateStudyGoal: (dailyGoalMinutes: number) =>
    request("/planner/goal", { method: "PUT", body: JSON.stringify({ dailyGoalMinutes }) }),

  // Quizzes & Mock Tests
  getQuizzes: () => request<{ quizzes: unknown[]; total: number }>("/quizzes"),
  submitQuizAttempt: (quizId: string, attempt: { subject: string; topic?: string; score: number; total: number; difficulty?: string }) =>
    request(`/quizzes/${quizId}/attempts`, { method: "POST", body: JSON.stringify(attempt) }),
  getMockTests: () => request<{ tests: unknown[]; total: number }>("/mock-tests"),
  submitMockTestAttempt: (testId: string, attempt: { subject: string; score: number; total: number }) =>
    request(`/mock-tests/${testId}/attempts`, { method: "POST", body: JSON.stringify(attempt) }),
  getPyqs: (params: Record<string, string> = {}) => {
    const q = new URLSearchParams(params).toString();
    return request<{ papers: unknown[]; total: number }>(`/pyqs?${q}`);
  },

  // Mistakes
  getMistakes: (subject?: string) => request<{ mistakes: unknown[] }>(`/mistakes${subject ? `?subject=${subject}` : ""}`),
  resolveMistake: (id: string) =>
    request(`/mistakes/${id}`, { method: "PATCH", body: JSON.stringify({ resolved: true }) }),

  // Career
  getCareerPlans: () => request<{ plans: unknown[] }>("/career-plans"),
  generateCareerPlan: (data: { interests: string; marks?: string; currentLevel: string; goal?: string }) =>
    request<{ plan: unknown }>("/career-plans", { method: "POST", body: JSON.stringify(data) }),

  // Viva
  getVivaSessions: () => request<{ sessions: unknown[] }>("/viva-sessions"),
  vivaTurn: (data: { subject: string; mode: string; persona?: string; messages: unknown[]; studentAnswer: string }) =>
    request<{ examinerReply: string; persona: string }>("/viva-sessions/turn", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // AI Services
  aiChat: (messages: unknown[], systemPrompt?: string) =>
    request<{ reply: string }>("/ai/chat", { method: "POST", body: JSON.stringify({ messages, systemPrompt }) }),
  aiMentor: (messages: unknown[]) =>
    request<{ reply: string }>("/ai/mentor", { method: "POST", body: JSON.stringify({ messages }) }),
  aiLesson: (pdfText: string, language: string, subject?: string) =>
    request<{ lesson: unknown }>("/ai/lesson", {
      method: "POST",
      body: JSON.stringify({ pdfText, language, subject }),
    }),
  aiSolveImage: (imageDataUrl: string, note?: string) =>
    request<{ solution: Record<string, unknown> }>("/ai/solve-image", {
      method: "POST",
      body: JSON.stringify({ imageDataUrl, note }),
    }),
  aiSolveDocument: (documentText: string, query?: string) =>
    request<{ answer: string; chunksAnalyzed: number }>("/ai/solve-document", {
      method: "POST",
      body: JSON.stringify({ documentText, query }),
    }),

  // Credits
  getCredits: () => request<{ wallet: Record<string, unknown>; ledger: unknown[]; eligibility: Record<string, unknown> }>("/credits"),
  awardCredits: (activity: string, refKey?: string, description?: string) =>
    request("/credits/award", { method: "POST", body: JSON.stringify({ activity, refKey, description }) }),
  spendCredits: (amount: number, purpose: string) =>
    request("/credits/spend", { method: "POST", body: JSON.stringify({ amount, purpose }) }),

  // Leaderboard & Impact
  getLeaderboard: () => request<{ rankings: unknown[]; total: number }>("/leaderboard"),
  getImpact: () => request<{ totals: Record<string, unknown>; source: string }>("/impact"),

  // Feedback
  getFeedback: () => request<{ feedback: unknown[] }>("/feedback"),
  submitFeedback: (rating: number, message: string) =>
    request("/feedback", { method: "POST", body: JSON.stringify({ rating, message }) }),

  // Certificates & Settings
  getCertificates: () => request<{ certificates: unknown[]; total: number }>("/certificates"),
  getSettings: () => request<{ settings: Record<string, unknown> }>("/settings"),
  updateSettings: (settings: Record<string, unknown>) =>
    request("/settings", { method: "PATCH", body: JSON.stringify(settings) }),

  // Network
  getNetwork: () => request<{ peers: unknown[]; posts: unknown[] }>("/network"),
  followUser: (targetId: string) => request(`/network/follow/${targetId}`, { method: "POST" }),

  // NGO
  getNgoPartners: () => request<{ partners: unknown[] }>("/ngo/partners"),
  createNgoPartner: (partner: { name: string; contactEmail?: string; referralCode: string }) =>
    request("/ngo/partners", { method: "POST", body: JSON.stringify(partner) }),
  importNgoStudents: (partnerId: string, emails: string[]) =>
    request("/ngo/import-students", { method: "POST", body: JSON.stringify({ partnerId, emails }) }),
};
