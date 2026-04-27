"use client";

import { useState } from "react";
import { CheckSquare, DollarSign, Building2, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ParsedItem {
  id: string;
  type: "checklist" | "budget" | "vendor";
  label: string;
  // checklist
  title?: string;
  category?: string;
  // budget
  description?: string;
  estimated?: number;
  // vendor
  vendorName?: string;
}

interface AddToPlanModalProps {
  items: ParsedItem[];
  onConfirm: (selected: ParsedItem[]) => Promise<void>;
  onClose: () => void;
}

const TYPE_META = {
  checklist: { icon: CheckSquare, color: "text-brand-blue", bg: "bg-blue-50", label: "Checklist Item" },
  budget: { icon: DollarSign, color: "text-green-600", bg: "bg-green-50", label: "Budget Item" },
  vendor: { icon: Building2, color: "text-orange-600", bg: "bg-orange-50", label: "Vendor" },
};

export function AddToPlanModal({ items, onConfirm, onClose }: AddToPlanModalProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set(items.map((i) => i.id)));
  const [applying, setApplying] = useState(false);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  }

  async function handleConfirm() {
    setApplying(true);
    await onConfirm(items.filter((i) => selected.has(i.id)));
    setApplying(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">Add to Plan</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Review and select items to import from the agent&apos;s response
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {items.map((item) => {
            const meta = TYPE_META[item.type];
            const Icon = meta.icon;
            const isSelected = selected.has(item.id);

            return (
              <button
                key={item.id}
                onClick={() => toggle(item.id)}
                className={cn(
                  "w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all",
                  isSelected
                    ? "border-purple-200 bg-purple-50"
                    : "border-slate-200 bg-white hover:border-slate-300"
                )}
              >
                <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5", meta.bg)}>
                  <Icon className={cn("w-3.5 h-3.5", meta.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <span className={cn("text-xs font-medium", meta.color)}>{meta.label}</span>
                  <p className="text-sm text-slate-800 mt-0.5 leading-snug">{item.label}</p>
                  {item.estimated !== undefined && (
                    <p className="text-xs text-slate-500 mt-0.5">${item.estimated.toLocaleString()}</p>
                  )}
                </div>
                <div className={cn(
                  "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all",
                  isSelected ? "border-purple-500 bg-purple-500" : "border-slate-300"
                )}>
                  {isSelected && <Check className="w-3 h-3 text-white" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-slate-200">
          <span className="text-xs text-slate-500">{selected.size} of {items.length} selected</span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={selected.size === 0 || applying}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                selected.size > 0 && !applying
                  ? "bg-purple-600 text-white hover:bg-purple-700"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed"
              )}
            >
              {applying ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Applying…
                </>
              ) : (
                "Add to Plan"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
