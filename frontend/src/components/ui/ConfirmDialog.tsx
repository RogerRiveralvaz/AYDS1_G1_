import type { ReactNode } from "react";

import { Modal } from "./Modal";
import { Button } from "./Button";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "danger";
  isSubmitting?: boolean;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "default",
  isSubmitting = false,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title}>
      <div className="space-y-6">
        <div className="text-sm text-slate-600 dark:text-slate-300">{description}</div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
            {cancelText}
          </Button>
          <Button
            variant="primary"
            className={
              variant === "danger"
                ? "bg-red-600 text-white hover:bg-red-500 focus-visible:ring-red-500"
                : undefined
            }
            onClick={onConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Procesando..." : confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
