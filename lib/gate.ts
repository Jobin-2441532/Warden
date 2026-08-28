import { createClient } from "@/lib/supabase/server";

export async function evaluateTransaction(
  supabase: any,
  merchantId: string, 
  mandateId: string, 
  amount: number, 
  category: string,
  agentSessionId?: string
) {

  // 1. Fetch the active mandate
  const { data: mandate, error: mandateError } = await supabase
    .from("mandates")
    .select("*")
    .eq("id", mandateId)
    .eq("merchant_id", merchantId)
    .single();

  if (mandateError || !mandate) {
    const errorReason = "Denied: Mandate not found or does not belong to merchant.";
    await recordTransaction(supabase, merchantId, mandateId, amount, category, "denied", errorReason, agentSessionId);
    return { decision: "denied", reason: errorReason };
  }

  if (!mandate.is_active) {
    const errorReason = `Denied: Mandate "${mandate.name}" is currently inactive.`;
    await recordTransaction(supabase, merchantId, mandateId, amount, category, "denied", errorReason, agentSessionId);
    return { decision: "denied", reason: errorReason };
  }

  // 2. Check per-order limit
  if (mandate.max_amount_per_order && amount > mandate.max_amount_per_order) {
    const errorReason = `Denied: Transaction amount ($${amount}) exceeds the per-order limit of $${mandate.max_amount_per_order}.`;
    await recordTransaction(supabase, merchantId, mandateId, amount, category, "denied", errorReason, agentSessionId);
    return { decision: "denied", reason: errorReason };
  }

  // 3. Check allowed categories
  if (mandate.allowed_categories && mandate.allowed_categories.length > 0) {
    if (!mandate.allowed_categories.includes(category)) {
      const errorReason = `Denied: Category "${category}" is not approved under this mandate.`;
      await recordTransaction(supabase, merchantId, mandateId, amount, category, "denied", errorReason, agentSessionId);
      return { decision: "denied", reason: errorReason };
    }
  }

  // Fetch today's transactions to evaluate daily limits and velocity
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const { data: todayTxs, error: txError } = await supabase
    .from("transactions")
    .select("amount")
    .eq("merchant_id", merchantId)
    .eq("mandate_id", mandateId)
    .in("status", ["approved", "completed"])
    .gte("created_at", startOfDay.toISOString());

  const dailyTotal = (todayTxs || []).reduce((sum, tx) => sum + tx.amount, 0);
  const dailyCount = (todayTxs || []).length;

  // 4. Check daily amount limit
  if (mandate.max_daily_amount && (dailyTotal + amount) > mandate.max_daily_amount) {
    const errorReason = `Denied: Adding $${amount} would exceed the daily total limit of $${mandate.max_daily_amount} (Current: $${dailyTotal}).`;
    await recordTransaction(supabase, merchantId, mandateId, amount, category, "denied", errorReason, agentSessionId);
    return { decision: "denied", reason: errorReason };
  }

  // 5. Check daily transaction count (velocity limit)
  if (mandate.velocity_limit_per_day && dailyCount >= mandate.velocity_limit_per_day) {
    const errorReason = `Denied: Daily transaction velocity limit of ${mandate.velocity_limit_per_day} has been reached.`;
    await recordTransaction(supabase, merchantId, mandateId, amount, category, "denied", errorReason, agentSessionId);
    return { decision: "denied", reason: errorReason };
  }

  // If all checks pass, it's approved
  const successReason = "Approved: Transaction meets all mandate constraints.";
  const { data: tx } = await recordTransaction(supabase, merchantId, mandateId, amount, category, "approved", successReason, agentSessionId);
  
  return { decision: "approved", reason: successReason, transactionId: tx?.id };
}

async function recordTransaction(
  supabase: any,
  merchantId: string, 
  mandateId: string, 
  amount: number, 
  category: string,
  status: string,
  reasonText: string,
  agentSessionId?: string
) {
  return await supabase.from("transactions").insert([{
    merchant_id: merchantId,
    mandate_id: mandateId,
    amount,
    category,
    status,
    reason_text: reasonText,
    agent_session_id: agentSessionId
  }]).select().single();
}

export async function failTransaction(supabase: any, transactionId: string, errorMessage?: string) {
  const reasonText = errorMessage 
    ? `Payment failed after approval — no charge occurred, agent notified. (Error: ${errorMessage})`
    : "Payment failed after approval — no charge occurred, agent notified.";

  await supabase
    .from("transactions")
    .update({ 
      status: "failed", 
      reason_text: reasonText 
    })
    .eq("id", transactionId);
}
