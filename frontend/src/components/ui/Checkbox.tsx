import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";

import { cn } from "../../utils/cn";

export type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label?: string;
};

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(({ className, label, ...props }, ref) => {
  return (
    <label className={cn("inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200", className)}>
      <span
        className={cn(
          "relative flex h-4 w-4 items-center justify-center rounded border border-slate-300 bg-white transition focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:border-slate-600 dark:bg-slate-900",
          props.disabled && "opacity-60",
        )}
      >
        <input
          {...props}
          ref={ref}
          type="checkbox"
          className="peer absolute inset-0 h-full w-full cursor-pointer appearance-none"
        />
        <svg
          aria-hidden
          className="pointer-events-none h-3 w-3 text-white opacity-0 transition peer-checked:opacity-100"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="3.5 8.5 6.5 11.5 12.5 5.5" />
        </svg>
        <span className="absolute inset-0 rounded bg-blue-600 opacity-0 transition peer-checked:opacity-100" />
      </span>
      {label ? <span>{label}</span> : null}
    </label>
  );
});

Checkbox.displayName = "Checkbox";
