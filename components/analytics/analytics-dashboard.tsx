"use client";

import { useState } from "react";
import Link from "next/link";
import {
  TrendingUp, Calendar, DollarSign, BarChart2,
  Users, Bot, Clock, AlertTriangle, CheckCircle2, ExternalLink,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import type { AnalyticsData } from "@/lib/analytics";
import { PageHeader } from "@/components/layout/page-header";
import { SectionCard } from "@/components/ui/section-card";
import {
  StatusDonut, BudgetBar, CategoryBar, NotesBar,
} from "./analytics-charts";

const SECTION_TABS = ["Overview", "Budget", "Timeline", "Team Activity"] as const;
type Tab = (typeof SECTION_TABS)[number];

const STATUS_DISPLAY: Record<string, string> = {
  DRAFT: "Draft", PLANNING: "Planning", PLAN_LOCKED: "Plan Locked",
  IN_EXECUTION: "In Execution", LIVE: "Live", COMPLETED: "Completed", CANCELLED: "Cancelled",
};
const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-600", PLANNING: "bg-blue-50 text-blue-600",
  PLAN_LOCKED: "bg-indigo-50 text-indigo-700", IN_EXECUTION: "bg-violet-50 text-violet-700",
  LIVE: "bg-green-50 text-green-700", COMPLETED: "bg-emerald-50 text-emerald-700",
  CANCELLED: "bg-red-50 text-red-500",
};

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export function AnalyticsDashboard({ data, events }: {
  data: AnalyticsData;
  events: { id: string; title: string; status: string; startDate: string | null }[];
}) {
  const [tab, setTab] = useState<Tab>("Overview");

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader title="Analytics" subtitle="Cross-event insights and performance metrics" />

      {/* Tab nav */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {SECTION_TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-4 py-1.5 rounded-lg text-sm font-medium transition-all",
              tab === t ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── Overview ───────────────────────────────────────────── */}
      {tab === "Overview" && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard label="Total Events" value={data.overview.totalEvents} />
            <StatCard label="This Quarter" value={data.overview.thisQuarter} />
            <StatCard label="This Month" value={data.overview.thisMonth} />
            <StatCard label="Budget Deployed" value={formatCurrency(data.overview.totalBudgetDeployed)} sub={`avg ${formatCurrency(data.overview.avgBudget)}`} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <SectionCard title="Events by Status" icon={BarChart2}>
              {data.overview.byStatus.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">No events yet</p>
              ) : (
                <StatusDonut data={data.overview.byStatus} />
              )}
            </SectionCard>

            <SectionCard title="All Events" icon={Calendar}>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {events.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-8">No events yet</p>
                ) : events.map((e) => (
                  <div key={e.id} className="flex items-center justify-between gap-3 py-1.5 border-b border-slate-100 last:border-0">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">{e.title}</p>
                      {e.startDate && (
                        <p className="text-xs text-slate-400">
                          {new Date(e.startDate).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", STATUS_COLORS[e.status] ?? "bg-slate-100 text-slate-600")}>
                        {STATUS_DISPLAY[e.status] ?? e.status}
                      </span>
                      <Link href={`/events/${e.id}/specs`} className="text-slate-400 hover:text-brand-blue transition-colors">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        </div>
      )}

      {/* ── Budget ─────────────────────────────────────────────── */}
      {tab === "Budget" && (
        <div className="space-y-5">
          <SectionCard title="Estimated vs. Actual by Event" icon={DollarSign}>
            <BudgetBar data={data.budget.byEvent} />
          </SectionCard>

          <SectionCard title="Spend by Category" icon={TrendingUp}>
            <CategoryBar data={data.budget.byCategory} />
          </SectionCard>

          {data.budget.topVariances.length > 0 && (
            <SectionCard title="Top Budget Variances" icon={AlertTriangle}>
              <div className="space-y-2">
                {data.budget.topVariances.map((v) => (
                  <div key={v.name} className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0">
                    <p className="flex-1 text-sm text-slate-700 truncate">{v.name}</p>
                    <span className={cn("text-xs font-semibold", v.variance > 0 ? "text-red-500" : "text-green-600")}>
                      {v.variance > 0 ? "+" : ""}{v.pct}%
                    </span>
                    <span className={cn("text-xs font-medium", v.variance > 0 ? "text-red-400" : "text-green-500")}>
                      {v.variance > 0 ? "+" : ""}{formatCurrency(Math.abs(v.variance))}
                    </span>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}
        </div>
      )}

      {/* ── Timeline ───────────────────────────────────────────── */}
      {tab === "Timeline" && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <StatCard
              label="Avg. Planning Duration"
              value={data.timeline.avgPlanningDays !== null ? `${data.timeline.avgPlanningDays} days` : "—"}
              sub="Draft → Plan Locked"
            />
            <StatCard
              label="Avg. Execution Lead Time"
              value={data.timeline.avgExecutionDays !== null ? `${data.timeline.avgExecutionDays} days` : "—"}
              sub="Plan Locked → Event Date"
            />
          </div>

          <SectionCard title="Events Timeline" icon={Calendar}>
            {data.timeline.events.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">No events with dates set</p>
            ) : (
              <div className="space-y-3">
                {data.timeline.events.map((e) => {
                  const start = new Date(e.startDate);
                  const end = new Date(e.endDate);
                  const isPast = end < new Date();
                  return (
                    <div key={e.name} className="flex items-center gap-3">
                      <div className="w-36 shrink-0">
                        <p className="text-xs font-medium text-slate-700 truncate">{e.name}</p>
                        <p className="text-xs text-slate-400">
                          {start.toLocaleDateString([], { month: "short", day: "numeric" })}
                          {e.startDate !== e.endDate && ` – ${end.toLocaleDateString([], { month: "short", day: "numeric" })}`}
                        </p>
                      </div>
                      <div className="flex-1 bg-slate-100 rounded-full h-2 relative">
                        <div
                          className={cn("h-2 rounded-full", isPast ? "bg-slate-400" : "bg-brand-blue")}
                          style={{ width: "100%" }}
                        />
                      </div>
                      <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium shrink-0", STATUS_COLORS[e.status] ?? "bg-slate-100 text-slate-600")}>
                        {STATUS_DISPLAY[e.status] ?? e.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>
        </div>
      )}

      {/* ── Team Activity ─────────────────────────────────────── */}
      {tab === "Team Activity" && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label="Agent Tasks Created" value={data.teamActivity.agentTasksTotal} />
            <StatCard
              label="Agent Tasks Completed"
              value={data.teamActivity.agentTasksCompleted}
              sub={data.teamActivity.agentTasksTotal > 0
                ? `${Math.round((data.teamActivity.agentTasksCompleted / data.teamActivity.agentTasksTotal) * 100)}% completion rate`
                : undefined}
            />
            <StatCard
              label="Total Team Messages"
              value={data.teamActivity.notesPerEvent.reduce((s, e) => s + e.count, 0)}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <SectionCard title="Messages per Event" icon={BarChart2}>
              <NotesBar data={data.teamActivity.notesPerEvent} />
            </SectionCard>

            <SectionCard title="Most Active Members" icon={Users}>
              {data.teamActivity.topMembers.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">No activity yet</p>
              ) : (
                <div className="space-y-3">
                  {data.teamActivity.topMembers.map((m, i) => (
                    <div key={m.name} className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-300 w-4">{i + 1}</span>
                      <div className="w-7 h-7 rounded-full bg-brand-blue flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {m.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="flex-1 text-sm text-slate-700">{m.name}</span>
                      <span className="text-xs text-slate-500">{m.count} msg{m.count !== 1 ? "s" : ""}</span>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </div>

          <SectionCard title="Agent Task Performance" icon={Bot}>
            <div className="flex items-center gap-6">
              <div className="flex-1">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-500">Completion rate</span>
                  <span className="font-medium text-slate-700">
                    {data.teamActivity.agentTasksTotal > 0
                      ? `${Math.round((data.teamActivity.agentTasksCompleted / data.teamActivity.agentTasksTotal) * 100)}%`
                      : "—"}
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className="bg-purple-500 h-2 rounded-full transition-all"
                    style={{
                      width: data.teamActivity.agentTasksTotal > 0
                        ? `${(data.teamActivity.agentTasksCompleted / data.teamActivity.agentTasksTotal) * 100}%`
                        : "0%",
                    }}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                {data.teamActivity.agentTasksCompleted} completed
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 shrink-0">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {data.teamActivity.agentTasksTotal - data.teamActivity.agentTasksCompleted} pending
              </div>
            </div>
          </SectionCard>
        </div>
      )}
    </div>
  );
}
