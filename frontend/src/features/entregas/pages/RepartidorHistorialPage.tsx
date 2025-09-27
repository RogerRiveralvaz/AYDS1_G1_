import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { fetchMisEntregas, type EntregaResumen } from "../../../api/entregas.api";
import { queryKeys } from "../../../api/queryKeys";
import { getErrorMessage } from "../../../api/client";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import { Skeleton } from "../../../components/ui/Skeleton";
import { StatusBadge } from "../../../components/ui/StatusBadge";

const currencyFormatter = new Intl.NumberFormat("es-GT", {
  style: "currency",
  currency: "GTQ",
  minimumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat("es-GT", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat("es-GT", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default function RepartidorHistorialPage() {
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [distanceMin, setDistanceMin] = useState<string>("");
  const [distanceMax, setDistanceMax] = useState<string>("");
  const [paymentStatus, setPaymentStatus] = useState<"all" | "paid" | "pending">("all");

  const entregasQuery = useQuery({
    queryKey: queryKeys.entregas.list({ scope: "historial" }),
    queryFn: () => fetchMisEntregas(),
  });

  const entregas = entregasQuery.data?.entregas ?? [];

  const historialBase = useMemo(
    () => entregas.filter((entrega) => entrega.codigoEstado === "ENTREGADA" || entrega.codigoEstado === "CANCELADA"),
    [entregas],
  );

  const fromDate = useMemo(() => (dateFrom ? new Date(dateFrom) : null), [dateFrom]);
  const toDate = useMemo(() => {
    if (!dateTo) {
      return null;
    }
    const limit = new Date(dateTo);
    limit.setHours(23, 59, 59, 999);
    return limit;
  }, [dateTo]);
  const minDistance = useMemo(() => parseDistance(distanceMin), [distanceMin]);
  const maxDistance = useMemo(() => parseDistance(distanceMax), [distanceMax]);

  const filtered = useMemo(
    () =>
      historialBase.filter(
        (entrega) =>
          matchesDateRange(entrega, fromDate, toDate) &&
          matchesDistance(entrega, minDistance, maxDistance) &&
          matchesPayment(entrega, paymentStatus),
      ),
    [historialBase, fromDate, toDate, minDistance, maxDistance, paymentStatus],
  );

  const metrics = useMemo(() => {
    return filtered.reduce(
      (acc, entrega) => {
        const distancia = entrega.distanciaKm ?? 0;
        acc.distancia += distancia;
        const pago = entrega.pagoRepartidorQ ?? 0;
        acc.ganancias += pago;
        if (entrega.codigoEstado === "ENTREGADA") {
          acc.completadas += 1;
        }
        return acc;
      },
      { distancia: 0, ganancias: 0, completadas: 0 },
    );
  }, [filtered]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const dateA = new Date(a.entregadaEn ?? a.asignadaEn ?? 0).getTime();
      const dateB = new Date(b.entregadaEn ?? b.asignadaEn ?? 0).getTime();
      return dateB - dateA;
    });
  }, [filtered]);

  const handleResetFilters = () => {
    setDateFrom("");
    setDateTo("");
    setDistanceMin("");
    setDistanceMax("");
    setPaymentStatus("all");
  };

  const handleExportCsv = () => {
    if (sorted.length === 0) {
      toast.error("No hay información para exportar");
      return;
    }
    const header = [
      "Entrega",
      "Pedido",
      "Estado",
      "Fecha",
      "Distancia_km",
      "Pago_Q",
      "Tienda",
      "Total_Pedido_Q",
    ];
    const rows = sorted.map((entrega) => {
      const distancia = entrega.distanciaKm ?? 0;
      const pago = entrega.pagoRepartidorQ ?? 0;
      const fecha = entrega.entregadaEn ?? entrega.asignadaEn ?? "";
      return [
        entrega.id,
        entrega.pedido.id,
        entrega.codigoEstado,
        fecha,
        distancia,
        pago,
        entrega.pedido.tienda.nombre,
        entrega.pedido.totalQ,
      ];
    });
    const csv = [header, ...rows]
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `historial-entregas-${new Date().toISOString().slice(0, 10)}.csv`);
    link.click();
    URL.revokeObjectURL(url);
    toast.success("CSV generado correctamente");
  };

  const renderContent = () => {
    if (entregasQuery.isLoading) {
      return (
        <div className="grid gap-4 md:grid-cols-3">
          {[0, 1, 2].map((key) => (
            <Skeleton key={key} className="h-28 w-full" />
          ))}
        </div>
      );
    }
    if (entregasQuery.isError) {
      return (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
          {getErrorMessage(entregasQuery.error, "No se pudo cargar el historial")}
        </div>
      );
    }
    return (
      <>
        <section className="grid gap-4 md:grid-cols-3">
          <MetricCard title="Entregas completadas" value={numberFormatter.format(metrics.completadas)} subtitle="En el rango seleccionado" />
          <MetricCard
            title="Distancia total"
            value={`${numberFormatter.format(metrics.distancia)} km`}
            subtitle="Suma de distancias recorridas"
          />
          <MetricCard
            title="Ganancias totales"
            value={currencyFormatter.format(metrics.ganancias)}
            subtitle="Basadas en registros confirmados"
          />
        </section>

        <section className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
            <thead className="bg-slate-50 dark:bg-slate-900/60">
              <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                <th className="px-4 py-3">Entrega</th>
                <th className="px-4 py-3">Pedido</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Distancia (km)</th>
                <th className="px-4 py-3">Pago</th>
                <th className="px-4 py-3">Tienda</th>
                <th className="px-4 py-3">Total pedido</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-800 dark:bg-slate-900">
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-sm text-slate-500 dark:text-slate-300">
                    No se encontraron entregas con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                sorted.map((entrega) => {
                  const distancia = entrega.distanciaKm ?? 0;
                  const pago = entrega.pagoRepartidorQ ?? 0;
                  const fecha = entrega.entregadaEn ?? entrega.asignadaEn;
                  const pagado = pago > 0;
                  return (
                    <tr key={entrega.id} className="text-slate-700 dark:text-slate-200">
                      <td className="px-4 py-3 font-medium">#{entrega.id}</td>
                      <td className="px-4 py-3">#{entrega.pedido.id}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={entrega.codigoEstado} />
                      </td>
                      <td className="px-4 py-3">{fecha ? dateFormatter.format(new Date(fecha)) : "-"}</td>
                      <td className="px-4 py-3">{numberFormatter.format(distancia)}</td>
                      <td className="px-4 py-3">
                        <span className={pagado ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}>
                          {currencyFormatter.format(pago)}
                        </span>
                      </td>
                      <td className="px-4 py-3">{entrega.pedido.tienda.nombre}</td>
                      <td className="px-4 py-3">{currencyFormatter.format(entrega.pedido.totalQ)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </section>
      </>
    );
  };

  return (
    <section className="space-y-10">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-wide text-blue-600">Repartidor</p>
        <h1 className="text-2xl font-semibold">Historial de entregas</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Filtra por fechas, distancia recorrida y estado de pago. Exporta los resultados a CSV cuando lo necesites.
        </p>
      </header>

      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Filtros</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <FilterField label="Desde" htmlFor="fecha-desde">
            <Input id="fecha-desde" type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
          </FilterField>
          <FilterField label="Hasta" htmlFor="fecha-hasta">
            <Input id="fecha-hasta" type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
          </FilterField>
          <FilterField label="Distancia mínima (km)" htmlFor="distancia-min">
            <Input
              id="distancia-min"
              type="number"
              min="0"
              step="0.1"
              value={distanceMin}
              onChange={(event) => setDistanceMin(event.target.value)}
            />
          </FilterField>
          <FilterField label="Distancia máxima (km)" htmlFor="distancia-max">
            <Input
              id="distancia-max"
              type="number"
              min="0"
              step="0.1"
              value={distanceMax}
              onChange={(event) => setDistanceMax(event.target.value)}
            />
          </FilterField>
          <FilterField label="Estado de pago" htmlFor="estado-pago">
            <Select
              id="estado-pago"
              value={paymentStatus}
              onChange={(event) => setPaymentStatus(event.target.value as typeof paymentStatus)}
            >
              <option value="all">Todos</option>
              <option value="paid">Pagados</option>
              <option value="pending">Pendientes</option>
            </Select>
          </FilterField>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" size="sm" onClick={handleResetFilters}>
            Restablecer filtros
          </Button>
          <Button variant="primary" size="sm" onClick={handleExportCsv}>
            Exportar CSV
          </Button>
        </div>
      </section>

      {renderContent()}
    </section>
  );
}

function matchesDateRange(entrega: EntregaResumen, fromDate: Date | null, toDate: Date | null) {
  const reference = entrega.entregadaEn ?? entrega.recogidaEn ?? entrega.asignadaEn;
  if (!reference) {
    return !fromDate && !toDate;
  }
  const date = new Date(reference);
  if (fromDate && date < fromDate) {
    return false;
  }
  if (toDate && date > toDate) {
    return false;
  }
  return true;
}

function matchesDistance(entrega: EntregaResumen, minDistance: number | null, maxDistance: number | null) {
  const distancia = entrega.distanciaKm ?? 0;
  if (minDistance !== null && distancia < minDistance) {
    return false;
  }
  if (maxDistance !== null && distancia > maxDistance) {
    return false;
  }
  return true;
}

function matchesPayment(entrega: EntregaResumen, paymentStatus: "all" | "paid" | "pending") {
  if (paymentStatus === "all") {
    return true;
  }
  const pagado = (entrega.pagoRepartidorQ ?? 0) > 0;
  if (paymentStatus === "paid") {
    return pagado;
  }
  return !pagado;
}

function parseDistance(value: string): number | null {
  if (!value) {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

type FilterFieldProps = Readonly<{ label: string; htmlFor: string; children: ReactNode }>;

function FilterField({ label, htmlFor, children }: FilterFieldProps) {
  return (
    <label htmlFor={htmlFor} className="space-y-1 text-sm font-medium text-slate-700 dark:text-slate-200">
      <span className="block text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

type MetricCardProps = Readonly<{ title: string; value: string; subtitle: string }>;

function MetricCard({ title, value, subtitle }: MetricCardProps) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{title}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">{value}</p>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
    </article>
  );
}
