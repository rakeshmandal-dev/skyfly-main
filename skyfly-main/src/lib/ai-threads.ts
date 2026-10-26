import { supabase } from "@/integrations/supabase/client";

export type ThreadChannel = "assistant" | "teacher" | "mentor" | "classroom";

/**
 * Loads persisted messages for a user and channel.
 * Uses Supabase database if authenticated, falls back gracefully to localStorage.
 */
export async function loadThread<T = unknown>(channel: ThreadChannel): Promise<T[]> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;

    if (user) {
      const { data, error } = await supabase
        .from("ai_threads")
        .select("messages")
        .eq("user_id", user.id)
        .eq("channel", channel)
        .maybeSingle();

      if (!error && data?.messages && Array.isArray(data.messages)) {
        return data.messages as T[];
      }
    }

    // Local fallback
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(`eduvault:thread:${channel}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed as T[];
      }
    }
  } catch (err) {
    console.warn(`[ai-threads] could not load thread for ${channel}:`, err);
  }
  return [];
}

/**
 * Persists messages for a user and channel.
 */
export async function saveThread<T = unknown>(channel: ThreadChannel, messages: T[]): Promise<void> {
  try {
    // Local storage persistence
    if (typeof window !== "undefined") {
      localStorage.setItem(`eduvault:thread:${channel}`, JSON.stringify(messages));
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;

    if (user) {
      await supabase.from("ai_threads").upsert(
        {
          user_id: user.id,
          channel,
          messages: messages as any,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,channel" },
      );
    }
  } catch (err) {
    console.warn(`[ai-threads] could not save thread for ${channel}:`, err);
  }
}
