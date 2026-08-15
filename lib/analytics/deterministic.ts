import { Account, UsageSnapshot, DocumentRecord } from "@prisma/client";

export interface UsageTrend {
  totalFlightHours: number;
  totalMissions: number;
  latestMonth: string | null;
  latestFlightHours: number;
  latestMissions: number;
  previousFlightHours: number;
  deltaFlightHoursPercent: number | null; // percentage change last month vs prior month
  threeMonthTrajectory: "GROWING" | "STABLE" | "DECLINING" | "ZERO_USAGE" | "NO_DATA";
  peakFlightHours: number;
  usageDropFromPeakPercent: number | null;
  isUsageCollapsing: boolean; // >30% drop from peak or recent decline
}

export function computeUsageTrend(snapshots: UsageSnapshot[]): UsageTrend {
  if (!snapshots || snapshots.length === 0) {
    return {
      totalFlightHours: 0,
      totalMissions: 0,
      latestMonth: null,
      latestFlightHours: 0,
      latestMissions: 0,
      previousFlightHours: 0,
      deltaFlightHoursPercent: null,
      threeMonthTrajectory: "NO_DATA",
      peakFlightHours: 0,
      usageDropFromPeakPercent: null,
      isUsageCollapsing: false,
    };
  }

  // Sort chronologically ascending
  const sorted = [...snapshots].sort((a, b) => a.month.localeCompare(b.month));
  const totalFlightHours = sorted.reduce((sum, s) => sum + s.flightHours, 0);
  const totalMissions = sorted.reduce((sum, s) => sum + s.missions, 0);
  const peakFlightHours = Math.max(...sorted.map((s) => s.flightHours), 0);

  const latest = sorted[sorted.length - 1];
  const previous = sorted.length > 1 ? sorted[sorted.length - 2] : null;

  let deltaPercent: number | null = null;
  if (previous && previous.flightHours > 0) {
    deltaPercent = Math.round(((latest.flightHours - previous.flightHours) / previous.flightHours) * 100);
  }

  let usageDropFromPeakPercent: number | null = null;
  if (peakFlightHours > 0) {
    usageDropFromPeakPercent = Math.round(((peakFlightHours - latest.flightHours) / peakFlightHours) * 100);
  }

  // 3-month trajectory check
  let trajectory: UsageTrend["threeMonthTrajectory"] = "STABLE";
  if (sorted.length >= 3) {
    const last3 = sorted.slice(-3);
    const firstOf3 = last3[0].flightHours;
    const lastOf3 = last3[2].flightHours;

    if (firstOf3 === 0 && lastOf3 === 0) {
      trajectory = "ZERO_USAGE";
    } else if (lastOf3 > firstOf3 * 1.15) {
      trajectory = "GROWING";
    } else if (lastOf3 < firstOf3 * 0.85) {
      trajectory = "DECLINING";
    } else {
      trajectory = "STABLE";
    }
  } else if (latest.flightHours === 0) {
    trajectory = "ZERO_USAGE";
  }

  const isUsageCollapsing =
    peakFlightHours > 10 && (latest.flightHours < peakFlightHours * 0.6 || trajectory === "DECLINING");

  return {
    totalFlightHours,
    totalMissions,
    latestMonth: latest.month,
    latestFlightHours: latest.flightHours,
    latestMissions: latest.missions,
    previousFlightHours: previous ? previous.flightHours : 0,
    deltaFlightHoursPercent: deltaPercent,
    threeMonthTrajectory: trajectory,
    peakFlightHours,
    usageDropFromPeakPercent,
    isUsageCollapsing,
  };
}

export interface PortfolioSummaryMetrics {
  totalAccounts: number;
  totalNominalArr: number;
  activeArr: number;
  churnedArr: number;
  accountsByCategory: Record<string, number>;
  totalTrackedFlightHours: number;
  totalTrackedMissions: number;
  accountsWithDecliningUsage: number;
  accountsWithGrowingUsage: number;
  totalDocuments: number;
}

export function computePortfolioMetrics(
  accounts: (Account & { usageSnapshots?: UsageSnapshot[]; documents?: { id: string }[] })[]
): PortfolioSummaryMetrics {
  let totalNominalArr = 0;
  let activeArr = 0;
  let churnedArr = 0;
  let totalFlightHours = 0;
  let totalMissions = 0;
  let decliningCount = 0;
  let growingCount = 0;
  let totalDocs = 0;

  const accountsByCategory: Record<string, number> = {};

  for (const acc of accounts) {
    totalNominalArr += acc.arr;
    if (acc.category === "churned") {
      churnedArr += acc.arr;
    } else {
      activeArr += acc.arr;
    }

    accountsByCategory[acc.category] = (accountsByCategory[acc.category] || 0) + 1;

    if (acc.documents) {
      totalDocs += acc.documents.length;
    }

    if (acc.usageSnapshots && acc.usageSnapshots.length > 0) {
      const trend = computeUsageTrend(acc.usageSnapshots);
      totalFlightHours += trend.totalFlightHours;
      totalMissions += trend.totalMissions;
      if (trend.threeMonthTrajectory === "DECLINING" || trend.isUsageCollapsing) {
        decliningCount++;
      } else if (trend.threeMonthTrajectory === "GROWING") {
        growingCount++;
      }
    }
  }

  return {
    totalAccounts: accounts.length,
    totalNominalArr,
    activeArr,
    churnedArr,
    accountsByCategory,
    totalTrackedFlightHours: totalFlightHours,
    totalTrackedMissions: totalMissions,
    accountsWithDecliningUsage: decliningCount,
    accountsWithGrowingUsage: growingCount,
    totalDocuments: totalDocs,
  };
}
