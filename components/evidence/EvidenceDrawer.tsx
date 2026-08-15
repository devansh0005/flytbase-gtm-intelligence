"use client";

import { FileText, ShieldCheck, X, BookOpen, CheckCircle } from "lucide-react";
import { EvidenceReference } from "@/lib/intelligence/types";

interface EvidenceDrawerProps {
  evidence: EvidenceReference | null;
  onClose: () => void;
  onViewDocument?: (fileName: string) => void;
}

export function EvidenceDrawer({ evidence, onClose, onViewDocument }: EvidenceDrawerProps) {
  if (!evidence) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex justify-end animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-card border-l border-border h-full shadow-2xl flex flex-col p-5 overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-secondary text-zinc-300 rounded border border-border">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white tracking-tight">Source Evidence Audit</h3>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">
                {evidence.sourceDoc}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-secondary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="py-4 space-y-4 flex-1">
          {/* Claim Box */}
          <div className="space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 font-mono">
              Derived Claim / Signal
            </span>
            <div className="p-3 bg-secondary/50 border border-border rounded text-xs font-semibold text-white">
              {evidence.claim}
            </div>
          </div>

          {/* Verbatim Excerpt */}
          <div className="space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 font-mono">
              Verbatim Text Excerpt from Source
            </span>
            <div className="p-3.5 bg-background border border-border rounded font-mono text-xs text-zinc-200 leading-relaxed whitespace-pre-wrap">
              "{evidence.excerpt}"
            </div>
          </div>

          {/* Metadata Row */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <div className="p-2.5 bg-secondary/40 border border-border rounded">
              <div className="text-[10px] text-zinc-400 uppercase font-mono">Confidence Level</div>
              <div className="text-xs font-bold text-emerald-400 mt-0.5 font-mono flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>{Math.round(evidence.confidence * 100)}% Grounded</span>
              </div>
            </div>

            <div className="p-2.5 bg-secondary/40 border border-border rounded">
              <div className="text-[10px] text-zinc-400 uppercase font-mono">Document Classification</div>
              <div className="text-xs font-medium text-zinc-200 mt-0.5 capitalize font-mono">
                {evidence.sourceDoc.includes("transcript")
                  ? "Call Transcript"
                  : evidence.sourceDoc.includes("email")
                  ? "Email Thread"
                  : evidence.sourceDoc.includes("renewal")
                  ? "Renewal Tracker"
                  : evidence.sourceDoc.includes("ticket")
                  ? "Support Ticket"
                  : evidence.sourceDoc.includes("deal")
                  ? "Deal & Pricing Notes"
                  : "Internal Notes"}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
          {onViewDocument && (
            <button
              onClick={() => {
                onViewDocument(evidence.sourceDoc);
                onClose();
              }}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded border border-border bg-secondary hover:bg-zinc-800 text-zinc-200 font-mono transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Read Document</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="text-xs px-3.5 py-1.5 rounded border border-border bg-secondary hover:bg-zinc-800 text-zinc-200 hover:text-white transition-colors ml-auto font-mono"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
