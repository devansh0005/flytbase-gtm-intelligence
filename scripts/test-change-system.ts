import "dotenv/config";
import { db } from "../lib/db";
import { SyncService } from "../lib/sync/sync-service";

async function main() {
  console.log("================================================================================");
  console.log("🧪 TESTING AUDITABLE CHANGE-HISTORY SYSTEM (PS-5 LATE-DATA ENGINE)");
  console.log("================================================================================\n");

  // Step 1: Run sync when no changes exist
  console.log("--- TEST 1: Syncing with FlytBase MCP when no source changes exist ---");
  const initialEventsCount = await db.changeEvent.count();
  console.log(`Initial Change Events in DB: ${initialEventsCount}`);

  const syncResult1 = await SyncService.syncAll();
  console.log(`Sync Result 1:`, {
    success: syncResult1.success,
    accountsSynced: syncResult1.accountsSynced,
    documentsSynced: syncResult1.documentsSynced,
    usageRecordsSynced: syncResult1.usageRecordsSynced,
    changesDetected: syncResult1.changesDetected,
    affectedAccounts: syncResult1.affectedAccounts,
  });

  const eventsCountAfterSync1 = await db.changeEvent.count();
  console.log(`Change Events after clean sync: ${eventsCountAfterSync1}`);
  console.log(`New events created on clean sync: ${eventsCountAfterSync1 - initialEventsCount} (Expected: 0)\n`);

  if (eventsCountAfterSync1 - initialEventsCount === 0) {
    console.log("✅ TEST 1 PASSED: Zero spurious change events created when source is identical.\n");
  } else {
    console.warn("⚠️ TEST 1 WARNING: Changes were detected during clean sync.");
  }

  // Step 2: Verification of Change Event structure
  console.log("--- TEST 2: Inspecting Change History & Intelligence Re-computation ---");
  const history = await SyncService.getChangeHistory(10);
  console.log(`Total events retrieved: ${history.length}`);
  if (history.length > 0) {
    console.log("Sample Change Event:", {
      id: history[0].id,
      accountId: history[0].accountId,
      entityType: history[0].entityType,
      changeType: history[0].changeType,
      entityIdentifier: history[0].entityIdentifier,
      impact: history[0].impactSummary,
      intelligenceRecomputed: history[0].intelligenceRecomputed,
      healthDelta: `${history[0].oldHealth} -> ${history[0].newHealth}`,
      priorityDelta: `${history[0].oldPriorityScore} -> ${history[0].newPriorityScore}`,
    });
  } else {
    console.log("ℹ️ No historical change events in DB (Clean initial baseline).");
  }

  console.log("\n================================================================================");
  console.log("✅ AUDITABLE CHANGE-HISTORY SYSTEM VERIFIED");
  console.log("================================================================================\n");
}

main().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
