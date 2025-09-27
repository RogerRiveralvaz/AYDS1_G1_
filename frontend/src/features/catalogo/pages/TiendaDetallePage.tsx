import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { fetchTiendaDetalle } from "../../../api/catalogo.api";
import { queryKeys } from "../../../api/queryKeys";
import { Button } from "../../../components/ui/Button";
import { Skeleton } from "../../../components/ui/Skeleton";
import { ProductCard, ProductCardSkeleton } from "../components/ProductCard";

export default function TiendaDetallePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const tiendaId = Number(id);

  const query = useQuery({
    queryKey: queryKeys.catalogo.tiendas.detail(tiendaId),
    enabled: Number.isFinite(tiendaId),
    queryFn: () => fetchTiendaDetalle(tiendaId),
  });

  const tienda = query.data;
  const categorias = useMemo(() => Object.entries(tienda?.productos ?? {}), [tienda?.productos]);

  if (query.isLoading) {
    return <DetalleSkeleton />;
  }

  if (!tienda) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          Volver
        </Button>
        <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700">
          No encontramos la tienda solicitada.
        </div>
      </div>
    );
  }

  return (
    <section aria-labelledby="titulo-tienda" className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-blue-600">Tienda #{tienda.id}</p>
          <h1 id="titulo-tienda" className="text-3xl font-semibold">
            {tienda.nombre}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {tienda.descripcion ?? "Explora los productos disponibles en esta tienda."}
          </p>
          <p className="text-xs text-slate-500">{tienda.ciudad ?? "Ubicacion no disponible"}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-600">
            {tienda.abierto ? "Abierta" : "Cerrada"}
          </span>
          <Button variant="ghost" onClick={() => navigate(-1)}>
            Volver
          </Button>
        </div>
      </div>

      {categorias.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700">
          Esta tienda aun no tiene productos publicados.
        </div>
      ) : null}

      {categorias.map(([categoria, productos]) => (
        <section key={categoria} className="space-y-4">
          <header className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">{categoria}</h2>
            <span className="text-xs text-slate-500">{productos.length} productos</span>
          </header>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {productos.map((producto) => (
              <ProductCard key={producto.id} producto={producto} />
            ))}
          </div>
        </section>
      ))}
    </section>
  );
}

function DetalleSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <ProductCardSkeleton key={`prod-skeleton-${index}`} />
        ))}
      </div>
    </div>
  );
}
