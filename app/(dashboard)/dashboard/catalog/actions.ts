"use server"

import { createClient } from "@/lib/supabase/server";

export async function processCatalog(merchantId: string, rawData: any[], sourceType: string) {
  const supabase = await createClient();

  // Mocking the Structuring Engine (LLM / Rule-based normalization)
  const structuredItems = rawData.map((item: any, index: number) => {
    // Normalization rules
    const name = item.name || item.title || item.product_name || `Unknown Product ${index}`;
    const desc = item.description || item.desc || "";
    
    // Attempt to parse price
    let priceInr = 0;
    const rawPrice = item.price || item.mrp || item.cost;
    if (typeof rawPrice === 'number') priceInr = rawPrice;
    else if (typeof rawPrice === 'string') priceInr = parseFloat(rawPrice.replace(/[^\d.]/g, '')) || 0;

    const inStock = item.in_stock !== undefined 
      ? (String(item.in_stock).toLowerCase() === 'true' || item.in_stock === 1) 
      : (item.stock_quantity > 0);

    const isClean = name && priceInr > 0 && item.category;

    return {
      id: item.id || `prd_${Date.now()}_${index}`,
      name,
      description: desc,
      price_inr: priceInr,
      currency: "INR",
      category: item.category || "Uncategorized",
      in_stock: inStock,
      stock_quantity: parseInt(item.stock_quantity || item.qty || "0"),
      policy: {
        returns: item.returns_allowed ? "Allowed" : "Not specified",
        shipping: "Standard",
      },
      last_updated: new Date().toISOString(),
      _needsReview: !isClean // Internal flag for the UI
    };
  });

  const payload = {
    merchant_id: merchantId,
    raw_source_type: sourceType,
    structured_json: structuredItems,
    last_synced_at: new Date().toISOString()
  };

  // Upsert catalog
  const { data: existing } = await supabase
    .from("catalogs")
    .select("id")
    .eq("merchant_id", merchantId)
    .single();

  let result;
  if (existing) {
    result = await supabase
      .from("catalogs")
      .update(payload)
      .eq("id", existing.id)
      .select()
      .single();
  } else {
    result = await supabase
      .from("catalogs")
      .insert([payload])
      .select()
      .single();
  }

  return { success: !result.error, data: result.data };
}
