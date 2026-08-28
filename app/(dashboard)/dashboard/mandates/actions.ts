"use server"

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function saveMandate(merchantId: string, payload: any) {
  const supabase = await createClient();

  const data = {
    merchant_id: merchantId,
    name: payload.name,
    max_amount_per_order: payload.maxAmountPerOrder,
    max_daily_amount: payload.maxDailyAmount,
    allowed_categories: payload.allowedCategories,
    velocity_limit_per_day: payload.velocityLimitPerDay,
    is_active: payload.isActive,
  };

  if (payload.id) {
    await supabase.from("mandates").update(data).eq("id", payload.id).eq("merchant_id", merchantId);
  } else {
    await supabase.from("mandates").insert([data]);
  }

  revalidatePath("/dashboard/mandates");
  return { success: true };
}

export async function toggleMandateStatus(merchantId: string, mandateId: string, isActive: boolean) {
  const supabase = await createClient();
  await supabase.from("mandates").update({ is_active: isActive }).eq("id", mandateId).eq("merchant_id", merchantId);
  revalidatePath("/dashboard/mandates");
}
