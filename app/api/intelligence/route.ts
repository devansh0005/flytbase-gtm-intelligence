import { NextResponse } from "next/server";
import { IntelligencePipeline } from "@/lib/intelligence/pipeline";

export async function GET() {
  try {
    const report = await IntelligencePipeline.runPipeline();
    return NextResponse.json(report);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to generate intelligence report" },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const report = await IntelligencePipeline.runPipeline();
    return NextResponse.json({ success: true, report });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to execute intelligence pipeline" },
      { status: 500 }
    );
  }
}
