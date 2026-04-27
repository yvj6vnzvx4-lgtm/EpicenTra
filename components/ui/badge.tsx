import { cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
  DRAFT:        "bg-slate-100 text-slate-600 border-slate-200",
  PLANNING:     "bg-[#EEF3FF] text-[#2B5CC8] border-[#2B5CC8]/20",
  PLAN_LOCKED:  "bg-[#EEF3FF] text-[#1E4BAF] border-[#1E4BAF]/30",
  IN_EXECUTION: "bg-amber-100 text-amber-700 border-amber-200",
  LIVE:         "bg-emerald-100 text-emerald-700 border-emerald-200",
  COMPLETED:    "bg-emerald-50 text-emerald-600 border-emerald-200",
  CANCELLED:    "bg-red-100 text-red-700 border-red-200",
};

const statusLabels: Record<string, string> = {
  DRAFT: "Draft",
  PLANNING: "Planning",
  PLAN_LOCKED: "Plan Locked",
  IN_EXECUTION: "In Execution",
  LIVE: "Live",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const roleColors: Record<string, string> = {
  ADMIN:       "bg-[#F47B5A]/10 text-[#F47B5A] border-[#F47B5A]/20",
  DIRECTOR:    "bg-[#EEF3FF] text-[#2B5CC8] border-[#2B5CC8]/20",
  MANAGER:     "bg-[#7DD3F0]/10 text-[#1E4BAF] border-[#7DD3F0]/30",
  COORDINATOR: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

interface BadgeProps {
  variant?: "status" | "role" | "default";
  value: string;
  className?: string;
}

export function Badge({ variant = "default", value, className }: BadgeProps) {
  let colorClass = "bg-navy-700/30 text-slate-300 border-navy-700";
  let label = value;

  if (variant === "status") {
    colorClass = statusColors[value] ?? colorClass;
    label = statusLabels[value] ?? value;
  } else if (variant === "role") {
    colorClass = roleColors[value] ?? colorClass;
  }

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border",
        colorClass,
        className
      )}
    >
      {label}
    </span>
  );
}
