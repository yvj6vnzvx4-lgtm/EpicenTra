"use client";

import { useMemo, useState } from "react";
import { BadgeCheck, CalendarClock, Plus, ShieldCheck, Trash2, Users } from "lucide-react";

interface StaffSlot {
  id: string;
  roleName: string;
  quantity: number;
  startTime: string;
  endTime: string;
  hourlyRate: number | null;
  notes: string | null;
  isFilled: boolean;
}

function formatShift(startTime: string, endTime: string) {
  if (!startTime && !endTime) return "Shift not scheduled";
  const format = (value: string) => {
    if (!value) return "TBD";
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime())
      ? "TBD"
      : parsed.toLocaleString([], {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        });
  };

  return `${format(startTime)} to ${format(endTime)}`;
}

export function StaffTable({ eventId, initialItems }: { eventId: string; initialItems: StaffSlot[] }) {
  const [items, setItems] = useState<StaffSlot[]>(initialItems);

  async function addItem() {
    const res = await fetch(`/api/events/${eventId}/staff-slots`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roleName: "New Role", quantity: 1 }),
    });
    const slot = await res.json();
    setItems((prev) => [...prev, { ...slot, startTime: "", endTime: "" }]);
  }

  async function updateItem(id: string, field: string, value: unknown) {
    setItems((prev) => prev.map((slot) => (slot.id === id ? { ...slot, [field]: value } : slot)));
    await fetch(`/api/events/${eventId}/staff-slots/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value || null }),
    });
  }

  async function deleteItem(id: string) {
    setItems((prev) => prev.filter((slot) => slot.id !== id));
    await fetch(`/api/events/${eventId}/staff-slots/${id}`, { method: "DELETE" });
  }

  const summary = useMemo(() => {
    const totalPeople = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const filledRoles = items.filter((item) => item.isFilled).length;
    const openRoles = items.length - filledRoles;
    const estimatedLaborCost = items.reduce((sum, item) => {
      if (!item.hourlyRate) return sum;
      return sum + item.hourlyRate * item.quantity;
    }, 0);

    return { totalPeople, filledRoles, openRoles, estimatedLaborCost };
  }, [items]);

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StaffSummaryCard icon={Users} label="Total Headcount" value={`${summary.totalPeople}`} hint="Across all listed roles" />
        <StaffSummaryCard icon={BadgeCheck} label="Filled Roles" value={`${summary.filledRoles}`} hint="Roles staffed and ready" />
        <StaffSummaryCard icon={ShieldCheck} label="Open Roles" value={`${summary.openRoles}`} hint="Still needs people assigned" />
        <StaffSummaryCard
          icon={CalendarClock}
          label="Labor Estimate"
          value={summary.estimatedLaborCost ? `$${summary.estimatedLaborCost.toLocaleString()}` : "Add hourly rates"}
          hint="Simple quantity x hourly rate view"
        />
      </div>

      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
            <p className="text-sm font-medium text-slate-600">No staffing roles yet</p>
            <p className="mt-2 text-sm text-slate-500">
              Add every role needed across setup, guest experience, and teardown.
            </p>
          </div>
        ) : (
          items.map((slot) => (
            <div
              key={slot.id}
              className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-slate-300"
            >
              <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_220px_220px_auto]">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                      slot.isFilled
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-amber-200 bg-amber-50 text-amber-700"
                    }`}>
                      {slot.isFilled ? "Filled" : "Open"}
                    </span>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">
                      Qty {slot.quantity}
                    </span>
                  </div>

                  <input
                    type="text"
                    value={slot.roleName}
                    onChange={(e) => updateItem(slot.id, "roleName", e.target.value)}
                    className="w-full border-0 bg-transparent px-0 text-base font-semibold text-slate-900 outline-none placeholder:text-slate-300"
                    placeholder="Role name"
                  />

                  <textarea
                    rows={2}
                    value={slot.notes ?? ""}
                    onChange={(e) => updateItem(slot.id, "notes", e.target.value || null)}
                    className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 outline-none transition-colors placeholder:text-slate-400 hover:border-slate-300 focus:border-brand-blue"
                    placeholder="What does this role own during the event? Add notes on responsibilities, handoff points, or staffing gaps."
                  />
                </div>

                <div className="space-y-3">
                  <Field label="Quantity">
                    <input
                      type="number"
                      min={1}
                      value={slot.quantity}
                      onChange={(e) => updateItem(slot.id, "quantity", Number(e.target.value))}
                      className="input-base text-center"
                    />
                  </Field>

                  <Field label="Hourly Rate">
                    <input
                      type="number"
                      min={0}
                      step={0.5}
                      value={slot.hourlyRate ?? ""}
                      placeholder="—"
                      onChange={(e) =>
                        updateItem(slot.id, "hourlyRate", e.target.value ? Number(e.target.value) : null)
                      }
                      className="input-base text-right"
                    />
                  </Field>
                </div>

                <div className="space-y-3">
                  <Field label="Shift Start">
                    <input
                      type="datetime-local"
                      value={slot.startTime}
                      onChange={(e) => updateItem(slot.id, "startTime", e.target.value)}
                      className="input-base text-sm"
                    />
                  </Field>
                  <Field label="Shift End">
                    <input
                      type="datetime-local"
                      value={slot.endTime}
                      onChange={(e) => updateItem(slot.id, "endTime", e.target.value)}
                      className="input-base text-sm"
                    />
                  </Field>
                </div>

                <div className="flex items-start justify-between gap-3 xl:flex-col xl:items-end">
                  <button
                    onClick={() => deleteItem(slot.id)}
                    className="rounded-xl border border-slate-200 p-2 text-slate-400 transition-colors hover:border-red-200 hover:text-brand-red"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>

                  <div className="space-y-3">
                    <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
                      <input
                        type="checkbox"
                        checked={slot.isFilled}
                        onChange={(e) => updateItem(slot.id, "isFilled", e.target.checked)}
                        className="h-4 w-4 rounded accent-brand-green"
                      />
                      Role filled
                    </label>

                    <div className="rounded-2xl bg-slate-50 px-3 py-2 text-right">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Shift Window
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{formatShift(slot.startTime, slot.endTime)}</p>
                    </div>
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
        Add Role
      </button>
    </div>
  );
}

function StaffSummaryCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="inline-flex rounded-2xl border border-slate-200 bg-slate-50 p-2 text-slate-700">
        <Icon className="h-4 w-4" />
      </div>
      <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-semibold text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{hint}</p>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </label>
      {children}
    </div>
  );
}
