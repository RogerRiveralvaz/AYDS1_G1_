import { Badge, type BadgeVariant } from "./Badge";
import { cn } from "../../utils/cn";

const STATUS_VARIANTS: Record<string, { label: string; variant: BadgeVariant }> = {
  ASIGNADA: { label: "Asignada", variant: "info" },
  ACEPTADA: { label: "Aceptada", variant: "info" },
  EN_CAMINO: { label: "En camino", variant: "warning" },
  ENTREGADA: { label: "Entregada", variant: "success" },
  CANCELADA: { label: "Cancelada", variant: "danger" },
  PENDIENTE: { label: "Pendiente", variant: "warning" },
  CONFIRMADO: { label: "Confirmado", variant: "info" },
  EN_PROCESO: { label: "En proceso", variant: "info" },
  READY: { label: "Listo", variant: "info" },
  ON_ROUTE: { label: "En ruta", variant: "warning" },
  DELIVERED: { label: "Entregado", variant: "success" },
  CANCELLED: { label: "Cancelado", variant: "danger" },
};

export type StatusBadgeProps = Readonly<{
  status?: string | null;
  className?: string;
  fallbackLabel?: string;
}>;

export function StatusBadge({ status, className, fallbackLabel }: StatusBadgeProps) {
  const key = status?.toUpperCase() ?? "";
  const config = STATUS_VARIANTS[key];
  const label = config?.label ?? fallbackLabel ?? (status ? capitalize(status) : "Desconocido");
  const variant = config?.variant ?? "default";
  return (
    <Badge variant={variant} className={cn("capitalize", className)}>
      {label}
    </Badge>
  );
}

function capitalize(value: string) {
  if (!value) {
    return value;
  }
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}
