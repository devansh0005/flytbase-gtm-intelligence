import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { computeUsageTrend, computePortfolioMetrics } from "@/lib/analytics/deterministic";

export async function GET() {
  try {
    const accounts = await db.account.findMany({
      include: {
        intelligence: true,
        usageSnapshots: true,
        documents: {
          select: {
            id: true,
            fileName: true,
            title: true,
            type: true,
            date: true,
            lastSeenAt: true,
          },
        },
      },
      orderBy: [{ arr: "desc" }, { name: "asc" }],
    });

    const portfolioMetrics = computePortfolioMetrics(accounts);

    const accountsWithAnalytics = accounts.map((acc) => {
      const usageTrend = computeUsageTrend(acc.usageSnapshots);
      const { parseAccountIntelligence } = require("@/lib/intelligence/formatters");
      const intelligenceParsed = parseAccountIntelligence(acc.intelligence);
      return {
        ...acc,
        usageTrend,
        intelligenceParsed,
      };
    });

    return NextResponse.json({
      portfolioMetrics,
      accounts: accountsWithAnalytics,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch accounts" },
      { status: 500 }
    );
  }
}
