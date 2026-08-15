import { GeminiProvider } from "./gemini-provider";
import { DocumentEvidenceExtractor } from "@/lib/intelligence/extractor";
import {
  LLMContextInput,
  QualitativeIntelligenceOutput,
  LLMObservabilityMetadata,
} from "./types";
import { Account, DocumentRecord, UsageSnapshot } from "@prisma/client";
import { DeterministicSignals } from "@/lib/intelligence/types";

export class LLMGateway {
  private static geminiProvider = new GeminiProvider();

  public static async processAccount(
    account: Account & {
      documents: DocumentRecord[];
      usageSnapshots: UsageSnapshot[];
    },
    deterministic: DeterministicSignals
  ): Promise<{
    intelligence: QualitativeIntelligenceOutput;
    observability: LLMObservabilityMetadata;
  }> {
    const startTime = Date.now();

    // Check if Gemini is configured
    if (this.geminiProvider.isAvailable()) {
      try {
        const context: LLMContextInput = {
          accountId: account.id,
          accountName: account.name,
          crmRecord: {
            accountId: account.accountId,
            category: account.category,
            arr: account.arr,
            docks: account.docks,
            health: account.health,
            sentiment: account.sentiment,
            tier: account.tier,
            csOwner: account.csOwner,
            seOwner: account.seOwner,
            championTagged: account.championTagged,
          },
          deterministicSignals: {
            nominalArr: deterministic.nominalArr,
            totalFlightHours: deterministic.totalFlightHours,
            totalMissions: deterministic.totalMissions,
            latestFlightHours: deterministic.latestFlightHours,
            previousFlightHours: deterministic.previousFlightHours,
            usageChangePercent: deterministic.usageChangePercent,
            threeMonthUsageTrajectory: deterministic.threeMonthUsageTrajectory,
            peakFlightHours: deterministic.peakFlightHours,
            usageDropFromPeakPercent: deterministic.usageDropFromPeakPercent,
            isUsageCollapsing: deterministic.isUsageCollapsing,
            daysToRenewal: deterministic.daysToRenewal,
            renewalStatusFlag: deterministic.renewalStatusFlag,
            documentCountsByType: deterministic.documentCountsByType,
            latestActivityDate: deterministic.latestActivityDate,
            daysSinceLatestActivity: deterministic.daysSinceLatestActivity,
            hasCrmHealthDisconnect: deterministic.hasCrmHealthDisconnect,
            crmHealthVsBehaviorSummary: deterministic.crmHealthVsBehaviorSummary,
          },
          availableDocumentFiles: account.documents.map((d) => d.fileName),
          documents: account.documents.map((d) => ({
            fileName: d.fileName,
            title: d.title,
            type: d.type,
            date: d.date,
            content: d.rawContent || "",
          })),
        };

        // Execute Gemini with 30s timeout guard
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Gemini API call timed out after 30s")), 30000)
        );

        const result = await Promise.race([
          this.geminiProvider.generateAccountIntelligence(context),
          timeoutPromise,
        ]);

        return result;
      } catch (geminiError: any) {
        const fallbackReason = geminiError?.message || String(geminiError);
        console.warn(
          `[LLMGateway] Gemini failed for account ${account.id}. Engaging deterministic/heuristic fallback. Reason: ${fallbackReason}`
        );

        const fallbackExtracted = DocumentEvidenceExtractor.extract({
          account,
          deterministic,
        });

        return {
          intelligence: {
            reconciledHealth: "WATCH", // will be computed by HealthReconciler
            healthRationale: "Extracted via verified fallback parser.",
            topRiskFactors: fallbackExtracted.risks.map((r) => r.title),
            contradictions: [],
            sentiment: fallbackExtracted.sentiment,
            stakeholders: fallbackExtracted.stakeholders,
            likelyChampion: fallbackExtracted.likelyChampion,
            risks: fallbackExtracted.risks,
            blockers: fallbackExtracted.blockers,
            opportunity: fallbackExtracted.opportunity,
            winBack: fallbackExtracted.winBack,
            nextBestActions: [],
            allEvidence: fallbackExtracted.allEvidence,
          },
          observability: {
            providerUsed: "heuristic_fallback",
            modelUsed: "deterministic-evidence-parser",
            latencyMs: Date.now() - startTime,
            usedFallback: true,
            fallbackReason,
          },
        };
      }
    }

    // No Gemini key configured -> Direct Heuristic Fallback
    const fallbackExtracted = DocumentEvidenceExtractor.extract({
      account,
      deterministic,
    });

    return {
      intelligence: {
        reconciledHealth: "WATCH",
        healthRationale: "Extracted via verified fallback parser.",
        topRiskFactors: fallbackExtracted.risks.map((r) => r.title),
        contradictions: [],
        sentiment: fallbackExtracted.sentiment,
        stakeholders: fallbackExtracted.stakeholders,
        likelyChampion: fallbackExtracted.likelyChampion,
        risks: fallbackExtracted.risks,
        blockers: fallbackExtracted.blockers,
        opportunity: fallbackExtracted.opportunity,
        winBack: fallbackExtracted.winBack,
        nextBestActions: [],
        allEvidence: fallbackExtracted.allEvidence,
      },
      observability: {
        providerUsed: "heuristic_fallback",
        modelUsed: "deterministic-evidence-parser",
        latencyMs: Date.now() - startTime,
        usedFallback: true,
        fallbackReason: "GEMINI_API_KEY is not configured",
      },
    };
  }
}
