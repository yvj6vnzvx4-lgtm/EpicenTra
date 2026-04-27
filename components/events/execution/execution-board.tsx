"use client";

import { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  CheckCircle2, Circle, AlertTriangle, Building2,
  DollarSign, Calendar, Bot, TrendingUp, Clock,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

interface Vendor { id: string; vendorName: string; category: string; status: string }
interface BudgetItem { id: string; category: string; description: string; estimated: number; actual: number | null }
interface ChecklistItem { id: string; title: string; category: string | null; isCompleted: boolean; dueDate: string | null }
interface AgentTask { id: string; prompt: string; status: string; result: string | null; createdAt: string }

interface ExecutionBoardProps {
  event: {
    title: string;
    status: string;
    startDate: string | null;
    totalBudget: number | null;
    planLockedAt: string | null;
  };
  vendors: Vendor[];
  budgetItems: BudgetItem[];
  checklist: ChecklistItem[];
  agentTasks: AgentTask[];
}

const VENDOR_STATUSES = ["PENDING", "CONTACTED", "CONFIRMED", "CONTRACTED", "CANCELLED"];
const VENDOR_STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  PENDING:    { label: "Awaiting Contact", color: "text-slate-500",  bg: "bg-slate-100" },
  CONTACTED:  { label: "Contacted",        color: "text-blue-600",   bg: "bg-blue-50" },
  CONFIRMED:  { label: "Confirmed",        color: "text-amber-600",  bg: "bg-amber-50" },
  CONTRACTED: { label: "Contracted",       color: "text-green-600",  bg: "bg-green-50" },
  CANCELLED:  { label: "Cancelled",        color: "text-red-500",    bg: "bg-red-50" },
};

