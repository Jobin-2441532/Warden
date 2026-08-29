"use server"
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export async function getDefaultMerchantAndCreateSession() {
  // Use service role to bypass RLS for the public storefront demo
  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, 
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Grab the first merchant (the demo merchant we seeded)
  const { data: merchant } = await supabase.from('merchants').select('id').limit(1).single();
  if (!merchant) return null;

  // Create a new session
  const { data: session } = await supabase.from('agent_sessions').insert([{ merchant_id: merchant.id }]).select('id').single();
  
  return {
    merchantId: merchant.id,
    sessionId: session?.id || null
  };
}

export async function saveAgentTranscript(sessionId: string, messages: any[]) {
  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, 
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  await supabase
    .from("agent_sessions")
    .update({ transcript_json: messages, ended_at: new Date().toISOString() })
    .eq("id", sessionId);
}
