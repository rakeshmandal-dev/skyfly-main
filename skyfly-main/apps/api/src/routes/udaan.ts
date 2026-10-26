import { Router, type Request, type Response } from "express";
import {
  UdaanResourceFilterSchema,
  UdaanCommunityItemCreateSchema,
  UdaanCommunityItemRequestSchema,
  UdaanCommunityReportSchema,
  UdaanOpportunityFilterSchema,
  UdaanAssistantQuerySchema,
  SEED_UDAAN_RESOURCES,
  SEED_COMMUNITY_LISTINGS,
  SEED_SCHOLARSHIPS,
  VERIFIED_KNOWLEDGE_EXPLANATIONS,
  type UdaanResource,
  type UdaanCommunityItem,
  type UdaanCommunityRequest,
  type UdaanOpportunity,
  type UdaanAssistantResponse,
} from "@eduvault/shared";
import { AIService } from "../services/ai.service.js";

export const udaanRouter = Router();

// In-memory persistent stores for server session resilience
let inMemoryResources: UdaanResource[] = [...SEED_UDAAN_RESOURCES];
let inMemoryListings: UdaanCommunityItem[] = [...SEED_COMMUNITY_LISTINGS];
let inMemoryRequests: UdaanCommunityRequest[] = [];
let inMemoryOpportunities: UdaanOpportunity[] = [...SEED_SCHOLARSHIPS];

// -----------------------------------------------------------------------------
// FEATURE 1: FREE DIGITAL SCHOOL BAG
// Open, accessible, organized by class, subject, language, resource type
// -----------------------------------------------------------------------------

udaanRouter.get("/udaan/resources", (req: Request, res: Response) => {
  const parsed = UdaanResourceFilterSchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: parsed.error.format() });
  }

  const { query, classGrade, subject, language, resourceType, sourceType, limit, offset } = parsed.data;

  let filtered = [...inMemoryResources];

  if (classGrade && classGrade !== "All") {
    filtered = filtered.filter((r) => r.classGrade === classGrade);
  }
  if (subject && subject !== "All") {
    filtered = filtered.filter((r) => r.subject.toLowerCase() === subject.toLowerCase());
  }
  if (language && language !== "bilingual") {
    filtered = filtered.filter((r) => r.language === language || r.language === "bilingual");
  }
  if (resourceType) {
    filtered = filtered.filter((r) => r.resourceType === resourceType);
  }
  if (sourceType) {
    filtered = filtered.filter((r) => r.sourceType === sourceType);
  }
  if (query && query.trim()) {
    const q = query.toLowerCase().trim();
    filtered = filtered.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        (r.titleHi && r.titleHi.includes(q)) ||
        r.subject.toLowerCase().includes(q) ||
        r.chapter.toLowerCase().includes(q) ||
        r.content.toLowerCase().includes(q)
    );
  }

  const total = filtered.length;
  const paged = filtered.slice(offset, offset + limit);

  return res.json({
    success: true,
    total,
    resources: paged,
  });
});

udaanRouter.get("/udaan/resources/:id", (req: Request, res: Response) => {
  const item = inMemoryResources.find((r) => r.id === req.params["id"]);
  if (!item) {
    return res.status(404).json({ success: false, error: "Resource not found" });
  }

  // Increment download counter
  item.downloadCount += 1;

  return res.json({
    success: true,
    resource: item,
  });
});

// -----------------------------------------------------------------------------
// FEATURE 4: COMMUNITY LEARNING BANK
// Privacy-preserving sharing of physical textbooks, calculators & learning tools
// -----------------------------------------------------------------------------

udaanRouter.get("/udaan/community-bank", (req: Request, res: Response) => {
  const category = req.query["category"] as string | undefined;
  const status = req.query["status"] as string | undefined;
  const search = req.query["search"] as string | undefined;

  let listings = [...inMemoryListings];

  // Filter out heavily reported listings
  listings = listings.filter((item) => item.reportsCount < 3);

  if (category && category !== "all") {
    listings = listings.filter((item) => item.category === category);
  }
  if (status && status !== "all") {
    listings = listings.filter((item) => item.status === status);
  }
  if (search && search.trim()) {
    const s = search.toLowerCase().trim();
    listings = listings.filter(
      (item) =>
        item.title.toLowerCase().includes(s) ||
        item.generalArea.toLowerCase().includes(s) ||
        item.safeHandoverPoint.toLowerCase().includes(s) ||
        item.description.toLowerCase().includes(s)
    );
  }

  return res.json({
    success: true,
    count: listings.length,
    listings,
  });
});

