import { createClient } from "@/lib/supabase/server";
import { formatINR } from "@/lib/format";

export async function evaluateTransaction(
  merchantId: string, 
  mandateId: string, 
  amount: number, 
  category: string,
  agentSessionId?: string,
  adminSupabaseClient?: any
) {
  const supabase = adminSupabaseClient || await createClient();

  // 1. Fetch Mandate
  const { data: mandate, error: mandateError } = await supabase
    .from("mandates")
    .select("*")
    .eq("id", mandateId)
    .single();

  if (mandateError || !mandate) {
    return { status: "error", reason: "Mandate not found or inaccessible." };
  }

  // 2. Base Checks
  if (!mandate.is_active) {
    const errorReason = `Denied: Mandate "${mandate.name}" is currently inactive.`;
    await failTransaction(supabase, merchantId, mandateId, amount, category, errorReason, agentSessionId);
    return { status: "denied", reason: errorReason, failed_rule: "inactive", rule_value: 0, attempted_value: 0 };
  }

  if (amount > mandate.max_amount_per_order) {
    const errorReason = `Denied: Transaction amount (${formatINR(amount)}) exceeds the per-order limit of ${formatINR(mandate.max_amount_per_order)}.`;
    await failTransaction(supabase, merchantId, mandateId, amount, category, errorReason, agentSessionId, "max_amount_per_order", mandate.max_amount_per_order, amount);
    return { status: "denied", reason: errorReason, failed_rule: "max_amount_per_order", rule_value: mandate.max_amount_per_order, attempted_value: amount };
  }

  if (mandate.allowed_categories && mandate.allowed_categories.length > 0) {
    if (!mandate.allowed_categories.includes(category)) {
      const errorReason = `Denied: Category "${category}" is not approved under this mandate.`;
      await failTransaction(supabase, merchantId, mandateId, amount, category, errorReason, agentSessionId, "allowed_categories", 0, 0);
      return { status: "denied", reason: errorReason, failed_rule: "allowed_categories", rule_value: 0, attempted_value: 0 };
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

  const dailyTotal = (todayTxs || []).reduce((sum: number, tx: any) => sum + tx.amount, 0);
  const dailyCount = (todayTxs || []).length;

  // 4. Check daily amount limit
  if (dailyTotal + amount > mandate.max_daily_amount) {
    const errorReason = `Denied: Adding ${formatINR(amount)} would exceed the daily total limit of ${formatINR(mandate.max_daily_amount)} (Current: ${formatINR(dailyTotal)}).`;
    await failTransaction(supabase, merchantId, mandateId, amount, category, errorReason, agentSessionId, "max_daily_amount", mandate.max_daily_amount, dailyTotal + amount);
    return { status: "denied", reason: errorReason, failed_rule: "max_daily_amount", rule_value: mandate.max_daily_amount, attempted_value: dailyTotal + amount };
  }

  // 5. Check daily velocity limit
  if (dailyCount >= mandate.velocity_limit_per_day) {
    const errorReason = `Denied: Daily transaction velocity limit of ${mandate.velocity_limit_per_day} has been reached.`;
    await failTransaction(supabase, merchantId, mandateId, amount, category, errorReason, agentSessionId, "velocity_limit_per_day", mandate.velocity_limit_per_day, dailyCount + 1);
    return { status: "denied", reason: errorReason, failed_rule: "velocity_limit_per_day", rule_value: mandate.velocity_limit_per_day, attempted_value: dailyCount + 1 };
  }

  // If all checks pass, record approved intent (not captured yet, awaits payment)
  const { data: tx } = await supabase.from("transactions").insert([{
    merchant_id: merchantId,
    mandate_id: mandateId,
    amount,
    category,
    status: "approved",
    reason_text: "Approved: Transaction meets all mandate constraints.",
    agent_session_id: agentSessionId
  }]).select().single();

  return { status: "approved", transactionId: tx?.id };
}

async function failTransaction(
  supabase: any, 
  merchantId: string, 
  mandateId: string, 
  amount: number, 
  category: string, 
  reasonText: string,
  agentSessionId?: string,
  failedRule?: string,
  ruleValue?: number,
  attemptedValue?: number
) {
  return await supabase.from("transactions").insert([{
    merchant_id: merchantId,
    mandate_id: mandateId,
    amount,
    category,
    status: "denied",
    reason_text: reasonText,
    agent_session_id: agentSessionId,
    failed_rule: failedRule,
    rule_value: ruleValue,
    attempted_value: attemptedValue
  }]).select().single();
}

export async function markTransactionFailed(supabase: any, transactionId: string, errorMessage?: string) {
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
