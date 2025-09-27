import { useMemo } from "react";
import type { ImgHTMLAttributes } from "react";

import { cn } from "../../utils/cn";

export type AvatarProps = ImgHTMLAttributes<HTMLImageElement> & {
  name?: string;
  size?: "sm" | "md" | "lg";
};

const sizes = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-base",
};

export function Avatar({ src, alt, name, size = "md", className, ...props }: AvatarProps) {
  const initials = useMemo(() => {
    if (name) {
      const [first, second] = name.trim().split(/\s+/);
      return (first?.[0] ?? "").concat(second?.[0] ?? "").toUpperCase();
    }
    return "?";
  }, [name]);

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-200",
        sizes[size],
        className,
      )}
    >
      {src ? (
        <img
          src={src}
          alt={alt ?? name ?? "Avatar"}
          className="h-full w-full rounded-full object-cover"
          {...props}
        />
      ) : (
        <span aria-hidden>{initials || "?"}</span>
      )}
      <span className="sr-only">{name ?? alt ?? "Usuario"}</span>
    </span>
  );
}
