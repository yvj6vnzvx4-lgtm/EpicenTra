"use client";

import { Printer } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

interface ChecklistItem {
  title: string;
  isCompleted: boolean;
  dueDate: string | null;
}

interface EventReportProps {
  event: {
    id: string;
    title: string;
    status: string;
    description?: string | null;
    startDate: string | null;
    endDate: string | null;
    venueName: string | null;
    venueCity: string | null;
    venueState: string | null;
    expectedAttendance: number | null;
    totalBudget: number | null;
  };
  budgetSummary: {
    totalEstimated: number;
    totalActual: number;
    variance: number;
    variancePct: number;
    items: { category: string; description: string; estimated: number; actual: number | null }[];
  };
  checklist: { total: number; completed: number; pct: number };
  checklistItems?: ChecklistItem[];
  decisions: { content: string; author: string; createdAt: string }[];
  agentTasks: { prompt: string; result: string | null; createdAt: string }[];
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  PLANNING: "Planning",
  PLAN_LOCKED: "Plan Locked",
  IN_EXECUTION: "In Execution",
  LIVE: "Live — Active",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const STATUS_BADGE: Record<string, string> = {
  IN_EXECUTION: "text-green-400 border-green-400",
  LIVE: "text-green-400 border-green-400",
  COMPLETED: "text-blue-400 border-blue-400",
  PLAN_LOCKED: "text-amber-400 border-amber-400",
  PLANNING: "text-slate-300 border-slate-500",
  DRAFT: "text-slate-400 border-slate-600",
  CANCELLED: "text-red-400 border-red-400",
};

function formatDateRange(start: string | null, end: string | null) {
  if (!start) return null;
  const s = new Date(start);
  const e = end ? new Date(end) : null;
  const full: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" };
  const short: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  if (!e || start === end) return s.toLocaleDateString([], full);
  return `${s.toLocaleDateString([], short)} – ${e.toLocaleDateString([], full)}`;
}

export function EventReport({
  event,
  budgetSummary,
  checklist,
  checklistItems,
  decisions,
  agentTasks,
}: EventReportProps) {
  const dateRange = formatDateRange(event.startDate, event.endDate);
  const statusLabel = STATUS_LABELS[event.status] ?? event.status;
  const statusColor = STATUS_BADGE[event.status] ?? "text-slate-300 border-slate-500";
  const remaining = budgetSummary.totalEstimated - budgetSummary.totalActual;
  const utilizationPct =
    budgetSummary.totalEstimated > 0
      ? Math.round((budgetSummary.totalActual / budgetSummary.totalEstimated) * 100)
      : 0;

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Export button */}
      <div className="flex justify-end mb-4 print:hidden">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-white text-sm font-medium hover:bg-slate-700 transition-colors"
        >
          <Printer className="w-4 h-4" />
          Export PDF
        </button>
      </div>

      <div
        className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm print:shadow-none print:border-0"
        id="report-body"
      >
        {/* ── DARK HEADER ── */}
        <div className="bg-[#0F1F3D] text-white px-4 sm:px-8 pt-6 pb-8 relative">
          <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-slate-400 mb-2">
            Activation Brief · Event Report
          </p>
          <h1 className="text-2xl sm:text-[2rem] font-bold leading-tight pr-28">{event.title}</h1>

          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs sm:text-sm text-slate-300">
            {dateRange && <span>{dateRange}</span>}
            {event.venueName && (
              <span>
                {event.venueName}
                {event.venueCity && `, ${event.venueCity}`}
                {event.venueState && `, ${event.venueState}`}
              </span>
            )}
            {event.expectedAttendance && (
              <span>{event.expectedAttendance.toLocaleString()} attendees</span>
            )}
          </div>

          {/* Status badge */}
          <span
            className={cn(
              "absolute top-6 right-4 sm:right-7 border px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-semibold whitespace-nowrap",
              statusColor
            )}
          >
            {statusLabel}
          </span>
        </div>

        {/* ── LIGHT BODY ── */}
        <div className="bg-[#F2F4F7] p-3 sm:p-5 space-y-3 sm:space-y-4">

