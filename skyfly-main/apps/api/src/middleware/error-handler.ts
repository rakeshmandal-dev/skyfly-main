import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
  const reqId = crypto.randomUUID();
  req.headers["x-request-id"] = reqId;
  res.setHeader("X-Request-Id", reqId);
  next();
}

export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction) {
  const reqId = req.headers["x-request-id"] as string;

  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      requestId: reqId,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid request payload",
        details: err.errors.map((e) => ({ path: e.path.join("."), message: e.message })),
      },
    });
  }

  const status = (err as { status?: number }).status || 500;
  const message = (err as Error).message || "Internal server error";

  console.error(`[API Error][${reqId}] ${req.method} ${req.path}:`, err);

  res.status(status).json({
    success: false,
    requestId: reqId,
    error: {
      code: status === 500 ? "INTERNAL_SERVER_ERROR" : "REQUEST_FAILED",
      message: status === 500 ? "An unexpected error occurred. Please try again." : message,
    },
  });
}
