"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export function OnboardingWizard() {
  const [step, setStep] = useState(1);
  const router = useRouter();

  // State for form fields (basic implementation)
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    website: "",
    catalogFile: null,
    maxAmount: 100,
    dailyLimit: 1000,
    allowedCategories: "",
  });

  const handleNext = () => setStep((s) => Math.min(s + 1, 4));
  const handlePrev = () => setStep((s) => Math.max(s - 1, 1));

  const handleComplete = async () => {
    // Here we would submit the data to an API route to update merchant profile and onboarding_status
    // For now, we simulate success and redirect
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl bg-background-alt">
        <CardHeader>
          <div className="flex items-center gap-2 mb-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`h-2 flex-1 rounded-full ${
                  step >= i ? "bg-accent" : "bg-muted/30"
                }`}
              />
            ))}
          </div>
          <CardTitle>
            {step === 1 && "Business Details"}
            {step === 2 && "Connect Catalog"}
            {step === 3 && "Set Mandate Defaults"}
            {step === 4 && "Ready to Go"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="text-xs uppercase tracking-wide text-foreground">Business Name</label>
                <input
                  type="text"
                  className="w-full mt-1 p-2 border border-muted/20 rounded bg-background"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-foreground">Category</label>
                <input
                  type="text"
                  className="w-full mt-1 p-2 border border-muted/20 rounded bg-background"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-foreground">Website</label>
                <input
                  type="url"
                  className="w-full mt-1 p-2 border border-muted/20 rounded bg-background"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-muted/40 rounded-lg p-12 text-center">
                <p className="text-sm text-muted">Drag & drop your catalog CSV/JSON here</p>
                <Button variant="outline" className="mt-4">Browse Files</Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="text-xs uppercase tracking-wide text-foreground">Max Amount per Order (?)</label>
                <input
                  type="number"
                  className="w-full mt-1 p-2 border border-muted/20 rounded bg-background"
                  value={formData.maxAmount}
                  onChange={(e) => setFormData({ ...formData, maxAmount: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-foreground">Max Daily Limit (?)</label>
                <input
                  type="number"
                  className="w-full mt-1 p-2 border border-muted/20 rounded bg-background"
                  value={formData.dailyLimit}
                  onChange={(e) => setFormData({ ...formData, dailyLimit: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-foreground">Allowed Categories (comma separated)</label>
                <input
                  type="text"
                  className="w-full mt-1 p-2 border border-muted/20 rounded bg-background"
                  value={formData.allowedCategories}
                  onChange={(e) => setFormData({ ...formData, allowedCategories: e.target.value })}
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4 text-center py-8">
              <h2 className="text-2xl font-serif">Setup Complete!</h2>
              <p className="text-muted">Your Warden account is ready. AI buyers can now transact based on your configured mandates.</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          {step > 1 ? (
            <Button variant="ghost" onClick={handlePrev}>Back</Button>
          ) : (
            <div />
          )}
          {step < 4 ? (
            <Button onClick={handleNext}>Continue</Button>
          ) : (
            <Button onClick={handleComplete}>Go to Dashboard</Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
