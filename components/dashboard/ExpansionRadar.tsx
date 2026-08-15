"use client";

import { useState } from "react";
import Link from "next/link";
import { TrendingUp, AlertTriangle, ShieldCheck, ArrowUpRight } from "lucide-react";
import { EvidenceDrawer } from "@/components/evidence/EvidenceDrawer";
import { EvidenceReference } from "@/lib/intelligence/types";

interface ExpansionAccount {
  id: string;
  name: string;
  nominalArr: number;
  opportunity: {
    status: string;
    potential?: string;
    details: string;
    isTrap: boolean;
    trapReason?: string;
    evidence: EvidenceReference[];
  };
}

export function ExpansionRadar({ accounts }: { accounts: ExpansionAccount[] }) {
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceReference | null>(null);

  const highConfidenceOpps = accounts.filter(
    (a) => (a.opportunity.status === "HIGH" || a.opportunity.potential) && !a.opportunity.isTrap
  );

  const expansionTraps = accounts.filter((a) => a.opportunity.isTrap);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* High-Confidence Expansion Radar */}
      <div className="bg-card border border-border rounded-lg p-4 space-y-3.5">
        <div className="flex items-center justify-between border-b border-border pb-2.5">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-xs uppercase tracking-wider text-emerald-400">
              High-Confidence Expansion Radar
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 font-semibold">
              {highConfidenceOpps.length} Accounts
            </span>
          </div>
          <span className="text-xs text-zinc-400 hidden sm:inline">
            Tender RFPs & pilot scale-ups
          </span>
        </div>

        <div className="space-y-2.5">
          {highConfidenceOpps.map((acc) => (
            <div
              key={acc.id}
              className="p-3 rounded border border-border bg-background/50 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Link
                    href={`/accounts/${acc.id}`}
                    className="font-semibold text-xs text-white hover:text-zinc-300 transition-colors flex items-center gap-1"
                  >
                    <span>{acc.name}</span>
                    <ArrowUpRight className="w-3 h-3 text-zinc-500" />
                  </Link>
                  <div className="text-[11px] text-zinc-400 font-mono mt-0.5">
                    Current: ${acc.nominalArr.toLocaleString()} ARR
                  </div>
                </div>

                {acc.opportunity.potential && (
                  <span className="px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/80 text-[11px] font-mono font-bold">
                    {acc.opportunity.potential}
                  </span>
                )}
              </div>

              <p className="text-xs text-zinc-300 leading-relaxed">
                {acc.opportunity.details}
              </p>

              {acc.opportunity.evidence.length > 0 && (
                <div className="pt-2 border-t border-border/60 flex items-center justify-between">
                  <button
                    onClick={() => setSelectedEvidence(acc.opportunity.evidence[0])}
                    className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 font-mono transition-colors underline underline-offset-2"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
                    <span>View SOW / RFP Evidence ({acc.opportunity.evidence.length})</span>
                  </button>
                  <span className="text-[10px] text-emerald-400 font-mono font-medium">Validated</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Expansion Traps Radar */}
      <div className="bg-card border border-border rounded-lg p-4 space-y-3.5">
        <div className="flex items-center justify-between border-b border-border pb-2.5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-xs uppercase tracking-wider text-amber-400">
              Expansion Trap Detector
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800/60 font-semibold">
              {expansionTraps.length} Trap Flagged
            </span>
          </div>
          <span className="text-xs text-zinc-400 hidden sm:inline">
            Hardware requests with adoption decline
          </span>
        </div>

        <div className="space-y-2.5">
          {expansionTraps.map((acc) => (
            <div
              key={acc.id}
              className="p-3 rounded border border-amber-900/40 bg-background/50 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Link
                    href={`/accounts/${acc.id}`}
                    className="font-semibold text-xs text-white hover:text-zinc-300 transition-colors flex items-center gap-1"
                  >
                    <span>{acc.name}</span>
                    <ArrowUpRight className="w-3 h-3 text-zinc-500" />
                  </Link>
                  <div className="text-[11px] text-zinc-400 font-mono mt-0.5">
                    Current: ${acc.nominalArr.toLocaleString()} ARR (10 Docks)
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800/80 text-[10px] font-mono font-bold">
                  EXPANSION TRAP
                </span>
              </div>

              <div className="p-2 rounded bg-secondary/60 border border-border text-xs text-amber-200/90 leading-relaxed font-mono">
                <strong className="text-amber-400">Trap Diagnostic:</strong> {acc.opportunity.trapReason || acc.opportunity.details}
              </div>

              {acc.opportunity.evidence.length > 0 && (
                <div className="pt-2 border-t border-border/60 flex items-center justify-between">
                  <button
                    onClick={() => setSelectedEvidence(acc.opportunity.evidence[0])}
                    className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 font-mono transition-colors underline underline-offset-2"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Inspect Billing & Ops Evidence</span>
                  </button>
                  <Link
                    href={`/accounts/${acc.id}`}
                    className="text-xs text-zinc-300 hover:text-white font-medium"
                  >
                    Review Account
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Traceable Evidence Drawer */}
      <EvidenceDrawer
        evidence={selectedEvidence}
        onClose={() => setSelectedEvidence(null)}
      />
    </div>
  );
}
