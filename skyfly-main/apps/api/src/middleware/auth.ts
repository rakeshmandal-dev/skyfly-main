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
  token?: string;
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
    req.token = token;

    // Secure server-managed role resolution:
    // 1. Check server-protected app_metadata (cannot be tampered with by clients)
    // 2. Check service-role / database permissions
    // Do NOT rely on untrusted client-supplied user_metadata for admin authorization
    const appRole = (data.user.app_metadata?.role as "student" | "admin") ||
      (Array.isArray(data.user.app_metadata?.roles) && data.user.app_metadata.roles.includes("admin") ? "admin" : undefined);

    let resolvedRole: "student" | "admin" = appRole || "student";

    if (resolvedRole !== "admin" && env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const { data: roleRow } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.user.id)
          .eq("role", "admin")
          .maybeSingle();

        if (roleRow?.role === "admin") {
          resolvedRole = "admin";
        }
      } catch {
        // Fallback to student if role query fails
      }
    }

    req.userRole = resolvedRole;
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
