import { useEffect } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";

import { cn } from "../../utils/cn";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  ariaLabel?: string;
  children: ReactNode;
  className?: string;
}

const modalRoot = typeof document !== "undefined" ? document.body : null;

export function Modal({ isOpen, onClose, title, ariaLabel, children, className }: ModalProps) {
  useEffect(() => {
    if (!isOpen) {
      return;
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !modalRoot) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" aria-hidden onClick={onClose} />
      <dialog
        open
        aria-label={ariaLabel ?? title}
        className={cn(
          "relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-lg focus:outline-none dark:border-slate-700 dark:bg-slate-900",
          className,
        )}
      >
        {title ? <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h2> : null}
        <div className={cn(title ? "mt-4" : undefined)}>{children}</div>
      </dialog>
    </div>,
    modalRoot,
  );
}
