"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Search,
} from "lucide-react";
import { FormattedAccountIntelligence } from "@/lib/intelligence/formatters";

interface PortfolioAccountRow {
  id: string;
  name: string;
  category: string;
  arr: number;
  health: string;
  sentiment: string;
  docks: string;
  csOwner: string;
  seOwner: string;
  intelligenceParsed: FormattedAccountIntelligence | null;
  usageTrend: {
    totalFlightHours: number;
    latestFlightHours: number;
    deltaFlightHoursPercent: number | null;
    threeMonthTrajectory: string;
    isUsageCollapsing: boolean;
    usageDropFromPeakPercent: number | null;
  };
  documents?: { id: string }[];
}

export function PortfolioAccountTable({ accounts }: { accounts: PortfolioAccountRow[] }) {
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"priority" | "arr" | "name" | "usage">("priority");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const categories = [
    { label: "All Accounts", value: "ALL" },
    { label: "Pre-Sale", value: "pre-sale" },
    { label: "Onboarding", value: "newly-sold-onboarding" },
    { label: "Established", value: "established" },
    { label: "Renewal-Focused", value: "renewal-focused" },
    { label: "Churned", value: "churned" },
  ];

  // Filtering
  const filtered = accounts.filter((acc) => {
    if (selectedCategory !== "ALL" && acc.category !== selectedCategory) return false;
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      return (
        acc.name.toLowerCase().includes(q) ||
        acc.id.toLowerCase().includes(q) ||
        acc.csOwner.toLowerCase().includes(q) ||
        acc.seOwner.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Sorting
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "priority") {
      const scoreA = a.intelligenceParsed?.priorityScore ?? 0;
      const scoreB = b.intelligenceParsed?.priorityScore ?? 0;
      return scoreB - scoreA;
    }
    if (sortBy === "arr") {
      return b.arr - a.arr;
    }
    if (sortBy === "usage") {
      return b.usageTrend.totalFlightHours - a.usageTrend.totalFlightHours;
    }
    return a.name.localeCompare(b.name);
  });

  const getReconciledHealthBadge = (health?: string) => {
    switch (health) {
      case "CRITICAL":
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-red-950/80 text-red-400 border border-red-800/60">
            CRITICAL
          </span>
        );
      case "AT_RISK":
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-amber-950/80 text-amber-400 border border-amber-800/60">
            AT RISK
          </span>
        );
      case "WATCH":
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-zinc-800 text-zinc-300 border border-zinc-700">
            WATCH
          </span>
        );
      case "CHURNED":
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-zinc-900 text-zinc-400 border border-zinc-800">
            CHURNED
          </span>
        );
      default:
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
            HEALTHY
          </span>
        );
    }
  };

  const getUrgencyBadge = (tier?: string) => {
    switch (tier) {
      case "CRITICAL":
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-red-900 text-red-100 border border-red-700">
            CRITICAL
          </span>
        );
      case "HIGH":
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-amber-900/80 text-amber-200 border border-amber-700">
            HIGH
          </span>
        );
      case "MEDIUM":
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-zinc-800 text-zinc-300 border border-zinc-700">
            MEDIUM
          </span>
        );
      default:
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono text-zinc-400 bg-zinc-900 border border-zinc-800">
            LOW
          </span>
        );
    }
  };

  const getTrajectoryBadge = (trend: PortfolioAccountRow["usageTrend"]) => {
    if (trend.isUsageCollapsing) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-red-400 font-bold">
          <TrendingDown className="w-3 h-3" /> -{trend.usageDropFromPeakPercent}%
        </span>
      );
    }
    if (trend.threeMonthTrajectory === "GROWING") {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400 font-medium">
          <TrendingUp className="w-3 h-3" /> Growing
        </span>
      );
    }
    if (trend.threeMonthTrajectory === "DECLINING") {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-amber-400 font-medium">
          <TrendingDown className="w-3 h-3" /> Declining
        </span>
      );
    }
    if (trend.threeMonthTrajectory === "ZERO_USAGE") {
      return <span className="text-[11px] font-mono text-zinc-500">0 hrs</span>;
    }
    return <span className="text-[11px] font-mono text-zinc-400">{trend.totalFlightHours > 0 ? "Stable" : "—"}</span>;
  };

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {/* Category Tabs & Search Bar */}
      <div className="p-3 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-3 bg-secondary/30">
        {/* Category Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat.value
                  ? "bg-zinc-200 text-zinc-950 font-semibold"
                  : "bg-secondary text-zinc-400 hover:text-white hover:bg-zinc-800"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search & Sort */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Filter accounts / owner..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-background border border-border rounded pl-8 pr-2.5 py-1 text-xs text-white placeholder:text-zinc-400 focus:outline-none focus:border-zinc-500 w-44"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-background border border-border rounded px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-zinc-500"
          >
            <option value="priority">Sort: Priority</option>
            <option value="arr">Sort: ARR</option>
            <option value="usage">Sort: Hours</option>
            <option value="name">Sort: Name</option>
          </select>
        </div>
      </div>

      {/* High Density Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border bg-secondary/40 text-[10px] font-mono font-semibold uppercase tracking-wider text-zinc-400">
              <th className="py-2.5 px-3.5">Account</th>
              <th className="py-2.5 px-3">Category</th>
              <th className="py-2.5 px-3 font-mono">Nominal ARR</th>
              <th className="py-2.5 px-3">CRM Health</th>
              <th className="py-2.5 px-3">Ground Truth</th>
              <th className="py-2.5 px-3">Urgency</th>
              <th className="py-2.5 px-3 font-mono">Telemetry</th>
              <th className="py-2.5 px-3 font-mono">Priority</th>
              <th className="py-2.5 px-3.5 text-right font-mono">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60 text-xs">
            {sorted.map((acc) => {
              const intel = acc.intelligenceParsed;
              const hasMismatch =
                acc.health.toLowerCase().includes("healthy") &&
                (intel?.reconciledHealth === "CRITICAL" ||
                  intel?.reconciledHealth === "AT_RISK" ||
                  intel?.reconciledHealth === "CHURNED");

              return (
                <tr key={acc.id} className="hover:bg-secondary/30 transition-colors">
                  <td className="py-2.5 px-3.5 font-medium">
                    <Link
                      href={`/accounts/${acc.id}`}
                      className="hover:text-zinc-300 transition-colors flex items-center gap-1 font-semibold text-white"
                    >
                      <span>{acc.name}</span>
                      <ArrowUpRight className="w-3 h-3 text-zinc-500" />
                    </Link>
                    <div className="text-[11px] text-zinc-400 font-mono font-normal">{acc.id}</div>
                  </td>
                  <td className="py-2.5 px-3 text-[11px] text-zinc-400 capitalize">
                    {acc.category.replace(/-/g, " ")}
                  </td>
                  <td className="py-2.5 px-3 font-mono font-semibold text-zinc-200">
                    ${acc.arr.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="text-zinc-400 font-mono text-[11px]">
                      {acc.health || "—"}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-1.5">
                      {getReconciledHealthBadge(intel?.reconciledHealth)}
                      {hasMismatch && (
                        <span className="text-[10px] font-mono text-red-400 font-bold" title="Contradicts CRM record">
                          ⚡ Mismatch
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-2.5 px-3">{getUrgencyBadge(intel?.priorityTier)}</td>
                  <td className="py-2.5 px-3">{getTrajectoryBadge(acc.usageTrend)}</td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-white">
                        {intel?.priorityScore ?? "—"}
                      </span>
                      <div className="w-10 bg-zinc-800 rounded-full h-1 overflow-hidden">
                        <div
                          className={`h-full ${
                            (intel?.priorityScore ?? 0) >= 80
                              ? "bg-red-500"
                              : (intel?.priorityScore ?? 0) >= 50
                              ? "bg-amber-400"
                              : "bg-zinc-500"
                          }`}
                          style={{ width: `${Math.min(100, intel?.priorityScore ?? 0)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 px-3.5 text-right">
                    <Link
                      href={`/accounts/${acc.id}`}
                      className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded border border-border bg-secondary hover:bg-zinc-800 text-zinc-200 hover:text-white font-mono transition-colors"
                    >
                      360°
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
