"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, CalendarDays, LayoutDashboard, BarChart3, Settings, X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface Event { id: string; title: string; status: string }

interface CommandPaletteProps {
  events: Event[];
  open: boolean;
  onClose: () => void;
}

const STATUS_COLOR: Record<string, string> = {
  DRAFT:        "bg-slate-100 text-slate-500",
  PLANNING:     "bg-[#EEF3FF] text-[#2B5CC8]",
  PLAN_LOCKED:  "bg-[#EEF3FF] text-[#1E4BAF]",
  IN_EXECUTION: "bg-amber-50 text-amber-700",
  LIVE:         "bg-green-50 text-green-700",
  COMPLETED:    "bg-emerald-50 text-emerald-700",
  CANCELLED:    "bg-red-50 text-red-500",
};

const QUICK_LINKS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Strategy Studio", href: "/strategy", icon: Sparkles },
  { label: "All Events", href: "/events", icon: CalendarDays },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function CommandPalette({ events, open, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredEvents = query
    ? events.filter((e) => e.title.toLowerCase().includes(query.toLowerCase())).slice(0, 6)
    : events.slice(0, 5);

  const quickLinks = query ? [] : QUICK_LINKS;
  const totalItems = quickLinks.length + filteredEvents.length;

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => { setSelectedIdx(0); }, [query]);

  function navigate(href: string) {
    router.push(href);
    onClose();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIdx((i) => Math.min(i + 1, totalItems - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIdx((i) => Math.max(i - 1, 0)); }
    if (e.key === "Enter") {
      const allItems = [
        ...quickLinks.map((l) => l.href),
        ...filteredEvents.map((e) => `/events/${e.id}/specs`),
      ];
      if (allItems[selectedIdx]) navigate(allItems[selectedIdx]);
    }
    if (e.key === "Escape") onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search events or navigate…"
            className="flex-1 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none bg-transparent"
          />
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto py-2">
          {/* Quick links */}
          {quickLinks.length > 0 && (
            <div>
              <p className="px-4 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Quick Nav</p>
              {quickLinks.map((link, i) => {
                const Icon = link.icon;
                return (
                  <button
                    key={link.href}
                    onClick={() => navigate(link.href)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors",
                      selectedIdx === i ? "bg-brand-blue/8 text-brand-blue" : "text-slate-700 hover:bg-slate-50"
                    )}
                  >
                    <Icon className="w-4 h-4 text-slate-400" />
                    {link.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Events */}
          {filteredEvents.length > 0 && (
            <div>
              <p className="px-4 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1">
                {query ? "Events" : "Recent Events"}
              </p>
              {filteredEvents.map((event, i) => {
                const idx = quickLinks.length + i;
                return (
                  <button
                    key={event.id}
                    onClick={() => navigate(`/events/${event.id}/specs`)}
                    className={cn(
                      "w-full flex items-center justify-between gap-3 px-4 py-2.5 text-sm text-left transition-colors",
                      selectedIdx === idx ? "bg-brand-blue/8 text-brand-blue" : "text-slate-700 hover:bg-slate-50"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <CalendarDays className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="truncate">{event.title}</span>
                    </div>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full shrink-0", STATUS_COLOR[event.status] ?? "bg-slate-100 text-slate-500")}>
                      {event.status.replace(/_/g, " ")}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {query && filteredEvents.length === 0 && (
            <p className="px-4 py-6 text-sm text-slate-400 text-center">No events found for &ldquo;{query}&rdquo;</p>
          )}
        </div>

        <div className="px-4 py-2.5 border-t border-slate-100 flex items-center gap-3 text-xs text-slate-400">
          <span>↑↓ navigate</span>
          <span>↵ open</span>
          <span>esc close</span>
        </div>
      </div>
    </div>
  );
}
