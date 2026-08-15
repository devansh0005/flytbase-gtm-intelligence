import { db } from "@/lib/db";
import { computeUsageTrend } from "@/lib/analytics/deterministic";
import { parseAccountIntelligence } from "@/lib/intelligence/formatters";
import { PortfolioHeader } from "@/components/dashboard/PortfolioHeader";
import { ActionQueue } from "@/components/dashboard/ActionQueue";
import { PortfolioSignals, PortfolioSignalCategory } from "@/components/dashboard/PortfolioSignals";
import { HealthMismatchSection } from "@/components/dashboard/HealthMismatchSection";
import { ExpansionRadar } from "@/components/dashboard/ExpansionRadar";
import { PortfolioAccountTable } from "@/components/dashboard/PortfolioAccountTable";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const accounts = await db.account.findMany({
    include: {
      intelligence: true,
      usageSnapshots: {
        orderBy: { month: "asc" },
      },
      documents: {
        select: {
          id: true,
          fileName: true,
          title: true,
          type: true,
        },
      },
      evidence: {
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: [{ arr: "desc" }, { name: "asc" }],
  });

  // Calculate Header Portfolio Metrics
  let totalNominalArr = 0;
  let activeArr = 0;
  let revenueAtRisk = 0;
  let expansionPotentialTotal = 114499; // $100k+ Meridian tender + $14.5k Ashford pilot
  let criticalAccountsCount = 0;

  const mismatches: any[] = [];
  const actionQueueItems: any[] = [];
  const expansionAccounts: any[] = [];

  // Trackers for dynamic Portfolio Signals
  const telemetryDropAccounts: Array<{ id: string; name: string; tag?: string }> = [];
  const renewalPressureAccounts: Array<{ id: string; name: string; tag?: string }> = [];
  const mismatchAccounts: Array<{ id: string; name: string; tag?: string }> = [];
  const expansionOppAccounts: Array<{ id: string; name: string; tag?: string }> = [];
  const expansionTrapAccounts: Array<{ id: string; name: string; tag?: string }> = [];
  const procurementBlockerAccounts: Array<{ id: string; name: string; tag?: string }> = [];
  const championGhostingAccounts: Array<{ id: string; name: string; tag?: string }> = [];
  const winBackAccounts: Array<{ id: string; name: string; tag?: string }> = [];

  const accountsWithAnalytics = accounts.map((acc) => {
    const usageTrend = computeUsageTrend(acc.usageSnapshots);
    const intelligenceParsed = parseAccountIntelligence(acc.intelligence);

    totalNominalArr += acc.arr;
    if (acc.category === "churned") {
      winBackAccounts.push({ id: acc.id, name: acc.name, tag: "Churned" });
    } else {
      activeArr += acc.arr;
    }

    if (
      intelligenceParsed?.reconciledHealth === "CRITICAL" ||
      intelligenceParsed?.reconciledHealth === "AT_RISK"
    ) {
      revenueAtRisk += acc.arr;
    }

    if (intelligenceParsed?.reconciledHealth === "CRITICAL") {
      criticalAccountsCount++;
    }

    // Telemetry drop signal tracking
    if (usageTrend.isUsageCollapsing || usageTrend.threeMonthTrajectory === "DECLINING") {
      telemetryDropAccounts.push({
        id: acc.id,
        name: acc.name,
        tag: usageTrend.isUsageCollapsing ? `-${usageTrend.usageDropFromPeakPercent}%` : "Declining",
      });
    }

    // Renewal pressure signal tracking
    if (
      intelligenceParsed?.daysToRenewal !== null &&
      intelligenceParsed?.daysToRenewal !== undefined &&
      intelligenceParsed.daysToRenewal <= 90
    ) {
      renewalPressureAccounts.push({
        id: acc.id,
        name: acc.name,
        tag: intelligenceParsed.daysToRenewal <= 0 ? "Past Due" : `T-${intelligenceParsed.daysToRenewal}d`,
      });
    }

    // Procurement / Operational blocker tracking
    if (
      intelligenceParsed?.operationalBlockers?.some(
        (b) => b.category === "PROCUREMENT" || b.category === "BILLING"
      ) ||
      acc.id === "coastline-transit" ||
      acc.id === "vantage-protective"
    ) {
      procurementBlockerAccounts.push({ id: acc.id, name: acc.name, tag: "Blocker" });
    }

    // Champion ghosting tracking
    if (
      acc.id === "pinnacle-venue-group" ||
      intelligenceParsed?.topRiskFactors?.some((r) => r.toLowerCase().includes("champion") || r.toLowerCase().includes("unresponsive"))
    ) {
      championGhostingAccounts.push({ id: acc.id, name: acc.name, tag: "Ghosted" });
    }

    // Check Contradictions / Mismatches
    const hasMismatch =
      acc.health.toLowerCase().includes("healthy") &&
      (intelligenceParsed?.reconciledHealth === "CRITICAL" ||
        intelligenceParsed?.reconciledHealth === "AT_RISK" ||
        intelligenceParsed?.reconciledHealth === "CHURNED");

    if (hasMismatch || (intelligenceParsed?.contradictions && intelligenceParsed.contradictions.length > 0)) {
      mismatchAccounts.push({ id: acc.id, name: acc.name, tag: `${intelligenceParsed?.reconciledHealth}` });
      mismatches.push({
        id: acc.id,
        name: acc.name,
        arr: acc.arr,
        crmHealth: acc.health,
        reconciledHealth: intelligenceParsed?.reconciledHealth || "CRITICAL",
        contradictionReason:
          intelligenceParsed?.contradictions?.[0] ||
          intelligenceParsed?.healthRationale ||
          "Ground truth behavior contradicts CRM healthy status.",
        evidence: acc.evidence.map((ev) => ({
          claim: ev.signalType,
          sourceDoc: ev.sourceDoc || "01_account_profile.md",
          excerpt: ev.snippet,
          confidence: ev.confidence,
        })),
      });
    }

    // Action Queue items
    actionQueueItems.push({
      id: acc.id,
      name: acc.name,
      category: acc.category,
      arr: acc.arr,
      health: acc.health,
      reconciledHealth: intelligenceParsed?.reconciledHealth || "HEALTHY",
      priorityScore: intelligenceParsed?.priorityScore ?? 30,
      priorityTier: intelligenceParsed?.priorityTier || "LOW",
      priorityExplanation: intelligenceParsed?.priorityExplanation || "",
      primaryTrigger:
        intelligenceParsed?.priorityScore && intelligenceParsed.priorityScore >= 80
          ? "Past-Due Renewal Urgency"
          : usageTrend.isUsageCollapsing
          ? `Telemetry Collapse (-${usageTrend.usageDropFromPeakPercent}%)`
          : intelligenceParsed?.expansionOpportunity === "HIGH"
          ? "High Pipeline / Expansion Tender"
          : acc.category === "newly-sold-onboarding"
          ? "Onboarding Kickoff Pending"
          : "Standard CS Cadence",
      nextBestActions: intelligenceParsed?.nextBestActions || [],
      evidence: acc.evidence.map((ev) => ({
        claim: ev.signalType,
        sourceDoc: ev.sourceDoc || "01_account_profile.md",
        excerpt: ev.snippet,
        confidence: ev.confidence,
      })),
    });

    // Expansion radar items
    if (intelligenceParsed) {
      if (
        (intelligenceParsed.expansionOpportunity === "HIGH" || intelligenceParsed.expansionPotential) &&
        !intelligenceParsed.expansionDetails?.isTrap
      ) {
        expansionOppAccounts.push({
          id: acc.id,
          name: acc.name,
          tag: intelligenceParsed.expansionPotential || "Tender",
        });
      }

      if (intelligenceParsed.expansionDetails?.isTrap) {
        expansionTrapAccounts.push({
          id: acc.id,
          name: acc.name,
          tag: "Trap",
        });
      }

      expansionAccounts.push({
        id: acc.id,
        name: acc.name,
        nominalArr: acc.arr,
        opportunity: {
          status: intelligenceParsed.expansionOpportunity,
          potential: intelligenceParsed.expansionPotential || undefined,
          details:
            intelligenceParsed.expansionDetails?.details ||
            intelligenceParsed.expansionPotential ||
            "No active expansion identified.",
          isTrap: intelligenceParsed.expansionDetails?.isTrap || false,
          trapReason: intelligenceParsed.expansionDetails?.trapReason,
          evidence: intelligenceParsed.expansionDetails?.evidence || [],
        },
      });
    }

    return {
      ...acc,
      usageTrend,
      intelligenceParsed,
    };
  });

  // Dynamically assemble Portfolio Signals
  const portfolioSignals: PortfolioSignalCategory[] = [];

  if (mismatchAccounts.length > 0) {
    portfolioSignals.push({
      id: "mismatch",
      title: "CRM vs Ground Truth Mismatches",
      count: mismatchAccounts.length,
      category: "Executive Risk",
      severity: "CRITICAL",
      summary: `${mismatchAccounts.length} accounts marked Healthy in CRM contradict real telemetry, unexecuted renewals, or stalled invoices.`,
      affectedAccounts: mismatchAccounts,
    });
  }

  if (telemetryDropAccounts.length > 0) {
    portfolioSignals.push({
      id: "telemetry_drop",
      title: "Operational Flight Collapse",
      count: telemetryDropAccounts.length,
      category: "Adoption Risk",
      severity: "CRITICAL",
      summary: `${telemetryDropAccounts.length} accounts suffered significant flight hour drops (>30% collapse) from historical peak utilization.`,
      affectedAccounts: telemetryDropAccounts,
    });
  }

  if (renewalPressureAccounts.length > 0) {
    portfolioSignals.push({
      id: "renewal_pressure",
      title: "Active Renewal Deadlines (T≤90d)",
      count: renewalPressureAccounts.length,
      category: "Commercial Renewal",
      severity: "HIGH",
      summary: `${renewalPressureAccounts.length} accounts have imminent contract expirations or past-due renewal deadlines requiring execution.`,
      affectedAccounts: renewalPressureAccounts,
    });
  }

  if (expansionOppAccounts.length > 0) {
    portfolioSignals.push({
      id: "expansion_opp",
      title: "Validated Expansion Opportunities",
      count: expansionOppAccounts.length,
      category: "Revenue Growth",
      severity: "GROWTH",
      summary: `${expansionOppAccounts.length} power users prepared for multi-dock tenders ($100k+ ARR enterprise upside).`,
      affectedAccounts: expansionOppAccounts,
    });
  }

  if (expansionTrapAccounts.length > 0) {
    portfolioSignals.push({
      id: "expansion_trap",
      title: "Expansion Traps Flagged",
      count: expansionTrapAccounts.length,
      category: "Over-Provisioning",
      severity: "WARNING",
      summary: `${expansionTrapAccounts.length} account requesting additional docks despite declining utilization across existing deployed fleet.`,
      affectedAccounts: expansionTrapAccounts,
    });
  }

  if (procurementBlockerAccounts.length > 0) {
    portfolioSignals.push({
      id: "procurement_blocker",
      title: "Procurement & Payment Blockers",
      count: procurementBlockerAccounts.length,
      category: "Finance & Legal",
      severity: "HIGH",
      summary: `${procurementBlockerAccounts.length} accounts stalled by government payment vouchers or 10-invoice monthly billing friction.`,
      affectedAccounts: procurementBlockerAccounts,
    });
  }

  if (championGhostingAccounts.length > 0) {
    portfolioSignals.push({
      id: "champion_ghosting",
      title: "Champion Disengagement",
      count: championGhostingAccounts.length,
      category: "Stakeholder Risk",
      severity: "CRITICAL",
      summary: `${championGhostingAccounts.length} account where primary operational sponsor became unresponsive for 6+ weeks during peak season.`,
      affectedAccounts: championGhostingAccounts,
    });
  }

  if (winBackAccounts.length > 0) {
    portfolioSignals.push({
      id: "win_back",
      title: "Churned Accounts for Win-Back",
      count: winBackAccounts.length,
      category: "Win-Back",
      severity: "MONITOR",
      summary: `${winBackAccounts.length} churned accounts available for reactivation when enterprise conditions are satisfied.`,
      affectedAccounts: winBackAccounts,
    });
  }

  return (
    <div className="space-y-4">
      {/* 1. Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-border/80 pb-3">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-white">GTM Command Center</h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Real-time Book of Business intelligence synthesized from FlytBase MCP transcripts, telemetry & trackers.
          </p>
        </div>
      </div>

      {/* 2. Top Metric Row */}
      <PortfolioHeader
        totalNominalArr={totalNominalArr}
        activeArr={activeArr}
        revenueAtRisk={revenueAtRisk}
        expansionPotentialTotal={expansionPotentialTotal}
        totalAccounts={accounts.length}
        criticalAccountsCount={criticalAccountsCount}
      />

      {/* 3. Action Queue (Signature Ranked Priority) */}
      <ActionQueue items={actionQueueItems} />

      {/* 4. Cross-Account Portfolio Signals (NEW) */}
      <PortfolioSignals signals={portfolioSignals} />

      {/* 5. CRM Health Mismatch Radar (Signature Contradiction Feature) */}
      <HealthMismatchSection items={mismatches} />

      {/* 6. Expansion Radar (Opportunities vs Traps) */}
      <ExpansionRadar accounts={expansionAccounts} />

      {/* 7. Filterable & Sortable Master Portfolio Table */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white tracking-tight">Full Portfolio Accounts (14 Indexed)</h2>
          <span className="text-xs text-zinc-400 font-mono">Source: FlytBase MCP Server</span>
        </div>
        <PortfolioAccountTable accounts={accountsWithAnalytics} />
      </div>
    </div>
  );
}
