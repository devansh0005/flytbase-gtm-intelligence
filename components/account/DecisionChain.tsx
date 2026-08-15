"use client";

import { useState } from "react";
import {
  ArrowDown,
  ShieldCheck,
  Zap,
  Activity,
  AlertTriangle,
  FileSearch,
} from "lucide-react";
import { EvidenceDrawer } from "@/components/evidence/EvidenceDrawer";
import { EvidenceReference } from "@/lib/intelligence/types";

export interface DecisionChainStep {
  stage: "RAW_SIGNAL" | "INTERPRETATION" | "BUSINESS_IMPACT" | "RECOMMENDED_ACTION";
  title: string;
  description: string;
  evidence?: EvidenceReference;
  tag?: string;
}

interface DecisionChainProps {
  steps: DecisionChainStep[];
  accountName: string;
}

export function DecisionChain({ steps, accountName }: DecisionChainProps) {
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceReference | null>(null);

  if (!steps || steps.length === 0) return null;

  const getStageHeader = (stage: DecisionChainStep["stage"]) => {
    switch (stage) {
      case "RAW_SIGNAL":
        return { label: "1. RAW SIGNAL", color: "text-zinc-400", border: "border-zinc-700" };
      case "INTERPRETATION":
        return { label: "2. INTERPRETATION", color: "text-amber-400", border: "border-amber-700/80" };
      case "BUSINESS_IMPACT":
        return { label: "3. BUSINESS IMPACT", color: "text-red-400", border: "border-red-700/80" };
      case "RECOMMENDED_ACTION":
        return { label: "4. RECOMMENDED ACTION", color: "text-emerald-400", border: "border-emerald-700/80" };
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-2.5">
        <div className="flex items-center gap-2">
          <FileSearch className="w-4 h-4 text-zinc-300" />
          <h2 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
            Explainable Decision Chain — Why This Decision?
          </h2>
        </div>
        <span className="text-[11px] text-zinc-400 font-mono hidden sm:inline">
          Transparent multi-stage reasoning grounded in telemetry & document evidence
        </span>
      </div>

      {/* Chain Steps (Horizontal on Desktop, Vertical on Mobile) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 relative">
        {steps.map((step, idx) => {
          const config = getStageHeader(step.stage);
          return (
            <div key={idx} className="flex flex-col justify-between p-3 rounded border border-border bg-background/60 space-y-2 relative">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${config.color}`}>
                    {config.label}
                  </span>
                  {step.tag && (
                    <span className="px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 text-[9px] font-mono">
                      {step.tag}
                    </span>
                  )}
                </div>

                <div className="font-semibold text-xs text-white">
                  {step.title}
                </div>

                <p className="text-[11px] text-zinc-300 leading-relaxed">
                  {step.description}
                </p>
              </div>

              {/* Evidence Link */}
              {step.evidence && (
                <div className="pt-2 border-t border-border/60">
                  <button
                    onClick={() => setSelectedEvidence(step.evidence!)}
                    className="text-[10px] text-zinc-400 hover:text-white flex items-center gap-1 font-mono transition-colors underline underline-offset-2"
                  >
                    <ShieldCheck className="w-3 h-3 text-zinc-400" />
                    <span>Evidence ({step.evidence.sourceDoc})</span>
                  </button>
                </div>
              )}
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
