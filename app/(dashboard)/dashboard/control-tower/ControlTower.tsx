"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { createClient } from "@/lib/supabase/client";
import { formatINR } from "@/lib/format";
import { ChevronDown, ChevronRight, AlertCircle, CheckCircle2, ShieldCheck } from "lucide-react";

export function ControlTower({ 
  merchantId, 
  initialTransactions 
}: { 
  merchantId: string;
  initialTransactions: any[];
}) {
  const [transactions, setTransactions] = useState<any[]>(initialTransactions);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  useEffect(() => {
    const supabase = createClient();
    
    // Subscribe to new transactions for this merchant
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transactions',
          filter: `merchant_id=eq.${merchantId}`
        },
        (payload) => {
          setTransactions((prev) => [payload.new, ...prev]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'transactions',
          filter: `merchant_id=eq.${merchantId}`
        },
        (payload) => {
          setTransactions((prev) => prev.map(t => t.id === payload.new.id ? payload.new : t));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [merchantId]);

  const toggleRow = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredTxs = transactions.filter(t => filterStatus === "all" || t.status === filterStatus);

  // Compute stats based on the currently loaded transactions (assumed to be mostly today's in this prototype)
  const totalAttempts = transactions.length;
  const approvedCount = transactions.filter(t => t.status === "approved" || t.status === "completed").length;
  const deniedCount = transactions.filter(t => t.status === "denied").length;
  const failedCount = transactions.filter(t => t.status === "failed").length;
  const totalApprovedValue = transactions
    .filter(t => t.status === "approved" || t.status === "completed")
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Summary Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-background-alt border-muted/20">
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wide text-muted">Attempts Today</p>
            <p className="text-2xl font-serif mt-1">{totalAttempts}</p>
          </CardContent>
        </Card>
        <Card className="bg-background-alt border-muted/20">
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wide text-muted">Approved</p>
            <p className="text-2xl font-serif mt-1 text-accent">{approvedCount}</p>
          </CardContent>
        </Card>
        <Card className="bg-background-alt border-muted/20">
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wide text-muted">Denied / Failed</p>
            <p className="text-2xl font-serif mt-1 text-danger">{deniedCount} / {failedCount}</p>
          </CardContent>
        </Card>
        <Card className="bg-background-alt border-muted/20">
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wide text-muted">Approved Value</p>
            <p className="text-2xl font-serif mt-1">{formatINR(totalApprovedValue)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {["all", "approved", "denied", "failed"].map(status => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide transition-colors ${
              filterStatus === status 
                ? "bg-foreground text-background" 
                : "bg-background-alt border border-muted/20 text-muted hover:border-foreground/30"
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Transaction Feed */}
      <Card className="bg-background-alt border-muted/20 overflow-hidden">
        <div className="divide-y divide-muted/10">
          {filteredTxs.length === 0 ? (
            <div className="p-8 text-center text-muted text-sm">No transactions found.</div>
          ) : (
            filteredTxs.map((tx) => {
              const isExpanded = expandedRows.has(tx.id);
              const isDenied = tx.status === "denied";
              const isFailed = tx.status === "failed";
              const isApproved = tx.status === "approved" || tx.status === "completed";

              return (
                <div key={tx.id} className="flex flex-col bg-background">
                  <div 
                    className={`flex items-center justify-between p-4 cursor-pointer hover:bg-background-alt/50 transition-colors ${
                      (isDenied || isFailed) ? "border-l-4 border-l-danger" : "border-l-4 border-l-accent"
                    }`}
                    onClick={() => toggleRow(tx.id)}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-6 text-muted">
                        {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                      </div>
                      <div className="w-32 text-xs text-muted">
                        {new Date(tx.created_at).toLocaleTimeString()}
                      </div>
                      <div className="w-24 font-mono font-medium">
                        {formatINR(tx.amount)}
                      </div>
                      <div className="flex-1 text-sm">
                        {tx.category || "Uncategorized"}
                      </div>
                      <div className="w-32 text-right">
                        {isApproved && <Badge variant="approved">Approved</Badge>}
                        {isDenied && <Badge variant="denied">Denied</Badge>}
                        {isFailed && <Badge variant="secondary" className="bg-amber-500/20 text-amber-500">Failed</Badge>}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Explainability Row */}
                  {isExpanded && (
                    <div className="bg-background-alt p-6 pl-14 border-t border-muted/10 text-sm">
                      <div className="flex items-start gap-3">
                        {isApproved && <ShieldCheck className="text-accent mt-0.5" size={20} />}
                        {(isDenied || isFailed) && <AlertCircle className="text-danger mt-0.5" size={20} />}
                        
                        <div className="space-y-3 w-full max-w-2xl">
                          <p className="font-semibold">{isApproved ? 'Gate Checks Passed:' : 'Reasoning Trace:'}</p>
                          
                          {isDenied && tx.failed_rule && (
                            <div className="bg-danger/5 border border-danger/20 rounded-md p-3">
                              <div className="text-xs uppercase tracking-wide text-danger font-semibold mb-1">Rule: {tx.failed_rule.replace(/_/g, ' ')}</div>
                              <div className="font-mono text-sm mb-2 text-foreground">
                                Limit: {tx.failed_rule.includes('velocity') ? tx.rule_value : formatINR(tx.rule_value || 0)} → 
                                Attempted: {tx.failed_rule.includes('velocity') ? tx.attempted_value : formatINR(tx.attempted_value || 0)}
                              </div>
                              <div className="text-muted text-xs">{tx.reason_text}</div>
                            </div>
                          )}

                          {(!isDenied || !tx.failed_rule) && (
                            <p className="text-muted leading-relaxed font-mono text-xs p-3 bg-background border border-muted/20 rounded-md">
                              {tx.reason_text}
                            </p>
                          )}

                          {isApproved && (
                            <div className="grid grid-cols-2 gap-2 text-xs text-muted">
                              <div className="flex items-center gap-1"><CheckCircle2 size={12} className="text-accent"/> Amount within per-order limit</div>
                              <div className="flex items-center gap-1"><CheckCircle2 size={12} className="text-accent"/> Category allowed</div>
                              <div className="flex items-center gap-1"><CheckCircle2 size={12} className="text-accent"/> Daily aggregate total OK</div>
                              <div className="flex items-center gap-1"><CheckCircle2 size={12} className="text-accent"/> Velocity constraints passed</div>
                            </div>
                          )}

                          <div className="pt-2 text-xs text-muted flex gap-4 border-t border-muted/10 mt-4">
                            <span>Mandate ID: {tx.mandate_id || 'N/A'}</span>
                            <span>Transaction ID: {tx.id}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
}
