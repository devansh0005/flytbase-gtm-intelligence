import "dotenv/config";
import { IntelligencePipeline } from "../lib/intelligence/pipeline";

async function testAccounts() {
  const targetAccounts = ["coastline-transit", "pinnacle-venue-group", "meridian-energy"];

  console.log("================================================================================");
  console.log("🧪 TESTING LLM REASONING & DETERMINISTIC ENGINE FOR 3 SELECTED ACCOUNTS");
  console.log("================================================================================\n");

  for (const accountId of targetAccounts) {
    console.log(`\n================================================================================`);
    console.log(`ACCOUNT: ${accountId.toUpperCase()}`);
    console.log(`================================================================================`);

    const result = await IntelligencePipeline.processAccount(accountId);

    console.log(`\n📡 OBSERVABILITY & AI PROVIDER METRICS:`);
    console.log(`  - Provider Used:   ${result.observability.providerUsed}`);
    console.log(`  - Model Used:      ${result.observability.modelUsed}`);
    console.log(`  - Latency:         ${result.observability.latencyMs}ms`);
    console.log(`  - Used Fallback:   ${result.observability.usedFallback}`);
    if (result.observability.fallbackReason) {
      console.log(`  - Fallback Reason: ${result.observability.fallbackReason}`);
    }

    console.log(`\n🔢 DETERMINISTIC BEHAVIORAL SIGNALS:`);
    console.log(`  - Nominal ARR:           $${result.deterministicSignals.nominalArr.toLocaleString()}`);
    console.log(`  - Total Flight Hours:    ${result.deterministicSignals.totalFlightHours}h (${result.deterministicSignals.totalMissions} missions)`);
    console.log(`  - Latest Month Usage:    ${result.deterministicSignals.latestFlightHours}h (Latest: ${result.deterministicSignals.latestMonth})`);
    console.log(`  - Usage Trajectory:      ${result.deterministicSignals.threeMonthUsageTrajectory}`);
    console.log(`  - Peak Drop %:           ${result.deterministicSignals.usageDropFromPeakPercent !== null ? `${result.deterministicSignals.usageDropFromPeakPercent}%` : 'N/A'}`);
    console.log(`  - Usage Collapsing:      ${result.deterministicSignals.isUsageCollapsing ? 'YES (Triggered)' : 'No'}`);
    console.log(`  - Days to Renewal:       ${result.deterministicSignals.daysToRenewal !== null ? `${result.deterministicSignals.daysToRenewal} days (${result.deterministicSignals.renewalStatusFlag})` : 'N/A'}`);
    console.log(`  - CRM Disconnect Flag:   ${result.deterministicSignals.hasCrmHealthDisconnect ? 'YES (Contradiction)' : 'No'}`);
    console.log(`  - Total Source Docs:     ${result.deterministicSignals.totalDocuments}`);

    console.log(`\n🏥 RECONCILED HEALTH & CONTRADICTIONS:`);
    console.log(`  - Reconciled Health:     ${result.reconciledHealth} (${result.healthScore}/100)`);
    console.log(`  - Diagnosis Rationale:   ${result.healthRationale}`);
    console.log(`  - Contradictions Found:`);
    if (result.contradictions.length === 0) {
      console.log(`    (None - CRM matches ground truth)`);
    } else {
      result.contradictions.forEach((c) => console.log(`    ⚠️ ${c}`));
    }

    console.log(`\n🚨 TOP RISKS & BLOCKERS:`);
    if (result.risks.length === 0 && result.blockers.length === 0) {
      console.log(`  (No high risks identified)`);
    }
    result.risks.forEach((r) => {
      console.log(`  - [Risk: ${r.severity}] ${r.title}: ${r.description}`);
      console.log(`    • Source Doc: ${r.evidence.sourceDoc} | Excerpt: "${r.evidence.excerpt}"`);
    });
    result.blockers.forEach((b) => {
      console.log(`  - [Blocker: ${b.severity} ${b.category}] ${b.title}: ${b.details}`);
      console.log(`    • Source Doc: ${b.evidence.sourceDoc} | Excerpt: "${b.evidence.excerpt}"`);
    });

    console.log(`\n🎯 EXPANSION OPPORTUNITIES:`);
    console.log(`  - Status:   ${result.opportunity.status} (Is Trap: ${result.opportunity.isTrap})`);
    console.log(`  - Details:  ${result.opportunity.details}`);
    if (result.opportunity.potential) {
      console.log(`  - Upside:   ${result.opportunity.potential}`);
    }
    result.opportunity.evidence.forEach((ev) => {
      console.log(`    • Evidence: [${ev.sourceDoc}] "${ev.excerpt}"`);
    });

    console.log(`\n⚡ PRIORITIZED NEXT-BEST ACTIONS (P0-P2):`);
    result.nextBestActions.forEach((act) => {
      console.log(`  - [${act.priority}] Action:  ${act.action}`);
      console.log(`    • Reason:  ${act.reason}`);
      console.log(`    • Outcome: ${act.expectedOutcome}`);
    });

    console.log(`\n🏆 DETERMINISTIC PRIORITY SCORE:`);
    console.log(`  - Priority Score: ${result.priorityScore}/100 (${result.priorityTier})`);
    console.log(`  - Explanation:    ${result.priorityExplanation}`);
  }

  console.log("\n================================================================================");
  console.log("✅ 3-ACCOUNT TEST COMPLETED");
  console.log("================================================================================\n");
}

testAccounts().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
