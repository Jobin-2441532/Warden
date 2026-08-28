import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CatalogManager } from "./CatalogManager";

export default async function CatalogPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch existing catalog
  const { data: catalog } = await supabase
    .from("catalogs")
    .select("*")
    .eq("merchant_id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-serif">Catalog Layer</h1>
        <p className="text-muted">Ingest and structure your product data for AI buyers.</p>
      </header>

      <CatalogManager initialCatalog={catalog} merchantId={user.id} />
    </div>
  );
}
