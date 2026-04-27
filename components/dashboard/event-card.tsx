"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { AvatarStack } from "@/components/ui/avatar";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { CalendarDays, MapPin, AlertCircle, Trash2, RotateCcw } from "lucide-react";
import toast from "react-hot-toast";

interface EventCardProps {
  event: {
    id: string;
    title: string;
    status: string;
    startDate: Date | null;
    endDate: Date | null;
    venueName: string | null;
    venueCity: string | null;
    venueState: string | null;
    totalBudget: number | null;
    totalSpent: number;
    owner: { name: string; avatarUrl: string | null };
    members: Array<{ user: { name: string; avatarUrl: string | null } }>;
    nextDeadline: { title: string; dueDate: Date } | null;
    isDeleted?: boolean;
  };
}

const statusAccent: Record<string, { border: string; bar: string }> = {
  DRAFT:        { border: "border-l-slate-400",   bar: "from-slate-400 to-slate-300" },
  PLANNING:     { border: "border-l-[#4A7FD4]",    bar: "from-[#4A7FD4] to-[#7DD3F0]" },
  PLAN_LOCKED:  { border: "border-l-[#2B5CC8]",    bar: "from-[#2B5CC8] to-[#4A7FD4]" },
  IN_EXECUTION: { border: "border-l-emerald-500", bar: "from-emerald-500 to-teal-400" },
  LIVE:         { border: "border-l-emerald-400", bar: "from-emerald-400 to-teal-300" },
  COMPLETED:    { border: "border-l-slate-300",   bar: "from-slate-300 to-slate-200" },
  CANCELLED:    { border: "border-l-red-400",     bar: "from-red-400 to-rose-300" },
};

export function EventCard({ event }: EventCardProps) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const accent = statusAccent[event.status] ?? statusAccent.DRAFT;

  const budgetPct =
    event.totalBudget && event.totalBudget > 0
      ? Math.min((event.totalSpent / event.totalBudget) * 100, 100)
      : 0;

  const isOverBudget = event.totalSpent > (event.totalBudget ?? Infinity);

  const allMembers = [
    event.owner,
    ...event.members.map((m) => m.user),
  ];

  const venue = [event.venueName, event.venueCity, event.venueState]
    .filter(Boolean)
    .join(", ");

  const isDeadlineSoon =
    event.nextDeadline &&
    new Date(event.nextDeadline.dueDate).getTime() - Date.now() <
      3 * 24 * 60 * 60 * 1000;

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    try {
      const res = await fetch(`/api/events/${event.id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      toast.success("Event moved to Deleted");
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Could not delete event: ${msg}`);
      setLoading(false);
      setConfirming(false);
    }
  }

  async function handleRestore(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    try {
      const res = await fetch(`/api/events/${event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deletedAt: null }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      toast.success("Event restored");
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Could not restore event: ${msg}`);
      setLoading(false);
    }
  }

  const cardContent = (
    <div
      className={cn(
        "relative rounded-xl border border-slate-200 border-l-[3px] p-5 h-full flex flex-col",
        "bg-white shadow-sm",
        "transition-all duration-200 group-hover:shadow-md group-hover:-translate-y-0.5",
        event.isDeleted ? "border-l-red-300 opacity-75" : accent.border
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="font-semibold text-slate-900 leading-tight group-hover:text-slate-950 transition-colors">
          {event.title}
        </h3>
        <div className="flex items-center gap-2 shrink-0">
          {!event.isDeleted && <Badge variant="status" value={event.status} />}

          {event.isDeleted ? (
            <button
              onClick={handleRestore}
              disabled={loading}
              className="flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded transition-colors disabled:opacity-60"
            >
              <RotateCcw className="w-3 h-3" />
              {loading ? "Restoring…" : "Restore"}
            </button>
          ) : confirming ? (
            <div
              className="flex items-center gap-1"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
            >
              <button
                onClick={handleDelete}
                disabled={loading}
                className="text-xs font-medium text-white bg-red-500 hover:bg-red-600 px-2 py-0.5 rounded transition-colors disabled:opacity-60"
              >
                {loading ? "Deleting…" : "Delete"}
              </button>
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setConfirming(false); }}
                className="text-xs font-medium text-slate-500 hover:text-slate-700 px-1 py-0.5 rounded transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setConfirming(true); }}
              className="opacity-0 group-hover:opacity-100 p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
              aria-label="Delete event"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Date & Venue */}
      <div className="space-y-1.5 mb-4 flex-1">
        {(event.startDate || event.endDate) && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <CalendarDays className="w-3.5 h-3.5 shrink-0 text-slate-400" />
            <span>
              {event.startDate && event.endDate
                ? `${formatDate(event.startDate)} – ${formatDate(event.endDate)}`
                : formatDate(event.startDate ?? event.endDate)}
            </span>
          </div>
        )}
        {venue && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
            <span className="truncate">{venue}</span>
          </div>
        )}
      </div>

      {/* Budget progress */}
      {event.totalBudget != null && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-500">Budget</span>
            <span className={`font-medium ${isOverBudget ? "text-red-600" : "text-slate-700"}`}>
              {formatCurrency(event.totalSpent)} / {formatCurrency(event.totalBudget)}
            </span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all bg-gradient-to-r",
                isOverBudget
                  ? "from-red-500 to-rose-400"
                  : budgetPct > 80
                  ? "from-amber-500 to-yellow-400"
                  : accent.bar
              )}
              style={{ width: `${budgetPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <AvatarStack users={allMembers} max={4} size="xs" />

        {event.nextDeadline && (
          <div className={`flex items-center gap-1 text-xs ${isDeadlineSoon ? "text-amber-600" : "text-slate-400"}`}>
            {isDeadlineSoon && <AlertCircle className="w-3 h-3" />}
            <span className="truncate max-w-[140px]">{event.nextDeadline.title}</span>
            <span className="shrink-0">· {formatDate(event.nextDeadline.dueDate)}</span>
          </div>
        )}
      </div>
    </div>
  );

  // Deleted cards are not clickable
  if (event.isDeleted) {
    return <div className="group h-full">{cardContent}</div>;
  }

  return (
    <Link href={`/events/${event.id}`} className="group block h-full">
      {cardContent}
    </Link>
  );
}
