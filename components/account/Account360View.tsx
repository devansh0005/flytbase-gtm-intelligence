"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  User,
  Wrench,
  AlertTriangle,
  FileText,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { UsageChart } from "@/components/account/UsageChart";
import { DocumentViewerList } from "@/components/account/DocumentViewerModal";
import { EvidenceDrawer } from "@/components/evidence/EvidenceDrawer";
import { DecisionChain, DecisionChainStep } from "@/components/account/DecisionChain";
import { FormattedAccountIntelligence } from "@/lib/intelligence/formatters";
import { EvidenceReference } from "@/lib/intelligence/types";

interface Account360Props {
  account: {
    id: string;
    accountId: string;
    name: string;
    category: string;
    vertical: string;
    region: string;
    arr: number;
    docks: string;
    health: string;
    sentiment: string;
    tier: string;
    csOwner: string;
    seOwner: string;
    championTagged: string | null;
    intelligenceParsed: FormattedAccountIntelligence | null;
    usageSnapshots: Array<{ month: string; flightHours: number; missions: number }>;
    documents: Array<{
      id: string;
      fileName: string;
      title: string;
      type: string;
      date?: string | null;
      rawContent?: string | null;
    }>;
    evidence?: Array<{
      signalType: string;
      sourceDoc: string | null;
      snippet: string;
      confidence: number;
    }>;
    usageTrend: {
      totalFlightHours: number;
      totalMissions: number;
      latestFlightHours: number;
      previousFlightHours: number;
      deltaFlightHoursPercent: number | null;
      threeMonthTrajectory: string;
      peakFlightHours: number;
      usageDropFromPeakPercent: number | null;
      isUsageCollapsing: boolean;
    };
  };
}

