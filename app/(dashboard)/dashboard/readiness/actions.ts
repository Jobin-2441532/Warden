"use server"

import { createClient } from "@/lib/supabase/server";

export async function calculateReadinessScore(merchantId: string) {
  const supabase = await createClient();

  // Fetch related data
  const { data: catalog } = await supabase
    .from("catalogs")
    .select("*")
    .eq("merchant_id", merchantId)
    .single();

  const { data: mandates } = await supabase
    .from("mandates")
    .select("*")
    .eq("merchant_id", merchantId)
    .eq("is_active", true);

  const structuredData = catalog?.structured_json || [];
  const totalProducts = structuredData.length;

  let score = 0;
  const breakdown: any[] = [];

  // 1. Catalog completeness (30%)
  let completenessScore = 0;
  let cleanProducts = 0;
  if (totalProducts > 0) {
    cleanProducts = structuredData.filter((i: any) => !i._needsReview).length;
    completenessScore = Math.round((cleanProducts / totalProducts) * 30);
  }
  score += completenessScore;
  breakdown.push({
    title: "Catalog Completeness",
    points: completenessScore,
    maxPoints: 30,
    tip: totalProducts === 0 
      ? "Upload a catalog to get started." 
      : cleanProducts < totalProducts 
        ? `Fix missing critical fields on ${totalProducts - cleanProducts} products to gain +${30 - completenessScore} points.`
        : "Excellent, all products are fully structured.",
  });

  // 2. Policy clarity (20%)
  let policyScore = 0;
  let productsWithPolicy = 0;
  if (totalProducts > 0) {
    productsWithPolicy = structuredData.filter((i: any) => i.policy?.returns && i.policy.returns !== "Not specified").length;
    policyScore = Math.round((productsWithPolicy / totalProducts) * 20);
  }
  score += policyScore;
  breakdown.push({
    title: "Policy Clarity",
    points: policyScore,
    maxPoints: 20,
    tip: totalProducts === 0 
      ? "N/A" 
      : productsWithPolicy < totalProducts 
        ? `Add return policy data to ${totalProducts - productsWithPolicy} products to gain +${20 - policyScore} points.`
        : "Policies are crystal clear for AI buyers.",
  });

  // 3. Pricing/stock freshness (15%)
  let freshnessScore = 0;
  let tipFreshness = "Upload a catalog first.";
  if (catalog?.last_synced_at) {
    const daysSinceSync = (Date.now() - new Date(catalog.last_synced_at).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceSync <= 7) {
      freshnessScore = 15;
      tipFreshness = "Catalog synced recently. Keep it up!";
    } else if (daysSinceSync <= 30) {
      freshnessScore = 7;
      tipFreshness = "Catalog is getting stale. Re-sync to gain +8 points.";
    } else {
      freshnessScore = 0;
      tipFreshness = "Catalog is very old. AI buyers trust fresh data. Re-sync for +15 points.";
    }
  }
  score += freshnessScore;
  breakdown.push({
    title: "Data Freshness",
    points: freshnessScore,
    maxPoints: 15,
    tip: tipFreshness,
  });

  // 4. Mandate configured (15%)
  const hasMandates = mandates && mandates.length > 0;
  const mandateScore = hasMandates ? 15 : 0;
  score += mandateScore;
  breakdown.push({
    title: "Mandate Configuration",
    points: mandateScore,
    maxPoints: 15,
    tip: hasMandates 
      ? "Active spending limits are set." 
      : "Configure at least one active mandate to define AI spending boundaries for +15 points.",
  });

  // 5. Category coverage / structured taxonomy (20%)
  let categoryScore = 0;
  let categorizedProducts = 0;
  if (totalProducts > 0) {
    categorizedProducts = structuredData.filter((i: any) => i.category && i.category !== "Uncategorized").length;
    categoryScore = Math.round((categorizedProducts / totalProducts) * 20);
  }
  score += categoryScore;
  breakdown.push({
    title: "Taxonomy Coverage",
    points: categoryScore,
    maxPoints: 20,
    tip: totalProducts === 0 
      ? "N/A" 
      : categorizedProducts < totalProducts 
        ? `Categorize ${totalProducts - categorizedProducts} products correctly to gain +${20 - categoryScore} points.`
        : "Taxonomy is fully structured.",
  });

  const payload = {
    merchant_id: merchantId,
    score,
    breakdown_json: breakdown,
    computed_at: new Date().toISOString()
  };

  await supabase.from("readiness_scores").insert([payload]);

  return { success: true, score: payload };
}
