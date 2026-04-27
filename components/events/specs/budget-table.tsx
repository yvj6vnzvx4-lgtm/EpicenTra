"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Plus, ReceiptText, Trash2, Wallet } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

const CATEGORIES = ["venue", "staffing", "materials", "catering", "permits", "av", "misc"];
const STATUSES = ["pending", "approved", "paid"];

interface BudgetItem {
  id: string;
  category: string;
  description: string;
  estimated: number;
  actual: number | null;
  status: string;
  notes: string | null;
}

interface BudgetTableProps {
  eventId: string;
  initialItems: BudgetItem[];
  totalBudget: number | null;
}

const statusStyles: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-sky-50 text-sky-700 border-sky-200",
  paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export function BudgetTable({ eventId, initialItems, totalBudget }: BudgetTableProps) {
  const [items, setItems] = useState<BudgetItem[]>(initialItems);

  async function addItem() {
    const res = await fetch(`/api/events/${eventId}/budget-items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: "misc", description: "New item", estimated: 0 }),
    });
    const item = await res.json();
    setItems((prev) => [...prev, item]);
  }

  async function updateItem(id: string, field: string, value: unknown) {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
    await fetch(`/api/events/${eventId}/budget-items/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
  }

  async function deleteItem(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id));
    await fetch(`/api/events/${eventId}/budget-items/${id}`, { method: "DELETE" });
  }

  const summary = useMemo(() => {
    const totalEstimated = items.reduce((sum, item) => sum + (item.estimated || 0), 0);
    const totalActual = items.reduce((sum, item) => sum + (item.actual ?? item.estimated ?? 0), 0);
    const approvedCount = items.filter((item) => item.status === "approved" || item.status === "paid").length;
    const paidCount = items.filter((item) => item.status === "paid").length;
    const remaining = totalBudget != null ? totalBudget - totalEstimated : null;
    const isOverBudget = totalBudget != null && totalEstimated > totalBudget;

    return {
      totalEstimated,
      totalActual,
      approvedCount,
      paidCount,
      remaining,
      isOverBudget,
    };
  }, [items, totalBudget]);

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={Wallet}
          label="Estimated Spend"
          value={formatCurrency(summary.totalEstimated)}
          hint={`${items.length} budget item${items.length === 1 ? "" : "s"}`}
          tone="sky"
        />
        <SummaryCard
          icon={ReceiptText}
          label="Tracked Actuals"
          value={formatCurrency(summary.totalActual)}
          hint="Uses actuals when provided"
          tone="slate"
        />
        <SummaryCard
          icon={CheckCircle2}
          label="Approved / Paid"
          value={`${summary.approvedCount}/${items.length || 0}`}
          hint={`${summary.paidCount} fully paid`}
          tone="emerald"
        />
        <SummaryCard
          icon={summary.isOverBudget ? AlertTriangle : Wallet}
          label={summary.isOverBudget ? "Budget Risk" : "Budget Remaining"}
          value={
            totalBudget == null
              ? "Set total budget"
              : `${summary.isOverBudget ? "-" : ""}${formatCurrency(Math.abs(summary.remaining ?? 0))}`
          }
          hint={summary.isOverBudget ? "Estimated plan exceeds budget" : "Headroom before lock"}
          tone={summary.isOverBudget ? "amber" : "violet"}
        />
      </div>

      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
            <p className="text-sm font-medium text-slate-600">No budget items yet</p>
            <p className="mt-2 text-sm text-slate-500">
              Start with rough line items for venue, staffing, fabrication, and logistics.
            </p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-slate-300"
            >
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_180px_140px_140px_auto]">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={item.category}
                      onChange={(e) => updateItem(item.id, "category", e.target.value)}
                      className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold capitalize text-slate-600 outline-none transition-colors hover:border-slate-300 focus:border-brand-blue"
                    >
                      {CATEGORIES.map((category) => (
                        <option key={category} value={category} className="capitalize">
                          {category}
                        </option>
                      ))}
                    </select>
                    <span className={`rounded-full border px-3 py-1.5 text-xs font-semibold capitalize ${statusStyles[item.status] ?? "border-slate-200 bg-slate-50 text-slate-600"}`}>
                      {item.status}
                    </span>
                  </div>

                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => updateItem(item.id, "description", e.target.value)}
                    className="w-full border-0 bg-transparent px-0 text-base font-semibold text-slate-900 outline-none placeholder:text-slate-300"
                    placeholder="Describe the expense"
                  />

                  <textarea
                    rows={2}
                    value={item.notes ?? ""}
                    onChange={(e) => updateItem(item.id, "notes", e.target.value || null)}
                    className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 outline-none transition-colors placeholder:text-slate-400 hover:border-slate-300 focus:border-brand-blue"
                    placeholder="What assumption, vendor quote, or approval context should the team remember?"
                  />
                </div>

                <MetricField
                  label="Estimated"
                  value={item.estimated}
                  align="right"
                  onChange={(value) => updateItem(item.id, "estimated", Number(value))}
                />

                <MetricField
                  label="Actual"
                  value={item.actual ?? ""}
                  align="right"
                  placeholder="—"
                  onChange={(value) =>
                    updateItem(item.id, "actual", value ? Number(value) : null)
                  }
                />

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium uppercase tracking-wider text-slate-400">
                    Status
                  </label>
                  <select
                    value={item.status}
                    onChange={(e) => updateItem(item.id, "status", e.target.value)}
                    className="input-base capitalize"
                  >
                    {STATUSES.map((status) => (
                      <option key={status} value={status} className="capitalize">
                        {status}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-start justify-between gap-2 lg:flex-col lg:items-end">
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="rounded-xl border border-slate-200 p-2 text-slate-400 transition-colors hover:border-red-200 hover:text-brand-red"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <div className="rounded-2xl bg-slate-50 px-3 py-2 text-right">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Plan Impact
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {formatCurrency(item.actual ?? item.estimated ?? 0)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <button
        onClick={addItem}
        className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-brand-blue transition-colors hover:border-sky-200 hover:bg-sky-50"
      >
        <Plus className="h-4 w-4" />
        Add Budget Item
      </button>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint: string;
  tone: "sky" | "slate" | "emerald" | "amber" | "violet";
}) {
  const toneClasses: Record<string, string> = {
    sky: "bg-sky-50 text-sky-700 border-sky-200",
    slate: "bg-slate-50 text-slate-700 border-slate-200",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    violet: "bg-violet-50 text-violet-700 border-violet-200",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className={`inline-flex rounded-2xl border p-2 ${toneClasses[tone]}`}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-semibold text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{hint}</p>
    </div>
  );
}

function MetricField({
  label,
  value,
  onChange,
  placeholder,
  align = "left",
}: {
  label: string;
  value: number | string;
  onChange: (value: string) => void;
  placeholder?: string;
  align?: "left" | "right";
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </label>
      <input
        type="number"
        min={0}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`input-base ${align === "right" ? "text-right" : ""}`}
      />
    </div>
  );
}
