import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { computeUsageTrend } from "@/lib/analytics/deterministic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const account = await db.account.findUnique({
      where: { id },
      include: {
        intelligence: true,
        usageSnapshots: {
          orderBy: { month: "asc" },
        },
        documents: {
          orderBy: { fileName: "asc" },
        },
        evidence: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    const usageTrend = computeUsageTrend(account.usageSnapshots);
    const { parseAccountIntelligence } = require("@/lib/intelligence/formatters");
    const intelligenceParsed = parseAccountIntelligence(account.intelligence);

    return NextResponse.json({
      account: {
        ...account,
        usageTrend,
        intelligenceParsed,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch account detail" },
      { status: 500 }
    );
  }
}
