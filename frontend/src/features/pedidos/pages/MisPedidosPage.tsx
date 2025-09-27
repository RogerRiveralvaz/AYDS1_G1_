import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { fetchPedidos } from "../../../api/pedidos.api";
import type { PedidoResumen } from "../../../api/pedidos.api";
import { queryKeys } from "../../../api/queryKeys";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { FilterBar } from "../../../components/ui/FilterBar";
import { Paginator } from "../../../components/ui/Paginator";
import { SearchInput } from "../../../components/ui/SearchInput";
import { formatCurrency, formatDateTime } from "../../../utils/format";

type PedidosQueryData = Awaited<ReturnType<typeof fetchPedidos>>;
const DEFAULT_META: PedidosQueryData["meta"] = { total: 0, page: 1, per_page: 10 };

const ESTADOS = [
  { codigo: "PENDING", label: "Pendiente" },
  { codigo: "PREPARING", label: "En preparacion" },
  { codigo: "READY", label: "Listo para entrega" },
  { codigo: "ON_ROUTE", label: "En camino" },
  { codigo: "DELIVERED", label: "Entregado" },
  { codigo: "CANCELLED", label: "Cancelado" },
];

function getEstadoBadge(codigo: string) {
  switch (codigo) {
    case "DELIVERED":
      return { variant: "success", text: "Entregado" };
    case "ON_ROUTE":
      return { variant: "info", text: "En camino" };
    case "READY":
      return { variant: "info", text: "Listo" };
    case "PREPARING":
      return { variant: "info", text: "Preparando" };
    case "CANCELLED":
      return { variant: "danger", text: "Cancelado" };
    default:
      return { variant: "warning", text: "Pendiente" };
  }
}

export default function MisPedidosPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const estado = params.get("estado") ?? "";
  const search = params.get("q") ?? "";
  const page = Number(params.get("page") ?? "1");

  const query = useQuery<PedidosQueryData>({
    queryKey: queryKeys.pedidos.list({ estado, search, page }),
    queryFn: () => fetchPedidos({ estado, q: search, page }),
    placeholderData: (previousData) => previousData,
  });

  const pedidos: PedidoResumen[] = query.data?.data ?? [];
  const meta = query.data?.meta ?? DEFAULT_META;

  const handleParamChange = (key: string, value: string | undefined) => {
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

  const hasResults = pedidos.length > 0;

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Mis pedidos</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">Consulta tus pedidos por estado, fecha o referencia y revisa el detalle completo.</p>
      </header>

      <FilterBar
        onReset={() => {
          const next = new URLSearchParams();
          setParams(next, { replace: true });
        }}
      >
        <SearchInput
          defaultValue={search}
          placeholder="Buscar por numero de pedido"
          onSearch={(value) => handleParamChange("q", value)}
        />
        <select
          value={estado}
          onChange={(event) => handleParamChange("estado", event.target.value || undefined)}
          className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
        >
          <option value="">Todos los estados</option>
          {ESTADOS.map((option) => (
            <option key={option.codigo} value={option.codigo}>
              {option.label}
            </option>
          ))}
        </select>
      </FilterBar>

      <div className="overflow-hidden rounded-lg border border-slate-200 shadow-sm dark:border-slate-800">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
          <thead className="bg-slate-50 dark:bg-slate-900">
            <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">Pedido</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Tienda</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white text-sm dark:divide-slate-800 dark:bg-slate-900">
            {query.isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">Cargando pedidos...</td>
              </tr>
            ) : null}
            {!query.isLoading && !hasResults ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">No encontramos pedidos con esos filtros.</td>
              </tr>
            ) : null}
            {pedidos.map((pedido) => {
              const estadoBadge = getEstadoBadge(pedido.codigo_estado);
              return (
                <tr key={pedido.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">#{pedido.id}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{formatDateTime(pedido.creado_en)}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{pedido.tienda?.nombre ?? "Sin tienda"}</td>
                  <td className="px-4 py-3">
                    <Badge variant={estadoBadge.variant as never}>{estadoBadge.text}</Badge>
                  </td>
                  <td className="px-4 py-3 font-medium">{formatCurrency(pedido.total)}</td>
                  <td className="px-4 py-3 text-right">
                    <Button size="sm" variant="outline" onClick={() => navigate(`/app/cliente/pedidos/${pedido.id}`)}>
                      Ver detalle
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Paginator
        page={meta.page}
        perPage={meta.per_page}
        total={meta.total}
        onPageChange={(newPage) => handleParamChange("page", String(newPage))}
      />
    </section>
  );
}