export function Account360View({ account }: Account360Props) {
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceReference | null>(null);
  const intel = account.intelligenceParsed;

  const getHealthBadge = (health?: string) => {
    switch (health) {
      case "CRITICAL":
        return (
          <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-red-950/80 text-red-400 border border-red-800/80">
            CRITICAL ({intel?.healthScore}/100)
          </span>
        );
      case "AT_RISK":
        return (
          <span className="px-2.5 py-0.5 rounded text-xs font-mono font-semibold bg-amber-950/80 text-amber-400 border border-amber-800/80">
            AT RISK ({intel?.healthScore}/100)
          </span>
        );
      case "WATCH":
        return (
          <span className="px-2.5 py-0.5 rounded text-xs font-mono font-medium bg-zinc-800 text-zinc-300 border border-zinc-700">
            WATCH ({intel?.healthScore}/100)
          </span>
        );
      case "CHURNED":
        return (
          <span className="px-2.5 py-0.5 rounded text-xs font-mono font-medium bg-zinc-900 text-zinc-400 border border-zinc-800">
            CHURNED
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded text-xs font-mono font-medium bg-emerald-950/80 text-emerald-400 border border-emerald-800/80">
            HEALTHY ({intel?.healthScore}/100)
          </span>
        );
    }
  };

  const getUrgencyBadge = (tier?: string) => {
    switch (tier) {
      case "CRITICAL":
        return (
          <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-red-900 text-red-100 border border-red-700 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
            P0 URGENT
          </span>
        );
      case "HIGH":
        return (
          <span className="px-2.5 py-0.5 rounded text-xs font-mono font-semibold bg-amber-900/80 text-amber-200 border border-amber-700">
            HIGH URGENCY
          </span>
        );
      case "MEDIUM":
        return (
          <span className="px-2.5 py-0.5 rounded text-xs font-mono font-medium bg-zinc-800 text-zinc-300 border border-zinc-700">
            MEDIUM
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded text-xs font-mono text-zinc-400 bg-zinc-900 border border-zinc-800">
            STANDARD MONITOR
          </span>
        );
    }
  };

  // Construct Explainable Decision Chain from Real Telemetry & Intelligence
  const decisionChainSteps: DecisionChainStep[] = [];
  const primaryEvidence = account.evidence && account.evidence.length > 0 ? {
    claim: account.evidence[0].signalType,
    sourceDoc: account.evidence[0].sourceDoc || "01_account_profile.md",
    excerpt: account.evidence[0].snippet,
    confidence: account.evidence[0].confidence,
  } : undefined;

  // 1. Raw Signal
  if (account.usageTrend.isUsageCollapsing) {
    decisionChainSteps.push({
      stage: "RAW_SIGNAL",
      title: `Telemetry Collapse (-${account.usageTrend.usageDropFromPeakPercent}%)`,
      description: `Monthly flight hours fell from ${account.usageTrend.peakFlightHours}h peak to ${account.usageTrend.latestFlightHours}h in latest month.`,
      tag: "Usage Telemetry",
    });
  } else if (intel?.daysToRenewal !== null && intel?.daysToRenewal !== undefined && intel.daysToRenewal <= 30) {
    decisionChainSteps.push({
      stage: "RAW_SIGNAL",
      title: intel.daysToRenewal <= 0 ? "Renewal Past Due" : `Renewal Due in T-${intel.daysToRenewal}d`,
      description: `Contract expiration deadline active in renewal schedule.`,
      tag: "Contract Schedule",
    });
  } else if (account.usageTrend.threeMonthTrajectory === "GROWING") {
    decisionChainSteps.push({
      stage: "RAW_SIGNAL",
      title: `Telemetry Growth (+${account.usageTrend.deltaFlightHoursPercent || 150}%)`,
      description: `Flight operations expanded from ${account.usageTrend.previousFlightHours}h to ${account.usageTrend.latestFlightHours}h monthly.`,
      tag: "Usage Telemetry",
    });
  } else {
    decisionChainSteps.push({
      stage: "RAW_SIGNAL",
      title: `Fleet Baseline Operations`,
      description: `Active fleet of ${account.docks} with ${account.usageTrend.totalFlightHours}h total flight telemetry logged.`,
      tag: "Account Profile",
    });
  }

  // 2. Interpretation
  decisionChainSteps.push({
    stage: "INTERPRETATION",
    title: intel?.contradictions && intel.contradictions.length > 0 ? "Behavioral Disconnect" : "Operational Assessment",
    description: intel?.contradictions?.[0] || intel?.healthRationale || "Account telemetry and engagement signals evaluated.",
    evidence: primaryEvidence,
    tag: "Intelligence",
  });

  // 3. Business Impact
  decisionChainSteps.push({
    stage: "BUSINESS_IMPACT",
    title: intel?.reconciledHealth === "CRITICAL" || intel?.reconciledHealth === "AT_RISK" ? `$${account.arr.toLocaleString()} ARR At Risk` : intel?.expansionOpportunity === "HIGH" ? `$${account.arr.toLocaleString()} ARR + Expansion Upside` : `$${account.arr.toLocaleString()} ARR Stable`,
    description: intel?.priorityExplanation || (intel?.reconciledHealth === "CRITICAL" ? "High immediate churn probability without prompt GTM intervention." : "Commercial contract operating within acceptable bounds."),
    tag: "Commercial Impact",
  });

  // 4. Recommended Action
  const topAction = intel?.nextBestActions?.[0];
  decisionChainSteps.push({
    stage: "RECOMMENDED_ACTION",
    title: topAction?.action || "Maintain Standard CS Cadence",
    description: topAction?.expectedOutcome ? `Goal: ${topAction.expectedOutcome}` : (topAction?.reason || "Execute proactive stakeholder cadence."),
    evidence: topAction?.evidence?.[0],
    tag: topAction?.priority || "P1",
  });

  return (
    <div className="space-y-4">
      {/* Top Back Navigation */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors font-mono"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Portfolio Command Center</span>
        </Link>
      </div>

      {/* Account Header Banner */}
      <div className="bg-card border border-border rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-sm">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl font-bold text-white tracking-tight">{account.name}</h1>
            <span className="px-2 py-0.5 text-xs font-mono rounded bg-secondary text-zinc-300 border border-border capitalize">
              {account.category.replace(/-/g, " ")}
            </span>
            {getHealthBadge(intel?.reconciledHealth)}
            {getUrgencyBadge(intel?.priorityTier)}
          </div>
          <div className="flex items-center gap-3 text-xs text-zinc-400 font-mono flex-wrap">
            <span>{account.accountId}</span>
            <span>•</span>
            <span>{account.vertical}</span>
            <span>•</span>
            <span>{account.region}</span>
            <span>•</span>
            <span>Tier: {account.tier}</span>
          </div>
        </div>

        <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-border pt-3 md:pt-0 md:pl-6">
          <div>
            <div className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 font-semibold">
              Nominal ARR
            </div>
            <div className="text-xl font-bold font-mono text-emerald-400">
              ${account.arr.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 font-semibold">
              Priority Score
            </div>
            <div className="text-lg font-bold font-mono text-white">
              {intel?.priorityScore ?? "—"}/100
            </div>
          </div>
        </div>
      </div>

      {/* NEW: Explainable Decision Chain */}
      <DecisionChain steps={decisionChainSteps} accountName={account.name} />

      {/* Section A: Executive Health Brief */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Cols: Health Diagnosis & Contradictions */}
        <div className="lg:col-span-2 bg-card border border-border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-zinc-300" />
              <h2 className="font-bold text-xs uppercase tracking-wider text-white">Executive Health Diagnosis</h2>
            </div>
            <span className="text-xs text-zinc-400 font-mono">
              Score: {intel?.healthScore}/100
            </span>
          </div>

          <p className="text-xs text-zinc-200 leading-relaxed font-medium">
            {intel?.healthRationale}
          </p>

          {/* Contradictions Box */}
          {intel?.contradictions && intel.contradictions.length > 0 && (
            <div className="p-3 rounded bg-red-950/40 border border-red-800/60 space-y-1">
              <div className="text-xs font-bold text-red-300 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                <span>CRM vs Ground Truth Disconnect Flagged</span>
              </div>
              <ul className="text-xs text-red-200/90 list-disc list-inside space-y-0.5">
                {intel.contradictions.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right Col: Team & Deployment Profile */}
        <div className="bg-card border border-border rounded-lg p-4 space-y-2.5">
          <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-400 border-b border-border pb-2">
            CRM Profile Metadata
          </h3>
          <div className="text-xs space-y-1.5 text-zinc-300 font-mono">
            <div className="flex justify-between">
              <span className="text-zinc-400">CS Owner:</span>
              <span className="font-medium text-white">{account.csOwner || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">SE Owner:</span>
              <span className="font-medium text-white">{account.seOwner || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Tagged Champion:</span>
              <span className="font-medium text-white">{account.championTagged || "None tagged"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Docks / Fleet:</span>
              <span className="font-medium text-white">{account.docks}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">CRM Health:</span>
              <span className="font-medium text-zinc-300">{account.health || "—"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Section F: Prioritized Next Best Actions */}
      <div className="bg-card border border-border rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-zinc-300" />
            <h2 className="font-bold text-xs uppercase tracking-wider text-white">Recommended Next Best Actions</h2>
          </div>
          <span className="text-xs text-zinc-400 font-mono">
            {intel?.nextBestActions?.length || 0} Actions Prioritized
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {intel?.nextBestActions?.map((act, idx) => (
            <div
              key={idx}
              className="p-3 rounded border border-border bg-background/50 flex flex-col justify-between space-y-2"
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-200 border border-zinc-700 font-mono font-bold text-[10px]">
                    {act.priority}
                  </span>
                  {act.evidence && act.evidence.length > 0 && (
                    <button
                      onClick={() => setSelectedEvidence(act.evidence[0])}
                      className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 font-mono underline underline-offset-2"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Evidence</span>
                    </button>
                  )}
                </div>
                <div className="font-bold text-xs text-white pt-0.5">{act.action}</div>
                <p className="text-xs text-zinc-400">{act.reason}</p>
              </div>

              <div className="pt-2 border-t border-border/60 text-[11px] text-emerald-400/90 font-mono">
                <strong>Expected Outcome:</strong> {act.expectedOutcome}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section C: Risks & Blockers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Risks */}
        <div className="bg-card border border-border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <h3 className="font-bold text-xs uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              Operational Risks ({intel?.topRiskFactors?.length || 0})
            </h3>
          </div>

          <div className="space-y-2">
            {intel?.topRiskFactors && intel.topRiskFactors.length > 0 ? (
              intel.topRiskFactors.map((r, i) => (
                <div
                  key={i}
                  className="p-2.5 rounded bg-amber-950/40 border border-amber-800/60 text-xs text-amber-200/90 flex items-start gap-2"
                >
                  <span className="font-bold text-amber-400">•</span>
                  <span>{r}</span>
                </div>
              ))
            ) : (
              <div className="text-xs text-zinc-400 italic">No high severity risks identified.</div>
            )}
          </div>
        </div>

        {/* Operational Blockers */}
        <div className="bg-card border border-border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5" />
              Operational Blockers ({intel?.operationalBlockers?.length || 0})
            </h3>
          </div>

          <div className="space-y-2">
            {intel?.operationalBlockers && intel.operationalBlockers.length > 0 ? (
              intel.operationalBlockers.map((b, i) => (
                <div
                  key={i}
                  className="p-2.5 rounded bg-background/50 border border-border text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-zinc-200">{b.title}</span>
                    <span className="px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 text-[10px] uppercase font-mono">
                      {b.category}
                    </span>
                  </div>
                  <p className="text-zinc-400">{b.details}</p>
                </div>
              ))
            ) : (
              <div className="text-xs text-zinc-400 italic">No active blockers logged.</div>
            )}
          </div>
        </div>
      </div>

      {/* Section D: Key Stakeholders */}
      <div className="bg-card border border-border rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" />
            Key Stakeholders & Champion Map ({intel?.keyStakeholders?.length || 0})
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {intel?.keyStakeholders && intel.keyStakeholders.length > 0 ? (
            intel.keyStakeholders.map((s, i) => (
              <div
                key={i}
                className="p-3 rounded border border-border bg-background/50 space-y-2 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-1">
                    <div>
                      <div className="font-semibold text-xs text-white flex items-center gap-1.5">
                        <span>{s.name}</span>
                        {s.isLikelyChampion && (
                          <span className="px-1.5 py-0.2 rounded bg-emerald-950/80 text-emerald-300 text-[9px] font-mono font-bold">
                            ★ Champion
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-zinc-400 mt-0.5">{s.role}</div>
                    </div>
                    <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-[9px] font-mono text-zinc-300 uppercase">
                      {s.authorityLevel}
                    </span>
                  </div>

                  {s.notes && (
                    <p className="text-xs text-zinc-400 mt-2 leading-relaxed">{s.notes}</p>
                  )}
                </div>

                {s.evidence && (
                  <div className="pt-2 border-t border-border/60">
                    <button
                      onClick={() => setSelectedEvidence(s.evidence)}
                      className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 font-mono underline underline-offset-2"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Role Evidence</span>
                    </button>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-xs text-zinc-400 italic col-span-3">No stakeholder profiles extracted.</div>
          )}
        </div>
      </div>

      {/* Section G: Telemetry Usage Trends Chart */}
      <div className="bg-card border border-border rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <div>
            <h3 className="font-bold text-xs uppercase tracking-wider text-white">Flight Telemetry History</h3>
            <p className="text-[11px] text-zinc-400">
              Monthly flight hours and mission count records synced from live MCP telemetry.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="text-zinc-400">
              Total Hours: <strong className="text-white">{account.usageTrend.totalFlightHours}h</strong>
            </span>
            <span className="text-zinc-400">
              Total Missions: <strong className="text-white">{account.usageTrend.totalMissions}</strong>
            </span>
          </div>
        </div>

        <UsageChart data={account.usageSnapshots} />
      </div>

      {/* Section I: Source Documents & Manifest */}
      <div className="bg-card border border-border rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <div>
            <h3 className="font-bold text-xs uppercase tracking-wider text-white">Source Documents Repository</h3>
            <p className="text-[11px] text-zinc-400">
              {account.documents.length} verified markdown documents available for this account.
            </p>
          </div>
        </div>

        <DocumentViewerList documents={account.documents} />
      </div>

      {/* Traceable Evidence Drawer */}
      <EvidenceDrawer
        evidence={selectedEvidence}
        onClose={() => setSelectedEvidence(null)}
      />
    </div>
  );
}
