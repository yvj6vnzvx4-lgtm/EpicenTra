"use client";

import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { Avatar } from "@/components/ui/avatar";
import { Bell, ChevronDown, LogOut, User, Search, Menu } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";

const breadcrumbMap: Record<string, string> = {
  dashboard: "Dashboard",
  strategy: "Strategy Studio",
  events: "Events",
  analytics: "Analytics",
  settings: "Settings",
  new: "New Event",
  specs: "Specifications",
  design: "Space Design",
  agent: "Agent Tasks",
  notes: "Notes",
  execution: "Execution",
  report: "Report",
};

function useBreadcrumbs(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  const crumbs = segments
    .map((seg, i) => ({
      label: breadcrumbMap[seg],
      href: "/" + segments.slice(0, i + 1).join("/"),
    }))
    .filter((c) => c.label !== undefined) as { label: string; href: string }[];
  return crumbs.map((c, i) => ({ ...c, isLast: i === crumbs.length - 1 }));
}

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const breadcrumbs = useBreadcrumbs(pathname);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <header className="h-14 bg-navy-900/80 backdrop-blur border-b border-white/[0.06] flex items-center justify-between px-4 sm:px-6 shrink-0">
      <div className="flex items-center gap-3">
        {/* Mobile hamburger */}
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="sm:hidden w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-white/[0.06] transition-colors"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}

        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1.5 text-sm">
          {breadcrumbs.map((crumb, i) => (
            <span key={crumb.href} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-slate-300">/</span>}
              {crumb.isLast ? (
                <span className="font-semibold text-slate-200 truncate max-w-[160px] sm:max-w-none">
                  {crumb.label}
                </span>
              ) : (
                <Link href={crumb.href} className="text-slate-500 hover:text-slate-300 transition-colors hidden sm:block">
                  {crumb.label}
                </Link>
              )}
            </span>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-2">
        {/* Cmd+K hint — desktop only */}
        <button
          onClick={() => {
            const e = new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true });
            document.dispatchEvent(e);
          }}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/[0.08] text-xs text-slate-500 hover:border-white/[0.15] hover:text-slate-300 transition-colors bg-white/[0.02]"
        >
          <Search className="w-3 h-3" />
          Search
          <kbd className="ml-1 text-[10px] bg-slate-100 px-1 rounded">⌘K</kbd>
        </button>

        {/* Notification bell */}
        <button className="relative w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-brand-coral" />
        </button>

        {/* User dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/[0.06] transition-colors"
          >
            {session?.user && (
              <>
                <Avatar name={session.user.name} avatarUrl={session.user.avatarUrl} size="xs" />
                <span className="hidden sm:block text-sm font-medium text-slate-300">
                  {session.user.name.split(" ")[0]}
                </span>
              </>
            )}
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-navy-800 rounded-xl shadow-2xl border border-white/[0.08] py-1 z-50 animate-fade-in">
              <div className="px-3 py-2 border-b border-white/[0.06]">
                <p className="text-xs font-medium text-slate-200">{session?.user?.name}</p>
                <p className="text-xs text-slate-500">{session?.user?.email}</p>
              </div>
              <Link
                href="/settings"
                onClick={() => setDropdownOpen(false)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-white/[0.06] hover:text-white transition-colors"
              >
                <User className="w-3.5 h-3.5" />
                Profile & Settings
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-brand-red hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
