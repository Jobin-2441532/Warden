import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Simple DB ping
    const { error } = await supabase.from("merchants").select("id").limit(1);
    
    if (error) throw error;

    return new Response(JSON.stringify({ status: "healthy", db: "connected" }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ status: "unhealthy", error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
