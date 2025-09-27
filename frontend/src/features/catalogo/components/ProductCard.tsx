import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { Producto } from "../../../api/catalogo.api";
import { agregarProductoAlCarrito } from "../../../api/carrito.api";
import { queryKeys } from "../../../api/queryKeys";
import { Button } from "../../../components/ui/Button";
import { Skeleton } from "../../../components/ui/Skeleton";
import { useToast } from "../../../hooks/useToast";
import { formatCurrency, formatWeightKg } from "../../../utils/format";

interface ProductCardProps {
  producto: Producto;
}

export function ProductCard({ producto }: ProductCardProps) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [cantidad, setCantidad] = useState(1);
  const principalImagen = producto.imagenes?.find((imagen) => imagen.principal) ?? producto.imagenes?.[0];

  const mutation = useMutation({
    mutationFn: () => agregarProductoAlCarrito({ id_producto: producto.id, cantidad }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.carrito.root });
      toast.show(`${producto.nombre} agregado al carrito`, "success");
    },
    onError: (error: unknown) => {
      console.error(error);
      toast.show("No se pudo agregar el producto", "error");
    },
  });

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <figure className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
        {principalImagen ? (
          <img
            src={principalImagen.url}
            alt={`Imagen de ${producto.nombre}`}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs font-medium uppercase tracking-wide text-slate-500">
            Sin imagen
          </div>
        )}
      </figure>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <header className="space-y-1">
          <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100">{producto.nombre}</h4>
          <p className="text-xs text-slate-500">{formatWeightKg(producto.peso_kg)}</p>
        </header>
        {producto.descripcion ? (
          <p className="text-sm text-slate-600 dark:text-slate-300">{producto.descripcion}</p>
        ) : null}
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {formatCurrency(producto.precio)}
          </span>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              value={cantidad}
              onChange={(event) => {
                const next = Number(event.target.value);
                setCantidad(Number.isFinite(next) && next > 0 ? next : 1);
              }}
              className="h-9 w-16 rounded-md border border-slate-300 bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-900"
              aria-label={`Cantidad para ${producto.nombre}`}
            />
            <Button size="sm" disabled={mutation.isPending} onClick={() => mutation.mutate()}>
              {mutation.isPending ? "Agregando" : "Agregar"}
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <Skeleton className="aspect-[4/3] w-full" />
      <div className="flex flex-1 flex-col gap-3 p-5">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-12 w-full" />
        <div className="mt-auto flex items-center justify-between pt-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>
    </div>
  );
}
