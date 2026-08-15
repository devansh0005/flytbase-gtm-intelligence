"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";

interface UsageSnapshotItem {
  month: string;
  flightHours: number;
  missions: number;
}

export function UsageChart({ data }: { data: UsageSnapshotItem[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center border border-dashed border-border rounded-lg text-xs text-zinc-500 font-mono">
        No flight usage telemetry recorded for this account.
      </div>
    );
  }

  return (
    <div className="h-64 w-full pt-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
          <CartesianGrid strokeDasharray="2 2" stroke="#222630" opacity={0.8} vertical={false} />
          <XAxis dataKey="month" stroke="#6b7280" fontSize={10} fontVariant="mono" />
          <YAxis stroke="#6b7280" fontSize={10} fontVariant="mono" />
          <Tooltip
            contentStyle={{
              backgroundColor: "#101318",
              borderColor: "#222630",
              borderRadius: "0.375rem",
              fontSize: "11px",
              color: "#f3f4f6",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.4)",
            }}
          />
          <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
          <Bar dataKey="flightHours" name="Flight Hours (h)" fill="#3b82f6" radius={[2, 2, 0, 0]} />
          <Bar dataKey="missions" name="Missions" fill="#71717a" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
