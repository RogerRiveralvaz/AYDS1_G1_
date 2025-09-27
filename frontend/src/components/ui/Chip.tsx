import { forwardRef } from "react";
import type { ButtonHTMLAttributes, HTMLAttributes } from "react";

import { cn } from "../../utils/cn";

type BaseProps = {
  selected?: boolean;
};

type ChipButtonProps = BaseProps & ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: false };
type ChipSpanProps = BaseProps & HTMLAttributes<HTMLSpanElement> & { asChild: true };

export type ChipProps = ChipButtonProps | ChipSpanProps;

const baseStyles =
  "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2";

export const Chip = forwardRef<HTMLButtonElement | HTMLSpanElement, ChipProps>(
  ({ selected, className, asChild, ...props }, ref) => {
    const classes = cn(
      baseStyles,
      selected
        ? "border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-950/40 dark:text-blue-200"
        : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200",
      className,
    );

    if (asChild) {
      const spanProps = props as HTMLAttributes<HTMLSpanElement>;
      return <span ref={ref as never} className={classes} {...spanProps} />;
    }

    const buttonProps = props as ButtonHTMLAttributes<HTMLButtonElement>;
    return <button ref={ref as never} type="button" className={classes} {...buttonProps} />;
  },
);

Chip.displayName = "Chip";
