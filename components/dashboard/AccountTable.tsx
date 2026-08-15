"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, TrendingUp, TrendingDown, Minus, FileText } from "lucide-react";

interface AccountTableItem {
  id: string;
  name: string;
  category: string;
  arr: number;
  health: string;
  sentiment: string;
  docks: string;
  csOwner: string;
  seOwner: string;
  championTagged: string | null;
  documents?: { id: string }[];
  usageTrend: {
    totalFlightHours: number;
    latestFlightHours: number;
    deltaFlightHoursPercent: number | null;
    threeMonthTrajectory: string;
    isUsageCollapsing: boolean;
  };
}

export function AccountTable({ accounts }: { accounts: AccountTableItem[] }) {
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  const categories = [
    { label: "All Accounts", value: "ALL" },
    { label: "Pre-Sale", value: "pre-sale" },
    { label: "Onboarding", value: "newly-sold-onboarding" },
    { label: "Established", value: "established" },
    { label: "Renewal-Focused", value: "renewal-focused" },
    { label: "Churned", value: "churned" },
  ];

  const filtered =
    selectedCategory === "ALL"
      ? accounts
      : accounts.filter((a) => a.category === selectedCategory);

  const getHealthBadge = (health: string) => {
    const lower = health.toLowerCase();
    if (lower.includes("healthy")) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          {health}
        </span>
      );
    }
    if (lower.includes("risk") || lower.includes("churned")) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
          {health}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-500/10 text-gray-400 border border-gray-500/20">
        {health || "—"}
      </span>
    );
  };

  const getTrajectoryBadge = (trend: AccountTableItem["usageTrend"]) => {
    if (trend.isUsageCollapsing) {
      return (
        <span className="inline-flex items-center gap-1 text-xs text-rose-400 font-medium">
          <TrendingDown className="w-3.5 h-3.5" /> Collapse
        </span>
      );
    }
    if (trend.threeMonthTrajectory === "GROWING") {
      return (
        <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-medium">
          <TrendingUp className="w-3.5 h-3.5" /> Growing
        </span>
      );
    }
    if (trend.threeMonthTrajectory === "DECLINING") {
      return (
        <span className="inline-flex items-center gap-1 text-xs text-amber-400 font-medium">
          <TrendingDown className="w-3.5 h-3.5" /> Declining
        </span>
      );
    }
    if (trend.threeMonthTrajectory === "ZERO_USAGE") {
      return (
        <span className="inline-flex items-center gap-1 text-xs text-gray-500">
          <Minus className="w-3.5 h-3.5" /> 0 hrs
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Minus className="w-3.5 h-3.5" /> {trend.totalFlightHours > 0 ? "Stable" : "—"}
      </span>
    );
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Category Tabs */}
      <div className="p-4 border-b border-border flex items-center gap-2 overflow-x-auto">
        {categories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setSelectedCategory(cat.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              selectedCategory === cat.value
                ? "bg-primary text-primary-foreground"
                : "bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Accounts Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border/80 bg-muted/20 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <th className="py-3 px-4">Account</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Nominal ARR</th>
              <th className="py-3 px-4">CRM Health</th>
              <th className="py-3 px-4">Flight Trajectory</th>
              <th className="py-3 px-4">Docs</th>
              <th className="py-3 px-4">CS / SE Owner</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50 text-sm">
            {filtered.map((acc) => (
              <tr key={acc.id} className="hover:bg-muted/30 transition-colors">
                <td className="py-3 px-4 font-medium">
                  <Link
                    href={`/accounts/${acc.id}`}
                    className="hover:text-primary transition-colors flex items-center gap-1.5"
                  >
                    <span>{acc.name}</span>
                    <ArrowUpRight className="w-3 h-3 opacity-50" />
                  </Link>
                  <div className="text-xs text-muted-foreground font-normal">{acc.id}</div>
                </td>
                <td className="py-3 px-4 text-xs text-muted-foreground capitalize">
                  {acc.category.replace(/-/g, " ")}
                </td>
                <td className="py-3 px-4 font-mono font-medium">
                  ${acc.arr.toLocaleString()}
                </td>
                <td className="py-3 px-4">{getHealthBadge(acc.health)}</td>
                <td className="py-3 px-4">{getTrajectoryBadge(acc.usageTrend)}</td>
                <td className="py-3 px-4">
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <FileText className="w-3 h-3 text-purple-400" />
                    {acc.documents?.length || 0}
                  </span>
                </td>
                <td className="py-3 px-4 text-xs text-muted-foreground">
                  <div>CS: {acc.csOwner || "—"}</div>
                  <div>SE: {acc.seOwner || "—"}</div>
                </td>
                <td className="py-3 px-4 text-right">
                  <Link
                    href={`/accounts/${acc.id}`}
                    className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded bg-secondary hover:bg-secondary/80 text-foreground transition-colors"
                  >
                    Details
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