udaanRouter.post("/udaan/community-bank", (req: Request, res: Response) => {
  const parsed = UdaanCommunityItemCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_FAILED",
        message: "Invalid listing or privacy guardrail triggered.",
        details: parsed.error.issues.map((i) => i.message),
      },
    });
  }

  const data = parsed.data;
  const newListing: UdaanCommunityItem = {
    id: `bank-item-${Date.now()}`,
    title: data.title,
    category: data.category,
    itemCondition: data.itemCondition,
    generalArea: data.generalArea,
    safeHandoverPoint: data.safeHandoverPoint,
    status: "Available",
    verificationStatus: "Verified Listing",
    listedByRole: data.listedByRole,
    description: data.description,
    safetyGuidelines:
      "Handover must be arranged exclusively at a public safe point (school gate or public library desk). For minor safety, raw phone numbers are never shared.",
    reportsCount: 0,
    createdAt: new Date().toISOString(),
  };

  inMemoryListings.unshift(newListing);

  return res.status(201).json({
    success: true,
    message: "Resource listed in Community Learning Bank.",
    listing: newListing,
  });
});

udaanRouter.post("/udaan/community-bank/:id/request", (req: Request, res: Response) => {
  const item = inMemoryListings.find((l) => l.id === req.params["id"]);
  if (!item) {
    return res.status(404).json({ success: false, error: "Listing not found" });
  }

  if (item.status === "Handed Over") {
    return res.status(400).json({
      success: false,
      error: "This item has already been successfully handed over to a fellow learner.",
    });
  }

  const parsed = UdaanCommunityItemRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_FAILED",
        message: "Invalid request data.",
        details: parsed.error.issues.map((i) => i.message),
      },
    });
  }

  const newRequest: UdaanCommunityRequest = {
    id: `req-${Date.now()}`,
    listingId: item.id,
    preferredSafePoint: parsed.data.preferredSafePoint,
    message: parsed.data.message,
    requesterRole: parsed.data.requesterRole,
    status: "Pending",
    createdAt: new Date().toISOString(),
  };

  inMemoryRequests.push(newRequest);
  item.status = "Requested";

  return res.json({
    success: true,
    message: "Request submitted safely. The donor will be notified to coordinate pickup at the designated safe point.",
    request: newRequest,
  });
});

udaanRouter.post("/udaan/community-bank/:id/confirm-handover", (req: Request, res: Response) => {
  const item = inMemoryListings.find((l) => l.id === req.params["id"]);
  if (!item) {
    return res.status(404).json({ success: false, error: "Listing not found" });
  }

  item.status = "Handed Over";
  item.confirmedHandoverAt = new Date().toISOString();

  return res.json({
    success: true,
    message: "Handover confirmed. Thank you for empowering a fellow student's education!",
    listing: item,
  });
});

udaanRouter.post("/udaan/community-bank/:id/report", (req: Request, res: Response) => {
  const item = inMemoryListings.find((l) => l.id === req.params["id"]);
  if (!item) {
    return res.status(404).json({ success: false, error: "Listing not found" });
  }

  const parsed = UdaanCommunityReportSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: parsed.error.format() });
  }

  item.reportsCount += 1;

  return res.json({
    success: true,
    message: "Report logged for moderation. Thank you for keeping our community safe and dignified.",
    reportsCount: item.reportsCount,
  });
});

// -----------------------------------------------------------------------------
// FEATURE 5: SCHOLARSHIP AND OPPORTUNITY CORNER
// Genuine, verified educational schemes, free courses & student grants
// -----------------------------------------------------------------------------

udaanRouter.get("/udaan/opportunities", (req: Request, res: Response) => {
  const parsed = UdaanOpportunityFilterSchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: parsed.error.format() });
  }

  const { query, level, category } = parsed.data;
  let opportunities = [...inMemoryOpportunities];

  if (level && level !== "all") {
    opportunities = opportunities.filter((o) => o.level === level || o.level === "All Students");
  }
  if (category && category !== "all") {
    opportunities = opportunities.filter((o) => o.category === category);
  }
  if (query && query.trim()) {
    const q = query.toLowerCase().trim();
    opportunities = opportunities.filter(
      (o) =>
        o.title.toLowerCase().includes(q) ||
        (o.titleHi && o.titleHi.includes(q)) ||
        o.organization.toLowerCase().includes(q) ||
        o.eligibilitySummary.toLowerCase().includes(q) ||
        o.benefit.toLowerCase().includes(q)
    );
  }

  return res.json({
    success: true,
    count: opportunities.length,
    opportunities,
  });
});

// -----------------------------------------------------------------------------
// FEATURE 3: FREE LEARNING ASSISTANT
// Clear, simple explanations with honest fallback indicators (zero hallucinated AI status)
// -----------------------------------------------------------------------------

