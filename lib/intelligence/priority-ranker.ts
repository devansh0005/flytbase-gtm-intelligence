import {
  DeterministicSignals,
  PriorityTier,
  ReconciledHealth,
  ExtractedBlocker,
  ExtractedRisk,
  CustomerSentiment,
} from "./types";

interface PriorityRankerInput {
  accountId: string;
  name: string;
  nominalArr: number;
  category: string;
  reconciledHealth: ReconciledHealth;
  sentiment: CustomerSentiment;
  deterministic: DeterministicSignals;
  blockers: ExtractedBlocker[];
  risks: ExtractedRisk[];
  hasHighOpportunity: boolean;
  isChampionGhosting: boolean;
}

export interface PriorityScoreOutput {
  priorityScore: number; // 0 to 100
  priorityTier: PriorityTier;
  priorityExplanation: string;
  primaryTrigger: string;
}

export class PortfolioPriorityRanker {
  public static calculate(input: PriorityRankerInput): PriorityScoreOutput {
    const {
      accountId,
      name,
      nominalArr,
      reconciledHealth,
      sentiment,
      deterministic,
      blockers,
      risks,
      hasHighOpportunity,
      isChampionGhosting,
    } = input;

    let score = 0;
    const explanations: string[] = [];
    let primaryTrigger = "Standard monitoring";

    // 1. Renewal Urgency (0 - 35 points)
    if (deterministic.renewalStatusFlag === "IMMEDIATE_PAST_DUE") {
      score += 35;
      explanations.push("Immediate past-due renewal line item (+35)");
      primaryTrigger = "Past-Due Renewal Urgency";
    } else if (deterministic.renewalStatusFlag === "UPCOMING_CRITICAL") {
      score += 28;
      explanations.push(`Critical renewal in T-${deterministic.daysToRenewal} days (+28)`);
      primaryTrigger = `Critical Renewal (T-${deterministic.daysToRenewal}d)`;
    } else if (deterministic.daysToRenewal !== null && deterministic.daysToRenewal <= 90) {
      score += 15;
      explanations.push(`Upcoming renewal in T-${deterministic.daysToRenewal} days (+15)`);
    }

    // 2. Telemetry Usage Collapse / Deterioration (0 - 25 points)
    if (deterministic.isUsageCollapsing) {
      score += 25;
      explanations.push(
        `Usage collapsed ${deterministic.usageDropFromPeakPercent}% from peak (+25)`
      );
      if (primaryTrigger === "Standard monitoring") {
        primaryTrigger = `Usage Collapse (-${deterministic.usageDropFromPeakPercent}%)`;
      }
    } else if (deterministic.threeMonthUsageTrajectory === "DECLINING") {
      score += 14;
      explanations.push("Usage declining over past 3 months (+14)");
    } else if (
      deterministic.category === "newly-sold-onboarding" &&
      deterministic.latestFlightHours === 0
    ) {
      score += 20;
      explanations.push("Onboarding account with 0 flight hours deployed (+20)");
      primaryTrigger = "Stalled Onboarding Kickoff";
    }

    // 3. ARR Exposure (0 - 20 points)
    if (nominalArr >= 50000) {
      score += 20;
      explanations.push(`High ARR tier ($${nominalArr.toLocaleString()}) (+20)`);
    } else if (nominalArr >= 20000) {
      score += 16;
      explanations.push(`Mid-High ARR tier ($${nominalArr.toLocaleString()}) (+16)`);
    } else if (nominalArr >= 8000) {
      score += 12;
      explanations.push(`Mid ARR tier ($${nominalArr.toLocaleString()}) (+12)`);
    } else if (nominalArr > 0) {
      score += 8;
      explanations.push(`Standard ARR ($${nominalArr.toLocaleString()}) (+8)`);
    } else if (hasHighOpportunity) {
      score += 15;
      explanations.push("Pre-sale high pipeline conversion potential (+15)");
      if (primaryTrigger === "Standard monitoring") {
        primaryTrigger = "High Pipeline Conversion Opportunity";
      }
    }

    // 4. Stakeholder & Operational Risk (0 - 20 points)
    if (isChampionGhosting) {
      score += 20;
      explanations.push("Tagged champion unresponsive for 6+ weeks (+20)");
      primaryTrigger = "Champion Ghosting & Disengagement";
    } else if (blockers.some((b) => b.severity === "HIGH")) {
      score += 16;
      explanations.push("High severity compliance/infrastructure blocker (+16)");
      if (primaryTrigger === "Standard monitoring") {
        primaryTrigger = "Regulatory/Siting Blocker";
      }
    } else if (hasHighOpportunity && primaryTrigger === "Standard monitoring") {
      score += 15;
      explanations.push("Active multi-site expansion tender in flight (+15)");
      primaryTrigger = "Enterprise Expansion Tender";
    }

    // Cap score at 100
    score = Math.min(100, Math.round(score));

    // Priority Tier
    let priorityTier: PriorityTier = "LOW";
    if (score >= 80) {
      priorityTier = "CRITICAL";
    } else if (score >= 60) {
      priorityTier = "HIGH";
    } else if (score >= 40) {
      priorityTier = "MEDIUM";
    } else {
      priorityTier = "LOW";
    }

    const priorityExplanation = `Priority Score ${score}/100 (${priorityTier}): ${explanations.join(
      ", "
    )}.`;

    return {
      priorityScore: score,
      priorityTier,
      priorityExplanation,
      primaryTrigger,
    };
  }
}
