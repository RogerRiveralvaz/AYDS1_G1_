import type { ReactNode } from "react";
import { Button } from "./Button";

interface FilterBarProps {
  children?: ReactNode;
  onReset?: () => void;
}

export function FilterBar({ children, onReset }: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center gap-3">{children}</div>
      {onReset ? (
        <Button variant="ghost" onClick={onReset} className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-300">
          Limpiar filtros
        </Button>
      ) : null}
    </div>
  );
}
