import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { computeUsageTrend } from "@/lib/analytics/deterministic";
import { parseAccountIntelligence } from "@/lib/intelligence/formatters";
import { Account360View } from "@/components/account/Account360View";

export const dynamic = "force-dynamic";

interface AccountDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AccountDetailPage({ params }: AccountDetailPageProps) {
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
    notFound();
  }

  const usageTrend = computeUsageTrend(account.usageSnapshots);
  const intelligenceParsed = parseAccountIntelligence(account.intelligence);

  const enrichedAccount = {
    ...account,
    usageTrend,
    intelligenceParsed,
  };

  return <Account360View account={enrichedAccount as any} />;
}
