import { cn } from "../../utils/cn";

type SpinnerProps = {
  className?: string;
  size?: "sm" | "md" | "lg";
};

const sizeMap = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
};

export function Spinner({ className, size = "md" }: SpinnerProps) {
  return (
    <span
      className={cn(
        "inline-block animate-spin rounded-full border-2 border-blue-500 border-r-transparent",
        sizeMap[size],
        className,
      )}
      aria-hidden="true"
    />
  );
}
