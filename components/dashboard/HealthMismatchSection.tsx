"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowRight, ShieldCheck, ArrowUpRight } from "lucide-react";
import { EvidenceDrawer } from "@/components/evidence/EvidenceDrawer";
import { EvidenceReference } from "@/lib/intelligence/types";

interface MismatchItem {
  id: string;
  name: string;
  arr: number;
  crmHealth: string;
  reconciledHealth: string;
  contradictionReason: string;
  evidence: EvidenceReference[];
}

export function HealthMismatchSection({ items }: { items: MismatchItem[] }) {
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceReference | null>(null);

  if (!items || items.length === 0) return null;

  return (
    <div className="bg-card border border-border border-l-2 border-l-amber-500/80 rounded-lg p-4 space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-2.5">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-400" />
          <h2 className="text-sm font-bold text-white tracking-tight">
            CRM Health Disconnect Radar
          </h2>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800/60 font-semibold">
            {items.length} Contradictions Flagged
          </span>
        </div>
        <span className="text-xs text-zinc-400 hidden sm:inline">
          Accounts where recorded CRM flags contradict real telemetry & contract blockers
        </span>
      </div>

      {/* Contradiction Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="p-3.5 rounded border border-border bg-background/50 flex flex-col justify-between space-y-3"
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <Link
                  href={`/accounts/${item.id}`}
                  className="font-semibold text-xs text-white hover:text-zinc-300 transition-colors flex items-center gap-1"
                >
                  <span>{item.name}</span>
                  <ArrowUpRight className="w-3 h-3 text-zinc-500" />
                </Link>
                <span className="font-mono text-xs font-semibold text-zinc-300">
                  ${item.arr.toLocaleString()}
                </span>
              </div>

              {/* Side-by-side Comparison Treatment */}
              <div className="grid grid-cols-5 items-center bg-secondary/50 border border-border/80 p-2 rounded text-xs">
                <div className="col-span-2">
                  <div className="text-[9px] text-zinc-400 uppercase font-semibold">CRM Record</div>
                  <div className="font-mono text-xs font-semibold text-zinc-300 mt-0.5">
                    {item.crmHealth || "Healthy"}
                  </div>
                </div>

                <div className="col-span-1 flex justify-center text-zinc-500">
                  <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
                </div>

                <div className="col-span-2 text-right">
                  <div className="text-[9px] text-red-400 uppercase font-semibold">Ground Truth</div>
                  <div className="font-mono text-xs font-bold text-red-400 mt-0.5">
                    {item.reconciledHealth}
                  </div>
                </div>
              </div>

              {/* Reason */}
              <p className="text-xs text-zinc-400 leading-relaxed line-clamp-3">
                {item.contradictionReason}
              </p>
            </div>

            {/* Footer Verification CTA */}
            <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs">
              {item.evidence.length > 0 ? (
                <button
                  onClick={() => setSelectedEvidence(item.evidence[0])}
                  className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 font-mono transition-colors underline underline-offset-2"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Verify ({item.evidence.length})</span>
                </button>
              ) : (
                <span className="text-[11px] text-zinc-500 font-mono">Deterministic signal</span>
              )}

              <Link
                href={`/accounts/${item.id}`}
                className="text-xs text-zinc-300 hover:text-white font-medium flex items-center gap-1"
              >
                Inspect 360°
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Traceable Evidence Drawer */}
      <EvidenceDrawer
        evidence={selectedEvidence}
        onClose={() => setSelectedEvidence(null)}
      />
    </div>
  );
}
