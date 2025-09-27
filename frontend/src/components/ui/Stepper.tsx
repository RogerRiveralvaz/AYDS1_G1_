import type { ReactNode } from "react";

import { cn } from "../../utils/cn";

type Step = {
  id: string;
  label: string;
  description?: ReactNode;
};

type StepperProps = {
  steps: Step[];
  currentStep: string;
};

export function Stepper({ steps, currentStep }: Readonly<StepperProps>) {
  const currentIndex = steps.findIndex((step) => step.id === currentStep);
  return (
    <ol className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6" aria-label="Progreso del registro">
      {steps.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isActive = index === currentIndex;
        return (
          <li key={step.id} className="flex items-start gap-3">
            <span
              aria-hidden
              className={cn(
                "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold transition",
                isCompleted && "border-blue-500 bg-blue-500 text-white",
                isActive && !isCompleted && "border-blue-500 text-blue-600",
                !isCompleted && !isActive && "border-slate-300 text-slate-500",
              )}
            >
              {isCompleted ? "✓" : index + 1}
            </span>
            <div className="space-y-1">
              <p
                className={cn(
                  "text-sm font-semibold",
                  isActive ? "text-slate-900 dark:text-slate-100" : "text-slate-500",
                )}
              >
                {step.label}
              </p>
              {step.description ? (
                <p className="text-xs text-slate-500 dark:text-slate-400">{step.description}</p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
