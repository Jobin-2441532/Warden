"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { saveMandate, toggleMandateStatus } from "./actions";
import { formatINR } from "@/lib/format";

export function MandateManager({ 
  merchantId, 
  initialMandates, 
  availableCategories 
}: { 
  merchantId: string; 
  initialMandates: any[]; 
  availableCategories: string[]; 
}) {
  const [mandates, setMandates] = useState<any[]>(initialMandates);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    id: "",
    name: "",
    maxAmountPerOrder: 0,
    maxDailyAmount: 0,
    velocityLimitPerDay: 0,
    allowedCategories: [] as string[],
    isActive: true,
  });

  const openEditor = (mandate?: any) => {
    if (mandate) {
      setEditingId(mandate.id);
      setFormData({
        id: mandate.id,
        name: mandate.name,
        maxAmountPerOrder: mandate.max_amount_per_order || 0,
        maxDailyAmount: mandate.max_daily_amount || 0,
        velocityLimitPerDay: mandate.velocity_limit_per_day || 0,
        allowedCategories: mandate.allowed_categories || [],
        isActive: mandate.is_active,
      });
    } else {
      setEditingId("new");
      setFormData({
        id: "",
        name: "",
        maxAmountPerOrder: 0,
        maxDailyAmount: 0,
        velocityLimitPerDay: 0,
        allowedCategories: [],
        isActive: true,
      });
    }
  };

  const closeEditor = () => {
    setEditingId(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await saveMandate(merchantId, formData);
    // Refresh page implicitly handled by Next.js revalidatePath, but we just trigger hard refresh for now
    window.location.reload();
  };

  const toggleCategory = (cat: string) => {
    setFormData((prev) => {
      if (prev.allowedCategories.includes(cat)) {
        return { ...prev, allowedCategories: prev.allowedCategories.filter((c) => c !== cat) };
      }
      return { ...prev, allowedCategories: [...prev.allowedCategories, cat] };
    });
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    await toggleMandateStatus(merchantId, id, !currentStatus);
    window.location.reload();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left: List of Mandates */}
      <div className="lg:col-span-1 space-y-4">
        <Button className="w-full" onClick={() => openEditor()}>
          + Create New Mandate
        </Button>
        {mandates.map((m) => (
          <Card 
            key={m.id} 
            className={`cursor-pointer transition-colors ${editingId === m.id ? 'border-accent ring-1 ring-accent' : 'border-muted/20'} bg-background-alt hover:border-foreground/30`}
            onClick={() => openEditor(m)}
          >
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <h3 className="font-bold">{m.name}</h3>
                <p className="text-xs text-muted">Per Order: {formatINR(m.max_amount_per_order)}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                {m.is_active ? <Badge variant="approved">Active</Badge> : <Badge variant="secondary">Inactive</Badge>}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-[10px] h-6 px-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleStatus(m.id, m.is_active);
                  }}
                >
                  Toggle
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {mandates.length === 0 && (
          <p className="text-muted text-sm text-center py-8">No mandates configured.</p>
        )}
      </div>

      {/* Right: Editor */}
      <div className="lg:col-span-2">
        {editingId ? (
          <Card className="bg-background-alt border-muted/20">
            <form onSubmit={handleSave}>
              <CardHeader>
                <CardTitle>{editingId === "new" ? "New Mandate" : "Edit Mandate"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-xs uppercase tracking-wide text-foreground">Mandate Name</label>
                  <input
                    type="text"
                    required
                    className="w-full mt-1 p-2 border border-muted/20 rounded bg-background"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs uppercase tracking-wide text-foreground">Max Amount / Order (₹)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      className="w-full mt-1 p-2 border border-muted/20 rounded bg-background"
                      value={formData.maxAmountPerOrder}
                      onChange={(e) => setFormData({ ...formData, maxAmountPerOrder: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wide text-foreground">Max Daily Amount (₹)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      className="w-full mt-1 p-2 border border-muted/20 rounded bg-background"
                      value={formData.maxDailyAmount}
                      onChange={(e) => setFormData({ ...formData, maxDailyAmount: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wide text-foreground">Velocity Limit (Max txs / day)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    className="w-full mt-1 p-2 border border-muted/20 rounded bg-background"
                    value={formData.velocityLimitPerDay}
                    onChange={(e) => setFormData({ ...formData, velocityLimitPerDay: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wide text-foreground mb-2 block">Allowed Categories</label>
                  {availableCategories.length === 0 ? (
                    <p className="text-sm text-muted">Upload a catalog first to map categories.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {availableCategories.map((cat) => (
                        <div
                          key={cat}
                          onClick={() => toggleCategory(cat)}
                          className={`cursor-pointer border px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                            formData.allowedCategories.includes(cat) 
                              ? "bg-accent text-foreground border-accent" 
                              : "bg-background text-muted border-muted/20 hover:border-foreground/30"
                          }`}
                        >
                          {cat}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <input 
                    type="checkbox" 
                    id="isActive" 
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                  <label htmlFor="isActive" className="text-sm">Active</label>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button variant="ghost" type="button" onClick={closeEditor}>Cancel</Button>
                <Button type="submit" disabled={isSaving}>{isSaving ? "Saving..." : "Save Mandate"}</Button>
              </CardFooter>
            </form>
          </Card>
        ) : (
          <div className="h-full min-h-[400px] flex items-center justify-center text-muted border-2 border-dashed border-muted/20 rounded-xl">
            Select a mandate to edit or create a new one.
          </div>
        )}
      </div>
    </div>
  );
}
