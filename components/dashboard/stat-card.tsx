import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  gradient: string;      // e.g. "from-blue-500 to-cyan-400"
  glow: string;          // e.g. "glow-blue"
  sub?: string;
}

const glowStyles: Record<string, string> = {
  "glow-blue":  "0 0 20px rgba(43,92,200,0.30),  0 0 40px rgba(43,92,200,0.12)",
  "glow-cyan":  "0 0 20px rgba(125,211,240,0.30), 0 0 40px rgba(125,211,240,0.12)",
  "glow-coral": "0 0 20px rgba(244,123,90,0.30),  0 0 40px rgba(244,123,90,0.12)",
  "glow-green": "0 0 20px rgba(16,185,129,0.30),  0 0 40px rgba(16,185,129,0.12)",
  "glow-amber": "0 0 20px rgba(245,158,11,0.30),  0 0 40px rgba(245,158,11,0.12)",
};

export function StatCard({ label, value, icon: Icon, gradient, glow, sub }: StatCardProps) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl p-4 sm:p-5 flex items-center gap-3 sm:gap-4 transition-all duration-300 cursor-default",
        "bg-navy-800 border border-white/[0.06]",
        "hover:scale-[1.02]"
      )}
      style={{ boxShadow: glowStyles[glow] }}
    >
      {/* Background gradient blob */}
      <div className={cn(
        "absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-20 blur-2xl bg-gradient-to-br transition-opacity duration-300 group-hover:opacity-30",
        gradient
      )} />

      {/* Icon */}
      <div className={cn(
        "relative w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br",
        gradient
      )}>
        <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
      </div>

      {/* Text */}
      <div className="relative min-w-0">
        <p className="font-display font-black text-xl sm:text-2xl text-white leading-tight tracking-wide truncate">{value}</p>
        <p className="text-xs text-[#6B7A99] mt-0.5 font-medium leading-tight">{label}</p>
        {sub && <p className="text-xs text-[#6B7A99]/70 mt-0.5 hidden sm:block">{sub}</p>}
      </div>
    </div>
  );
}
