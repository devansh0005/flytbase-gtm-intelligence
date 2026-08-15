import {
  DeterministicSignals,
  ExtractedRisk,
  ExtractedBlocker,
  ReconciledHealth,
  EvidenceReference,
} from "./types";

export interface HealthReconciliationInput {
  accountId: string;
  name: string;
  crmHealth: string;
  crmSentiment: string;
  category: string;
  deterministic: DeterministicSignals;
  risks: ExtractedRisk[];
  blockers: ExtractedBlocker[];
  evidence: EvidenceReference[];
}

export interface ReconciledHealthOutput {
  reconciledHealth: ReconciledHealth;
  healthScore: number; // 0 to 100
  healthRationale: string;
  topRiskFactors: string[];
  contradictions: string[];
  confidence: number;
}

export class HealthReconciler {
  public static reconcile(input: HealthReconciliationInput): ReconciledHealthOutput {
    const { deterministic, crmHealth, crmSentiment, risks, blockers, category } = input;
    const contradictions: string[] = [];
    const topRiskFactors: string[] = [];

    // Base score initialization
    let score = 85;

    // 1. Churned State Check
    if (deterministic.isChurnedState) {
      if (crmHealth.toLowerCase().includes("healthy")) {
        contradictions.push(
          `CRM states health is '${crmHealth}', but the account has officially churned / non-renewed.`
        );
      }
      return {
        reconciledHealth: "CHURNED",
        healthScore: 0,
        healthRationale:
          "Account has lapsed or confirmed non-renewal. Telemetry flight hours are at zero.",
        topRiskFactors: ["Subscription lapsed/cancelled", "Zero active flight operations"],
        contradictions,
        confidence: 1.0,
      };
    }

    // 2. Telemetry Usage Penalties / Adjustments
    if (deterministic.isUsageCollapsing) {
      score -= 35;
      const riskText = `Flight telemetry collapsed ${deterministic.usageDropFromPeakPercent}% from peak (${deterministic.peakFlightHours}h → ${deterministic.latestFlightHours}h)`;
      topRiskFactors.push(riskText);
      if (crmHealth.toLowerCase().includes("healthy")) {
        contradictions.push(
          `CRM records 'Healthy', but flight hours dropped ${deterministic.usageDropFromPeakPercent}% over recent months.`
        );
      }
    } else if (deterministic.threeMonthUsageTrajectory === "DECLINING") {
      score -= 15;
      topRiskFactors.push(
        `Usage is steadily declining over the last 3 months (${deterministic.latestFlightHours}h latest)`
      );
    } else if (deterministic.threeMonthUsageTrajectory === "GROWING") {
      score += 10;
    }

    // 3. Renewal Urgency Penalties
    if (deterministic.renewalStatusFlag === "IMMEDIATE_PAST_DUE") {
      score -= 40;
      topRiskFactors.push("Renewal license is past due with stalled payment channel");
      if (crmHealth.toLowerCase().includes("healthy")) {
        contradictions.push(
          "CRM states 'Healthy', but subscription line is past due without executed renewal voucher."
        );
      }
    } else if (deterministic.renewalStatusFlag === "UPCOMING_CRITICAL") {
      score -= 25;
      topRiskFactors.push(
        `Critical renewal expiring in T-${deterministic.daysToRenewal} days with open blockers`
      );
    }

    // 4. Blockers & Risks
    for (const b of blockers) {
      if (b.severity === "HIGH") {
        score -= 15;
        topRiskFactors.push(`High severity blocker: ${b.title}`);
      } else {
        score -= 5;
      }
    }

    for (const r of risks) {
      if (r.severity === "HIGH") {
        score -= 15;
        topRiskFactors.push(`High severity risk: ${r.title}`);
      }
    }

    // Normalize score to 0 - 100
    score = Math.max(0, Math.min(100, score));

    // Determine Reconciled Health Category
    let reconciledHealth: ReconciledHealth = "HEALTHY";
    if (score < 30) {
      reconciledHealth = "CRITICAL";
    } else if (score < 55) {
      reconciledHealth = "AT_RISK";
    } else if (score < 75) {
      reconciledHealth = "WATCH";
    } else {
      reconciledHealth = "HEALTHY";
    }

    // Generate Rationales
    let healthRationale = "";
    if (reconciledHealth === "CRITICAL") {
      healthRationale = `Account is in immediate crisis (Health Score: ${score}/100) due to ${topRiskFactors.slice(0, 2).join(" and ")}. Immediate executive GTM intervention required.`;
    } else if (reconciledHealth === "AT_RISK") {
      healthRationale = `Account exhibits serious operational or adoption risks (Health Score: ${score}/100): ${topRiskFactors.slice(0, 2).join(", ")}. Requires active remediation.`;
    } else if (reconciledHealth === "WATCH") {
      healthRationale = `Account is functional but has friction points (Health Score: ${score}/100): ${topRiskFactors[0] || "Onboarding/scoping items pending"}.`;
    } else {
      healthRationale = `Account is performing strongly (Health Score: ${score}/100) with healthy usage adoption and positive stakeholder alignment.`;
    }

    return {
      reconciledHealth,
      healthScore: score,
      healthRationale,
      topRiskFactors: topRiskFactors.slice(0, 4),
      contradictions,
      confidence: 0.95,
    };
  }
}
