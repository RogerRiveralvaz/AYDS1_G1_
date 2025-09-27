import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { fetchPedidoDetalle } from "../../../api/pedidos.api";
import { queryKeys } from "../../../api/queryKeys";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { Skeleton } from "../../../components/ui/Skeleton";
import { formatCurrency, formatDateTime, formatWeightKg } from "../../../utils/format";

const STATUS_ORDER = ["PENDING", "PREPARING", "READY", "ON_ROUTE", "DELIVERED", "CANCELLED"];

import type { BadgeVariant } from "../../../components/ui/Badge";

function getStatusVariant(code: string): { variant: BadgeVariant; label: string } {
  switch (code) {
    case "DELIVERED":
      return { variant: "success", label: "Entregado" };
    case "ON_ROUTE":
      return { variant: "info", label: "En camino" };
    case "READY":
      return { variant: "info", label: "Listo para entrega" };
    case "PREPARING":
      return { variant: "info", label: "Preparacion" };
    case "CANCELLED":
      return { variant: "danger", label: "Cancelado" };
    default:
      return { variant: "warning", label: "Pendiente" };
  }
}

export default function PedidoDetallePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const pedidoId = Number(id);

  const query = useQuery({
    queryKey: queryKeys.pedidos.detail(pedidoId),
    enabled: Number.isFinite(pedidoId),
    queryFn: () => fetchPedidoDetalle(pedidoId),
    refetchInterval: (data: any) => {
      if (!data) return 10000;
      if (data.codigo_estado === 'DELIVERED' || data.codigo_estado === 'CANCELLED') {
        return false;
      }
      return 10000;
    },
  });

  const pedido = query.data;
  const estadoBadge = pedido ? getStatusVariant(pedido.codigo_estado) : null;
  const timeline = useMemo(() => {
    if (!pedido) return [];
    return [...pedido.historial].sort((a, b) =>
      STATUS_ORDER.indexOf(a.codigo) - STATUS_ORDER.indexOf(b.codigo),
    );
  }, [pedido]);

  if (query.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!pedido) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-slate-600 dark:text-slate-300">No encontramos el pedido solicitado.</p>
        <Button variant="ghost" onClick={() => navigate(-1)}>Volver</Button>
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-blue-600">Pedido #{pedido.id}</p>
          <h1 className="text-2xl font-semibold">Detalle del pedido</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">Creado el {formatDateTime(pedido.creado_en)}</p>
          <p className="text-sm text-slate-500">Direcion: {pedido.direccion_entrega ?? 'No disponible'}</p>
        </div>
        <div className="flex items-center gap-3">
          {estadoBadge ? <Badge variant={estadoBadge.variant}>{estadoBadge.label}</Badge> : null}
          <Button variant="ghost" onClick={() => query.refetch()} disabled={query.isFetching}>
            {query.isFetching ? 'Actualizando...' : 'Actualizar'}
          </Button>
          <Button variant="outline" onClick={() => navigate('/app/cliente/pedidos')}>Volver a pedidos</Button>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-semibold">Articulos</h2>
          <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
            <thead className="bg-slate-50 dark:bg-slate-900">
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3">Cantidad</th>
                <th className="px-4 py-3">Precio</th>
                <th className="px-4 py-3">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {pedido.items.map((item) => (
                <tr key={item.id} className="bg-white dark:bg-slate-900">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{item.nombre}</td>
                  <td className="px-4 py-3">{item.cantidad}</td>
                  <td className="px-4 py-3">{formatCurrency(item.precio_unitario)}</td>
                  <td className="px-4 py-3 font-medium">{formatCurrency(item.total_linea)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <aside className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-semibold">Resumen</h2>
          <dl className="space-y-2 text-sm">
            <ResumenRow label="Tienda" value={pedido.tienda?.nombre ?? 'No disponible'} />
            <ResumenRow label="Peso total" value={formatWeightKg(pedido.peso_total)} />
            <ResumenRow label="Subtotal" value={formatCurrency(pedido.subtotal)} />
            <ResumenRow label="Envio" value={formatCurrency(pedido.envio)} />
            <ResumenRow label="Total" value={formatCurrency(pedido.total)} highlight />
          </dl>
          {pedido.notas ? (
            <div className="rounded-md bg-slate-50 p-3 text-sm text-slate-600 dark:bg-slate-800/60 dark:text-slate-200">
              <p className="font-medium">Notas del cliente</p>
              <p>{pedido.notas}</p>
            </div>
          ) : null}
        </aside>
      </div>

      <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-lg font-semibold">Seguimiento</h2>
        <ol className="relative border-l border-slate-200 pl-6 dark:border-slate-700">
          {timeline.map((entrada) => {
            const badge = getStatusVariant(entrada.codigo);
            return (
              <li key={`${entrada.codigo}-${entrada.cambiado_en}`} className="mb-6 last:mb-0">
                <span className="absolute -left-[7px] h-3 w-3 rounded-full bg-blue-500" aria-hidden />
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Badge variant={badge.variant}>{badge.label}</Badge>
                  <span className="text-xs text-slate-500">{formatDateTime(entrada.cambiado_en)}</span>
                </div>
                {entrada.nota ? <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{entrada.nota}</p> : null}
              </li>
            );
          })}
        </ol>
      </section>
    </section>
  );
}

function ResumenRow({ label, value, highlight }: Readonly<{ label: string; value: string; highlight?: boolean }>) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500">{label}</span>
      <span className={highlight ? "text-lg font-semibold text-slate-900 dark:text-slate-100" : "font-medium"}>{value}</span>
    </div>
  );
}
