"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer,
} from "recharts";
import type { AnalyticsData } from "@/lib/analytics";
import { formatCurrency } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  DRAFT:        "#94a3b8",
  PLANNING:     "#60a5fa",
  PLAN_LOCKED:  "#818cf8",
  IN_EXECUTION: "#a78bfa",
  LIVE:         "#34d399",
  COMPLETED:    "#10b981",
  CANCELLED:    "#f87171",
};

const BAR_COLORS = { estimated: "#3b82f6", actual: "#10b981" };

// ── Events by Status donut ────────────────────────────────────────────────
export function StatusDonut({ data }: { data: AnalyticsData["overview"]["byStatus"] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          dataKey="count"
          nameKey="status"
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={3}
        >
          {data.map((entry) => (
            <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? "#94a3b8"} />
          ))}
        </Pie>
        <Tooltip formatter={(v) => [v, "events"]} />
        <Legend
          formatter={(value) => value.replace(/_/g, " ")}
          iconType="circle"
          iconSize={8}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

// ── Budget estimated vs actual bar ───────────────────────────────────────
export function BudgetBar({ data }: { data: AnalyticsData["budget"]["byEvent"] }) {
  if (data.length === 0) return <EmptyChart message="No budget data yet" />;
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 40 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" interval={0} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
        <Tooltip formatter={(v) => formatCurrency(Number(v))} />
        <Legend iconType="square" iconSize={10} />
        <Bar dataKey="estimated" name="Estimated" fill={BAR_COLORS.estimated} radius={[4, 4, 0, 0]} />
        <Bar dataKey="actual" name="Actual" fill={BAR_COLORS.actual} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Budget by category bar ────────────────────────────────────────────────
export function CategoryBar({ data }: { data: AnalyticsData["budget"]["byCategory"] }) {
  if (data.length === 0) return <EmptyChart message="No category data yet" />;
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, left: 80, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
        <YAxis type="category" dataKey="category" tick={{ fontSize: 11 }} width={76} />
        <Tooltip formatter={(v) => formatCurrency(Number(v))} />
        <Bar dataKey="amount" name="Estimated" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Notes per event bar ───────────────────────────────────────────────────
export function NotesBar({ data }: { data: AnalyticsData["teamActivity"]["notesPerEvent"] }) {
  if (data.length === 0) return <EmptyChart message="No notes activity yet" />;
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 40 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" interval={0} />
        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
        <Tooltip />
        <Bar dataKey="count" name="Messages" fill="#60a5fa" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-40 text-xs text-slate-400">{message}</div>
  );
}
