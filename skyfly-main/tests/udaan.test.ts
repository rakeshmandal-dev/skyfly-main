import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { type AddressInfo } from "node:net";
import {
  UdaanCommunityItemCreateSchema,
  UdaanCommunityItemRequestSchema,
  UdaanCommunityReportSchema,
  UdaanResourceFilterSchema,
  UdaanAssistantQuerySchema,
  SEED_UDAAN_RESOURCES,
  SEED_SCHOLARSHIPS,
  SEED_COMMUNITY_LISTINGS,
  VERIFIED_KNOWLEDGE_EXPLANATIONS,
} from "@eduvault/shared";

process.env.NODE_ENV = "test";
const { app } = await import("../apps/api/src/index.js");

let server: http.Server;
let baseUrl: string;

before(async () => {
  await new Promise<void>((resolve) => {
    server = http.createServer(app);
    server.listen(0, "127.0.0.1", () => {
      const addr = server.address() as AddressInfo;
      baseUrl = `http://127.0.0.1:${addr.port}`;
      resolve();
    });
  });
});

after(async () => {
  await new Promise<void>((resolve) => {
    server.close(() => resolve());
  });
});

test("UDAAN MISSION — Comprehensive Integration & Resilience Suite", async (t) => {
  // -------------------------------------------------------------
  // FEATURE 1: Free Digital School Bag & Resource Schema Verification
  // -------------------------------------------------------------
  await t.test("Feature 1: Seed resources contain valid open licenses and metadata", () => {
    assert.ok(SEED_UDAAN_RESOURCES.length >= 6, "Must provide a comprehensive seed set");
    for (const res of SEED_UDAAN_RESOURCES) {
      assert.ok(res.id, "Resource must have ID");
      assert.ok(res.title, "Resource must have title");
      assert.ok(res.classGrade, "Resource must specify classGrade");
      assert.ok(res.subject, "Resource must specify subject");
      assert.ok(["en", "hi", "bilingual"].includes(res.language), "Valid language code");
      assert.ok(["official_open", "community_verified"].includes(res.sourceType), "Distinguishes source type");
      assert.ok(res.openLicense, "Resource must declare open/educational license");
      assert.ok(res.content && res.content.length > 50, "Resource must contain readable content");
      assert.ok(res.fileSizeBytes > 0, "Resource must have positive fileSizeBytes");
    }
  });

  await t.test("Feature 1: ResourceFilterSchema validates query params correctly", () => {
    const validFilter = {
      classGrade: "Class 10",
      subject: "Science",
      language: "hi" as const,
      query: "प्रकाश",
    };
    const parsed = UdaanResourceFilterSchema.safeParse(validFilter);
    assert.equal(parsed.success, true);

    const invalidFilter = {
      language: "unsupported_lang",
    };
    const invalidParsed = UdaanResourceFilterSchema.safeParse(invalidFilter);
    assert.equal(invalidParsed.success, false);
  });

  await t.test("Feature 1: HTTP GET /api/udaan/resources returns filtered open curriculum", async () => {
    const res = await fetch(`${baseUrl}/api/udaan/resources?classGrade=Class 10`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.resources));
    assert.ok(body.resources.length > 0);
    for (const r of body.resources) {
      assert.equal(r.classGrade, "Class 10");
      assert.ok(r.openLicense, "All resources in Digital School Bag must have open educational licenses");
    }
  });

  await t.test("Feature 1: HTTP GET /api/udaan/resources/:id returns individual resource", async () => {
    const firstId = SEED_UDAAN_RESOURCES[0].id;
    const res = await fetch(`${baseUrl}/api/udaan/resources/${firstId}`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.resource.id, firstId);
    assert.ok(body.resource.content);
  });

  // -------------------------------------------------------------
  // FEATURE 2: Low-Internet and Offline Learning Integrity
  // -------------------------------------------------------------
  await t.test("Feature 2: Resources have valid offline storage calculation payloads", () => {
    for (const res of SEED_UDAAN_RESOURCES) {
      const serialized = JSON.stringify(res);
      const byteLength = new TextEncoder().encode(serialized).length;
      assert.ok(byteLength > 0);
      assert.ok(byteLength < 500000, "Content must remain lightweight for low-end devices");
    }
  });

  // -------------------------------------------------------------
  // FEATURE 3: Free Learning Assistant Honest Fallback
  // -------------------------------------------------------------
  await t.test("Feature 3: Verified Knowledge Bank has prewritten curriculum coverage", () => {
    const keys = Object.keys(VERIFIED_KNOWLEDGE_EXPLANATIONS);
    assert.ok(keys.length >= 3, "Must have at least 3 prewritten curriculum explanations");
    for (const key of keys) {
      const exp = VERIFIED_KNOWLEDGE_EXPLANATIONS[key];
      assert.ok(exp.title);
      assert.ok(exp.explanation && exp.explanation.length > 50);
      assert.ok(Array.isArray(exp.steps) && exp.steps.length > 0);
      assert.ok(exp.practiceQuestion.hint, "Must include supportive hint");
      assert.ok(exp.practiceQuestion.answer, "Must include step-by-step answer");
    }
  });

  await t.test("Feature 3: Assistant schema validates query requirements", () => {
    const validQuery = {
      query: "Explain photosynthesis simply with steps",
      subject: "Science",
      language: "en" as const,
    };
    const parsed = UdaanAssistantQuerySchema.safeParse(validQuery);
    assert.equal(parsed.success, true);

    const invalidQuery = {
      query: "a", // too short, requires min 2 chars
    };
    const invalidParsed = UdaanAssistantQuerySchema.safeParse(invalidQuery);
    assert.equal(invalidParsed.success, false);
  });

  await t.test("Feature 3: HTTP POST /api/udaan/assistant honest fallback behavior", async () => {
    const res = await fetch(`${baseUrl}/api/udaan/assistant`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: "What is kinematics and how do we calculate velocity?",
        subject: "Physics",
        language: "en",
      }),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.answer);
    assert.ok(body.source);
    // Since live AI keys are absent in standard test env, verify honest attribution
    if (!body.isLiveAi) {
      assert.equal(
        body.source,
        "verified_curriculum_knowledge_bank",
        "Transparently marks fallback content as verified curriculum knowledge bank"
      );
      assert.ok(
        body.statusBadge.includes("Curriculum Knowledge Bank"),
        "Provides clear status badge indicating zero API tokens used and verified prewritten content"
      );
    }
  });

  // -------------------------------------------------------------
  // FEATURE 4: Community Learning Bank — Privacy & Safety Guardrails
  // -------------------------------------------------------------
  await t.test("Feature 4: Rejects phone numbers in listing descriptions for student privacy", () => {
    const leakAttempt = {
      title: "Class 10 NCERT Math Book",
      category: "books" as const,
      itemCondition: "Fair" as const,
      generalArea: "Bhopal, MP Nagar",
      safeHandoverPoint: "Govt Boys Higher Secondary School MP Nagar Gate",
      description: "Book available. Call me on 9876543210 for pickup.",
    };
    const parsed = UdaanCommunityItemCreateSchema.safeParse(leakAttempt);
    assert.equal(parsed.success, false, "Must reject descriptions containing phone numbers");
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message;
      assert.ok(msg.includes("phone numbers"), "Expected privacy violation error message");
    }
  });

  await t.test("Feature 4: Rejects email addresses in listing descriptions", () => {
    const leakAttempt = {
      title: "Scientific Calculator FX-82MS",
      category: "calculator" as const,
      itemCondition: "Gently Used" as const,
      generalArea: "Indore, Vijay Nagar",
      safeHandoverPoint: "Public Central Library Vijay Nagar Gate",
      description: "Mail me at student123@gmail.com to take this.",
    };
    const parsed = UdaanCommunityItemCreateSchema.safeParse(leakAttempt);
    assert.equal(parsed.success, false, "Must reject descriptions containing email addresses");
  });

  await t.test("Feature 4: Rejects phone numbers in handover safe points", () => {
    const leakPoint = {
      preferredSafePoint: "Meet me at school gate or call 9876543210",
      message: "Need this geometry box for upcoming exams.",
    };
    const parsed = UdaanCommunityItemRequestSchema.safeParse(leakPoint);
    assert.equal(parsed.success, false, "Must reject preferred safe points containing phone numbers");
  });

  await t.test("Feature 4: Accepts valid privacy-preserving community listing", () => {
    const safeListing = {
      title: "CBSE Class 12 Chemistry Exemplar",
      category: "books" as const,
      itemCondition: "Gently Used" as const,
      generalArea: "Jaipur, Malviya Nagar",
      safeHandoverPoint: "Govt Senior Secondary School Main Gate Malviya Nagar",
      description: "Contains all solved exemplar questions for board practice. Clean pages.",
    };
    const parsed = UdaanCommunityItemCreateSchema.safeParse(safeListing);
    assert.equal(parsed.success, true);
  });

  await t.test("Feature 4: HTTP Community Bank Listing & Request Flow", async () => {
    // 1. Fetch listings
    const getRes = await fetch(`${baseUrl}/api/udaan/community-bank`);
    assert.equal(getRes.status, 200);
    const getBody = await getRes.json();
    assert.equal(getBody.success, true);
    assert.ok(getBody.listings.length > 0);

    // 2. Post valid listing
    const postRes = await fetch(`${baseUrl}/api/udaan/community-bank`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Stationery Geometry Box & Ruler",
        category: "stationery",
        itemCondition: "Gently Used",
        generalArea: "Lucknow, Alambagh",
        safeHandoverPoint: "Alambagh Public Library Entrance",
        description: "Full geometry set with compass, divider, and protractor.",
      }),
    });
    assert.equal(postRes.status, 201);
    const postBody = await postRes.json();
    assert.equal(postBody.success, true);
    assert.ok(postBody.listing.id);
    const createdId = postBody.listing.id;

    // 3. Post a safe request for that item
    const reqRes = await fetch(`${baseUrl}/api/udaan/community-bank/${createdId}/request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        preferredSafePoint: "Alambagh Public Library Entrance between 4 PM and 5 PM",
        message: "Need geometry box for upcoming class 10 board exam constructions.",
        requesterRole: "Student",
      }),
    });
    assert.equal(reqRes.status, 200);
    const reqBody = await reqRes.json();
    assert.equal(reqBody.success, true);
    assert.equal(reqBody.request.status, "Pending");

    // 4. Confirm handover
    const confirmRes = await fetch(`${baseUrl}/api/udaan/community-bank/${createdId}/confirm-handover`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    assert.equal(confirmRes.status, 200);
    const confirmBody = await confirmRes.json();
    assert.equal(confirmBody.success, true);
    assert.equal(confirmBody.listing.status, "Handed Over");

    // 5. Submit community moderation report
    const reportRes = await fetch(`${baseUrl}/api/udaan/community-bank/${createdId}/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reason: "other",
        details: "Testing moderation reporting pipeline.",
      }),
    });
    assert.equal(reportRes.status, 200);
    const reportBody = await reportRes.json();
    assert.equal(reportBody.success, true);
  });

  // -------------------------------------------------------------
  // FEATURE 5: Scholarship and Opportunity Corner
  // -------------------------------------------------------------
  await t.test("Feature 5: Seed scholarships have authentic official domains and criteria", () => {
    assert.ok(SEED_SCHOLARSHIPS.length >= 4);
    for (const opp of SEED_SCHOLARSHIPS) {
      assert.ok(opp.id);
      assert.ok(opp.title);
      assert.ok(opp.organization);
      assert.ok(opp.eligibilitySummary && opp.eligibilitySummary.length > 10, "Must have comprehensive eligibility");
      assert.ok(opp.benefit && opp.benefit.length > 5, "Must detail real benefits");
      assert.ok(opp.officialLink.startsWith("http"), "Must link to official portal");
      assert.ok(opp.verificationDate, "Must document verification date");
      assert.ok(Array.isArray(opp.applicationSteps) && opp.applicationSteps.length >= 2);
    }
  });

  await t.test("Feature 5: HTTP GET /api/udaan/opportunities returns verified schemes", async () => {
    const res = await fetch(`${baseUrl}/api/udaan/opportunities`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.opportunities));
    assert.ok(body.opportunities.length > 0);
  });
});
