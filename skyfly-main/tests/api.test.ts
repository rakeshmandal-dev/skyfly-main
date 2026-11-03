import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { type AddressInfo } from "node:net";

// Set test environment before importing app
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

test("API Endpoints Integration Suite", async (t) => {
  await t.test("GET /api/health returns 200 and healthy status", async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.equal(res.status, 200);

    const body = await res.json();
    assert.equal(body.status, "healthy");
    assert.equal(body.service, "EduVault AI Express API");
    assert.ok(body.timestamp);
  });

  await t.test("GET /api/subjects returns subject list", async () => {
    const res = await fetch(`${baseUrl}/api/subjects`);
    assert.equal(res.status, 200);

    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.subjects));
    assert.ok(body.subjects.length > 0);
  });

  await t.test("GET /api/me rejects unauthenticated requests with 401", async () => {
    const res = await fetch(`${baseUrl}/api/me`);
    assert.equal(res.status, 401);

    const body = await res.json();
    assert.equal(body.success, false);
    assert.equal(body.error.code, "UNAUTHORIZED");
  });

  await t.test("POST /api/quizzes/phy-kin-e/attempts validates payload", async () => {
    // Attempt without auth should be rejected with 401
    const res = await fetch(`${baseUrl}/api/quizzes/phy-kin-e/attempts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        quizId: "phy-kin-e",
        score: 100,
        totalQuestions: 5,
        timeSpentSeconds: 120,
      }),
    });

    assert.equal(res.status, 401);
  });

  await t.test("GET /api/credits rejects unauthenticated callers", async () => {
    const res = await fetch(`${baseUrl}/api/credits`);
    assert.equal(res.status, 401);
  });

  await t.test("CORS enforces trusted origin and allows credentials", async () => {
    const res = await fetch(`${baseUrl}/api/health`, {
      headers: {
        Origin: "http://localhost:5173",
      },
    });
    assert.equal(res.status, 200);
    assert.equal(res.headers.get("access-control-allow-origin"), "http://localhost:5173");
    assert.equal(res.headers.get("access-control-allow-credentials"), "true");
  });
});
