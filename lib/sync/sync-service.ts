import crypto from "crypto";
import { db } from "@/lib/db";
import { mcpClient } from "@/lib/mcp/client";

export interface SyncResult {
  success: boolean;
  accountsSynced: number;
  documentsSynced: number;
  usageRecordsSynced: number;
  changesDetected: number;
  durationMs: number;
  affectedAccounts: string[];
  error?: string;
}

export class SyncService {
  private static calculateHash(content: string): string {
    return crypto.createHash("sha256").update(content).digest("hex");
  }

  public static async syncAll(): Promise<SyncResult> {
    const startTime = Date.now();
    let changesDetected = 0;
    let accountsSynced = 0;
    let documentsSynced = 0;
    let usageRecordsSynced = 0;
    const affectedAccountIds = new Set<string>();
    const createdEventIds: string[] = [];

    // Check if this is the very first bootstrap sync of an empty database
    const initialAccountCount = await db.account.count();
    const isBootstrap = initialAccountCount === 0;

    // 1. Update SyncState to SYNCING
    await db.syncState.upsert({
      where: { id: "singleton" },
      update: {
        status: "SYNCING",
        lastSyncStartedAt: new Date(),
        errorMessage: null,
      },
      create: {
        id: "singleton",
        status: "SYNCING",
        lastSyncStartedAt: new Date(),
      },
    });

    try {
      // 2. Fetch all accounts from MCP
      const mcpAccounts = await mcpClient.listAccounts();
      accountsSynced = mcpAccounts.length;

      for (const mcpAcc of mcpAccounts) {
        // A. Compare Account Metadata
        const existingAcc = await db.account.findUnique({
          where: { id: mcpAcc.id },
          include: { intelligence: true },
        });

        if (existingAcc && !isBootstrap) {
          const changedFields: Record<string, { old: any; new: any }> = {};
          if (existingAcc.arr !== mcpAcc.arr) changedFields.arr = { old: existingAcc.arr, new: mcpAcc.arr };
          if (existingAcc.health !== mcpAcc.health) changedFields.health = { old: existingAcc.health, new: mcpAcc.health };
          if (existingAcc.sentiment !== mcpAcc.sentiment) changedFields.sentiment = { old: existingAcc.sentiment, new: mcpAcc.sentiment };
          if (existingAcc.category !== mcpAcc.category) changedFields.category = { old: existingAcc.category, new: mcpAcc.category };
          if (existingAcc.csOwner !== mcpAcc.csOwner) changedFields.csOwner = { old: existingAcc.csOwner, new: mcpAcc.csOwner };
          if (existingAcc.seOwner !== mcpAcc.seOwner) changedFields.seOwner = { old: existingAcc.seOwner, new: mcpAcc.seOwner };
          if (existingAcc.championTagged !== mcpAcc.championTagged) changedFields.championTagged = { old: existingAcc.championTagged, new: mcpAcc.championTagged };
          if (existingAcc.docks !== mcpAcc.docks) changedFields.docks = { old: existingAcc.docks, new: mcpAcc.docks };

          if (Object.keys(changedFields).length > 0) {
            changesDetected++;
            affectedAccountIds.add(mcpAcc.id);

            const prevSummary = JSON.stringify(
              Object.fromEntries(Object.entries(changedFields).map(([k, v]) => [k, v.old]))
            );
            const newSummary = JSON.stringify(
              Object.fromEntries(Object.entries(changedFields).map(([k, v]) => [k, v.new]))
            );
            const fieldNames = Object.keys(changedFields).join(", ");
            const impactSummary = `Account metadata mutated: ${fieldNames} changed.`;

            const event = await db.changeEvent.create({
              data: {
                accountId: mcpAcc.id,
                entityType: "ACCOUNT",
                changeType: "UPDATED",
                entityIdentifier: "metadata",
                previousValue: prevSummary,
                newValue: newSummary,
                impactSummary,
                oldHealth: existingAcc.intelligence?.reconciledHealth || existingAcc.health,
                oldUrgency: existingAcc.intelligence?.priorityTier || "LOW",
                oldPriorityScore: existingAcc.intelligence?.priorityScore || 30,
              },
            });
            createdEventIds.push(event.id);
          }
        }

        await db.account.upsert({
          where: { id: mcpAcc.id },
          update: {
            accountId: mcpAcc.accountId,
            name: mcpAcc.name,
            folder: mcpAcc.folder,
            category: mcpAcc.category,
            categoryFolder: mcpAcc.categoryFolder,
            vertical: mcpAcc.vertical,
            region: mcpAcc.region,
            arr: mcpAcc.arr,
            docks: mcpAcc.docks,
            health: mcpAcc.health,
            sentiment: mcpAcc.sentiment,
            tier: mcpAcc.tier,
            csOwner: mcpAcc.csOwner,
            seOwner: mcpAcc.seOwner,
            championTagged: mcpAcc.championTagged,
            lastSyncedAt: new Date(),
          },
          create: {
            id: mcpAcc.id,
            accountId: mcpAcc.accountId,
            name: mcpAcc.name,
            folder: mcpAcc.folder,
            category: mcpAcc.category,
            categoryFolder: mcpAcc.categoryFolder,
            vertical: mcpAcc.vertical,
            region: mcpAcc.region,
            arr: mcpAcc.arr,
            docks: mcpAcc.docks,
            health: mcpAcc.health,
            sentiment: mcpAcc.sentiment,
            tier: mcpAcc.tier,
            csOwner: mcpAcc.csOwner,
            seOwner: mcpAcc.seOwner,
            championTagged: mcpAcc.championTagged,
            lastSyncedAt: new Date(),
          },
        });

        // B. Fetch & Diff Document Manifest
        const docManifest = await mcpClient.listAccountDocuments(mcpAcc.id);
        documentsSynced += docManifest.length;

        for (const docMeta of docManifest) {
          const rawDocContent = await mcpClient.getAccountDocument(mcpAcc.id, docMeta.file);
          const contentHash = this.calculateHash(rawDocContent || "");

          const existingDoc = await db.documentRecord.findUnique({
            where: {
              accountId_fileName: {
                accountId: mcpAcc.id,
                fileName: docMeta.file,
              },
            },
          });

          if (!isBootstrap) {
            if (!existingDoc) {
              changesDetected++;
              affectedAccountIds.add(mcpAcc.id);

              const event = await db.changeEvent.create({
                data: {
                  accountId: mcpAcc.id,
                  entityType: "DOCUMENT",
                  changeType: "CREATED",
                  entityIdentifier: docMeta.file,
                  newHash: contentHash,
                  newValue: JSON.stringify({ title: docMeta.title, type: docMeta.type }),
                  impactSummary: `New source document added: ${docMeta.file} (${docMeta.title})`,
                },
              });
              createdEventIds.push(event.id);
            } else if (existingDoc.contentHash !== contentHash) {
              changesDetected++;
              affectedAccountIds.add(mcpAcc.id);

              const event = await db.changeEvent.create({
                data: {
                  accountId: mcpAcc.id,
                  entityType: "DOCUMENT",
                  changeType: "UPDATED",
                  entityIdentifier: docMeta.file,
                  previousHash: existingDoc.contentHash,
                  newHash: contentHash,
                  impactSummary: `Source document content updated: SHA-256 diff detected in ${docMeta.file}`,
                },
              });
              createdEventIds.push(event.id);
            }
          }

          await db.documentRecord.upsert({
            where: {
              accountId_fileName: {
                accountId: mcpAcc.id,
                fileName: docMeta.file,
              },
            },
            update: {
              title: docMeta.title,
              type: docMeta.type,
              date: docMeta.date || null,
              contentHash,
              rawContent: rawDocContent,
              lastSeenAt: new Date(),
            },
            create: {
              accountId: mcpAcc.id,
              fileName: docMeta.file,
              title: docMeta.title,
              type: docMeta.type,
              date: docMeta.date || null,
              contentHash,
              rawContent: rawDocContent,
              lastSeenAt: new Date(),
            },
          });
        }

        // C. Fetch & Diff Usage Snapshots
        const usageRecords = await mcpClient.getAccountUsage(mcpAcc.id);
        if (Array.isArray(usageRecords) && usageRecords.length > 0) {
          usageRecordsSynced += usageRecords.length;
          for (const u of usageRecords) {
            const existingUsage = await db.usageSnapshot.findUnique({
              where: {
                accountId_month: {
                  accountId: mcpAcc.id,
                  month: u.month,
                },
              },
            });

            if (!isBootstrap) {
              if (!existingUsage) {
                changesDetected++;
                affectedAccountIds.add(mcpAcc.id);

                const event = await db.changeEvent.create({
                  data: {
                    accountId: mcpAcc.id,
                    entityType: "USAGE",
                    changeType: "CREATED",
                    entityIdentifier: u.month,
                    newValue: JSON.stringify({ flightHours: u.flightHours, missions: u.missions }),
                    impactSummary: `New telemetry month logged (${u.month}: ${u.flightHours}h, ${u.missions} missions)`,
                  },
                });
                createdEventIds.push(event.id);
              } else if (
                existingUsage.flightHours !== u.flightHours ||
                existingUsage.missions !== u.missions
              ) {
                changesDetected++;
                affectedAccountIds.add(mcpAcc.id);

                const event = await db.changeEvent.create({
                  data: {
                    accountId: mcpAcc.id,
                    entityType: "USAGE",
                    changeType: "UPDATED",
                    entityIdentifier: u.month,
                    previousValue: JSON.stringify({
                      flightHours: existingUsage.flightHours,
                      missions: existingUsage.missions,
                    }),
                    newValue: JSON.stringify({
                      flightHours: u.flightHours,
                      missions: u.missions,
                    }),
                    impactSummary: `Telemetry updated for ${u.month}: ${existingUsage.flightHours}h → ${u.flightHours}h (${existingUsage.missions} → ${u.missions} missions)`,
                  },
                });
                createdEventIds.push(event.id);
              }
            }

            await db.usageSnapshot.upsert({
              where: {
                accountId_month: {
                  accountId: mcpAcc.id,
                  month: u.month,
                },
              },
              update: {
                flightHours: u.flightHours,
                missions: u.missions,
              },
              create: {
                accountId: mcpAcc.id,
                month: u.month,
                flightHours: u.flightHours,
                missions: u.missions,
              },
            });
          }
        }
      }

      // 3. Automated Intelligence Re-evaluation for Affected Accounts
      if (affectedAccountIds.size > 0) {
        const { IntelligencePipeline } = await import("@/lib/intelligence/pipeline");
        for (const accountId of affectedAccountIds) {
          const prevIntel = await db.accountIntelligence.findUnique({
            where: { accountId },
          });

          // Run intelligence pipeline for affected account
          const newIntel = await IntelligencePipeline.processAccount(accountId);

          // Update ChangeEvent records with intelligence delta
          await db.changeEvent.updateMany({
            where: {
              id: { in: createdEventIds },
              accountId,
            },
            data: {
              intelligenceRecomputed: true,
              oldHealth: prevIntel?.reconciledHealth || "HEALTHY",
              newHealth: newIntel.reconciledHealth,
              oldUrgency: prevIntel?.priorityTier || "LOW",
              newUrgency: newIntel.priorityTier,
              oldPriorityScore: prevIntel?.priorityScore || 30,
              newPriorityScore: newIntel.priorityScore,
              recomputedAt: new Date(),
            },
          });
        }
      } else if (isBootstrap) {
        // On initial bootstrap, run intelligence pipeline for all accounts
        const { IntelligencePipeline } = await import("@/lib/intelligence/pipeline");
        await IntelligencePipeline.runPipeline();
      }

      // 4. Update SyncState to IDLE (Success)
      const durationMs = Date.now() - startTime;
      await db.syncState.update({
        where: { id: "singleton" },
        data: {
          status: "IDLE",
          lastSyncCompletedAt: new Date(),
          totalAccountsSynced: accountsSynced,
          totalDocsSynced: documentsSynced,
          changesDetected,
          errorMessage: null,
        },
      });

      return {
        success: true,
        accountsSynced,
        documentsSynced,
        usageRecordsSynced,
        changesDetected,
        durationMs,
        affectedAccounts: Array.from(affectedAccountIds),
      };
    } catch (err: any) {
      const errorMessage = err?.message || String(err);
      await db.syncState.update({
        where: { id: "singleton" },
        data: {
          status: "ERROR",
          errorMessage,
        },
      });

      return {
        success: false,
        accountsSynced,
        documentsSynced,
        usageRecordsSynced,
        changesDetected,
        durationMs: Date.now() - startTime,
        affectedAccounts: [],
        error: errorMessage,
      };
    }
  }

  public static async getStatus() {
    return db.syncState.findUnique({
      where: { id: "singleton" },
    });
  }

  public static async getChangeHistory(limit: number = 50) {
    return db.changeEvent.findMany({
      take: limit,
      orderBy: { detectedAt: "desc" },
      include: {
        account: {
          select: {
            id: true,
            name: true,
            arr: true,
            category: true,
          },
        },
      },
    });
  }
}
