"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  ShieldAlert,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { EvidenceDrawer } from "@/components/evidence/EvidenceDrawer";
import { EvidenceReference } from "@/lib/intelligence/types";

interface ActionQueueItem {
  id: string;
  name: string;
  category: string;
  arr: number;
  health: string;
  reconciledHealth: string;
  priorityScore: number;
  priorityTier: string;
  priorityExplanation: string;
  primaryTrigger: string;
  nextBestActions: Array<{
    action: string;
    priority: string;
    reason: string;
    expectedOutcome: string;
    evidence?: EvidenceReference[];
  }>;
  evidence: EvidenceReference[];
}

export function ActionQueue({ items }: { items: ActionQueueItem[] }) {
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceReference | null>(null);

  // Filter accounts requiring GTM action, sorted by deterministic priority score
  const actionAccounts = items
    .filter((item) => item.priorityTier !== "LOW" || item.nextBestActions.length > 0)
    .sort((a, b) => b.priorityScore - a.priorityScore);

  const getHealthBadge = (health: string) => {
    switch (health) {
      case "CRITICAL":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-950/60 text-red-400 border border-red-800/60">
            CRITICAL
          </span>
        );
      case "AT_RISK":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-amber-950/60 text-amber-400 border border-amber-800/60">
            AT RISK
          </span>
        );
      case "WATCH":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-zinc-800 text-zinc-300 border border-zinc-700">
            WATCH
          </span>
        );
      case "CHURNED":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-zinc-900 text-zinc-400 border border-zinc-800">
            CHURNED
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
            HEALTHY
          </span>
        );
    }
  };

  const getUrgencyBadge = (tier: string) => {
    switch (tier) {
      case "CRITICAL":
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-900/80 text-red-100 border border-red-700">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
            P0 URGENT
          </span>
        );
      case "HIGH":
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-amber-900/60 text-amber-200 border border-amber-700/80">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            HIGH URGENCY
          </span>
        );
      case "MEDIUM":
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-zinc-800 text-zinc-300 border border-zinc-700">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
            MEDIUM
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono text-zinc-400 bg-zinc-900 border border-zinc-800">
            LOW
          </span>
        );
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {/* Panel Header */}
      <div className="px-4 py-3 border-b border-border bg-secondary/40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-zinc-300" />
          <h2 className="text-sm font-bold text-white tracking-tight">
            Prioritized GTM Action Queue
          </h2>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
            {actionAccounts.length} Active Triage
          </span>
        </div>
        <span className="text-xs text-zinc-400 hidden sm:inline">
          Ranked by deterministic urgency, renewal deadlines & active blockers
        </span>
      </div>

      {/* Action Rows */}
      <div className="divide-y divide-border">
        {actionAccounts.map((account, idx) => {
          const topAction = account.nextBestActions[0];
          return (
            <div
              key={account.id}
              className="p-3.5 hover:bg-secondary/30 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3"
            >
              {/* Account Identity & Signals */}
              <div className="flex items-start gap-3 min-w-[280px]">
                <div className="w-6 h-6 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xs font-mono font-semibold text-zinc-400 shrink-0 mt-0.5">
                  #{idx + 1}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      href={`/accounts/${account.id}`}
                      className="font-semibold text-sm text-white hover:text-zinc-300 transition-colors flex items-center gap-1"
                    >
                      <span>{account.name}</span>
                      <ArrowUpRight className="w-3 h-3 text-zinc-500" />
                    </Link>
                    {getHealthBadge(account.reconciledHealth)}
                    {getUrgencyBadge(account.priorityTier)}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <span className="font-mono font-medium text-emerald-400">
                      ${account.arr.toLocaleString()} ARR
                    </span>
                    <span>•</span>
                    <span className="font-mono text-[11px] text-zinc-400">
                      Trigger: {account.primaryTrigger}
                    </span>
                  </div>
                </div>
              </div>

              {/* Recommended Next Action */}
              <div className="flex-1 md:px-4">
                {topAction ? (
                  <div className="p-2.5 rounded border border-border/80 bg-background/50 text-xs space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-zinc-200 flex items-center gap-1.5">
                        <span className="px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-200 border border-zinc-700 font-mono font-bold text-[10px]">
                          {topAction.priority}
                        </span>
                        {topAction.action}
                      </span>
                      {account.evidence.length > 0 && (
                        <button
                          onClick={() => setSelectedEvidence(account.evidence[0])}
                          className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 font-mono transition-colors shrink-0 underline underline-offset-2"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
                          <span>Evidence ({account.evidence.length})</span>
                        </button>
                      )}
                    </div>
                    <div className="text-zinc-400 text-[11px] line-clamp-1">
                      Reason: {topAction.reason}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-zinc-500 italic">
                    Account healthy; proceed with standard CS cadence.
                  </div>
                )}
              </div>

              {/* Review CTA */}
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href={`/accounts/${account.id}`}
                  className="px-3 py-1.5 rounded border border-border bg-secondary hover:bg-zinc-800 text-zinc-200 hover:text-white text-xs font-medium transition-colors flex items-center gap-1"
                >
                  <span>Review</span>
                  <ArrowUpRight className="w-3 h-3 text-zinc-400" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Traceable Evidence Drawer */}
      <EvidenceDrawer
        evidence={selectedEvidence}
        onClose={() => setSelectedEvidence(null)}
      />
    </div>
  );
}
