import { forwardRef } from "react";
import type { SelectHTMLAttributes } from "react";

import { cn } from "../../utils/cn";

const baseStyles =
  "block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  hasError?: boolean;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({ className, hasError, ...props }, ref) => {
  return (
    <select
      ref={ref}
      className={cn(
        baseStyles,
        hasError && "border-red-500 focus-visible:ring-red-500 dark:border-red-400",
        className,
      )}
      {...props}
    />
  );
});

Select.displayName = "Select";
