import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { type AddressInfo } from "node:net";
import { AIService } from "../apps/api/src/services/ai.service.js";
import { NoteCreateSchema, NoteFilterSchema, CreditSpendSchema } from "@eduvault/shared";

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

test("Negative Testing & Boundary Resilience Suite", async (t) => {
  await t.test("rejects malformed authorization header with 401", async () => {
    const res = await fetch(`${baseUrl}/api/me`, {
      headers: { Authorization: "InvalidTokenFormatWithoutBearer" },
    });
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.equal(body.error.code, "UNAUTHORIZED");
  });

  await t.test("rejects forged or expired bearer token with 401", async () => {
    const res = await fetch(`${baseUrl}/api/me`, {
      headers: { Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.fake_signature" },
    });
    assert.equal(res.status, 401);
  });

  await t.test("rejects empty note creation payload with validation error", () => {
    const result = NoteCreateSchema.safeParse({});
    assert.equal(result.success, false);
    if (!result.success) {
      assert.ok(result.error.errors.some(e => e.path.includes("title")));
    }
  });

  await t.test("rejects negative or fractional credit spends", () => {
    assert.equal(CreditSpendSchema.safeParse({ amount: -50, purpose: "test" }).success, false);
    assert.equal(CreditSpendSchema.safeParse({ amount: 12.34, purpose: "test" }).success, false);
  });

  await t.test("AI service falls back cleanly when API keys are unconfigured", async () => {
    const response = await AIService.generateChat([
      { role: "user", content: "Explain Newton's third law" }
    ]);
    assert.ok(typeof response === "string");
    assert.ok(response.length > 10);
    // Verified fallback content
    assert.ok(response.toLowerCase().includes("concept") || response.toLowerCase().includes("newton") || response.toLowerCase().includes("learning"));
  });

  await t.test("AI lesson generator produces structured fallback sections without crashing", async () => {
    const lesson = await AIService.buildClassroomLesson(
      "Electromagnetic Induction and Faraday's laws of induction with magnetic flux.",
      "en",
      "Physics"
    );

    assert.equal(lesson.subject, "Physics");
    assert.ok(Array.isArray(lesson.topics));
    assert.ok(lesson.topics.length > 0);
    assert.ok(lesson.topics[0].keyPoints.length > 0);
  });

  await t.test("rejects invalid NGO student import with missing emails", async () => {
    const res = await fetch(`${baseUrl}/api/ngo/import-students`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ partnerId: "ngo-1", studentEmails: [] }),
    });
    // Unauthenticated request receives 401
    assert.equal(res.status, 401);
  });
});
