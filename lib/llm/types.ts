import {
  CustomerSentiment,
  ExtractedStakeholder,
  ExtractedRisk,
  ExtractedBlocker,
  ExtractedOpportunity,
  ExtractedWinBack,
  NextBestAction,
  EvidenceReference,
  ReconciledHealth,
} from "@/lib/intelligence/types";

export interface QualitativeIntelligenceOutput {
  reconciledHealth: ReconciledHealth;
  healthRationale: string;
  topRiskFactors: string[];
  contradictions: string[];
  sentiment: CustomerSentiment;
  stakeholders: ExtractedStakeholder[];
  likelyChampion: string | null;
  risks: ExtractedRisk[];
  blockers: ExtractedBlocker[];
  opportunity: {
    status: "HIGH" | "MEDIUM" | "LOW" | "TRAP" | "NONE";
    potential?: string;
    details: string;
    isTrap: boolean;
    trapReason?: string;
    evidence: EvidenceReference[];
  };
  winBack: ExtractedWinBack;
  nextBestActions: NextBestAction[];
  allEvidence: EvidenceReference[];
}

export interface LLMObservabilityMetadata {
  providerUsed: "gemini" | "heuristic_fallback" | "openai";
  modelUsed: string;
  latencyMs: number;
  tokensUsed?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  usedFallback: boolean;
  fallbackReason?: string;
}

export interface LLMIntelligenceResult {
  intelligence: QualitativeIntelligenceOutput;
  observability: LLMObservabilityMetadata;
}

export interface LLMContextInput {
  accountId: string;
  accountName: string;
  crmRecord: {
    accountId: string;
    category: string;
    arr: number;
    docks: string;
    health: string;
    sentiment: string;
    tier: string;
    csOwner: string;
    seOwner: string;
    championTagged: string | null;
  };
  deterministicSignals: {
    nominalArr: number;
    totalFlightHours: number;
    totalMissions: number;
    latestFlightHours: number;
    previousFlightHours: number;
    usageChangePercent: number | null;
    threeMonthUsageTrajectory: string;
    peakFlightHours: number;
    usageDropFromPeakPercent: number | null;
    isUsageCollapsing: boolean;
    daysToRenewal: number | null;
    renewalStatusFlag: string;
    documentCountsByType: Record<string, number>;
    latestActivityDate: string | null;
    daysSinceLatestActivity: number | null;
    hasCrmHealthDisconnect: boolean;
    crmHealthVsBehaviorSummary: string;
  };
  availableDocumentFiles: string[];
  documents: Array<{
    fileName: string;
    title: string;
    type: string;
    date?: string | null;
    content: string;
  }>;
}
