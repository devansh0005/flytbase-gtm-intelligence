import { NextResponse } from "next/server";
import { SyncService } from "@/lib/sync/sync-service";

export async function GET() {
  try {
    const status = await SyncService.getStatus();
    return NextResponse.json({ status });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch sync status" },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const result = await SyncService.syncAll();
    return NextResponse.json({ result });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to execute sync" },
      { status: 500 }
    );
  }
}
