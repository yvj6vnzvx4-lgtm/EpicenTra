import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionCardProps {
  title?: string;
  icon?: ElementType;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  tone?: "default" | "subtle" | "dark";
}

const toneClasses = {
  default: "border border-slate-200 bg-white shadow-sm",
  subtle: "border border-slate-200 bg-slate-50",
  dark: "border border-white/[0.06] bg-navy-800",
};

export function SectionCard({
  title,
  icon: Icon,
  actions,
  children,
  className,
  contentClassName,
  tone = "default",
}: SectionCardProps) {
  return (
    <div className={cn("rounded-2xl p-5", toneClasses[tone], className)}>
      {(title || actions) && (
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            {Icon && <Icon className={cn("h-4 w-4 shrink-0", tone === "dark" ? "text-slate-400" : "text-slate-500")} />}
            {title && (
              <h3 className={cn("text-sm font-semibold", tone === "dark" ? "text-slate-200" : "text-slate-800")}>
                {title}
              </h3>
            )}
          </div>
          {actions}
        </div>
      )}
      <div className={contentClassName}>{children}</div>
    </div>
  );
}
