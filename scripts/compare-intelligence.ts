import "dotenv/config";
import { db } from "../lib/db";
import { extractDeterministicSignals } from "../lib/intelligence/deterministic-signals";
import { DocumentEvidenceExtractor } from "../lib/intelligence/extractor";
import { HealthReconciler } from "../lib/intelligence/health-reconciler";
import { ActionGenerator } from "../lib/intelligence/action-generator";
import { GeminiProvider } from "../lib/llm/gemini-provider";
import { LLMContextInput } from "../lib/llm/types";

async function compareAccounts() {
  const targetAccounts = ["coastline-transit", "pinnacle-venue-group", "meridian-energy"];

  console.log("================================================================================");
  console.log("🔍 HEURISTIC vs GEMINI COMPARISON AUDIT (READ-ONLY / NO DB WRITE)");
  console.log("================================================================================\n");

  const geminiProvider = new GeminiProvider();
  const isGeminiAvailable = geminiProvider.isAvailable();

  console.log(`📡 GEMINI CONFIGURATION STATUS:`);
  console.log(`  - GEMINI_API_KEY Configured: ${isGeminiAvailable ? "YES (Key Present)" : "NO (Key Missing from Environment)"}`);
  console.log(`  - Configured Model:          ${process.env.GEMINI_MODEL || "gemini-2.0-flash"}`);
  console.log(`  - Execution Mode:            ${isGeminiAvailable ? "Live Gemini API Call" : "Heuristic Baseline & Fallback Inspection"}\n`);

  for (const accountId of targetAccounts) {
    const account = await db.account.findUnique({
      where: { id: accountId },
      include: {
        documents: true,
        usageSnapshots: true,
      },
    });

    if (!account) {
      console.error(`Account not found: ${accountId}`);
      continue;
    }

    console.log("================================================================================");
    console.log(`ACCOUNT: ${account.name.toUpperCase()} (${account.id})`);
    console.log("================================================================================");

    // 1. Deterministic Signals
    const deterministic = extractDeterministicSignals(account);

    console.log("\n[1] DETERMINISTIC INPUTS (IDENTICAL FOR BOTH ENGINES):");
    console.log(`  • Nominal ARR:        $${deterministic.nominalArr.toLocaleString()}`);
    console.log(`  • Usage Trajectory:   ${deterministic.threeMonthUsageTrajectory} (${deterministic.latestFlightHours}h latest vs ${deterministic.peakFlightHours}h peak)`);
    console.log(`  • Drop from Peak:     ${deterministic.usageDropFromPeakPercent !== null ? `${deterministic.usageDropFromPeakPercent}%` : 'N/A'}`);
    console.log(`  • Usage Collapsing:   ${deterministic.isUsageCollapsing ? 'YES' : 'No'}`);
    console.log(`  • Days to Renewal:    ${deterministic.daysToRenewal !== null ? `${deterministic.daysToRenewal}d (${deterministic.renewalStatusFlag})` : 'N/A'}`);
    console.log(`  • CRM Disconnect:     ${deterministic.hasCrmHealthDisconnect ? 'YES' : 'No'}`);

    // 2. Heuristic Engine Execution
    const heuristicStart = Date.now();
    const heuristicExtracted = DocumentEvidenceExtractor.extract({
      account,
      deterministic,
    });
    const heuristicHealth = HealthReconciler.reconcile({
      accountId: account.id,
      name: account.name,
      crmHealth: account.health,
      crmSentiment: account.sentiment,
      category: account.category,
      deterministic,
      risks: heuristicExtracted.risks,
      blockers: heuristicExtracted.blockers,
      evidence: heuristicExtracted.allEvidence,
    });
    const heuristicActions = ActionGenerator.generate({
      accountId: account.id,
      category: account.category,
      reconciledHealth: heuristicHealth.reconciledHealth,
      deterministic,
      blockers: heuristicExtracted.blockers,
      risks: heuristicExtracted.risks,
      opportunity: heuristicExtracted.opportunity,
      winBack: heuristicExtracted.winBack,
      evidence: heuristicExtracted.allEvidence,
    });
    const heuristicLatency = Date.now() - heuristicStart;

    console.log("\n--------------------------------------------------------------------------------");
    console.log(`[A] HEURISTIC ENGINE OUTPUT (Latency: ${heuristicLatency}ms):`);
    console.log(`  • Reconciled Health: ${heuristicHealth.reconciledHealth} (${heuristicHealth.healthScore}/100)`);
    console.log(`  • Health Rationale:  ${heuristicHealth.healthRationale}`);
    console.log(`  • Contradictions:    ${heuristicHealth.contradictions.join("; ") || "None"}`);
    console.log(`  • Top Risks:`);
    heuristicExtracted.risks.forEach((r) => console.log(`      - [${r.severity}] ${r.title} (Doc: ${r.evidence.sourceDoc})`));
    heuristicExtracted.blockers.forEach((b) => console.log(`      - [Blocker ${b.severity}] ${b.title} (Doc: ${b.evidence.sourceDoc})`));
    console.log(`  • Stakeholders:`);
    heuristicExtracted.stakeholders.forEach((s) => console.log(`      - ${s.name} (${s.role}, ${s.authorityLevel}, ${s.sentiment})`));
    console.log(`  • Expansion / Trap:  ${heuristicExtracted.opportunity.status} (Trap: ${heuristicExtracted.opportunity.isTrap}) -> ${heuristicExtracted.opportunity.details}`);
    console.log(`  • Next Best Actions:`);
    heuristicActions.forEach((a) => console.log(`      - [${a.priority}] ${a.action} (Reason: ${a.reason})`));
    console.log(`  • Evidence Count:    ${heuristicExtracted.allEvidence.length} references (Confidence: 0.95)`);

    // 3. Gemini Engine Execution (if available)
    console.log("\n--------------------------------------------------------------------------------");
    console.log(`[B] GEMINI REASONING OUTPUT:`);
    if (!isGeminiAvailable) {
      console.log(`  ⚠️ GEMINI_API_KEY is not set in environment.`);
      console.log(`  • Provider Used:   heuristic_fallback`);
      console.log(`  • Model Used:      deterministic-evidence-parser`);
      console.log(`  • Fallback Reason: GEMINI_API_KEY is not configured`);
    } else {
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

        const geminiResult = await geminiProvider.generateAccountIntelligence(context);
        console.log(`  • Provider Used:   ${geminiResult.observability.providerUsed}`);
        console.log(`  • Model Used:      ${geminiResult.observability.modelUsed}`);
        console.log(`  • Latency:         ${geminiResult.observability.latencyMs}ms`);
        if (geminiResult.observability.tokensUsed) {
          console.log(`  • Tokens Used:     ${geminiResult.observability.tokensUsed.totalTokens} tokens (Prompt: ${geminiResult.observability.tokensUsed.promptTokens}, Completion: ${geminiResult.observability.tokensUsed.completionTokens})`);
        }
        console.log(`  • Reconciled Health: ${geminiResult.intelligence.reconciledHealth}`);
        console.log(`  • Health Rationale:  ${geminiResult.intelligence.healthRationale}`);
        console.log(`  • Contradictions:    ${geminiResult.intelligence.contradictions.join("; ") || "None"}`);
        console.log(`  • Top Risks:`);
        geminiResult.intelligence.risks.forEach((r) => console.log(`      - [${r.severity}] ${r.title}: ${r.description} (Doc: ${r.evidence.sourceDoc})`));
        geminiResult.intelligence.blockers.forEach((b) => console.log(`      - [Blocker ${b.severity}] ${b.title}: ${b.details} (Doc: ${b.evidence.sourceDoc})`));
        console.log(`  • Stakeholders:`);
        geminiResult.intelligence.stakeholders.forEach((s) => console.log(`      - ${s.name} (${s.role}, ${s.authorityLevel}, ${s.sentiment})`));
        console.log(`  • Expansion / Trap:  ${geminiResult.intelligence.opportunity.status} (Trap: ${geminiResult.intelligence.opportunity.isTrap}) -> ${geminiResult.intelligence.opportunity.details}`);
        console.log(`  • Next Best Actions:`);
        geminiResult.intelligence.nextBestActions.forEach((a) => console.log(`      - [${a.priority}] ${a.action} (Reason: ${a.reason})`));
        console.log(`  • Evidence Count:    ${geminiResult.intelligence.allEvidence.length} references`);
      } catch (err: any) {
        console.error(`  ❌ Gemini Call Failed: ${err.message}`);
      }
    }
    console.log("\n");
  }

  console.log("================================================================================");
  console.log("🏁 COMPARISON COMPLETED (DATABASE UNTOUCHED)");
  console.log("================================================================================\n");
}

compareAccounts().catch((err) => {
  console.error("Comparison failed:", err);
  process.exit(1);
});
