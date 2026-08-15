"use client";

import Link from "next/link";
import {
  TrendingDown,
  Clock,
  AlertCircle,
  TrendingUp,
  AlertTriangle,
  Wrench,
  UserX,
  RotateCcw,
  ArrowUpRight,
} from "lucide-react";

export interface PortfolioSignalCategory {
  id: string;
  title: string;
  count: number;
  category: string;
  severity: "CRITICAL" | "HIGH" | "WARNING" | "GROWTH" | "MONITOR";
  summary: string;
  affectedAccounts: Array<{ id: string; name: string; tag?: string }>;
}

export function PortfolioSignals({ signals }: { signals: PortfolioSignalCategory[] }) {
  if (!signals || signals.length === 0) return null;

  const getSeverityBadge = (sev: PortfolioSignalCategory["severity"]) => {
    switch (sev) {
      case "CRITICAL":
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-red-950/80 text-red-400 border border-red-800/80">
            CRITICAL
          </span>
        );
      case "HIGH":
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-amber-950/80 text-amber-300 border border-amber-800/80">
            HIGH
          </span>
        );
      case "WARNING":
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-amber-950/60 text-amber-400 border border-amber-800/60">
            WARNING
          </span>
        );
      case "GROWTH":
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800/80">
            EXPANSION
          </span>
        );
      default:
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-zinc-800 text-zinc-300 border border-zinc-700">
            MONITOR
          </span>
        );
    }
  };

  const getIcon = (id: string) => {
    switch (id) {
      case "telemetry_drop":
        return <TrendingDown className="w-3.5 h-3.5 text-red-400" />;
      case "renewal_pressure":
        return <Clock className="w-3.5 h-3.5 text-amber-400" />;
      case "mismatch":
        return <AlertCircle className="w-3.5 h-3.5 text-red-400" />;
      case "expansion_opp":
        return <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />;
      case "expansion_trap":
        return <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />;
      case "procurement_blocker":
        return <Wrench className="w-3.5 h-3.5 text-zinc-400" />;
      case "champion_ghosting":
        return <UserX className="w-3.5 h-3.5 text-red-400" />;
      case "win_back":
        return <RotateCcw className="w-3.5 h-3.5 text-zinc-400" />;
      default:
        return <AlertCircle className="w-3.5 h-3.5 text-zinc-400" />;
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-2.5">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-white tracking-tight">
            Cross-Account Portfolio Signals
          </h2>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700 font-semibold">
            {signals.length} Macro Patterns Derived
          </span>
        </div>
        <span className="text-xs text-zinc-400 hidden sm:inline font-mono">
          Synthesized from 14 accounts, 87 docs & 70 telemetry records
        </span>
      </div>

      {/* Signals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {signals.map((sig) => (
          <div
            key={sig.id}
            className="p-3 rounded border border-border bg-background/50 flex flex-col justify-between space-y-2.5 hover:border-zinc-700 transition-colors"
          >
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-1.5 font-semibold text-xs text-white">
                  {getIcon(sig.id)}
                  <span>{sig.title}</span>
                </div>
                {getSeverityBadge(sig.severity)}
              </div>

              <p className="text-[11px] text-zinc-400 leading-relaxed">
                {sig.summary}
              </p>
            </div>

            {/* Affected Accounts Pills */}
            <div className="pt-2 border-t border-border/60 space-y-1">
              <div className="text-[10px] uppercase font-mono text-zinc-500 font-semibold">
                Affected Accounts ({sig.count})
              </div>
              <div className="flex flex-wrap gap-1">
                {sig.affectedAccounts.map((acc) => (
                  <Link
                    key={acc.id}
                    href={`/accounts/${acc.id}`}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-secondary hover:bg-zinc-800 border border-border text-[11px] font-mono text-zinc-300 hover:text-white transition-colors"
                    title={acc.tag ? `${acc.name} (${acc.tag})` : acc.name}
                  >
                    <span>{acc.name.split(" ")[0]}</span>
                    <ArrowUpRight className="w-2.5 h-2.5 text-zinc-500" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
