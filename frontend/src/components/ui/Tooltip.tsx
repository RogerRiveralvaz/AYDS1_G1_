import type { ReactNode } from "react";

import { cn } from "../../utils/cn";

type TooltipProps = {
  content: ReactNode;
  children: ReactNode;
  className?: string;
  side?: "top" | "bottom" | "left" | "right";
};

const sideStyles: Record<Required<TooltipProps>["side"], string> = {
  top: "bottom-full left-1/2 -translate-x-1/2 -translate-y-2",
  bottom: "top-full left-1/2 -translate-x-1/2 translate-y-2",
  left: "right-full top-1/2 -translate-y-1/2 -translate-x-2",
  right: "left-full top-1/2 -translate-y-1/2 translate-x-2",
};

export function Tooltip({ content, children, side = "top", className }: Readonly<TooltipProps>) {
  return (
    <span className="group relative inline-flex" aria-live="polite">
      {children}
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute z-50 min-w-[8rem] rounded-md border border-slate-200 bg-slate-900 px-3 py-1 text-xs font-medium text-white opacity-0 shadow-md transition focus-within:opacity-100 group-hover:opacity-100 group-focus-visible:opacity-100 dark:border-slate-700",
          sideStyles[side],
          className,
        )}
      >
        {content}
      </span>
    </span>
  );
}
