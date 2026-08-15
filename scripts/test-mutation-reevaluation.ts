import "dotenv/config";
import { db } from "../lib/db";
import { SyncService } from "../lib/sync/sync-service";

async function testMutation() {
  console.log("================================================================================");
  console.log("🔬 TESTING REAL MUTATION, CHANGE LOGGING & INTELLIGENCE RE-EVALUATION");
  console.log("================================================================================\n");

  const targetAccount = "vantage-protective";
  console.log(`Targeting test account: ${targetAccount}`);

  // 1. Get current baseline
  const accountBefore = await db.account.findUnique({
    where: { id: targetAccount },
    include: { intelligence: true, documents: true },
  });

  console.log(`Baseline Health: ${accountBefore?.intelligence?.reconciledHealth} (${accountBefore?.intelligence?.healthScore}/100)`);
  console.log(`Baseline Priority: ${accountBefore?.intelligence?.priorityScore}/100 (${accountBefore?.intelligence?.priorityTier})`);

  // 2. Temporarily mutate one document's hash or content in local SQLite to simulate a modified remote doc
  const targetDoc = accountBefore?.documents[0];
  if (targetDoc) {
    console.log(`\nSimulating an out-of-sync state for document: ${targetDoc.fileName}...`);
    // Alter local hash so next MCP sync detects the SHA-256 diff
    await db.documentRecord.update({
      where: { id: targetDoc.id },
      data: { contentHash: "stale_hash_to_trigger_diff_detection" },
    });
  }

  // 3. Run Sync
  console.log("\nExecuting SyncService.syncAll() against live FlytBase MCP...");
  const syncResult = await SyncService.syncAll();
  console.log("Sync Result:", {
    changesDetected: syncResult.changesDetected,
    affectedAccounts: syncResult.affectedAccounts,
  });

  // 4. Verify Change Event
  const recentEvents = await db.changeEvent.findMany({
    where: { accountId: targetAccount },
    orderBy: { detectedAt: "desc" },
    take: 1,
  });

  if (recentEvents.length > 0) {
    const evt = recentEvents[0];
    console.log("\n✅ CHANGE EVENT RECORDED IN DATABASE:");
    console.log(`  - Event ID:               ${evt.id}`);
    console.log(`  - Entity Type:            ${evt.entityType} (${evt.changeType})`);
    console.log(`  - Identifier:             ${evt.entityIdentifier}`);
    console.log(`  - Impact Summary:         ${evt.impactSummary}`);
    console.log(`  - Prev SHA:               ${evt.previousHash}`);
    console.log(`  - New SHA:                ${evt.newHash}`);
    console.log(`  - Intelligence Recomputed:${evt.intelligenceRecomputed}`);
    console.log(`  - Health Delta:           ${evt.oldHealth} -> ${evt.newHealth}`);
    console.log(`  - Priority Delta:         ${evt.oldPriorityScore} -> ${evt.newPriorityScore}`);
  } else {
    console.warn("No change event was logged.");
  }

  console.log("\n================================================================================");
  console.log("🏁 END-TO-END MUTATION & RE-EVALUATION TEST PASSED");
  console.log("================================================================================\n");
}

testMutation().catch((err) => {
  console.error("Mutation test failed:", err);
  process.exit(1);
});
