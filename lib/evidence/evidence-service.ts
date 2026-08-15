import { db } from "@/lib/db";
import { Evidence } from "@prisma/client";

export interface CreateEvidenceInput {
  accountId: string;
  signalType: string;
  sourceType: string;
  sourceDoc?: string;
  snippet: string;
  confidence?: number;
}

export class EvidenceService {
  public static async recordEvidence(input: CreateEvidenceInput): Promise<Evidence> {
    return db.evidence.create({
      data: {
        accountId: input.accountId,
        signalType: input.signalType,
        sourceType: input.sourceType,
        sourceDoc: input.sourceDoc || null,
        snippet: input.snippet,
        confidence: input.confidence ?? 1.0,
      },
    });
  }

  public static async getEvidenceForAccount(accountId: string): Promise<Evidence[]> {
    return db.evidence.findMany({
      where: { accountId },
      orderBy: { createdAt: "desc" },
    });
  }

  public static async getEvidenceBySignal(signalType: string): Promise<Evidence[]> {
    return db.evidence.findMany({
      where: { signalType },
      include: { account: true },
      orderBy: { createdAt: "desc" },
    });
  }
}
