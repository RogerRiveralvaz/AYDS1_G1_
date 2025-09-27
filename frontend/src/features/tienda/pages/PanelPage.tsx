import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ResponsiveContainer, BarChart, XAxis, Tooltip, Bar, CartesianGrid } from "recharts";

import { queryKeys } from "../../../api/queryKeys";
import { fetchTiendaDashboard } from "../../../api/tiendas.api";
import { formatCurrency } from "../../../utils/format";
import { Skeleton } from "../../../components/ui/Skeleton";

export default function PanelPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.tienda.dashboard,
    queryFn: fetchTiendaDashboard,
    staleTime: 60_000,
  });

  const chartData = useMemo(() => {
    if (!data) {
      return [];
    }
    return [
      { label: "Pedidos", value: data.pedidos_totales },
      { label: "Clientes", value: data.clientes_unicos },
      { label: "Vendidos", value: data.productos_vendidos },
    ];
  }, [data]);

  let chartContent: React.ReactNode;
  if (isLoading) {
    chartContent = (
      <div className="flex h-full items-center justify-center">
        <Skeleton className="h-24 w-full" />
      </div>
    );
  } else if (isError) {
    chartContent = <p className="text-sm text-red-500">No fue posible cargar el resumen. Intenta refrescar la página.</p>;
  } else if (chartData.length === 0) {
    chartContent = (
      <div className="flex h-full flex-col items-center justify-center text-sm text-slate-500 dark:text-slate-400">
        <p>No hay datos suficientes todavía. Recibe tu primer pedido para ver tendencias.</p>
      </div>
    );
  } else {
    chartContent = (
      <ResponsiveContainer>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
          <XAxis dataKey="label" stroke="#64748b" tickLine={false} axisLine={false} />
          <Tooltip
            cursor={{ fill: "rgba(148, 163, 184, 0.1)" }}
            formatter={(value: number) => value.toLocaleString("es-GT")}
          />
          <Bar dataKey="value" fill="#2563eb" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Panel de tienda</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Sigue tus métricas clave en tiempo real y detecta oportunidades para tu catálogo.
        </p>
      </header>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Pedidos totales"
          value={isLoading ? <Skeleton className="h-6 w-12" /> : data?.pedidos_totales ?? 0}
        />
        <MetricCard
          title="Ingresos acumulados"
          value={isLoading ? <Skeleton className="h-6 w-20" /> : formatCurrency(data?.ingresos ?? 0)}
        />
        <MetricCard
          title="Clientes únicos"
          value={isLoading ? <Skeleton className="h-6 w-12" /> : data?.clientes_unicos ?? 0}
        />
        <MetricCard
          title="Unidades vendidas"
          value={isLoading ? <Skeleton className="h-6 w-16" /> : data?.productos_vendidos ?? 0}
        />
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Actividad reciente</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Visualiza cómo evoluciona tu tienda. Los datos se actualizan cada minuto al ingresar.
        </p>
        <div className="mt-6 h-64 w-full">
          {chartContent}
        </div>
      </div>
    </section>
  );
}

interface MetricCardProps {
  readonly title: string;
  readonly value: React.ReactNode;
}

function MetricCard({ title, value }: MetricCardProps) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</h2>
      <div className="mt-3 text-2xl font-semibold text-slate-900 dark:text-slate-100">{value}</div>
    </article>
  );
}
