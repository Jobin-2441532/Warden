import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { MandateManager } from "./MandateManager";

export default async function MandatesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: mandates } = await supabase
    .from("mandates")
    .select("*")
    .eq("merchant_id", user.id)
    .order("created_at", { ascending: false });

  // Get catalog categories to populate allowed_categories multi-select
  const { data: catalog } = await supabase
    .from("catalogs")
    .select("structured_json")
    .eq("merchant_id", user.id)
    .single();

  let categories = new Set<string>();
  if (catalog && catalog.structured_json) {
    catalog.structured_json.forEach((item: any) => {
      if (item.category && item.category !== "Uncategorized") {
        categories.add(item.category);
      }
    });
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-serif">Mandates</h1>
        <p className="text-muted">Define the spending boundaries for autonomous AI buyers.</p>
      </header>

      <MandateManager 
        merchantId={user.id} 
        initialMandates={mandates || []} 
        availableCategories={Array.from(categories)} 
      />
    </div>
  );
}
