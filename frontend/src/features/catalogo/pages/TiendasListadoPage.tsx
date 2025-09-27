import { useEffect, useMemo } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchTiendas, fetchTiendaDetalle } from "../../../api/catalogo.api";
import type { Tienda } from "../../../api/catalogo.api";
import { queryKeys } from "../../../api/queryKeys";
import { FilterBar } from "../../../components/ui/FilterBar";
import { Paginator } from "../../../components/ui/Paginator";
import { SearchInput } from "../../../components/ui/SearchInput";
import { Button } from "../../../components/ui/Button";
import { StoreCard, StoreCardSkeleton } from "../components/StoreCard";
import { useToast } from "../../../hooks/useToast";

const PER_PAGE = 12;
const EMPTY_TIENDA_LIST: Tienda[] = [];
const STORE_SKELETON_KEYS = ["store-1", "store-2", "store-3", "store-4", "store-5", "store-6"];

type TiendasQueryData = Awaited<ReturnType<typeof fetchTiendas>>;

export default function TiendasListadoPage() {
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const queryClient = useQueryClient();
  const toast = useToast();

  const search = params.get("q") ?? "";
  const categoria = params.get("categoria") ?? "";
  const ciudad = params.get("ciudad") ?? "";
  const abiertas = params.get("abiertas") === "1";
  const page = Number(params.get("page") ?? "1");

  const filters = useMemo(
    () => ({ search, categoria, ciudad, abiertas, page, per_page: PER_PAGE }),
    [search, categoria, ciudad, abiertas, page],
  );

  const query = useQuery<TiendasQueryData>({
    queryKey: queryKeys.catalogo.tiendas.list(filters),
    queryFn: () => fetchTiendas(filters),
    placeholderData: (previousData) => previousData,
  });

  useEffect(() => {
    if (query.isError) {
      toast.show("No se pudieron cargar las tiendas", "error");
    }
  }, [query.isError, toast]);

  const tiendas = query.data?.data ?? EMPTY_TIENDA_LIST;
  const meta = query.data?.meta ?? { page, per_page: PER_PAGE, total: 0 };

  const categoriasDisponibles = useMemo(() => {
    const set = new Set<string>();
    tiendas.forEach((tienda) => tienda.categorias?.forEach((cat) => set.add(cat)));
    return Array.from(set).sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }));
  }, [tiendas]);

  const ciudadesDisponibles = useMemo(() => {
    const set = new Set<string>();
    tiendas.forEach((tienda) => tienda.ciudad && set.add(tienda.ciudad));
    return Array.from(set).sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }));
  }, [tiendas]);

  const linkBase = location.pathname.startsWith("/app/cliente") ? "/app/cliente/catalogo" : "/catalogo/tiendas";

  const handlePrefetch = (id: number) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.catalogo.tiendas.detail(id),
      queryFn: () => fetchTiendaDetalle(id),
    });
  };

  const updateParam = (key: string, value: string | undefined) => {
    const next = new URLSearchParams(params);
    if (value && value.length > 0) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    if (key !== "page") {
      next.delete("page");
    }
    setParams(next, { replace: true });
  };

  return (
    <section aria-labelledby="titulo-tiendas" className="space-y-6">
      <header className="space-y-2">
        <h1 id="titulo-tiendas" className="text-3xl font-semibold">
          Tiendas disponibles
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Explora tiendas verificadas, filtra por categoria, ciudad o disponibilidad y prefiere las que estan abiertas ahora.
        </p>
      </header>

      <FilterBar
        onReset={() => {
          setParams(new URLSearchParams(), { replace: true });
        }}
      >
        <SearchInput
          defaultValue={search}
          onSearch={(value) => updateParam("q", value)}
          placeholder="Buscar tiendas"
        />

        <select
          value={categoria}
          onChange={(event) => updateParam("categoria", event.target.value || undefined)}
          className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
        >
          <option value="">Categoria</option>
          {categoriasDisponibles.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        <select
          value={ciudad}
          onChange={(event) => updateParam("ciudad", event.target.value || undefined)}
          className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
        >
          <option value="">Ciudad</option>
          {ciudadesDisponibles.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>

        <Button
          type="button"
          variant={abiertas ? "primary" : "outline"}
          onClick={() => updateParam("abiertas", abiertas ? undefined : "1")}
        >
          Solo abiertas
        </Button>
      </FilterBar>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {query.isLoading
          ? STORE_SKELETON_KEYS.map((key) => <StoreCardSkeleton key={key} />)
          : null}
        {!query.isLoading && tiendas.length === 0 ? (
          <div className="col-span-full rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700">
            No encontramos tiendas con estos filtros. Ajusta la busqueda o prueba con otra categoria.
          </div>
        ) : null}
        {tiendas.map((tienda) => (
          <StoreCard
            key={tienda.id}
            tienda={tienda}
            to={`${linkBase}/${tienda.id}`}
            className="cursor-pointer"
            onMouseEnter={() => handlePrefetch(tienda.id)}
            onFocus={() => handlePrefetch(tienda.id)}
          />
        ))}
      </div>

      <Paginator page={meta.page} perPage={meta.per_page} total={meta.total} onPageChange={(value) => updateParam("page", String(value))} />
    </section>
  );
}


