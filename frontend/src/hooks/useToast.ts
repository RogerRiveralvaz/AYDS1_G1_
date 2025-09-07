import { useCallback } from "react";
import { toast } from "react-hot-toast";

type ToastVariant = "success" | "error" | "info" | "loading";

const variantMap: Record<ToastVariant, (message: string) => string> = {
  success: (message) => toast.success(message),
  error: (message) => toast.error(message),
  info: (message) => toast(message),
  loading: (message) => toast.loading(message),
};

export function useToast() {
  const show = useCallback((message: string, variant: ToastVariant = "info") => {
    const presenter = variantMap[variant] ?? toast;
    return presenter(message);
  }, []);

  return {
    show,
    dismiss: toast.dismiss,
  };
}
