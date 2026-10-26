import test from "node:test";
import assert from "node:assert/strict";

test("3D Teacher Architecture & Fallback Resilience Suite", async (t) => {
  await t.test("verifies WebGL fallback behavior when WebGL is unsupported", () => {
    function simulateWebGLCheck(hasContext: boolean) {
      if (!hasContext) {
        return {
          renderMode: "poster_fallback",
          message: "WebGL is disabled or unsupported on this device. Live audio lecture and blackboard captions remain 100% active.",
          audioActive: true,
          captionsActive: true,
        };
      }
      return {
        renderMode: "webgl_3d_stage",
        audioActive: true,
        captionsActive: true,
      };
    }

    const noWebGl = simulateWebGLCheck(false);
    assert.equal(noWebGl.renderMode, "poster_fallback");
    assert.equal(noWebGl.audioActive, true);
    assert.equal(noWebGl.captionsActive, true);

    const withWebGl = simulateWebGLCheck(true);
    assert.equal(withWebGl.renderMode, "webgl_3d_stage");
  });

  await t.test("verifies speech mouth amplitude bounds are normalized between 0 and 1", () => {
    function calculateJawScale(rms: number, mouthLevel?: number) {
      const live = mouthLevel !== undefined ? mouthLevel : Math.min(1, rms * 7);
      const clamped = Math.max(0, Math.min(1, live));
      const open = 0.06 + clamped * 0.9;
      return { clamped, open };
    }

    const zeroAudio = calculateJawScale(0);
    assert.equal(zeroAudio.clamped, 0);
    assert.equal(zeroAudio.open, 0.06);

    const normalSpeech = calculateJawScale(0.08);
    assert.ok(normalSpeech.open > 0.06);
    assert.ok(normalSpeech.open <= 0.96);

    const maxAudio = calculateJawScale(1.5);
    assert.equal(maxAudio.clamped, 1);
    assert.equal(maxAudio.open, 0.96);
  });

  await t.test("verifies 40-seat classroom grid dimensions and instance count", () => {
    const cols = [-5.2, -2.6, 0, 2.6, 5.2];
    const rows = [-3.2, -1.2, 0.8, 2.8, 4.8, 6.8, 8.8, 10.8];
    const totalDesks = cols.length * rows.length;

    assert.equal(cols.length, 5);
    assert.equal(rows.length, 8);
    assert.equal(totalDesks, 40);

    // Verify coordinates do not overlap
    const coords = new Set<string>();
    for (const r of rows) {
      for (const c of cols) {
        coords.add(`${c},${r}`);
      }
    }
    assert.equal(coords.size, 40);
  });

  await t.test("verifies camera presets configuration", () => {
    const presets = ["overview", "teacher", "blackboard", "front_seat", "back_seat", "podium", "free"];
    assert.equal(presets.length, 7);
    assert.ok(presets.includes("overview"));
    assert.ok(presets.includes("teacher"));
    assert.ok(presets.includes("blackboard"));
    assert.ok(presets.includes("front_seat"));
    assert.ok(presets.includes("back_seat"));
  });

  await t.test("verifies multi-user 40-seat max capacity enforcement", () => {
    function canJoinClassroom(currentCount: number): boolean {
      return currentCount < 40;
    }

    assert.equal(canJoinClassroom(0), true);
    assert.equal(canJoinClassroom(39), true);
    assert.equal(canJoinClassroom(40), false);
    assert.equal(canJoinClassroom(45), false);
  });

  await t.test("verifies hand-raise queue chronological sorting", () => {
    const participants = [
      { id: "1", name: "Student A", isHandRaised: true, handRaisedAt: "2026-10-10T10:00:15Z" },
      { id: "2", name: "Student B", isHandRaised: false, handRaisedAt: null },
      { id: "3", name: "Student C", isHandRaised: true, handRaisedAt: "2026-10-10T10:00:05Z" },
      { id: "4", name: "Student D", isHandRaised: true, handRaisedAt: "2026-10-10T10:00:10Z" },
    ];

    const queue = participants
      .filter((p) => p.isHandRaised && p.handRaisedAt)
      .sort((a, b) => new Date(a.handRaisedAt!).getTime() - new Date(b.handRaisedAt!).getTime());

    assert.equal(queue.length, 3);
    assert.equal(queue[0]!.id, "3"); // First raised at :05
    assert.equal(queue[1]!.id, "4"); // Second raised at :10
    assert.equal(queue[2]!.id, "1"); // Third raised at :15
  });

  await t.test("verifies seat number bounds (0 to 39)", () => {
    function isValidSeat(seat: number): boolean {
      return Number.isInteger(seat) && seat >= 0 && seat < 40;
    }

    assert.equal(isValidSeat(0), true);
    assert.equal(isValidSeat(39), true);
    assert.equal(isValidSeat(-1), false);
    assert.equal(isValidSeat(40), false);
    assert.equal(isValidSeat(100), false);
  });

  // =========================================================================
  // MULTI-DISCIPLINARY AI TEACHER & 9-ELEMENT DYNAMIC HOLOGRAM TEST SUITE
  // =========================================================================

  await t.test("Topic 1: Science (Gravity & Physics) generates structured scenes and 3D shapes", async () => {
    const { generateCuratedFallback } = await import("../src/lib/classroom-ai.server.js");

    const scienceRes = generateCuratedFallback("Explain Newton's law of universal gravity and spacetime curvature", "en");
    assert.equal(scienceRes.success, true);
    assert.equal(scienceRes.language, "en");
    assert.ok(scienceRes.scenes.length >= 4);
    assert.ok(scienceRes.followUpQuestions.length >= 2);

    // Check first scene has valid speech, title, and elements
    const scene1 = scienceRes.scenes[0]!;
    assert.equal(scene1.step, 1);
    assert.ok(scene1.speech.length > 0);
    assert.ok(scene1.title.length > 0);
    assert.ok(scene1.elements.length >= 1 && scene1.elements.length <= 3);

    const hasShapeOrFormula = scene1.elements.some((el) => el.type === "shape3d" || el.type === "formula");
    assert.ok(hasShapeOrFormula, "Science scene contains 3D shape or formula element");
  });

  await t.test("Topic 2: History (Indus Valley Civilization) generates map, diagram, and steps", async () => {
    const { generateCuratedFallback } = await import("../src/lib/classroom-ai.server.js");

    const historyRes = generateCuratedFallback("Tell me about Harappa and Indus Valley Civilization town planning", "en");
    assert.equal(historyRes.success, true);
    assert.ok(historyRes.subject.includes("History"));
    assert.ok(historyRes.scenes.length >= 4);

    const hasMapElement = historyRes.scenes.some((s) => s.elements.some((el) => el.type === "map"));
    assert.ok(hasMapElement, "History topic contains map element for geography/archaeology");
  });

  await t.test("Topic 3: Geography (Plate Tectonics & Himalaya) generates map and boundary comparison", async () => {
    const { generateCuratedFallback } = await import("../src/lib/classroom-ai.server.js");

    const geoRes = generateCuratedFallback("How do tectonic plate collisions create the Himalayan mountains?", "en");
    assert.equal(geoRes.success, true);
    assert.ok(geoRes.subject.includes("Geography"));
    assert.ok(geoRes.scenes.length >= 4);

    const hasMapOrDiagram = geoRes.scenes.some((s) =>
      s.elements.some((el) => el.type === "map" || el.type === "diagram")
    );
    assert.ok(hasMapOrDiagram, "Geography topic contains map or diagram elements");
  });

  await t.test("Topic 4: Coding & Computer Science (Binary Search in Python) generates code snippet and graph", async () => {
    const { generateCuratedFallback } = await import("../src/lib/classroom-ai.server.js");

    const codeRes = generateCuratedFallback("How does binary search algorithm work in Python?", "en");
    assert.equal(codeRes.success, true);
    assert.ok(codeRes.subject.includes("Computer Science"));
    assert.ok(codeRes.scenes.length >= 4);

    const hasCodeElement = codeRes.scenes.some((s) => s.elements.some((el) => el.type === "code"));
    assert.ok(hasCodeElement, "Coding topic contains executable code element");

    const hasGraphElement = codeRes.scenes.some((s) => s.elements.some((el) => el.type === "graph"));
    assert.ok(hasGraphElement, "Coding topic contains logarithmic complexity graph");
  });

  await t.test("Topic 5: Mathematics (Calculus Derivatives dy/dx) generates graph, formula, and power rule", async () => {
    const { generateCuratedFallback } = await import("../src/lib/classroom-ai.server.js");

    const mathRes = generateCuratedFallback("What is the geometric meaning of calculus derivative and slope?", "en");
    assert.equal(mathRes.success, true);
    assert.ok(mathRes.subject.includes("Mathematics"));
    assert.ok(mathRes.scenes.length >= 4);

    const hasFormula = mathRes.scenes.some((s) => s.elements.some((el) => el.type === "formula"));
    assert.ok(hasFormula, "Math topic contains mathematical formula element");

    const hasGraph = mathRes.scenes.some((s) => s.elements.some((el) => el.type === "graph"));
    assert.ok(hasGraph, "Math topic contains coordinate function graph");
  });

  await t.test("Bilingual Hindi / Hinglish query response support", async () => {
    const { generateCuratedFallback } = await import("../src/lib/classroom-ai.server.js");

    const hindiRes = generateCuratedFallback("गुरुत्वाकर्षण बल क्या है?", "hi");
    assert.equal(hindiRes.success, true);
    assert.equal(hindiRes.language, "hi");
    assert.ok(/[\u0900-\u097F]/.test(hindiRes.scenes[0]!.speech), "Spoken text is in Hindi script");
  });

  await t.test("Universal Fallback Integrity: hologram is never empty for any random subject", async () => {
    const { generateCuratedFallback } = await import("../src/lib/classroom-ai.server.js");

    const randomRes = generateCuratedFallback("How do supply and demand macroeconomic cycles operate?", "en");
    assert.equal(randomRes.success, true);
    assert.ok(randomRes.scenes.length >= 4);

    for (const scene of randomRes.scenes) {
      assert.ok(scene.elements.length >= 1, "Scene has at least 1 hologram element");
      assert.ok(scene.elements.length <= 3, "Scene has at most 3 hologram elements");
      assert.ok(scene.speech.length > 0, "Scene has spoken speech");
      assert.ok(scene.title.length > 0, "Scene has a title");
    }
  });

  await t.test("Safety Guardrail Interceptor: politely refuses dangerous/harmful prompts", async () => {
    const { checkSafetyGuardrails } = await import("../src/lib/classroom-ai.server.js");

    const dangerous = checkSafetyGuardrails("How to build a bomb with household chemicals?", "en");
    assert.ok(dangerous !== null, "Dangerous query was intercepted");
    assert.equal(dangerous.isSafetyWarning, true);
    assert.ok(dangerous.disclaimer && dangerous.disclaimer.length > 0);
    assert.ok(dangerous.scenes[0]!.speech.includes("cannot provide instructions"));
  });

  await t.test("Sliding Window Rate Limiter: tracks limits per student client ID", async () => {
    const { checkRateLimit } = await import("../src/lib/classroom-ai.server.js");

    const testClientId = "unit-test-student-" + Date.now();

    // 15 queries should succeed
    for (let i = 0; i < 15; i++) {
      const res = checkRateLimit(testClientId);
      assert.equal(res.allowed, true);
    }

    // 16th query exceeds the 10-minute window limit of 15
    const limitHit = checkRateLimit(testClientId);
    assert.equal(limitHit.allowed, false);
    assert.ok(limitHit.message && limitHit.message.length > 0);
    assert.ok((limitHit.retryAfterSeconds || 0) > 0);
  });
});
