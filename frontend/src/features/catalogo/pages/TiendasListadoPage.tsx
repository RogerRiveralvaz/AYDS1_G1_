import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";

import { fetchTiendas, type Tienda } from "../../../api/catalogo.api";
import { queryKeys } from "../../../api/queryKeys";
import { DataTable } from "../../../components/tables/DataTable";
import { Chip } from "../../../components/ui/Chip";
import { FilterBar } from "../../../components/ui/FilterBar";
import { Paginator } from "../../../components/ui/Paginator";
import { SearchInput } from "../../../components/ui/SearchInput";

const PER_PAGE = 10;

export default function TiendasListadoPage() {
  const [search, setSearch] = useState("");
  const [categoria, setCategoria] = useState<string | null>(null);
  const [ciudad, setCiudad] = useState<string | null>(null);
  const [soloAbiertas, setSoloAbiertas] = useState(false);
  const [page, setPage] = useState(1);

  const params = useMemo(
    () => ({
      search: search || undefined,
      categoria: categoria || undefined,
      ciudad: ciudad || undefined,
      abiertas: soloAbiertas || undefined,
      page,
      per_page: PER_PAGE,
    }),
    [search, categoria, ciudad, soloAbiertas, page],
  );

  const query = useQuery({
    queryKey: queryKeys.catalogo.tiendas.list(params),
    queryFn: () => fetchTiendas(params),
    keepPreviousData: true,
  });

  const tiendas = query.data?.data ?? [];
  const meta = query.data?.meta ?? { total: 0, per_page: PER_PAGE, page };

  const categoriasDisponibles = useMemo(() => {
    const set = new Set<string>();
    tiendas.forEach((tienda) => tienda.categorias?.forEach((cat) => set.add(cat)));
    return Array.from(set).sort();
  }, [tiendas]);

  const ciudadesDisponibles = useMemo(() => {
    const set = new Set<string>();
    tiendas.forEach((tienda) => tienda.ciudad && set.add(tienda.ciudad));
    return Array.from(set).sort();
  }, [tiendas]);

  const columns = useMemo<ColumnDef<Tienda>[]>(
    () => [
      {
        header: "Tienda",
        accessorKey: "nombre",
        cell: ({ row }) => (
          <div className="space-y-1">
            <p className="font-medium text-slate-900 dark:text-slate-100">{row.original.nombre}</p>
            <p className="text-xs text-slate-500">{row.original.ciudad ?? "Sin ciudad"}</p>
          </div>
        ),
      },
      {
        header: "Categorias",
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-2">
            {row.original.categorias?.length ? (
              row.original.categorias.map((cat) => (
                <Chip key={cat} asChild>
                  <span className="text-xs">{cat}</span>
                </Chip>
              ))
            ) : (
              <span className="text-xs text-slate-500">Sin categorias</span>
            )}
          </div>
        ),
      },
      {
        header: "Estado",
        accessorKey: "abierto",
        cell: ({ getValue }) => (
          <span className={getValue<boolean>() ? "text-emerald-600" : "text-slate-400"}>
            {getValue<boolean>() ? "Abierta" : "Cerrada"}
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <section aria-labelledby="titulo-tiendas" className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 id="titulo-tiendas" className="text-2xl font-semibold">
            Tiendas disponibles
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Filtra por categoria, ciudad o disponibilidad en tiempo real.
          </p>
        </div>
      </div>

      <FilterBar
        onReset={() => {
          setSearch("");
          setCategoria(null);
          setCiudad(null);
          setSoloAbiertas(false);
          setPage(1);
        }}
      >
        <SearchInput
          defaultValue={search}
          onSearch={(value) => {
            setPage(1);
            setSearch(value);
          }}
          placeholder="Buscar tiendas"
        />
        <select
          value={categoria ?? ""}
          onChange={(event) => {
            setCategoria(event.target.value || null);
            setPage(1);
          }}
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
          value={ciudad ?? ""}
          onChange={(event) => {
            setCiudad(event.target.value || null);
            setPage(1);
          }}
          className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
        >
          <option value="">Ciudad</option>
          {ciudadesDisponibles.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={soloAbiertas}
            onChange={(event) => {
              setSoloAbiertas(event.target.checked);
              setPage(1);
            }}
          />
          Solo abiertas
        </label>
      </FilterBar>

      <DataTable
        data={tiendas}
        columns={columns}
        loading={query.isLoading || query.isFetching}
        emptyState="No encontramos tiendas con estos filtros."
      />

      <Paginator page={meta.page} perPage={meta.per_page} total={meta.total} onPageChange={setPage} />
    </section>
  );
}
