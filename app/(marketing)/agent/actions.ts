"use server"
import { createClient } from "@/lib/supabase/server";

export async function saveAgentTranscript(sessionId: string, messages: any[]) {
  const supabase = await createClient();
  await supabase
    .from("agent_sessions")
    .update({ transcript_json: messages, ended_at: new Date().toISOString() })
    .eq("id", sessionId);
}
