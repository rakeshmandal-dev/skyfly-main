import type { Request, Response, NextFunction } from "express";
import { createClient, type User } from "@supabase/supabase-js";
import { env } from "../config/env.js";

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export interface AuthenticatedRequest extends Request {
  user?: User;
  userId?: string;
  userRole?: "student" | "admin";
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      error: { code: "UNAUTHORIZED", message: "Missing or malformed Authorization header" },
    });
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return res.status(401).json({
      success: false,
      error: { code: "UNAUTHORIZED", message: "Token not provided" },
    });
  }

  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      return res.status(401).json({
        success: false,
        error: { code: "INVALID_TOKEN", message: "Session expired or token invalid" },
      });
    }

    req.user = data.user;
    req.userId = data.user.id;
    req.userRole = (data.user.user_metadata?.role as "student" | "admin") || "student";
    next();
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: { code: "AUTH_VERIFICATION_FAILED", message: "Could not verify credentials" },
    });
  }
}

export function requireRole(role: "student" | "admin") {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Authentication required" },
      });
    }

    if (req.userRole !== role && req.userRole !== "admin") {
      return res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: `Requires ${role} permissions` },
      });
    }

    next();
  };
}
