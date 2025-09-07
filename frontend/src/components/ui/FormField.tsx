import type { ReactNode } from "react";

import { cn } from "../../utils/cn";

interface FormFieldProps {
  label: string;
  description?: ReactNode;
  error?: ReactNode;
  children: ReactNode;
  required?: boolean;
  className?: string;
}

export function FormField({ label, description, error, children, required, className }: FormFieldProps) {
  return (
    <div className={cn("space-y-1", className)}>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
        {label}
        {required ? <span className="ml-1 text-red-500">*</span> : null}
      </label>
      {description ? <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p> : null}
      <div className="mt-1">{children}</div>
      {error ? <p className="text-xs text-red-500">{error}</p> : null}
    </div>
  );
}
