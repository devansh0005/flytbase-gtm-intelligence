"use client";

import { DollarSign, ShieldAlert, TrendingUp, Building2, AlertTriangle, Database } from "lucide-react";

interface PortfolioHeaderProps {
  totalNominalArr: number;
  activeArr: number;
  revenueAtRisk: number;
  expansionPotentialTotal: number;
  totalAccounts: number;
  criticalAccountsCount: number;
}

export function PortfolioHeader({
  totalNominalArr,
  activeArr,
  revenueAtRisk,
  expansionPotentialTotal,
  totalAccounts,
  criticalAccountsCount,
}: PortfolioHeaderProps) {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {/* 1. Portfolio ARR */}
      <div className="bg-card border border-border rounded-lg p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-zinc-400">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
            Portfolio ARR
          </span>
          <DollarSign className="w-3.5 h-3.5 text-zinc-500" />
        </div>
        <div className="mt-2.5">
          <div className="text-xl font-bold font-mono text-white tracking-tight">
            {formatCurrency(totalNominalArr)}
          </div>
          <div className="text-[11px] text-zinc-400 mt-0.5 font-mono">
            {formatCurrency(activeArr)} active
          </div>
        </div>
      </div>

      {/* 2. Revenue At Risk */}
      <div className="bg-card border border-border border-l-2 border-l-red-500 rounded-lg p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-zinc-400">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-red-400">
            Revenue at Risk
          </span>
          <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
        </div>
        <div className="mt-2.5">
          <div className="text-xl font-bold font-mono text-red-400 tracking-tight">
            {formatCurrency(revenueAtRisk)}
          </div>
          <div className="text-[11px] text-zinc-400 mt-0.5">
            Critical & At-Risk tiers
          </div>
        </div>
      </div>

      {/* 3. Expansion Pipeline */}
      <div className="bg-card border border-border border-l-2 border-l-emerald-500 rounded-lg p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-zinc-400">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
            Expansion Upside
          </span>
          <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
        </div>
        <div className="mt-2.5">
          <div className="text-xl font-bold font-mono text-emerald-400 tracking-tight">
            {formatCurrency(expansionPotentialTotal)}+
          </div>
          <div className="text-[11px] text-zinc-400 mt-0.5">
            Tender RFP & pilot upside
          </div>
        </div>
      </div>

      {/* 4. Total Accounts */}
      <div className="bg-card border border-border rounded-lg p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-zinc-400">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
            Monitored Accounts
          </span>
          <Building2 className="w-3.5 h-3.5 text-zinc-500" />
        </div>
        <div className="mt-2.5">
          <div className="text-xl font-bold text-white tracking-tight">
            {totalAccounts} Accounts
          </div>
          <div className="text-[11px] text-zinc-400 mt-0.5">
            5 lifecycle categories
          </div>
        </div>
      </div>

      {/* 5. Critical Triage */}
      <div className="bg-card border border-border border-l-2 border-l-amber-500 rounded-lg p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-zinc-400">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-400">
            Action Triage
          </span>
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
        </div>
        <div className="mt-2.5">
          <div className="text-xl font-bold text-amber-400 font-mono tracking-tight">
            {criticalAccountsCount} Critical
          </div>
          <div className="text-[11px] text-zinc-400 mt-0.5">
            Immediate P0 intervention
          </div>
        </div>
      </div>

      {/* 6. MCP Protocol Truth */}
      <div className="bg-card border border-border rounded-lg p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-zinc-400">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
            Source of Truth
          </span>
          <Database className="w-3.5 h-3.5 text-zinc-500" />
        </div>
        <div className="mt-2.5">
          <div className="text-sm font-semibold text-white tracking-tight">
            FlytBase MCP
          </div>
          <div className="text-[11px] text-zinc-400 mt-0.5">
            100% Normalized Cache
          </div>
        </div>
      </div>
    </div>
  );
}
