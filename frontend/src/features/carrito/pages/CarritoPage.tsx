import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "../../../api/queryKeys";
import {
  actualizarCantidadItem,
  eliminarItem,
  fetchCarrito,
  type CarritoItem,
} from "../../../api/carrito.api";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Skeleton } from "../../../components/ui/Skeleton";
import { useToast } from "../../../hooks/useToast";
import { formatCurrency } from "../../../utils/format";

export default function CarritoPage() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const carritoQuery = useQuery({
    queryKey: queryKeys.carrito.root,
    queryFn: fetchCarrito,
  });

  const actualizarCantidad = useMutation({
    mutationFn: ({ id, cantidad }: { id: number; cantidad: number }) => actualizarCantidadItem(id, cantidad),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.carrito.root, data);
      toast.show("Cantidad actualizada", "success");
    },
    onError: () => {
      toast.show("No se pudo actualizar la cantidad", "error");
    },
  });

  const eliminar = useMutation({
    mutationFn: (id: number) => eliminarItem(id),
    onSuccess: (data, id) => {
      queryClient.setQueryData(queryKeys.carrito.root, data);
      const undo = toast.show("Producto eliminado", "info");
      window.setTimeout(() => toast.dismiss(undo), 4000);
    },
    onError: () => {
      toast.show("No se pudo eliminar el producto", "error");
    },
  });

  const resumen = carritoQuery.data;
  const items = resumen?.items ?? [];

  const totals = useMemo(
    () => ({
      subtotal: resumen ? formatCurrency(resumen.subtotal) : "-",
      envio: resumen ? formatCurrency(resumen.envio) : "-",
      total: resumen ? formatCurrency(resumen.total) : "-",
    }),
    [resumen],
  );

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Mi carrito</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Actualiza las cantidades o elimina productos antes de continuar al checkout.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          {carritoQuery.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={`skeleton-${index}`}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                >
                  <Skeleton className="h-16 w-16 rounded-md" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-10 w-24" />
                </div>
              ))}
            </div>
          ) : null}

          {!carritoQuery.isLoading && items.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700">
              Tu carrito esta vacio. Explora las tiendas y añade productos.
            </div>
          ) : null}

          {items.map((item) => (
            <CarritoItemRow
              key={item.id}
              item={item}
              updating={actualizarCantidad.isPending}
              removing={eliminar.isPending}
              onCantidadChange={(cantidad) => actualizarCantidad.mutate({ id: item.id, cantidad })}
              onRemove={() => eliminar.mutate(item.id)}
            />
          ))}
        </div>

        <aside className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-semibold">Resumen</h2>
          <div className="space-y-3 text-sm">
            <ResumenRow label="Subtotal" value={totals.subtotal} />
            <ResumenRow label="Envio estimado" value={totals.envio} />
            <ResumenRow label="Total" value={totals.total} highlight />
          </div>
          <Button
            type="button"
            variant="primary"
            onClick={() => window.location.assign("/app/cliente/checkout")}
            disabled={!items.length}
            className="w-full"
          >
            Ir al checkout
          </Button>
        </aside>
      </div>
    </section>
  );
}

function CarritoItemRow({
  item,
  onCantidadChange,
  onRemove,
  updating,
  removing,
}: {
  item: CarritoItem;
  onCantidadChange: (cantidad: number) => void;
  onRemove: () => void;
  updating: boolean;
  removing: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-medium text-slate-900 dark:text-slate-100">{item.nombre}</p>
        <p className="text-xs text-slate-500">{formatCurrency(item.precio)} · {item.cantidad} unidades</p>
      </div>
      <div className="flex items-center gap-3">
        <label className="text-xs text-slate-500">
          Cantidad
          <Input
            type="number"
            min={1}
            defaultValue={item.cantidad}
            className="mt-1 w-20"
            onBlur={(event) => {
              const value = Number(event.currentTarget.value);
              if (!Number.isNaN(value) && value > 0 && value !== item.cantidad) {
                onCantidadChange(value);
              }
            }}
            disabled={updating}
          />
        </label>
        <Button variant="ghost" onClick={onRemove} disabled={removing}>
          Quitar
        </Button>
      </div>
    </div>
  );
}

function ResumenRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500">{label}</span>
      <span className={highlight ? "text-lg font-semibold text-slate-900 dark:text-slate-100" : "font-medium"}>{value}</span>
    </div>
  );
}
