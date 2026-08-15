import { db } from "@/lib/db";
import { extractDeterministicSignals } from "./deterministic-signals";
import { LLMGateway } from "@/lib/llm/gateway";
import { HealthReconciler } from "./health-reconciler";
import { ActionGenerator } from "./action-generator";
import { PortfolioPriorityRanker } from "./priority-ranker";
import {
  AccountIntelligenceReport,
  PortfolioIntelligenceReport,
  ReconciledHealth,
} from "./types";
import { LLMObservabilityMetadata } from "@/lib/llm/types";

export interface AccountIntelligenceWithObservability extends AccountIntelligenceReport {
  observability: LLMObservabilityMetadata;
}

export class IntelligencePipeline {
  public static async processAccount(
    accountId: string
  ): Promise<AccountIntelligenceWithObservability> {
    const account = await db.account.findUnique({
      where: { id: accountId },
      include: {
        documents: true,
        usageSnapshots: true,
      },
    });

    if (!account) {
      throw new Error(`Account not found: ${accountId}`);
    }

    // A. Deterministic Signal Extraction
    const deterministic = extractDeterministicSignals(account);

    // B. LLM Gateway Reasoning (with Heuristic Fallback)
    const { intelligence: extracted, observability } = await LLMGateway.processAccount(
      account,
      deterministic
    );

    // C. Health Reconciliation (Combining CRM, Behavioral Telemetry & Extracted Evidence)
    const healthResult = HealthReconciler.reconcile({
      accountId: account.id,
      name: account.name,
      crmHealth: account.health,
      crmSentiment: account.sentiment,
      category: account.category,
      deterministic,
      risks: extracted.risks,
      blockers: extracted.blockers,
      evidence: extracted.allEvidence,
    });

    // F. Next Best Action Generation
    const nextBestActions =
      extracted.nextBestActions && extracted.nextBestActions.length > 0 && !observability.usedFallback
        ? extracted.nextBestActions
        : ActionGenerator.generate({
            accountId: account.id,
            category: account.category,
            reconciledHealth: healthResult.reconciledHealth,
            deterministic,
            blockers: extracted.blockers,
            risks: extracted.risks,
            opportunity: extracted.opportunity,
            winBack: extracted.winBack,
            evidence: extracted.allEvidence,
          });

    // G. Portfolio Priority Scoring (Deterministic)
    const isChampionGhosting = extracted.stakeholders.some(
      (s) => s.sentiment === "GHOSTING"
    );
    const hasHighOpportunity =
      extracted.opportunity.status === "HIGH" && !extracted.opportunity.isTrap;

    const priorityResult = PortfolioPriorityRanker.calculate({
      accountId: account.id,
      name: account.name,
      nominalArr: account.arr,
      category: account.category,
      reconciledHealth: healthResult.reconciledHealth,
      sentiment: extracted.sentiment,
      deterministic,
      blockers: extracted.blockers,
      risks: extracted.risks,
      hasHighOpportunity,
      isChampionGhosting,
    });

    // H. Persist to Database (AccountIntelligence & Evidence)
    await db.accountIntelligence.upsert({
      where: { accountId: account.id },
      update: {
        reconciledHealth: healthResult.reconciledHealth,
        healthScore: healthResult.healthScore,
        healthRationale: healthResult.healthRationale,
        topRiskFactors: JSON.stringify(healthResult.topRiskFactors),
        contradictions: JSON.stringify(healthResult.contradictions),
        sentimentScore: extracted.sentiment,
        renewalRiskStatus:
          deterministic.renewalStatusFlag === "IMMEDIATE_PAST_DUE"
            ? "PAST_DUE"
            : deterministic.renewalStatusFlag === "UPCOMING_CRITICAL"
            ? "UPCOMING_CRITICAL"
            : deterministic.renewalStatusFlag === "UPCOMING_NORMAL"
            ? "SECURE"
            : "NOT_APPLICABLE",
        daysToRenewal: deterministic.daysToRenewal,
        expansionOpportunity: extracted.opportunity.status,
        expansionPotential: extracted.opportunity.potential || null,
        expansionDetails: JSON.stringify(extracted.opportunity),
        winBackViability: extracted.winBack.viability,
        winBackDetails: JSON.stringify(extracted.winBack),
        churnRootCause: extracted.winBack.churnReason || null,
        operationalBlockers: JSON.stringify(extracted.blockers),
        keyStakeholders: JSON.stringify(extracted.stakeholders),
        nextBestActions: JSON.stringify(nextBestActions),
        priorityScore: priorityResult.priorityScore,
        priorityTier: priorityResult.priorityTier,
        priorityExplanation: priorityResult.priorityExplanation,
        deterministicSignals: JSON.stringify(deterministic),
      },
      create: {
        accountId: account.id,
        reconciledHealth: healthResult.reconciledHealth,
        healthScore: healthResult.healthScore,
        healthRationale: healthResult.healthRationale,
        topRiskFactors: JSON.stringify(healthResult.topRiskFactors),
        contradictions: JSON.stringify(healthResult.contradictions),
        sentimentScore: extracted.sentiment,
        renewalRiskStatus:
          deterministic.renewalStatusFlag === "IMMEDIATE_PAST_DUE"
            ? "PAST_DUE"
            : deterministic.renewalStatusFlag === "UPCOMING_CRITICAL"
            ? "UPCOMING_CRITICAL"
            : deterministic.renewalStatusFlag === "UPCOMING_NORMAL"
            ? "SECURE"
            : "NOT_APPLICABLE",
        daysToRenewal: deterministic.daysToRenewal,
        expansionOpportunity: extracted.opportunity.status,
        expansionPotential: extracted.opportunity.potential || null,
        expansionDetails: JSON.stringify(extracted.opportunity),
        winBackViability: extracted.winBack.viability,
        winBackDetails: JSON.stringify(extracted.winBack),
        churnRootCause: extracted.winBack.churnReason || null,
        operationalBlockers: JSON.stringify(extracted.blockers),
        keyStakeholders: JSON.stringify(extracted.stakeholders),
        nextBestActions: JSON.stringify(nextBestActions),
        priorityScore: priorityResult.priorityScore,
        priorityTier: priorityResult.priorityTier,
        priorityExplanation: priorityResult.priorityExplanation,
        deterministicSignals: JSON.stringify(deterministic),
      },
    });

    // Populate Evidence Records (idempotent overwrite)
    await db.evidence.deleteMany({ where: { accountId: account.id } });
    if (extracted.allEvidence.length > 0) {
      await db.evidence.createMany({
        data: extracted.allEvidence.map((ev) => ({
          accountId: account.id,
          signalType: ev.claim,
          sourceType: ev.sourceDoc.includes("transcript")
            ? "TRANSCRIPT"
            : ev.sourceDoc.includes("email")
            ? "EMAIL"
            : ev.sourceDoc.includes("ticket")
            ? "TICKET"
            : ev.sourceDoc.includes("renewal")
            ? "RENEWAL_TRACKER"
            : ev.sourceDoc.includes("notes")
            ? "NOTES"
            : "CRM_METADATA",
          sourceDoc: ev.sourceDoc,
          snippet: ev.excerpt,
          confidence: ev.confidence,
        })),
      });
    }

    return {
      accountId: account.id,
      name: account.name,
      category: account.category,
      nominalArr: account.arr,
      deterministicSignals: deterministic,
      reconciledHealth: healthResult.reconciledHealth,
      healthScore: healthResult.healthScore,
      healthRationale: healthResult.healthRationale,
      topRiskFactors: healthResult.topRiskFactors,
      contradictions: healthResult.contradictions,
      sentiment: extracted.sentiment,
      stakeholders: extracted.stakeholders,
      likelyChampion: extracted.likelyChampion,
      risks: extracted.risks,
      blockers: extracted.blockers,
      opportunity: extracted.opportunity,
      winBack: extracted.winBack,
      nextBestActions,
      priorityScore: priorityResult.priorityScore,
      priorityTier: priorityResult.priorityTier,
      priorityExplanation: priorityResult.priorityExplanation,
      allEvidence: extracted.allEvidence,
      observability,
    };
  }