          {/* EVENT DETAILS */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-slate-400 mb-4">
              Event Details
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
              {dateRange && (
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Date</p>
                  <p className="text-sm font-semibold text-slate-800">{dateRange}</p>
                </div>
              )}
              {event.venueName && (
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Venue</p>
                  <p className="text-sm font-semibold text-slate-800">
                    {event.venueName}
                    {event.venueCity && `, ${event.venueCity}`}
                  </p>
                </div>
              )}
              {event.expectedAttendance && (
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Expected attendance</p>
                  <p className="text-sm font-semibold text-slate-800">
                    {event.expectedAttendance.toLocaleString()}
                  </p>
                </div>
              )}
              {event.totalBudget ? (
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Total budget</p>
                  <p className="text-sm font-semibold text-slate-800">
                    {formatCurrency(event.totalBudget)}
                  </p>
                </div>
              ) : null}
            </div>
            {event.description && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs text-slate-400 mb-1">Concept</p>
                <p className="text-sm text-slate-700 leading-relaxed">{event.description}</p>
              </div>
            )}
          </div>

          {/* MILESTONES + BUDGET OVERVIEW — stacks on mobile, 2 col on md+ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {/* Execution Milestones */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-slate-400 mb-4">
                Execution Milestones
              </p>
              {checklistItems && checklistItems.length > 0 ? (
                <div className="space-y-3">
                  {checklistItems.map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div
                        className={cn(
                          "w-2.5 h-2.5 rounded-full mt-[3px] shrink-0",
                          item.isCompleted ? "bg-red-500" : "bg-slate-300"
                        )}
                      />
                      <div>
                        <p
                          className={cn(
                            "text-sm font-medium leading-snug",
                            item.isCompleted ? "text-slate-800" : "text-slate-500"
                          )}
                        >
                          {item.title}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {item.isCompleted
                            ? `Complete${item.dueDate ? ` · ${item.dueDate}` : ""}`
                            : item.dueDate
                            ? item.dueDate
                            : "Upcoming"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "w-2.5 h-2.5 rounded-full mt-[3px] shrink-0",
                      checklist.pct >= 100 ? "bg-red-500" : "bg-slate-300"
                    )}
                  />
                  <div>
                    <p className="text-sm font-medium text-slate-700">Checklist progress</p>
                    <p className="text-xs text-slate-400">
                      {checklist.completed} of {checklist.total} complete
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Budget as KPI bars */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-slate-400 mb-4">
                Budget Overview
              </p>
              {budgetSummary.items.length > 0 ? (
                <div className="space-y-3.5">
                  {budgetSummary.items.slice(0, 6).map((item, i) => {
                    const pct =
                      item.estimated > 0
                        ? Math.min(100, ((item.actual ?? 0) / item.estimated) * 100)
                        : 0;
                    return (
                      <div key={i}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-slate-600 truncate max-w-[55%]">
                            {item.category}
                          </span>
                          <span className="text-slate-700 font-medium tabular-nums">
                            {formatCurrency(item.actual ?? 0)} /{" "}
                            {formatCurrency(item.estimated)}
                          </span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all",
                              pct >= 90 ? "bg-red-500" : "bg-blue-500"
                            )}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-slate-400">No budget items yet</p>
              )}
            </div>
          </div>

          {/* BUDGET SNAPSHOT */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-slate-400 mb-4">
              Budget Snapshot
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Total budget", value: formatCurrency(budgetSummary.totalEstimated) },
                { label: "Spent to date", value: formatCurrency(budgetSummary.totalActual) },
                { label: "Remaining", value: formatCurrency(Math.max(0, remaining)) },
                { label: "Budget utilization", value: `${utilizationPct}%` },
              ].map((stat, i) => (
                <div key={i} className="bg-[#FDF6EE] rounded-xl p-4">
                  <p className="text-lg sm:text-xl font-bold text-red-500">{stat.value}</p>
                  <p className="text-xs text-slate-500 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* KEY DECISIONS */}
          {decisions.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-slate-400 mb-4">
                Key Decisions
              </p>
              <div className="space-y-3">
                {decisions.map((d, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                    <div>
                      <p className="text-sm text-slate-700 leading-snug">{d.content}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {d.author} ·{" "}
                        {new Date(d.createdAt).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI AGENT ACTIVITY LOG */}
          {agentTasks.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-slate-400 mb-4">
                AI Agent Activity Log
              </p>
              <div className="space-y-3">
                {agentTasks.slice(0, 6).map((t, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div
                      className={cn(
                        "w-2 h-2 rounded-full mt-1.5 shrink-0",
                        i < 2 ? "bg-red-500" : "bg-slate-300"
                      )}
                    />
                    <div>
                      <p className="text-sm text-slate-700 leading-snug">{t.prompt}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {new Date(t.createdAt).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                        {t.result && " · via AI agent"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #report-body, #report-body * { visibility: visible; }
          #report-body { position: absolute; left: 0; top: 0; width: 100%; border-radius: 0; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
}
