"use client";

import { useEffect, useState, useTransition } from "react";
import { RefreshCw, Check, AlertCircle } from "lucide-react";

interface SyncStateData {
  status: "IDLE" | "SYNCING" | "ERROR";
  lastSyncStartedAt: string;
  lastSyncCompletedAt: string | null;
  totalAccountsSynced: number;
  totalDocsSynced: number;
  changesDetected: number;
  errorMessage: string | null;
}

export function SyncStatusBadge({ onSyncSuccess }: { onSyncSuccess?: () => void }) {
  const [syncState, setSyncState] = useState<SyncStateData | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/sync");
      if (res.ok) {
        const data = await res.json();
        setSyncState(data.status);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  const triggerSync = () => {
    setIsSyncing(true);
    startTransition(async () => {
      try {
        const res = await fetch("/api/sync", { method: "POST" });
        if (res.ok) {
          await fetchStatus();
          if (onSyncSuccess) onSyncSuccess();
        }
      } catch (e) {
        console.error("Sync error:", e);
      } finally {
        setIsSyncing(false);
      }
    });
  };

  const status = syncState?.status || "IDLE";
  const loading = isSyncing || isPending || status === "SYNCING";

  return (
    <div className="flex items-center gap-2 text-xs">
      {/* Status indicator pill */}
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-border bg-card text-zinc-300">
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            loading
              ? "bg-amber-400 animate-pulse"
              : status === "ERROR"
              ? "bg-red-400"
              : "bg-emerald-400"
          }`}
        />
        <span className="font-mono text-[11px] text-zinc-400">
          {loading
            ? "Syncing MCP..."
            : status === "ERROR"
            ? "Sync Error"
            : syncState?.lastSyncCompletedAt
            ? `Synced ${new Date(syncState.lastSyncCompletedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
            : "MCP Ready"}
        </span>
      </div>

      {/* Sync Action Button */}
      <button
        onClick={triggerSync}
        disabled={loading}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-border bg-secondary hover:bg-zinc-800 text-zinc-200 hover:text-white transition-colors disabled:opacity-50 text-[11px] font-medium"
        title="Trigger manual sync against FlytBase MCP"
      >
        <RefreshCw className={`w-3 h-3 text-zinc-400 ${loading ? "animate-spin text-zinc-200" : ""}`} />
        <span>{loading ? "Syncing" : "Sync"}</span>
      </button>
    </div>
  );
}
