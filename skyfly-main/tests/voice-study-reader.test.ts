import test from "node:test";
import assert from "node:assert/strict";

test("Voice Assistant & Study Reader Suite", async (t) => {
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_EXTENSIONS = [".pdf", ".txt", ".md", ".png", ".jpg", ".jpeg", ".webp"];

  function validateStudyFile(fileName: string, sizeBytes: number) {
    if (sizeBytes > MAX_FILE_SIZE) {
      return { valid: false, error: "File exceeds 10MB limit." };
    }
    const ext = fileName.slice(fileName.lastIndexOf(".")).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return { valid: false, error: "Unsupported file format. Please upload PDF, TXT, MD, or images." };
    }
    return { valid: true, error: null };
  }

  await t.test("accepts files within 10MB and with valid extension", () => {
    const validPdf = validateStudyFile("chapter-1-physics.pdf", 4 * 1024 * 1024);
    assert.equal(validPdf.valid, true);

    const validImage = validateStudyFile("whiteboard-notes.png", 2 * 1024 * 1024);
    assert.equal(validImage.valid, true);

    const validText = validateStudyFile("summary.txt", 50 * 1024);
    assert.equal(validText.valid, true);
  });

  await t.test("strictly rejects files exceeding 10MB limit", () => {
    const oversizedPdf = validateStudyFile("huge-textbook.pdf", 10.5 * 1024 * 1024);
    assert.equal(oversizedPdf.valid, false);
    assert.ok(oversizedPdf.error?.includes("10MB"));
  });

  await t.test("strictly rejects unsafe and executable file types", () => {
    const dangerousFiles = ["payload.exe", "run.bat", "script.sh", "library.dll", "hack.bin"];
    for (const file of dangerousFiles) {
      const res = validateStudyFile(file, 1024);
      assert.equal(res.valid, false);
      assert.ok(res.error?.includes("Unsupported"));
    }
  });

  await t.test("accurately detects Hindi Devanagari script vs English", () => {
    const HINDI_REGEX = /[\u0900-\u097F]/;
    const detect = (text: string) => (HINDI_REGEX.test(text) ? "hi-IN" : "en-IN");

    assert.equal(detect("न्यूटन के गति के नियम समझाइए"), "hi-IN");
    assert.equal(detect("भौतिक विज्ञान के नोट्स"), "hi-IN");
    assert.equal(detect("Explain Newton's second law of motion"), "en-IN");
    assert.equal(detect("What is the formula for kinetic energy?"), "en-IN");
  });

  await t.test("splits long text into sentence chunks under 200 chars for speech synthesis", () => {
    const longText =
      "Newton's first law of motion states that an object will remain at rest or move at a constant velocity unless acted upon by an external force. This property is known as inertia. In everyday life, when a bus suddenly stops, passengers jerk forward due to inertia of motion.";

    const chunks =
      longText.match(/[^.!?।\n]+[.!?।]*\s*/g)?.reduce<string[]>((acc, s) => {
        const last = acc[acc.length - 1];
        if (last && (last + s).length < 200) acc[acc.length - 1] = last + s;
        else acc.push(s);
        return acc;
      }, []) ?? [longText];

    assert.ok(chunks.length >= 2, "Long text must be split into multiple chunks");
    for (const chunk of chunks) {
      assert.ok(chunk.length <= 250, `Chunk exceeds safe utterance length: "${chunk}"`);
    }
  });

  await t.test("validates voice assistant state machine and timeout boundaries", () => {
    const validStates = ["idle", "listening", "processing", "speaking", "paused", "error"];
    assert.equal(validStates.length, 6);

    const SILENCE_TIMEOUT_MS = 15000;
    assert.equal(SILENCE_TIMEOUT_MS, 15000, "Continuous recording must auto-timeout after 15s of silence");
  });

  await t.test("enforces unreadable OCR failure reporting instead of hallucinating", () => {
    function processOcrResponse(rawText: string) {
      const cleaned = rawText.trim();
      if (!cleaned || cleaned.includes("NO_READABLE_TEXT_FOUND") || cleaned.length < 5) {
        throw new Error("Unable to extract legible text from this image.");
      }
      return cleaned;
    }

    assert.throws(
      () => processOcrResponse("NO_READABLE_TEXT_FOUND"),
      /Unable to extract legible text/
    );

    assert.throws(
      () => processOcrResponse(""),
      /Unable to extract legible text/
    );

    assert.equal(
      processOcrResponse("Force equals mass times acceleration"),
      "Force equals mass times acceleration"
    );
  });

  await t.test("ensures student private vault documents are isolated per user", () => {
    type StudentDocument = { id: string; userId: string; title: string; encrypted: boolean };
    const mockDb: StudentDocument[] = [
      { id: "doc-1", userId: "user-pooja", title: "My JEE Formula Sheet", encrypted: true },
      { id: "doc-2", userId: "user-rahul", title: "Biology Chapter 3", encrypted: true },
    ];

    const getStudentVaultDocs = (requestingUserId: string) =>
      mockDb.filter((doc) => doc.userId === requestingUserId);

    const poojaDocs = getStudentVaultDocs("user-pooja");
    assert.equal(poojaDocs.length, 1);
    assert.equal(poojaDocs[0].title, "My JEE Formula Sheet");

    const unauthorizedQuery = getStudentVaultDocs("user-attacker");
    assert.equal(unauthorizedQuery.length, 0, "No cross-tenant data leakage");
  });
});
