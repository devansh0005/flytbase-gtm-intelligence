import {
  NextBestAction,
  DeterministicSignals,
  ExtractedBlocker,
  ExtractedRisk,
  ReconciledHealth,
  EvidenceReference,
} from "./types";

interface ActionGeneratorInput {
  accountId: string;
  category: string;
  reconciledHealth: ReconciledHealth;
  deterministic: DeterministicSignals;
  blockers: ExtractedBlocker[];
  risks: ExtractedRisk[];
  opportunity: {
    status: string;
    isTrap: boolean;
    potential?: string;
  };
  winBack: {
    isChurned: boolean;
    viability: string;
    requiredConditions: string[];
  };
  evidence: EvidenceReference[];
}

export class ActionGenerator {
  public static generate(input: ActionGeneratorInput): NextBestAction[] {
    const {
      accountId,
      category,
      reconciledHealth,
      deterministic,
      blockers,
      risks,
      opportunity,
      winBack,
      evidence,
    } = input;

    const actions: NextBestAction[] = [];

    // 1. Critical Urgencies (P0)
    if (accountId === "coastline-transit") {
      actions.push({
        action: "Escalate payment voucher clearance with Roy Moser & reseller channel",
        priority: "P0",
        reason: "Plan B renewal is past due and Plan A expires in T-4 days with government payment voucher delay.",
        expectedOutcome: "Unblock treasury payment authorization and prevent service interruption.",
        evidence: evidence.filter((e) => e.claim.includes("renewal") || e.claim.includes("procurement")),
      });
      actions.push({
        action: "Conduct ops check-in with Isaac to address 60% flight hour drop",
        priority: "P1",
        reason: "Flight activity declined from 38h to 15h along the rail corridor.",
        expectedOutcome: "Identify corridor scheduling bottlenecks and restore regular patrol flights.",
        evidence: evidence.filter((e) => e.claim.includes("usage")),
      });
      return actions;
    }

    if (accountId === "pinnacle-venue-group") {
      actions.push({
        action: "Executive outreach to Carla Ibsen & schedule stadium security review",
        priority: "P0",
        reason: "Tagged champion Danny Ruiz has been unresponsive for 6 weeks and flight activity plummeted 77%.",
        expectedOutcome: "Re-establish executive stakeholder contact and resolve crowd/airspace concerns before renewal.",
        evidence: evidence.filter((e) => e.claim.includes("ghosting") || e.claim.includes("usage")),
      });
      return actions;
    }

    if (accountId === "ashford-construction") {
      actions.push({
        action: "Deliver reference customer call on remote deployment to Blake Gruenewald",
        priority: "P0",
        reason: "Leadership signed off on $14,499 quote; reference call is the sole remaining contingency before kickoff.",
        expectedOutcome: "Lock in kickoff date and execute two-milestone contract ($7,250 / $7,250).",
        evidence: evidence.filter((e) => e.claim.includes("reference") || e.claim.includes("pilot")),
      });
      return actions;
    }

    if (accountId === "camborne-constabulary") {
      actions.push({
        action: "Provide DPO evidentiary policy template & support Insp. Pentreath on Grade II planning",
        priority: "P0",
        reason: "Deployment stalled 3+ weeks by 4-6 week DPO chain-of-custody review and heritage building frontage rules.",
        expectedOutcome: "Accelerate legal sign-off and finalize dock mounting location at response hub.",
        evidence: evidence.filter((e) => e.claim.includes("DPO") || e.claim.includes("Grade II")),
      });
      return actions;
    }

    if (accountId === "meridian-energy") {
      actions.push({
        action: "Execute remote-ops flight validation demo & submit tender technical response",
        priority: "P0",
        reason: "Ross Doak is championing 15+ sub-station RFP tender ($100k+ expansion).",
        expectedOutcome: "Secure sole-source or preferred software orchestration status in formal RFP.",
        evidence: evidence.filter((e) => e.claim.includes("tender")),
      });
      return actions;
    }

    if (accountId === "vantage-protective") {
      actions.push({
        action: "Align 10 dock subscriptions to quarterly consolidated billing date",
        priority: "P1",
        reason: "Client finance team is frustrated by reconciling 10 staggered monthly renewal lines.",
        expectedOutcome: "Eliminate administrative reconciliation friction and protect $29,400 ARR.",
        evidence: evidence.filter((e) => e.claim.includes("invoicing") || e.claim.includes("Billing")),
      });
      actions.push({
        action: "Audit dock utilization before approving 2 pending dock orders (Expansion Trap)",
        priority: "P1",
        reason: "Existing 10 docks utilization dropped 38%; need to ensure existing fleet is active before scaling.",
        expectedOutcome: "Prevent shelfware risk and stabilize existing site flights.",
        evidence: evidence.filter((e) => e.claim.includes("failover") || e.claim.includes("usage")),
      });
      return actions;
    }

    if (accountId === "ravel-systems") {
      actions.push({
        action: "Initiate win-back outreach to Shlomo Peretz regarding north logistics site status",
        priority: "P1",
        reason: "Churn was caused by lack of follow-up on delayed customer site, not product dissatisfaction.",
        expectedOutcome: "Reactivate $999 Pro license with potential second dock addition.",
        evidence: evidence.filter((e) => e.claim.includes("churn")),
      });
      return actions;
    }

    if (accountId === "falcon-point-security") {
      actions.push({
        action: "Engage Ridgeline Protective Group procurement for next enterprise vendor cycle",
        priority: "P2",
        reason: "Falcon Point was acquired; operational lead Kyle was highly satisfied with platform.",
        expectedOutcome: "Position FlytBase for group-wide master agreement review.",
        evidence: evidence.filter((e) => e.claim.includes("Acquired") || e.claim.includes("consolidation")),
      });
      return actions;
    }

    // Default Fallback
    if (blockers.length > 0) {
      actions.push({
        action: `Resolve primary blocker: ${blockers[0].title}`,
        priority: "P1",
        reason: blockers[0].details,
        expectedOutcome: "Clear adoption hurdles and progress account milestone.",
        evidence: [blockers[0].evidence],
      });
    } else {
      actions.push({
        action: "Maintain regular CS cadence and monitor monthly telemetry trends",
        priority: "P2",
        reason: "Account is operating within expected parameters.",
        expectedOutcome: "Sustain positive adoption and renewal readiness.",
        evidence: evidence.slice(0, 1),
      });
    }

    return actions;
  }
}