function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const diff = new Date(iso).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function ExecutionBoard({ event, vendors, budgetItems, checklist, agentTasks }: ExecutionBoardProps) {
  const days = daysUntil(event.startDate);

  // Budget totals
  const totalEstimated = budgetItems.reduce((s, i) => s + i.estimated, 0);
  const totalActual = budgetItems.reduce((s, i) => s + (i.actual ?? 0), 0);
  const budgetCap = event.totalBudget ?? totalEstimated;
  const budgetUsedPct = budgetCap > 0 ? Math.min((totalActual / budgetCap) * 100, 100) : 0;

  // Checklist by category
  const checklistByCategory = useMemo(() => {
    const map = new Map<string, { total: number; done: number }>();
    for (const item of checklist) {
      const cat = item.category ?? "General";
      const existing = map.get(cat) ?? { total: 0, done: 0 };
      map.set(cat, { total: existing.total + 1, done: existing.done + (item.isCompleted ? 1 : 0) });
    }
    return Array.from(map.entries()).map(([cat, counts]) => ({ cat, ...counts }));
  }, [checklist]);

  const totalDone = checklist.filter((c) => c.isCompleted).length;
  const totalItems = checklist.length;
  const checklistPct = totalItems > 0 ? Math.round((totalDone / totalItems) * 100) : 0;

  // Overdue items
  const overdue = checklist.filter(
    (c) => !c.isCompleted && c.dueDate && new Date(c.dueDate) < new Date()
  );

  // Simulated activity feed from real data
  const activityFeed = useMemo(() => {
    const entries: { icon: "warn" | "ok" | "bot" | "budget"; message: string; time: string }[] = [];

    for (const item of overdue.slice(0, 3)) {
      const diff = Math.abs(daysUntil(item.dueDate) ?? 0);
      entries.push({
        icon: "warn",
        message: `Flagged: "${item.title}" is overdue by ${diff} day${diff !== 1 ? "s" : ""}`,
        time: item.dueDate!,
      });
    }

    const pendingVendors = vendors.filter((v) => v.status === "PENDING");
    for (const v of pendingVendors.slice(0, 2)) {
      entries.push({
        icon: "bot",
        message: `Reminder: ${v.vendorName} (${v.category}) — no contact made yet`,
        time: new Date().toISOString(),
      });
    }

    for (const item of budgetItems) {
      if (item.actual && item.estimated > 0) {
        const overage = ((item.actual - item.estimated) / item.estimated) * 100;
        if (overage > 15) {
          entries.push({
            icon: "budget",
            message: `Budget alert: ${item.category} is ${Math.round(overage)}% over estimate`,
            time: new Date().toISOString(),
          });
        }
      }
    }

    if (event.planLockedAt) {
      entries.push({
        icon: "ok",
        message: "Plan locked — execution phase started",
        time: event.planLockedAt,
      });
    }

    return entries.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  }, [overdue, vendors, budgetItems, event.planLockedAt]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Status banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-5 text-white flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-indigo-200 uppercase tracking-wide">Execution Mode</p>
          <h2 className="text-xl font-bold mt-0.5">{event.title}</h2>
          {event.planLockedAt && (
            <p className="text-xs text-indigo-200 mt-1">
              Plan locked {new Date(event.planLockedAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
            </p>
          )}
        </div>
        {days !== null && (
          <div className="text-right">
            <p className="text-4xl font-bold">{days < 0 ? Math.abs(days) : days}</p>
            <p className="text-xs text-indigo-200">{days < 0 ? "days ago" : "days until event"}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Checklist progress */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-brand-blue" />
              <h3 className="text-sm font-semibold text-slate-800">Checklist Progress</h3>
            </div>
            <span className="text-sm font-bold text-slate-700">{checklistPct}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 mb-5">
            <div
              className="bg-brand-blue h-2 rounded-full transition-all"
              style={{ width: `${checklistPct}%` }}
            />
          </div>
          <div className="space-y-2.5">
            {checklistByCategory.map(({ cat, total, done }) => (
              <div key={cat} className="flex items-center gap-3">
                <span className="text-xs text-slate-500 w-28 truncate">{cat}</span>
                <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                  <div
                    className="bg-brand-blue h-1.5 rounded-full"
                    style={{ width: `${total > 0 ? (done / total) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-xs text-slate-500 w-12 text-right">{done}/{total}</span>
              </div>
            ))}
            {totalItems === 0 && (
              <p className="text-xs text-slate-400 text-center py-2">No checklist items yet</p>
            )}
          </div>
          {overdue.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-xs font-medium text-red-500 flex items-center gap-1 mb-2">
                <AlertTriangle className="w-3.5 h-3.5" /> {overdue.length} overdue item{overdue.length !== 1 ? "s" : ""}
              </p>
              {overdue.map((item) => (
                <p key={item.id} className="text-xs text-slate-600 flex items-center gap-2 mb-1">
                  <Circle className="w-2.5 h-2.5 text-red-400 shrink-0" />
                  {item.title}
                </p>
              ))}
            </div>
          )}
        </div>

        {/* Days / budget summary */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-4 h-4 text-green-600" />
              <h3 className="text-sm font-semibold text-slate-800">Budget Tracking</h3>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Cap</span>
                <span className="font-medium text-slate-700">{formatCurrency(budgetCap)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Estimated</span>
                <span className="font-medium text-slate-700">{formatCurrency(totalEstimated)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Committed</span>
                <span className={cn("font-medium", totalActual > budgetCap ? "text-red-500" : "text-green-600")}>
                  {formatCurrency(totalActual)}
                </span>
              </div>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3">
              <div
                className={cn("h-1.5 rounded-full transition-all", budgetUsedPct > 90 ? "bg-red-500" : "bg-green-500")}
                style={{ width: `${budgetUsedPct}%` }}
              />
            </div>
            <p className="text-xs text-slate-400 mt-1">{Math.round(budgetUsedPct)}% of budget used</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-purple-600" />
              <h3 className="text-sm font-semibold text-slate-800">Event Date</h3>
            </div>
            {event.startDate ? (
              <p className="text-sm font-semibold text-slate-700">
                {new Date(event.startDate).toLocaleDateString([], { weekday: "short", month: "long", day: "numeric", year: "numeric" })}
              </p>
            ) : (
              <p className="text-xs text-slate-400">No date set</p>
            )}
          </div>
        </div>
      </div>

      {/* Vendor coordination */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="w-4 h-4 text-orange-500" />
          <h3 className="text-sm font-semibold text-slate-800">Vendor Coordination</h3>
          <span className="ml-auto text-xs text-slate-400">{vendors.length} vendor{vendors.length !== 1 ? "s" : ""}</span>
        </div>
        {vendors.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">No vendors added yet</p>
        ) : (
          <div className="space-y-2">
            {vendors.map((v) => {
              const meta = VENDOR_STATUS_META[v.status] ?? VENDOR_STATUS_META.PENDING;
              const stepIdx = VENDOR_STATUSES.indexOf(v.status);
              return (
                <div key={v.id} className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">{v.vendorName}</p>
                    <p className="text-xs text-slate-400">{v.category}</p>
                  </div>
                  {/* Progress steps */}
                  <div className="hidden sm:flex items-center gap-1">
                    {VENDOR_STATUSES.slice(0, 4).map((s, i) => (
                      <div key={s} className="flex items-center gap-1">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          i <= stepIdx ? "bg-green-500" : "bg-slate-200"
                        )} />
                        {i < 3 && <div className={cn("w-4 h-px", i < stepIdx ? "bg-green-500" : "bg-slate-200")} />}
                      </div>
                    ))}
                  </div>
                  <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full shrink-0", meta.bg, meta.color)}>
                    {meta.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Agent activity feed */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Bot className="w-4 h-4 text-purple-600" />
          <h3 className="text-sm font-semibold text-slate-800">Execution Agent Activity</h3>
        </div>

        {activityFeed.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">No activity yet</p>
        ) : (
          <div className="space-y-2.5">
            {activityFeed.map((entry, i) => {
              const iconMap = {
                warn: <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />,
                ok: <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />,
                bot: <Bot className="w-3.5 h-3.5 text-purple-500 shrink-0" />,
                budget: <TrendingUp className="w-3.5 h-3.5 text-amber-500 shrink-0" />,
              };
              return (
                <div key={i} className="flex items-start gap-2.5 text-xs text-slate-600">
                  {iconMap[entry.icon]}
                  <span className="flex-1">{entry.message}</span>
                  <span className="text-slate-400 shrink-0">
                    {new Date(entry.time).toLocaleDateString([], { month: "short", day: "numeric" })}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Completed agent tasks summary */}
        {agentTasks.filter((t) => t.status === "COMPLETED").length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
            <p className="text-xs font-medium text-slate-500 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {agentTasks.filter((t) => t.status === "COMPLETED").length} agent task{agentTasks.filter((t) => t.status === "COMPLETED").length !== 1 ? "s" : ""} completed
            </p>
            {agentTasks
              .filter((t) => t.status === "COMPLETED")
              .slice(0, 3)
              .map((task) => (
                <div key={task.id} className="bg-purple-50 border border-purple-100 rounded-xl p-3">
                  <p className="text-xs font-medium text-purple-800 mb-1.5">{task.prompt}</p>
                  {task.result && (
                    <div className="prose prose-xs max-w-none text-slate-600 prose-p:my-0.5 prose-ul:my-0.5 prose-li:my-0 line-clamp-4">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{task.result}</ReactMarkdown>
                    </div>
                  )}
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
