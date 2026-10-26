import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  SUPABASE_URL: z.string().url().default("http://127.0.0.1:54321"),
  SUPABASE_PUBLISHABLE_KEY: z.string().min(1).default("dummy-publishable-key"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  LOVABLE_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  CORS_ORIGIN: z.string().default("*"),
});

export const env = envSchema.parse({
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV,
  SUPABASE_URL: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY: process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  LOVABLE_API_KEY: process.env.LOVABLE_API_KEY,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  CORS_ORIGIN: process.env.CORS_ORIGIN,
});
