"use client";

import Link from "next/link";
import { AlertTriangle, Clock, ArrowUpRight, Sparkles, TrendingDown } from "lucide-react";

interface AccountSummaryItem {
  id: string;
  name: string;
  category: string;
  arr: number;
  health: string;
  usageTrend: {
    threeMonthTrajectory: string;
    isUsageCollapsing: boolean;
    latestFlightHours: number;
    deltaFlightHoursPercent: number | null;
  };
}

export function PriorityQueuePlaceholder({ accounts }: { accounts: AccountSummaryItem[] }) {
  // Deterministic attention candidates:
  // 1. Churned accounts with nominal ARR (e.g. falcon-point-security)
  // 2. Accounts with collapsing usage (e.g. coastline-transit, pinnacle-venue-group, vantage-protective)
  // 3. Newly sold with 0 flight hours (e.g. camborne-constabulary)
  const urgentAttentionAccounts = accounts.filter(
    (a) =>
      a.usageTrend.isUsageCollapsing ||
      a.category === "churned" ||
      (a.category === "newly-sold-onboarding" && a.usageTrend.latestFlightHours === 0)
  );

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-amber-500/10 text-amber-400 rounded-md">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-sm flex items-center gap-2">
              Attention Queue
              <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Deterministic Signals
              </span>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Flagged accounts requiring GTM review based on usage collapse, renewal urgency, and lifecycle state.
            </p>
          </div>
        </div>
      </div>

      <div className="divide-y divide-border/60 mt-2">
        {urgentAttentionAccounts.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            No accounts currently flagged for urgent attention. Run MCP Sync to populate data.
          </div>
        ) : (
          urgentAttentionAccounts.slice(0, 5).map((acc) => (
            <div
              key={acc.id}
              className="py-3 flex items-center justify-between gap-4 hover:bg-muted/30 px-2 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                <div>
                  <Link
                    href={`/accounts/${acc.id}`}
                    className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1"
                  >
                    {acc.name}
                    <ArrowUpRight className="w-3.5 h-3.5 opacity-60" />
                  </Link>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                    <span className="capitalize">{acc.category.replace(/-/g, " ")}</span>
                    <span>•</span>
                    <span>ARR: ${acc.arr.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs">
                {acc.usageTrend.isUsageCollapsing && (
                  <span className="flex items-center gap-1 text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded">
                    <TrendingDown className="w-3 h-3" /> Usage Collapse
                  </span>
                )}
                {acc.category === "churned" && (
                  <span className="text-gray-400 bg-gray-500/10 border border-gray-500/20 px-2 py-0.5 rounded">
                    Churned Account
                  </span>
                )}
                {acc.category === "newly-sold-onboarding" && (
                  <span className="text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                    Kickoff Pending
                  </span>
                )}

                <Link
                  href={`/accounts/${acc.id}`}
                  className="px-2.5 py-1 text-xs rounded bg-secondary hover:bg-secondary/80 text-foreground transition-colors"
                >
                  Review
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
