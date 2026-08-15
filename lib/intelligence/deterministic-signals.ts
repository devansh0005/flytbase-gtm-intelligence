import { Account, DocumentRecord, UsageSnapshot } from "@prisma/client";
import { DeterministicSignals } from "./types";

export function extractDeterministicSignals(
  account: Account & {
    documents: DocumentRecord[];
    usageSnapshots: UsageSnapshot[];
  },
  referenceDate: Date = new Date("2026-08-15")
): DeterministicSignals {
  const isChurnedState =
    account.category === "churned" ||
    account.health.toLowerCase().includes("churn");

  // 1. Usage Calculations
  const sortedUsage = [...account.usageSnapshots].sort((a, b) =>
    a.month.localeCompare(b.month)
  );

  const totalFlightHours = sortedUsage.reduce((acc, u) => acc + u.flightHours, 0);
  const totalMissions = sortedUsage.reduce((acc, u) => acc + u.missions, 0);
  const peakFlightHours =
    sortedUsage.length > 0 ? Math.max(...sortedUsage.map((u) => u.flightHours)) : 0;

  const latestUsage = sortedUsage.length > 0 ? sortedUsage[sortedUsage.length - 1] : null;
  const previousUsage =
    sortedUsage.length > 1 ? sortedUsage[sortedUsage.length - 2] : null;

  let usageChangePercent: number | null = null;
  if (latestUsage && previousUsage && previousUsage.flightHours > 0) {
    usageChangePercent = Math.round(
      ((latestUsage.flightHours - previousUsage.flightHours) /
        previousUsage.flightHours) *
        100
    );
  }

  let usageDropFromPeakPercent: number | null = null;
  if (peakFlightHours > 0 && latestUsage) {
    usageDropFromPeakPercent = Math.round(
      ((peakFlightHours - latestUsage.flightHours) / peakFlightHours) * 100
    );
  }

  let threeMonthUsageTrajectory: DeterministicSignals["threeMonthUsageTrajectory"] =
    "NO_DATA";

  if (sortedUsage.length === 0) {
    threeMonthUsageTrajectory = "NO_DATA";
  } else if (sortedUsage.length >= 3) {
    const last3 = sortedUsage.slice(-3);
    const firstOf3 = last3[0].flightHours;
    const lastOf3 = last3[2].flightHours;

    if (firstOf3 === 0 && lastOf3 === 0) {
      threeMonthUsageTrajectory = "ZERO_USAGE";
    } else if (lastOf3 > firstOf3 * 1.15) {
      threeMonthUsageTrajectory = "GROWING";
    } else if (lastOf3 < firstOf3 * 0.85) {
      threeMonthUsageTrajectory = "DECLINING";
    } else {
      threeMonthUsageTrajectory = "STABLE";
    }
  } else if (latestUsage && latestUsage.flightHours === 0) {
    threeMonthUsageTrajectory = "ZERO_USAGE";
  } else {
    threeMonthUsageTrajectory = "STABLE";
  }

  const isUsageCollapsing =
    peakFlightHours >= 10 &&
    latestUsage !== null &&
    (latestUsage.flightHours < peakFlightHours * 0.5 ||
      (threeMonthUsageTrajectory === "DECLINING" &&
        usageDropFromPeakPercent !== null &&
        usageDropFromPeakPercent >= 35));

  // 2. Renewal Parsing from Documents & Trackers
  let daysToRenewal: number | null = null;
  let renewalStatusFlag: DeterministicSignals["renewalStatusFlag"] = "NOT_APPLICABLE";

  for (const doc of account.documents) {
    const content = doc.rawContent || "";
    // Match "T-X days" or "T-X day" or past due
    const tDayMatches = content.match(/T-(\d+)\s*days?/gi);
    if (tDayMatches && tDayMatches.length > 0) {
      const extractedDays = tDayMatches
        .map((m) => {
          const num = m.replace(/[^0-9]/g, "");
          return parseInt(num, 10);
        })
        .filter((n) => !isNaN(n));

      if (extractedDays.length > 0) {
        const minDays = Math.min(...extractedDays);
        if (daysToRenewal === null || minDays < daysToRenewal) {
          daysToRenewal = minDays;
        }
      }
    }

    if (
      content.toLowerCase().includes("t-1 day (already past") ||
      content.toLowerCase().includes("past due")
    ) {
      daysToRenewal = -1;
    }
  }

  if (daysToRenewal !== null) {
    if (daysToRenewal <= 0) {
      renewalStatusFlag = "IMMEDIATE_PAST_DUE";
    } else if (daysToRenewal <= 14) {
      renewalStatusFlag = "UPCOMING_CRITICAL";
    } else {
      renewalStatusFlag = "UPCOMING_NORMAL";
    }
  }

  // 3. Document Counts by Type & Activity Dates
  const documentCountsByType: Record<string, number> = {};
  let ticketCount = 0;
  const activityDates: string[] = [];

  for (const doc of account.documents) {
    const type = doc.type || "other";
    documentCountsByType[type] = (documentCountsByType[type] || 0) + 1;

    if (type === "tickets" || doc.fileName.includes("ticket")) {
      ticketCount++;
    }

    if (doc.date) {
      activityDates.push(doc.date);
    }

    // Extract dates from content (e.g. 2026-07-29 or Date: 2026-05-19)
    const contentDates = (doc.rawContent || "").match(/202[56]-\d{2}-\d{2}/g);
    if (contentDates) {
      activityDates.push(...contentDates);
    }
  }

  activityDates.sort();
  const latestActivityDate =
    activityDates.length > 0 ? activityDates[activityDates.length - 1] : null;

  let daysSinceLatestActivity: number | null = null;
  if (latestActivityDate) {
    const actDate = new Date(latestActivityDate);
    const diffTime = referenceDate.getTime() - actDate.getTime();
    daysSinceLatestActivity = Math.max(
      0,
      Math.round(diffTime / (1000 * 60 * 60 * 24))
    );
  }

  // 4. CRM Health Disconnect Detection
  const crmHealthLower = account.health.toLowerCase();
  const crmSentimentLower = account.sentiment.toLowerCase();

  let hasCrmHealthDisconnect = false;
  const disconnectReasons: string[] = [];

  if (isChurnedState && crmHealthLower.includes("healthy")) {
    hasCrmHealthDisconnect = true;
    disconnectReasons.push("Account is churned in reality but flagged 'Healthy' in CRM");
  }

  if (isUsageCollapsing && crmHealthLower.includes("healthy")) {
    hasCrmHealthDisconnect = true;
    disconnectReasons.push(
      `Flight usage collapsed ${usageDropFromPeakPercent}% from peak (${peakFlightHours}h → ${latestUsage?.flightHours}h) while CRM claims 'Healthy'`
    );
  }

  if (
    (renewalStatusFlag === "IMMEDIATE_PAST_DUE" || renewalStatusFlag === "UPCOMING_CRITICAL") &&
    crmHealthLower.includes("healthy")
  ) {
    hasCrmHealthDisconnect = true;
    disconnectReasons.push(
      `Renewal is in critical jeopardy (${daysToRenewal === -1 ? 'Past due' : `T-${daysToRenewal} days`}) with pending procurement blockers while CRM claims 'Healthy'`
    );
  }

  return {
    accountId: account.id,
    name: account.name,
    category: account.category,
    nominalArr: account.arr,
    isChurnedState,
    docksDeployedText: account.docks,
    totalFlightHours,
    totalMissions,
    latestMonth: latestUsage ? latestUsage.month : null,
    latestFlightHours: latestUsage ? latestUsage.flightHours : 0,
    latestMissions: latestUsage ? latestUsage.missions : 0,
    previousFlightHours: previousUsage ? previousUsage.flightHours : 0,
    usageChangePercent,
    threeMonthUsageTrajectory,
    peakFlightHours,
    usageDropFromPeakPercent,
    isUsageCollapsing,
    daysToRenewal,
    renewalStatusFlag,
    totalDocuments: account.documents.length,
    documentCountsByType,
    latestActivityDate,
    daysSinceLatestActivity,
    supportTicketCount: ticketCount,
    hasCrmHealthDisconnect,
    crmHealthVsBehaviorSummary:
      disconnectReasons.length > 0
        ? disconnectReasons.join("; ")
        : "CRM health label aligns with behavioral signals",
  };
}
