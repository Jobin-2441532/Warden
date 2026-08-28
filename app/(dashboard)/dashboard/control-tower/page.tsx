import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ControlTower } from "./ControlTower";

export default async function ControlTowerPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch today's transactions initially
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const { data: initialTransactions } = await supabase
    .from("transactions")
    .select("*")
    .eq("merchant_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  // We could also fetch aggregate stats, but we can compute them on the client for recent data or fetch aggregates.
  // For this prototype, we'll just pass the initial list and do stats in the client.

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-serif">Control Tower</h1>
        <p className="text-muted">Real-time audit log of all AI transaction requests.</p>
      </header>

      <ControlTower merchantId={user.id} initialTransactions={initialTransactions || []} />
    </div>
  );
}