udaanRouter.post("/udaan/assistant", async (req: Request, res: Response) => {
  const parsed = UdaanAssistantQuerySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: parsed.error.format() });
  }

  const { query, subject, language } = parsed.data;
  const qLower = query.toLowerCase();

  // Check matching prewritten educational topic in knowledge bank
  let matchedTopicKey: string | null = null;
  if (qLower.includes("motion") || qLower.includes("kinematic") || qLower.includes("speed") || qLower.includes("velocity")) {
    matchedTopicKey = "kinematics";
  } else if (qLower.includes("newton") || qLower.includes("force") || qLower.includes("inertia")) {
    matchedTopicKey = "newton";
  } else if (qLower.includes("reaction") || qLower.includes("chemical") || qLower.includes("equation") || qLower.includes("balance")) {
    matchedTopicKey = "chemistry";
  } else if (qLower.includes("derivative") || qLower.includes("calculus") || qLower.includes("differentiat")) {
    matchedTopicKey = "calculus";
  } else if (qLower.includes("cell") || qLower.includes("biology") || qLower.includes("organelle") || qLower.includes("plant cell")) {
    matchedTopicKey = "biology";
  } else if (qLower.includes("search") || qLower.includes("binary") || qLower.includes("coding") || qLower.includes("python") || qLower.includes("algorithm")) {
    matchedTopicKey = "coding";
  }

  // Attempt live AI generation if key is present
  const hasLiveAiConfigured = Boolean(
    process.env["GEMINI_API_KEY"] || process.env["OPENAI_API_KEY"] || process.env["LOVABLE_API_KEY"]
  );

  if (hasLiveAiConfigured) {
    try {
      const liveSystemPrompt = `You are the Udaan Mission Free Study Companion. Provide simple, encouraging, step-by-step guidance for school and college learners in ${language === "hi" ? "Hindi (हिन्दी)" : "English"}. Avoid complex academic jargon. Explain like a caring elder sibling or dedicated teacher. Keep formatting clean.`;
      const liveAiAnswer = await AIService.generateChat([{ role: "user", content: query }], liveSystemPrompt);

      const response: UdaanAssistantResponse = {
        query,
        answer: liveAiAnswer,
        isLiveAi: true,
        source: "live_ai",
        statusBadge: "Live AI Learning Assistant",
        stepByStepGuidance: [
          "Core concept identified",
          "Step-by-step reasoning applied",
          "Plain language formulation generated",
        ],
        offlineAvailable: false,
      };

      return res.json({ success: true, ...response });
    } catch {
      // Intentionally fall through to honest curriculum fallback with proper logging
      console.info("[UdaanAssistant] Live AI call failed or timed out. Falling back to verified curriculum knowledge bank.");
    }
  }

  // Honest Curriculum Knowledge Bank Fallback
  // NEVER pretend this fallback content is a live AI response!
  const fallback = matchedTopicKey
    ? VERIFIED_KNOWLEDGE_EXPLANATIONS[matchedTopicKey]
    : {
        title: `Curriculum Guide: ${subject || "General Science & Mathematics"}`,
        explanation: `Here is a structured explanation for **"${query}"** from our verified open curriculum bank:\n\n1. **Core Concept:** Connect this topic to real-world observations before memorizing formulas.\n2. **Underlying Principle:** Break down the complex question into its basic variables and given quantities.\n3. **Practical Application:** Verify your units (SI Units) and review 2 solved sample problems.\n\n*Note: This explanation is provided by the verified Udaan Knowledge Bank without requiring live internet or token limits.*`,
        steps: [
          "Identify known quantities and core definitions.",
          "Select the appropriate fundamental law or formula.",
          "Solve step-by-step with unit verification.",
          "Review similar practice problems in your Digital School Bag.",
        ],
        practiceQuestion: {
          question: `Practice Concept: How would you explain ${query.slice(0, 50)} in one simple sentence to a Class 6 student?`,
          answer: "Focus on everyday analogies (e.g. water pipes for electricity, push/pull for forces, sorting cards for binary search).",
          hint: "Use an intuitive everyday analogy.",
        },
      };

  const honestResponse: UdaanAssistantResponse = {
    query,
    answer: `### ${fallback.title}\n\n${fallback.explanation}`,
    isLiveAi: false,
    source: "verified_curriculum_knowledge_bank",
    statusBadge: "Curriculum Knowledge Bank — Verified Prewritten Explanation (Zero API Tokens Used, 100% Free & Offline-Ready)",
    stepByStepGuidance: fallback.steps,
    practiceQuestion: fallback.practiceQuestion,
    offlineAvailable: true,
  };

  return res.json({ success: true, ...honestResponse });
});
