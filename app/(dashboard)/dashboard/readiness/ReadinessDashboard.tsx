"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Progress";
import { LineChart, Line, ResponsiveContainer, YAxis } from "recharts";
import { calculateReadinessScore } from "./actions";

export function ReadinessDashboard({ 
  merchantId, 
  initialScores 
}: { 
  merchantId: string, 
  initialScores: any[] 
}) {
  const [scores, setScores] = useState<any[]>(initialScores || []);
  const [isCalculating, setIsCalculating] = useState(false);

  const latestScore = scores.length > 0 ? scores[scores.length - 1] : null;

  const handleRecalculate = async () => {
    setIsCalculating(true);
    try {
      const result = await calculateReadinessScore(merchantId);
      if (result.success && result.score) {
        setScores((prev) => [...prev, result.score]);
      }
    } finally {
      setIsCalculating(false);
    }
  };

  // Sparkline data mapping
  const trendData = scores.map((s, idx) => ({
    name: `Score ${idx}`,
    score: s.score
  }));

  const getScoreLabel = (score: number) => {
    if (score >= 90) return "Excellent — fully agent-ready";
    if (score >= 70) return "Good — minor gaps remain";
    return "Needs work before AI buyers can transact reliably";
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header and Recalculate */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-serif">AI Readiness Score</h2>
          <p className="text-muted text-sm">Measure how prepared your storefront is for autonomous buyers.</p>
        </div>
        <Button onClick={handleRecalculate} disabled={isCalculating}>
          {isCalculating ? "Calculating..." : "Recalculate Score"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        {/* Main Score Display */}
        <Card className="col-span-1 bg-background-alt border-muted/20 flex flex-col items-center justify-center p-8 text-center">
          <div className="relative w-48 h-48 rounded-full border-[12px] border-foreground/10 flex items-center justify-center mb-4">
            {/* SVG Circular Progress */}
            <svg className="absolute top-0 left-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle 
                cx="50" 
                cy="50" 
                r="44" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="12" 
                className="text-accent"
                strokeDasharray="276"
                strokeDashoffset={latestScore ? 276 - (276 * latestScore.score) / 100 : 276}
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 1s ease-in-out" }}
              />
            </svg>
            <div className="relative z-10 flex flex-col items-center">
              <span className="text-6xl font-serif text-foreground leading-none">
                {latestScore ? latestScore.score : 0}
              </span>
              <span className="text-xs uppercase tracking-wide text-muted mt-2">out of 100</span>
            </div>
          </div>

          {latestScore && (
            <div className="mt-2 mb-4">
              <p className="text-sm font-semibold text-foreground">{getScoreLabel(latestScore.score)}</p>
              <p className="text-xs text-muted mt-1">Last calculated: {new Date(latestScore.created_at || new Date()).toLocaleString()}</p>
            </div>
          )}
          
          {/* Trend Line (Sparkline) */}
          {scores.length > 1 && (
            <div className="w-full h-16 mt-4 opacity-70">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <YAxis domain={[0, 100]} hide />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="var(--foreground)" 
                    strokeWidth={2} 
                    dot={false} 
                    isAnimationActive={false} 
                  />
                </LineChart>
              </ResponsiveContainer>
              <p className="text-[10px] uppercase tracking-wide text-muted mt-1">Trend over time</p>
            </div>
          )}
        </Card>

        {/* Breakdown List */}
        <Card className="col-span-1 md:col-span-2 bg-background-alt border-muted/20">
          <CardHeader>
            <CardTitle>Score Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {latestScore ? (
              latestScore.breakdown_json.map((item: any, idx: number) => (
                <div key={idx} className="space-y-2">
                  <div className="flex justify-between items-end">
                    <span className="text-sm font-semibold uppercase tracking-wide text-foreground">
                      {item.title}
                    </span>
                    <span className="text-xs font-mono text-muted">
                      {item.points} / {item.maxPoints}
                    </span>
                  </div>
                  <Progress value={item.points} max={item.maxPoints} className="bg-foreground/5" />
                  <p className="text-xs text-muted">
                    <span className="font-semibold text-foreground/80">Tip:</span> {item.tip}
                  </p>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-muted">
                <p>No readiness score found.</p>
                <p className="text-sm">Click Recalculate to generate your first score.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
