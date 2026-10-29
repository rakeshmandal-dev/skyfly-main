import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env.js";
import { requestIdMiddleware, errorHandler } from "./middleware/error-handler.js";
import { standardRateLimiter } from "./middleware/rate-limit.js";

// Routes
import { healthRouter } from "./routes/health.js";
import { meRouter } from "./routes/me.js";
import { notesRouter } from "./routes/notes.js";
import { bookmarksRouter } from "./routes/bookmarks.js";
import { subjectsRouter } from "./routes/subjects.js";
import { progressRouter } from "./routes/progress.js";
import { plannerRouter } from "./routes/planner.js";
import { quizzesRouter } from "./routes/quizzes.js";
import { mockTestsRouter } from "./routes/mock-tests.js";
import { pyqsRouter } from "./routes/pyqs.js";
import { learningSessionsRouter } from "./routes/learning-sessions.js";
import { mistakesRouter } from "./routes/mistakes.js";
import { careerPlansRouter } from "./routes/career-plans.js";
import { vivaSessionsRouter } from "./routes/viva-sessions.js";
import { aiRouter } from "./routes/ai.js";
import { creditsRouter } from "./routes/credits.js";
import { leaderboardRouter } from "./routes/leaderboard.js";
import { feedbackRouter } from "./routes/feedback.js";
import { impactRouter } from "./routes/impact.js";
import { certificatesRouter } from "./routes/certificates.js";
import { settingsRouter } from "./routes/settings.js";
import { networkRouter } from "./routes/network.js";
import { ngoRouter } from "./routes/ngo.js";
import { udaanRouter } from "./routes/udaan.js";

export const app = express();

// Security & baseline middleware
app.use(helmet());

const defaultTrustedOrigins = [
  "http://localhost:5173",
  "http://localhost:8080",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:8080",
  "http://127.0.0.1:3000",
];

const configuredOrigins =
  env.CORS_ORIGIN && env.CORS_ORIGIN !== "*"
    ? env.CORS_ORIGIN.split(",").map((s) => s.trim().replace(/\/$/, ""))
    : [];

const trustedOrigins = Array.from(new Set([...defaultTrustedOrigins, ...configuredOrigins]));

app.use(
  cors({
    origin: (requestOrigin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, same-origin, curl, server-to-server)
      if (!requestOrigin) {
        return callback(null, true);
      }

      const normalizedOrigin = requestOrigin.replace(/\/$/, "");

      if (trustedOrigins.includes(normalizedOrigin)) {
        return callback(null, true);
      }

      // In non-production or test, allow wildcards or local loopback patterns
      if (
        env.NODE_ENV !== "production" &&
        (env.CORS_ORIGIN === "*" ||
          /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(normalizedOrigin))
      ) {
        return callback(null, true);
      }

      return callback(
        new Error(`CORS blocked: Origin ${requestOrigin} is not in the trusted origins list.`)
      );
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "X-Request-ID"],
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(requestIdMiddleware);
app.use(standardRateLimiter);

// Mount API routes
app.use("/api", healthRouter);
app.use("/api", meRouter);
app.use("/api", notesRouter);
app.use("/api", bookmarksRouter);
app.use("/api", subjectsRouter);
app.use("/api", progressRouter);
app.use("/api", plannerRouter);
app.use("/api", quizzesRouter);
app.use("/api", mockTestsRouter);
app.use("/api", pyqsRouter);
app.use("/api", learningSessionsRouter);
app.use("/api", mistakesRouter);
app.use("/api", careerPlansRouter);
app.use("/api", vivaSessionsRouter);
app.use("/api", aiRouter);
app.use("/api", creditsRouter);
app.use("/api", leaderboardRouter);
app.use("/api", feedbackRouter);
app.use("/api", impactRouter);
app.use("/api", certificatesRouter);
app.use("/api", settingsRouter);
app.use("/api", networkRouter);
app.use("/api", ngoRouter);
app.use("/api", udaanRouter);

// Centralized error handler
app.use(errorHandler);

if (process.env.NODE_ENV !== "test") {
  const server = app.listen(env.PORT, () => {
    console.log(`[EduVault API] Server listening on port ${env.PORT} (env: ${env.NODE_ENV})`);
  });

  const shutdown = () => {
    console.log("[EduVault API] Graceful shutdown initiated...");
    server.close(() => {
      console.log("[EduVault API] Server closed.");
      process.exit(0);
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}
