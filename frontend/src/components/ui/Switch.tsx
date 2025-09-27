import { forwardRef, useId } from "react";
import type { ButtonHTMLAttributes } from "react";

import { cn } from "../../utils/cn";

export type SwitchProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type" | "role" | "onChange"> & {
  checked: boolean;
  onCheckedChange?: (checked: boolean) => void;
  label?: string;
};

export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(
  ({ checked, onCheckedChange, label, className, disabled, ...props }, ref) => {
    const id = useId();
    return (
      <div className={cn("flex items-center gap-2", disabled && "opacity-60")}>
        <button
          {...props}
          ref={ref}
          id={id}
          type="button"
          role="switch"
          aria-checked={checked}
          disabled={disabled}
          onClick={() => onCheckedChange?.(!checked)}
          className={cn(
            "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer items-center rounded-full border border-transparent transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
            checked ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-700",
            className,
          )}
        >
          <span
            aria-hidden
            className={cn(
              "inline-block h-5 w-5 transform rounded-full bg-white shadow transition",
              checked ? "translate-x-5" : "translate-x-1",
            )}
          />
        </button>
        {label ? (
          <label htmlFor={id} className="text-sm text-slate-700 dark:text-slate-200">
            {label}
          </label>
        ) : null}
      </div>
    );
  },
);

Switch.displayName = "Switch";
