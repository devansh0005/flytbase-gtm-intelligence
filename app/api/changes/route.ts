import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { SyncService } from "@/lib/sync/sync-service";

export async function GET() {
  try {
    const syncState = await SyncService.getStatus();
    const changes = await SyncService.getChangeHistory(100);

    const totalChanges = await db.changeEvent.count();
    const accountsRecomputed = await db.changeEvent.count({
      where: { intelligenceRecomputed: true },
    });
    const documentChanges = await db.changeEvent.count({
      where: { entityType: "DOCUMENT" },
    });
    const usageChanges = await db.changeEvent.count({
      where: { entityType: "USAGE" },
    });
    const metadataChanges = await db.changeEvent.count({
      where: { entityType: "ACCOUNT" },
    });

    return NextResponse.json({
      syncState,
      metrics: {
        totalChanges,
        accountsRecomputed,
        documentChanges,
        usageChanges,
        metadataChanges,
      },
      changes,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch change history" },
      { status: 500 }
    );
  }
}
