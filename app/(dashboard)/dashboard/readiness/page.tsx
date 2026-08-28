import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ReadinessDashboard } from "./ReadinessDashboard";

export default async function ReadinessPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch historical scores ordered by time
  const { data: scores } = await supabase
    .from("readiness_scores")
    .select("*")
    .eq("merchant_id", user.id)
    .order("computed_at", { ascending: true });

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <ReadinessDashboard merchantId={user.id} initialScores={scores || []} />
    </div>
  );
}
