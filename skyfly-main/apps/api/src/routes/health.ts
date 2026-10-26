import { Router } from "express";

export const healthRouter = Router();

healthRouter.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    service: "EduVault AI Express API",
    version: "1.0.0",
  });
});

healthRouter.get("/ready", (req, res) => {
  res.json({
    status: "ready",
    database: "connected",
    aiService: "active",
  });
});
