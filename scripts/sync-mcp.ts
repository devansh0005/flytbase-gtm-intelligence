import "dotenv/config";
import { SyncService } from "../lib/sync/sync-service";

async function main() {
  console.log("🚀 Starting initial FlytBase MCP sync...");
  const result = await SyncService.syncAll();
  console.log("\n📊 Sync Finished with result:", JSON.stringify(result, null, 2));
  if (!result.success) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal sync error:", err);
  process.exit(1);
});
