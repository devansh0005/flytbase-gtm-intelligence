export type ReconciledHealth = "HEALTHY" | "WATCH" | "AT_RISK" | "CRITICAL" | "CHURNED";
export type PriorityTier = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
export type ExpansionType = "HIGH" | "MEDIUM" | "LOW" | "TRAP" | "NONE";
export type WinBackViability = "HIGH" | "MODERATE" | "LOW" | "NOT_APPLICABLE";
export type CustomerSentiment = "POSITIVE" | "NEUTRAL" | "CONCERNED" | "NEGATIVE";

export interface EvidenceReference {
  claim: string;
  sourceDoc: string; // e.g. "07_transcript_renewal_procurement_call.md"
  excerpt: string;   // exact text excerpt
  confidence: number; // 0.0 to 1.0
}

export interface ExtractedStakeholder {
  name: string;
  role: string;
  department?: string;
  authorityLevel: "ECONOMIC_BUYER" | "TECHNICAL_EVALUATOR" | "OPERATOR" | "PROCUREMENT" | "INFLUENCER";
  sentiment: "CHAMPION" | "POSITIVE" | "NEUTRAL" | "CONCERNED" | "DETRACTOR" | "GHOSTING";
  isLikelyChampion: boolean;
  notes?: string;
  evidence: EvidenceReference;
}

export interface ExtractedRisk {
  type: "EXPLICIT" | "IMPLIED";
  title: string;
  description: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
  evidence: EvidenceReference;
}

export interface ExtractedBlocker {
  title: string;
  category: "REGULATORY" | "INFRASTRUCTURE" | "TECHNICAL" | "BILLING" | "TRAINING" | "PROCUREMENT";
  severity: "HIGH" | "MEDIUM" | "LOW";
  details: string;
  evidence: EvidenceReference;
}

export interface ExtractedOpportunity {
  type: "EXPANSION" | "UPGRADE" | "PILOT_CONVERSION" | "NEW_SITE";
  title: string;
  description: string;
  estimatedPotential?: string; // only if explicitly stated, e.g. "15+ docks tender ($100k+)"
  isTrap: boolean;
  trapWarning?: string;
  evidence: EvidenceReference;
}

export interface ExtractedWinBack {
  isChurned: boolean;
  churnReason?: string;
  viability: WinBackViability;
  requiredConditions: string[];
  evidence: EvidenceReference;
}

export interface NextBestAction {
  action: string;
  priority: "P0" | "P1" | "P2";
  reason: string;
  expectedOutcome: string;
  evidence: EvidenceReference[];
}

export interface DeterministicSignals {
  accountId: string;
  name: string;
  category: string;
  nominalArr: number;
  isChurnedState: boolean;
  docksDeployedText: string;
  
  // Usage & Telemetry
  totalFlightHours: number;
  totalMissions: number;
  latestMonth: string | null;
  latestFlightHours: number;
  latestMissions: number;
  previousFlightHours: number;
  usageChangePercent: number | null; // latest vs prior month %
  threeMonthUsageTrajectory: "GROWING" | "STABLE" | "DECLINING" | "ZERO_USAGE" | "NO_DATA";
  peakFlightHours: number;
  usageDropFromPeakPercent: number | null;
  isUsageCollapsing: boolean;

  // Renewal & Time
  daysToRenewal: number | null; // e.g. -1 for past due, 4 for 4 days away
  renewalStatusFlag: "IMMEDIATE_PAST_DUE" | "UPCOMING_CRITICAL" | "UPCOMING_NORMAL" | "NOT_APPLICABLE";

  // Documents & Activity
  totalDocuments: number;
  documentCountsByType: Record<string, number>;
  latestActivityDate: string | null; // YYYY-MM-DD
  daysSinceLatestActivity: number | null;
  supportTicketCount: number;

  // CRM vs Reality Behavioral Disconnect
  hasCrmHealthDisconnect: boolean;
  crmHealthVsBehaviorSummary: string;
}

export interface AccountIntelligenceReport {
  accountId: string;
  name: string;
  category: string;
  nominalArr: number;
  
  deterministicSignals: DeterministicSignals;
  
  // Reconciled Health & Contradictions
  reconciledHealth: ReconciledHealth;
  healthScore: number; // 0 - 100
  healthRationale: string;
  topRiskFactors: string[];
  contradictions: string[];
  
  // Qualitative Extracted Evidence
  sentiment: CustomerSentiment;
  stakeholders: ExtractedStakeholder[];
  likelyChampion: string | null;
  risks: ExtractedRisk[];
  blockers: ExtractedBlocker[];
  opportunity: {
    status: ExpansionType;
    potential?: string;
    details: string;
    isTrap: boolean;
    trapReason?: string;
    evidence: EvidenceReference[];
  };
  winBack: ExtractedWinBack;
  
  // Decisions
  nextBestActions: NextBestAction[];
  
  // Portfolio Priority
  priorityScore: number; // 0 - 100 deterministic
  priorityTier: PriorityTier;
  priorityExplanation: string;

  // Evidence List
  allEvidence: EvidenceReference[];
}

export interface PortfolioIntelligenceReport {
  generatedAt: string;
  totalAccounts: number;
  portfolioNominalArr: number;
  activeArr: number;
  churnedArr: number;
  accountsByReconciledHealth: Record<ReconciledHealth, number>;
  portfolioPriorityRanking: {
    rank: number;
    accountId: string;
    name: string;
    priorityScore: number;
    priorityTier: PriorityTier;
    reconciledHealth: ReconciledHealth;
    nominalArr: number;
    primaryTrigger: string;
  }[];
  top5Risks: {
    accountId: string;
    accountName: string;
    riskTitle: string;
    severity: string;
    sourceDoc: string;
    excerpt: string;
  }[];
  top5Opportunities: {
    accountId: string;
    accountName: string;
    opportunityTitle: string;
    potential?: string;
    sourceDoc: string;
    excerpt: string;
  }[];
  contradictionsDetected: {
    accountId: string;
    accountName: string;
    crmClaim: string;
    groundTruth: string;
    evidenceDoc: string;
  }[];
  accountsWithInsufficientEvidence: string[];
  accountReports: Record<string, AccountIntelligenceReport>;
}
