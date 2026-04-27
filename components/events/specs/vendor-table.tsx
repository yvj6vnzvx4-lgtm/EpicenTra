"use client";

import { useMemo, useState } from "react";
import { Building2, Mail, Phone, Plus, Trash2, UserRound } from "lucide-react";

const CATEGORIES = ["catering", "av", "staffing", "fabrication", "photography", "venue", "logistics", "misc"];
const STATUSES = ["prospective", "contacted", "confirmed", "contracted"];

interface Vendor {
  id: string;
  vendorName: string;
  category: string;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  status: string;
  cost: number | null;
  notes: string | null;
}

const statusTone: Record<string, string> = {
  prospective: "bg-slate-100 text-slate-600 border-slate-200",
  contacted: "bg-amber-50 text-amber-700 border-amber-200",
  confirmed: "bg-sky-50 text-sky-700 border-sky-200",
  contracted: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export function VendorTable({ eventId, initialItems }: { eventId: string; initialItems: Vendor[] }) {
  const [items, setItems] = useState<Vendor[]>(initialItems);

  async function addItem() {
    const res = await fetch(`/api/events/${eventId}/vendors`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vendorName: "New Vendor", category: "misc" }),
    });
    const vendor = await res.json();
    setItems((prev) => [...prev, vendor]);
  }

  async function updateItem(id: string, field: string, value: unknown) {
    setItems((prev) => prev.map((vendor) => (vendor.id === id ? { ...vendor, [field]: value } : vendor)));
    await fetch(`/api/events/${eventId}/vendors/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
  }

  async function deleteItem(id: string) {
    setItems((prev) => prev.filter((vendor) => vendor.id !== id));
    await fetch(`/api/events/${eventId}/vendors/${id}`, { method: "DELETE" });
  }

  const summary = useMemo(() => {
    const contracted = items.filter((vendor) => vendor.status === "contracted").length;
    const active = items.filter((vendor) => vendor.status === "confirmed" || vendor.status === "contracted").length;
    const estimatedCost = items.reduce((sum, vendor) => sum + (vendor.cost ?? 0), 0);
    return { contracted, active, estimatedCost };
  }, [items]);

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-3">
        <VendorSummaryCard label="Active Vendors" value={`${summary.active}`} hint="Confirmed or contracted" />
        <VendorSummaryCard label="Contracted" value={`${summary.contracted}`} hint="Ready to execute" />
        <VendorSummaryCard
          label="Tracked Vendor Cost"
          value={summary.estimatedCost ? `$${summary.estimatedCost.toLocaleString()}` : "Add cost estimates"}
          hint="Based on entered vendor costs"
        />
      </div>

      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
            <p className="text-sm font-medium text-slate-600">No vendors yet</p>
            <p className="mt-2 text-sm text-slate-500">
              Track each outside partner here so sourcing progress is visible to the whole team.
            </p>
          </div>
        ) : (
          items.map((vendor) => (
            <div
              key={vendor.id}
              className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-slate-300"
            >
              <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_220px_170px_auto]">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={vendor.category}
                      onChange={(e) => updateItem(vendor.id, "category", e.target.value)}
                      className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold capitalize text-slate-600 outline-none transition-colors hover:border-slate-300 focus:border-brand-blue"
                    >
                      {CATEGORIES.map((category) => (
                        <option key={category} value={category} className="capitalize">
                          {category}
                        </option>
                      ))}
                    </select>
                    <span className={`rounded-full border px-3 py-1.5 text-xs font-semibold capitalize ${statusTone[vendor.status] ?? "bg-slate-100 text-slate-600 border-slate-200"}`}>
                      {vendor.status}
                    </span>
                  </div>

                  <input
                    type="text"
                    value={vendor.vendorName}
                    onChange={(e) => updateItem(vendor.id, "vendorName", e.target.value)}
                    className="w-full border-0 bg-transparent px-0 text-base font-semibold text-slate-900 outline-none placeholder:text-slate-300"
                    placeholder="Vendor name"
                  />

                  <textarea
                    rows={2}
                    value={vendor.notes ?? ""}
                    onChange={(e) => updateItem(vendor.id, "notes", e.target.value || null)}
                    className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 outline-none transition-colors placeholder:text-slate-400 hover:border-slate-300 focus:border-brand-blue"
                    placeholder="Capture quote status, decision criteria, lead times, or what is still missing."
                  />
                </div>

                <div className="space-y-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      <UserRound className="h-3.5 w-3.5 text-sky-500" />
                      Contact
                    </div>
                    <input
                      type="text"
                      value={vendor.contactName ?? ""}
                      onChange={(e) => updateItem(vendor.id, "contactName", e.target.value || null)}
                      placeholder="Primary contact"
                      className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition-colors placeholder:text-slate-400 focus:border-brand-blue"
                    />
                    <div className="mt-2 grid gap-2">
                      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
                        <Mail className="h-3.5 w-3.5 text-slate-400" />
                        <input
                          type="email"
                          value={vendor.contactEmail ?? ""}
                          onChange={(e) => updateItem(vendor.id, "contactEmail", e.target.value || null)}
                          placeholder="email@vendor.com"
                          className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                        />
                      </div>
                      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
                        <Phone className="h-3.5 w-3.5 text-slate-400" />
                        <input
                          type="text"
                          value={vendor.contactPhone ?? ""}
                          onChange={(e) => updateItem(vendor.id, "contactPhone", e.target.value || null)}
                          placeholder="Phone number"
                          className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Status
                    </label>
                    <select
                      value={vendor.status}
                      onChange={(e) => updateItem(vendor.id, "status", e.target.value)}
                      className="input-base capitalize"
                    >
                      {STATUSES.map((status) => (
                        <option key={status} value={status} className="capitalize">
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Estimated Cost
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={vendor.cost ?? ""}
                      placeholder="—"
                      onChange={(e) => updateItem(vendor.id, "cost", e.target.value ? Number(e.target.value) : null)}
                      className="input-base text-right"
                    />
                  </div>
                </div>

                <div className="flex items-start justify-between gap-2 xl:flex-col xl:items-end">
                  <button
                    onClick={() => deleteItem(vendor.id)}
                    className="rounded-xl border border-slate-200 p-2 text-slate-400 transition-colors hover:border-red-200 hover:text-brand-red"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <div className="rounded-2xl bg-slate-50 px-3 py-2 text-right">
                    <div className="flex items-center justify-end gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      <Building2 className="h-3.5 w-3.5" />
                      Vendor Stage
                    </div>
                    <p className="mt-1 text-sm font-semibold text-slate-900 capitalize">{vendor.status}</p>
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
        Add Vendor
      </button>
    </div>
  );
}

function VendorSummaryCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-semibold text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{hint}</p>
    </div>
  );
}
