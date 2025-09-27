import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Legend,
} from "recharts";

import { fetchAdminResumen } from "../../../api/admin.api";
import { queryKeys } from "../../../api/queryKeys";
import { Skeleton } from "../../../components/ui/Skeleton";
import { Select } from "../../../components/ui/Select";
import { Input } from "../../../components/ui/Input";
import { formatCurrency } from "../../../utils/format";

const RANGE_OPTIONS = [
  { value: "7", label: "Ultimos 7 dias" },
  { value: "14", label: "Ultimos 14 dias" },
  { value: "30", label: "Ultimos 30 dias" },
];

const METRIC_SKELETON_KEYS = [
  "metric-skeleton-1",
  "metric-skeleton-2",
  "metric-skeleton-3",
  "metric-skeleton-4",
  "metric-skeleton-5",
  "metric-skeleton-6",
];

export default function AdminPanelPage() {
  const [daysRange, setDaysRange] = useState("7");
  const [searchTop, setSearchTop] = useState("");

  const resumenQuery = useQuery({
    queryKey: queryKeys.admin.resumen,
    queryFn: fetchAdminResumen,
    staleTime: 1000 * 60,
  });

  const resumen = resumenQuery.data;
  const isLoading = resumenQuery.isLoading;

  const metrics = useMemo(() => {
    if (!resumen) {
      return [] as Array<{ title: string; value: string }>;
    }
    return [
      { title: "Pedidos hoy", value: String(resumen.pedidos_hoy ?? 0) },
      { title: "Pedidos totales", value: String(resumen.pedidos_totales ?? 0) },
      { title: "Ingresos", value: formatCurrency(resumen.ingresos_totales ?? 0) },
      { title: "Tiendas activas", value: String(resumen.tiendas_activas ?? 0) },
      { title: "Repartidores activos", value: String(resumen.repartidores_activos ?? 0) },
      { title: "Tiendas pendientes", value: String(resumen.tiendas_pendientes ?? 0) },
    ];
  }, [resumen]);

  const pedidosData = useMemo(() => {
    if (!resumen) {
      return [] as Array<{ fecha: string; total: number }>;
    }
    const limite = Number(daysRange);
    const items = resumen.pedidos_por_dia ?? [];
    return items
      .slice(-limite)
      .map((item) => ({ fecha: item.fecha, total: item.total }));
  }, [resumen, daysRange]);

  const topTiendas = useMemo(() => {
    if (!resumen) {
      return [] as Array<{ tienda: string; ingresos: number }>;
    }
    const query = searchTop.trim().toLowerCase();
    return (resumen.top_tiendas ?? [])
      .map((item) => ({
        tienda: item.tienda ?? "",
        ingresos: Number(item.ingresos ?? 0),
      }))
      .filter((item) => (query ? item.tienda.toLowerCase().includes(query) : true));
  }, [resumen, searchTop]);

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Resumen general</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Monitorea las metricas clave de la plataforma y revisa tendencias de pedidos e ingresos.
        </p>
      </header>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {METRIC_SKELETON_KEYS.map((key) => (
            <Skeleton key={key} className="h-24 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {metrics.map((metric) => (
            <MetricCard key={metric.title} title={metric.title} value={metric.value} />
          ))}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Pedidos por dia</h2>
              <p className="text-xs text-slate-500">
                Visualiza el ritmo de pedidos confirmados en el periodo seleccionado.
              </p>
            </div>
            <Select value={daysRange} onChange={(event) => setDaysRange(event.target.value)}>
              {RANGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="h-80">
            {isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer>
                <LineChart data={pedidosData} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="fecha" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="total" stroke="#2563eb" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Top tiendas por ingresos</h2>
              <p className="text-xs text-slate-500">Filtra por nombre para analizar tiendas especificas.</p>
            </div>
            <Input
              value={searchTop}
              onChange={(event) => setSearchTop(event.target.value)}
              placeholder="Buscar tienda"
              className="h-9 w-40"
            />
          </div>
          <div className="h-80">
            {isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer>
                <BarChart data={topTiendas} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="tienda" tick={{ fontSize: 12 }} interval={0} angle={-25} textAnchor="end" height={70} />
                  <YAxis tickFormatter={formatCurrencyTick} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="ingresos" fill="#22c55e" name="Ingresos" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function formatCurrencyTick(value: number) {
  if (value >= 1_000_000) {
    return `Q${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `Q${(value / 1_000).toFixed(1)}K`;
  }
  return `Q${value.toFixed(0)}`;
}


type MetricCardProps = Readonly<{ title: string; value: string }>;

function MetricCard({ title, value }: MetricCardProps) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</h2>
      <p className="mt-3 text-2xl font-semibold text-slate-900 dark:text-slate-100">{value}</p>
    </article>
  );
}
