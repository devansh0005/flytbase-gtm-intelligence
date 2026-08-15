"use client";

import { DollarSign, Building2, Plane, FileText, TrendingDown, TrendingUp } from "lucide-react";
import { PortfolioSummaryMetrics } from "@/lib/analytics/deterministic";

export function PortfolioOverview({ metrics }: { metrics: PortfolioSummaryMetrics }) {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total ARR */}
      <div className="bg-card border border-border rounded-xl p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Portfolio ARR
          </span>
          <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold">{formatCurrency(metrics.totalNominalArr)}</div>
          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
            <span className="text-emerald-400 font-medium">
              {formatCurrency(metrics.activeArr)} active
            </span>
            <span>•</span>
            <span className="text-rose-400 font-medium">
              {formatCurrency(metrics.churnedArr)} churned
            </span>
          </div>
        </div>
      </div>

      {/* Account Counts */}
      <div className="bg-card border border-border rounded-xl p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Accounts
          </span>
          <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
            <Building2 className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold">{metrics.totalAccounts} Total</div>
          <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground flex-wrap">
            <span className="text-gray-300">
              {metrics.accountsByCategory["pre-sale"] || 0} Pre-Sale
            </span>
            <span>•</span>
            <span className="text-amber-400">
              {metrics.accountsByCategory["renewal-focused"] || 0} Renewal
            </span>
            <span>•</span>
            <span className="text-emerald-400">
              {metrics.accountsByCategory["established"] || 0} Est.
            </span>
          </div>
        </div>
      </div>

      {/* Telemetry Flight Hours */}
      <div className="bg-card border border-border rounded-xl p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Flight Activity
          </span>
          <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
            <Plane className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold">
            {metrics.totalTrackedFlightHours.toLocaleString()} hrs
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
            <span>{metrics.totalTrackedMissions.toLocaleString()} missions</span>
            <span>•</span>
            <span className="flex items-center text-emerald-400 font-medium">
              <TrendingUp className="w-3 h-3 mr-0.5 inline" />
              {metrics.accountsWithGrowingUsage} growing
            </span>
            <span>•</span>
            <span className="flex items-center text-rose-400 font-medium">
              <TrendingDown className="w-3 h-3 mr-0.5 inline" />
              {metrics.accountsWithDecliningUsage} declining
            </span>
          </div>
        </div>
      </div>

      {/* Document Evidence Repository */}
      <div className="bg-card border border-border rounded-xl p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Source Evidence
          </span>
          <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg">
            <FileText className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold">{metrics.totalDocuments} Docs</div>
          <div className="text-xs text-muted-foreground mt-1">
            Transcripts, emails, tickets, notes & trackers
          </div>
        </div>
      </div>
    </div>
  );
}
