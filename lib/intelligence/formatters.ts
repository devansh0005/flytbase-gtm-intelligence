import { AccountIntelligence, Evidence, Account, UsageSnapshot, DocumentRecord } from "@prisma/client";
import {
  ExtractedStakeholder,
  ExtractedBlocker,
  NextBestAction,
  DeterministicSignals,
  ReconciledHealth,
  PriorityTier,
  ExpansionType,
  WinBackViability,
} from "./types";

export interface FormattedAccountIntelligence {
  reconciledHealth: ReconciledHealth;
  healthScore: number;
  healthRationale: string;
  topRiskFactors: string[];
  contradictions: string[];
  sentimentScore: string;
  renewalRiskStatus: string;
  daysToRenewal: number | null;
  expansionOpportunity: ExpansionType;
  expansionPotential: string | null;
  expansionDetails: any;
  winBackViability: WinBackViability;
  winBackDetails: any;
  churnRootCause: string | null;
  operationalBlockers: ExtractedBlocker[];
  keyStakeholders: ExtractedStakeholder[];
  nextBestActions: NextBestAction[];
  priorityScore: number;
  priorityTier: PriorityTier;
  priorityExplanation: string;
  deterministicSignals: DeterministicSignals | null;
}

export function parseAccountIntelligence(
  raw: AccountIntelligence | null
): FormattedAccountIntelligence | null {
  if (!raw) return null;

  const safeJson = <T>(val: string | null, fallback: T): T => {
    if (!val) return fallback;
    try {
      return JSON.parse(val) as T;
    } catch {
      return fallback;
    }
  };

  return {
    reconciledHealth: (raw.reconciledHealth || "HEALTHY") as ReconciledHealth,
    healthScore: raw.healthScore ?? 80,
    healthRationale: raw.healthRationale || "No health diagnosis available.",
    topRiskFactors: safeJson<string[]>(raw.topRiskFactors, []),
    contradictions: safeJson<string[]>(raw.contradictions, []),
    sentimentScore: raw.sentimentScore || "NEUTRAL",
    renewalRiskStatus: raw.renewalRiskStatus || "NOT_APPLICABLE",
    daysToRenewal: raw.daysToRenewal,
    expansionOpportunity: (raw.expansionOpportunity || "NONE") as ExpansionType,
    expansionPotential: raw.expansionPotential,
    expansionDetails: safeJson(raw.expansionDetails, {}),
    winBackViability: (raw.winBackViability || "NOT_APPLICABLE") as WinBackViability,
    winBackDetails: safeJson(raw.winBackDetails, {}),
    churnRootCause: raw.churnRootCause,
    operationalBlockers: safeJson<ExtractedBlocker[]>(raw.operationalBlockers, []),
    keyStakeholders: safeJson<ExtractedStakeholder[]>(raw.keyStakeholders, []),
    nextBestActions: safeJson<NextBestAction[]>(raw.nextBestActions, []),
    priorityScore: raw.priorityScore ?? 30,
    priorityTier: (raw.priorityTier || "LOW") as PriorityTier,
    priorityExplanation: raw.priorityExplanation || "Calculated priority score.",
    deterministicSignals: safeJson<DeterministicSignals | null>(raw.deterministicSignals, null),
  };
}

export interface EnrichedAccount extends Account {
  intelligenceParsed: FormattedAccountIntelligence | null;
  usageSnapshots: UsageSnapshot[];
  documents: DocumentRecord[];
  evidence: Evidence[];
}
