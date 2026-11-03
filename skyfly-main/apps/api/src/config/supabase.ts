import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "./env.js";

let serviceClient: SupabaseClient | null = null;

/**
 * Returns a server-authoritative Supabase client (using service role key if available, else publishable key).
 */
export function getServiceClient(): SupabaseClient {
  const key = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_PUBLISHABLE_KEY;
  if (!serviceClient) {
    serviceClient = createClient(env.SUPABASE_URL, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return serviceClient;
}

/**
 * Returns a Supabase client scoped to an authenticated user's bearer token
 * so Row Level Security (RLS) policies and PostgreSQL auth.uid() functions are respected.
 */
export function getUserClient(token?: string): SupabaseClient {
  if (!token) {
    return getServiceClient();
  }

  return createClient(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
}

