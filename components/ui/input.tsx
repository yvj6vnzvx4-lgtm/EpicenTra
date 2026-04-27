import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={id}
            className="text-xs font-medium text-slate-400 uppercase tracking-wider"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            "w-full px-3 py-2 rounded-lg text-sm bg-navy-800 border text-slate-200 placeholder:text-slate-500",
            "focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent transition-all",
            error
              ? "border-brand-red focus:ring-brand-red"
              : "border-navy-700 hover:border-navy-600",
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-brand-red">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