  public static async runPipeline(): Promise<PortfolioIntelligenceReport> {
    const accounts = await db.account.findMany({
      select: { id: true },
      orderBy: { id: "asc" },
    });

    const accountReports: Record<string, AccountIntelligenceReport> = {};
    let totalNominalArr = 0;
    let activeArr = 0;
    let churnedArr = 0;

    const healthCounts: Record<ReconciledHealth, number> = {
      HEALTHY: 0,
      WATCH: 0,
      AT_RISK: 0,
      CRITICAL: 0,
      CHURNED: 0,
    };

    const topRisksList: PortfolioIntelligenceReport["top5Risks"] = [];
    const topOppsList: PortfolioIntelligenceReport["top5Opportunities"] = [];
    const contradictionsList: PortfolioIntelligenceReport["contradictionsDetected"] = [];
    const insufficientEvidenceList: string[] = [];

    for (const { id } of accounts) {
      const rep = await this.processAccount(id);
      accountReports[id] = rep;

      totalNominalArr += rep.nominalArr;
      if (rep.reconciledHealth === "CHURNED") {
        churnedArr += rep.nominalArr;
      } else {
        activeArr += rep.nominalArr;
      }

      healthCounts[rep.reconciledHealth] = (healthCounts[rep.reconciledHealth] || 0) + 1;

      // Check evidence sufficiency
      if (rep.allEvidence.length === 0) {
        insufficientEvidenceList.push(id);
      }

      // Collect contradictions
      for (const c of rep.contradictions) {
        contradictionsList.push({
          accountId: rep.accountId,
          accountName: rep.name,
          crmClaim: `CRM Health: ${rep.deterministicSignals.hasCrmHealthDisconnect ? 'Healthy' : 'Standard'}`,
          groundTruth: c,
          evidenceDoc: rep.allEvidence[0]?.sourceDoc || "01_account_profile.md",
        });
      }

      // Collect Risks
      for (const r of rep.risks) {
        topRisksList.push({
          accountId: rep.accountId,
          accountName: rep.name,
          riskTitle: r.title,
          severity: r.severity,
          sourceDoc: r.evidence.sourceDoc,
          excerpt: r.evidence.excerpt,
        });
      }

      // Collect Opportunities
      if (rep.opportunity.status === "HIGH" && !rep.opportunity.isTrap) {
        topOppsList.push({
          accountId: rep.accountId,
          accountName: rep.name,
          opportunityTitle: rep.opportunity.details,
          potential: rep.opportunity.potential,
          sourceDoc: rep.opportunity.evidence[0]?.sourceDoc || "deal_notes",
          excerpt: rep.opportunity.evidence[0]?.excerpt || rep.opportunity.details,
        });
      }
    }

    // Rank accounts by deterministic priority score descending
    const rankedAccounts = Object.values(accountReports)
      .sort((a, b) => b.priorityScore - a.priorityScore)
      .map((rep, idx) => {
        let trigger = "Standard monitoring";
        if (rep.priorityScore >= 80) {
          if (rep.deterministicSignals.renewalStatusFlag === "IMMEDIATE_PAST_DUE") {
            trigger = "Past-Due Renewal Urgency";
          } else if (rep.deterministicSignals.isUsageCollapsing) {
            trigger = `Telemetry Collapse (-${rep.deterministicSignals.usageDropFromPeakPercent}%)`;
          } else {
            trigger = "Critical Blocker / Risk";
          }
        } else if (rep.opportunity.status === "HIGH") {
          trigger = "High Pipeline / Expansion Opportunity";
        } else if (rep.deterministicSignals.category === "newly-sold-onboarding") {
          trigger = "Onboarding Kickoff Pending";
        }

        return {
          rank: idx + 1,
          accountId: rep.accountId,
          name: rep.name,
          priorityScore: rep.priorityScore,
          priorityTier: rep.priorityTier,
          reconciledHealth: rep.reconciledHealth,
          nominalArr: rep.nominalArr,
          primaryTrigger: trigger,
        };
      });

    return {
      generatedAt: new Date().toISOString(),
      totalAccounts: accounts.length,
      portfolioNominalArr: totalNominalArr,
      activeArr,
      churnedArr,
      accountsByReconciledHealth: healthCounts,
      portfolioPriorityRanking: rankedAccounts,
      top5Risks: topRisksList.slice(0, 5),
      top5Opportunities: topOppsList.slice(0, 5),
      contradictionsDetected: contradictionsList,
      accountsWithInsufficientEvidence: insufficientEvidenceList,
      accountReports,
    };
  }
}
