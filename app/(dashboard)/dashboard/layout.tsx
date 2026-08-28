import Link from "next/link";
import { ShieldCheck, Database, Activity, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-background-alt border-r border-muted/20 flex flex-col p-6">
        <div className="mb-8">
          <Link href="/dashboard" className="text-2xl font-serif tracking-tight font-bold text-foreground">
            WARDEN
          </Link>
          {user && <p className="text-xs text-muted mt-2 truncate">{user.email}</p>}
        </div>

        <nav className="flex flex-col gap-2 flex-1">
          <Link href="/dashboard/catalog" className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium hover:bg-foreground/5 transition-colors">
            <Database size={16} className="text-muted" /> Catalog
          </Link>
          <Link href="/dashboard/readiness" className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium hover:bg-foreground/5 transition-colors">
            <Activity size={16} className="text-muted" /> Readiness Score
          </Link>
          <Link href="/dashboard/mandates" className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium hover:bg-foreground/5 transition-colors">
            <ShieldCheck size={16} className="text-muted" /> Mandates
          </Link>
          <Link href="/dashboard/control-tower" className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium hover:bg-foreground/5 transition-colors">
            <Lock size={16} className="text-muted" /> Control Tower
          </Link>
        </nav>

        <div className="pt-8 border-t border-muted/20">
          <Link href="/agent" target="_blank" className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-bold text-accent bg-accent/10 hover:bg-accent/20 transition-colors">
            Launch Agent →
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
