import { supabase } from "@/integrations/supabase/client";
export async function recordLearningSession(kind: "voice" | "classroom" | "audio", id: string = crypto.randomUUID()) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const { error } = await supabase.from("learning_sessions").insert({ id, user_id: user.id, kind });
  if (error && error.code !== "23505") throw new Error(error.message);
}
