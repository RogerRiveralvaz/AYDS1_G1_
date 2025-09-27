import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";

import { cn } from "../../utils/cn";

const baseStyles =
  "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60";

const variants = {
  primary: "bg-blue-600 text-white hover:bg-blue-500 focus-visible:ring-blue-500",
  secondary:
    "bg-slate-800 text-white hover:bg-slate-700 focus-visible:ring-slate-700 dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-slate-100",
  outline:
    "border border-slate-300 bg-transparent text-slate-900 hover:bg-slate-100 focus-visible:ring-slate-300 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800",
  ghost: "bg-transparent text-slate-900 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800",
};

const sizes = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", type = "button", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";
