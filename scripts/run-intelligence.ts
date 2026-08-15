import "dotenv/config";
import { IntelligencePipeline } from "../lib/intelligence/pipeline";

async function main() {
  console.log("================================================================================");
  console.log("🚀 EXECUTING FLYTBASE GTM INTELLIGENCE PIPELINE ACROSS ALL 14 ACCOUNTS");
  console.log("================================================================================\n");

  const report = await IntelligencePipeline.runPipeline();

  console.log(`\n📊 PORTFOLIO HEALTH SUMMARY (${report.totalAccounts} Accounts)`);
  console.log(`- Total Nominal ARR: $${report.portfolioNominalArr.toLocaleString()}`);
  console.log(`- Active ARR: $${report.activeArr.toLocaleString()}`);
  console.log(`- Churned ARR: $${report.churnedArr.toLocaleString()}`);
  console.log("- Reconciled Health Counts:", JSON.stringify(report.accountsByReconciledHealth, null, 2));

  console.log("\n🔥 PORTFOLIO PRIORITY RANKING (DETERMINISTIC 0-100 SCORE):");
  console.table(
    report.portfolioPriorityRanking.map((r) => ({
      Rank: r.rank,
      ID: r.accountId,
      Name: r.name,
      Score: r.priorityScore,
      Tier: r.priorityTier,
      Health: r.reconciledHealth,
      ARR: `$${r.nominalArr.toLocaleString()}`,
      Trigger: r.primaryTrigger,
    }))
  );

  console.log("\n⚠️ CONTRADICTIONS DETECTED BETWEEN CRM AND GROUND EVIDENCE:");
  report.contradictionsDetected.forEach((c, idx) => {
    console.log(`\n[${idx + 1}] Account: ${c.accountName} (${c.accountId})`);
    console.log(`    - CRM Claim:    ${c.crmClaim}`);
    console.log(`    - Ground Truth: ${c.groundTruth}`);
    console.log(`    - Evidence Doc: ${c.evidenceDoc}`);
  });

  console.log("\n🎯 TOP EXPANSION OPPORTUNITIES (EVIDENCE BACKED):");
  report.top5Opportunities.forEach((o, idx) => {
    console.log(`\n[${idx + 1}] Account: ${o.accountName} (${o.accountId})`);
    console.log(`    - Opportunity: ${o.opportunityTitle}`);
    if (o.potential) console.log(`    - Potential:   ${o.potential}`);
    console.log(`    - Source Doc:  ${o.sourceDoc}`);
    console.log(`    - Excerpt:     "${o.excerpt}"`);
  });

  console.log("\n🚨 TOP OPERATIONAL & CHURN RISKS (EVIDENCE BACKED):");
  report.top5Risks.forEach((r, idx) => {
    console.log(`\n[${idx + 1}] Account: ${r.accountName} (${r.accountId})`);
    console.log(`    - Risk:       ${r.riskTitle} (Severity: ${r.severity})`);
    console.log(`    - Source Doc: ${r.sourceDoc}`);
    console.log(`    - Excerpt:    "${r.excerpt}"`);
  });

  console.log("\n📋 SAMPLE EVIDENCE-BACKED ACCOUNT INTELLIGENCE:");
  const sampleIds = ["coastline-transit", "pinnacle-venue-group", "meridian-energy", "vantage-protective", "falcon-point-security"];
  sampleIds.forEach((id) => {
    const a = report.accountReports[id];
    if (a) {
      console.log(`\n--------------------------------------------------------------------------------`);
      console.log(`ACCOUNT: ${a.name} (${a.accountId}) | ARR: $${a.nominalArr.toLocaleString()} | Health: ${a.reconciledHealth} (${a.healthScore}/100)`);
      console.log(`Priority: ${a.priorityScore} (${a.priorityTier}) -> ${a.priorityExplanation}`);
      console.log(`Diagnosis: ${a.healthRationale}`);
      console.log(`Next Best Actions:`);
      a.nextBestActions.forEach((act) => {
        console.log(`  [${act.priority}] ${act.action} -> Reason: ${act.reason}`);
      });
    }
  });

  console.log("\n================================================================================");
  console.log("✅ INTELLIGENCE PIPELINE COMPLETED SUCCESSFULLY");
  console.log("================================================================================");
}

main().catch((err) => {
  console.error("Fatal error running intelligence pipeline:", err);
  process.exit(1);
});
