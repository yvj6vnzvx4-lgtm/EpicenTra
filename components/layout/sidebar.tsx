"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import {
  LayoutDashboard, CalendarDays, BarChart3, Settings, Sparkles,
  ChevronLeft, ChevronRight, X,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/strategy", label: "Strategy Studio", icon: Sparkles },
  { href: "/events", label: "Events", icon: CalendarDays },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);

  const navContent = (
    <>
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-5 border-b border-white/[0.06]">
        {/* Logo mark — colored geometric shapes from brand SVG */}
        <svg
          viewBox="0 0 520 521"
          className="w-8 h-8 shrink-0"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M0 181C0 114.726 53.7258 61 120 61H400V61C400 127.274 346.274 181 280 181H0V181Z" fill="#1565C0" fillOpacity="0.9"/>
          <path d="M180 521C113.726 521 60 467.274 60 401L60 121C126.274 121 180 174.726 180 241V521Z" fill="#7CE1FB" fillOpacity="0.9"/>
          <path d="M120 461C120 394.726 173.726 341 240 341H520C520 407.274 466.274 461 400 461H120Z" fill="#5BC5F2" fillOpacity="0.9"/>
          <path d="M460 401C393.726 401 340 347.274 340 281V0C406.274 0 460 53.7258 460 120V401Z" fill="#2089E1" fillOpacity="0.9"/>
          <rect x="335" y="61" width="5" height="120" fill="white" fillOpacity="0.6"/>
          <rect x="180" y="341" width="5" height="120" fill="white" fillOpacity="0.6"/>
          <rect x="60" y="186" width="5" height="120" transform="rotate(-90 60 186)" fill="white" fillOpacity="0.6"/>
          <rect x="340" y="341" width="5" height="120" transform="rotate(-90 340 341)" fill="white" fillOpacity="0.6"/>
        </svg>

        {!collapsed && (
          <span className="font-display font-black tracking-[0.05em] text-lg text-white uppercase">EpicenTra</span>
        )}
        {/* Mobile close */}
        {onMobileClose && (
          <button onClick={onMobileClose} className="ml-auto text-slate-400 hover:text-slate-200 sm:hidden">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onMobileClose}
              className={cn(
                "relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
                isActive
                  ? "bg-brand-blue/20 text-white"
                  : "text-[#6B7A99] hover:text-slate-200 hover:bg-white/[0.05]"
              )}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r bg-brand-blue shadow-[0_0_8px_rgba(43,92,200,0.8)]" />
              )}
              <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-brand-cyan" : "text-[#6B7A99] group-hover:text-slate-300")} />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}

      </nav>

      {/* User profile */}
      {session?.user && (
        <div className="border-t border-white/[0.06] p-3">
          <div className="flex items-center gap-3">
            <Avatar name={session.user.name} avatarUrl={session.user.avatarUrl} size="sm" />
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-200 truncate">{session.user.name}</p>
                <Badge variant="role" value={session.user.role} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Desktop collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="hidden sm:flex absolute -right-3 top-6 w-6 h-6 rounded-full bg-navy-800 border border-navy-700 items-center justify-center text-slate-400 hover:text-slate-200 transition-colors z-10"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "relative hidden sm:flex flex-col h-screen bg-navy-900 border-r border-navy-800 transition-all duration-200 shrink-0",
          collapsed ? "w-16" : "w-60"
        )}
      >
        {navContent}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 sm:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={onMobileClose} />
          <aside className="relative flex flex-col h-screen w-64 bg-navy-900 border-r border-navy-800">
            {navContent}
          </aside>
        </div>
      )}
    </>
  );
}
