import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import {
  actualizarEstadoEntrega,
  fetchMisEntregas,
  type EntregaEstadoCodigo,
  type EntregaResumen,
} from "../../../api/entregas.api";
import { getErrorMessage } from "../../../api/client";
import { queryKeys } from "../../../api/queryKeys";
import { Button } from "../../../components/ui/Button";
import { Skeleton } from "../../../components/ui/Skeleton";
import { StatusBadge } from "../../../components/ui/StatusBadge";

const currencyFormatter = new Intl.NumberFormat("es-GT", {
  style: "currency",
  currency: "GTQ",
  minimumFractionDigits: 2,
});

const datetimeFormatter = new Intl.DateTimeFormat("es-GT", {
  dateStyle: "medium",
  timeStyle: "short",
});

const skeletonPlaceholders = ["uno", "dos", "tres", "cuatro"] as const;

export default function RepartidorEntregasPage() {
  const queryClient = useQueryClient();
  const [processingId, setProcessingId] = useState<number | null>(null);

  const entregasQuery = useQuery<{ entregas: EntregaResumen[] }>({
    queryKey: queryKeys.entregas.list(),
    queryFn: () => fetchMisEntregas(),
    refetchInterval: 10000,
  });

  const mutation = useMutation({
    mutationFn: ({ id, codigo }: { id: number; codigo: EntregaEstadoCodigo }) =>
      actualizarEstadoEntrega(id, { codigo }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.entregas.list() });
    },
  });

  const entregas = entregasQuery.data?.entregas ?? [];

  const { disponibles, aceptadas, enCamino } = useMemo(() => {
    return {
      disponibles: entregas.filter((entrega) => entrega.codigoEstado === "ASIGNADA"),
      aceptadas: entregas.filter((entrega) => entrega.codigoEstado === "ACEPTADA"),
      enCamino: entregas.filter((entrega) => entrega.codigoEstado === "EN_CAMINO"),
    };
  }, [entregas]);

  const handleCambioEstado = async (
    entrega: EntregaResumen,
    codigo: EntregaEstadoCodigo,
    successMessage: string,
  ) => {
    setProcessingId(entrega.id);
    try {
      await mutation.mutateAsync({ id: entrega.id, codigo });
      toast.success(successMessage);
    } catch (error) {
      toast.error(getErrorMessage(error, "No se pudo actualizar la entrega"));
    } finally {
      setProcessingId(null);
    }
  };

  let content: React.ReactNode = null;
  if (entregasQuery.isLoading) {
    content = (
      <div className="grid gap-4 md:grid-cols-2">
        {skeletonPlaceholders.map((key) => (
          <Skeleton key={key} className="h-56 w-full" />
        ))}
      </div>
    );
  } else if (entregasQuery.isError) {
    content = (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
        {getErrorMessage(entregasQuery.error, "No se pudieron cargar las entregas")}
      </div>
    );
  } else {
    content = (
      <div className="space-y-12">
        <EntregaSection
          title="Disponibles"
          description="Pedidos recién asignados a tu bandeja. Puedes aceptarlos o rechazarlos."
          emptyMessage="No tienes entregas disponibles por ahora. Se actualizarán automáticamente."
          entregas={disponibles}
          onCambioEstado={handleCambioEstado}
          processingId={processingId}
        />
        <EntregaSection
          title="Aceptadas"
          description="Pedidos que ya aceptaste y están listos para ser recogidos."
          emptyMessage="No tienes entregas aceptadas pendientes."
          entregas={aceptadas}
          onCambioEstado={handleCambioEstado}
          processingId={processingId}
        />
        <EntregaSection
          title="En camino"
          description="Pedidos que ya están en ruta hacia el cliente."
          emptyMessage="No hay entregas en curso en este momento."
          entregas={enCamino}
          onCambioEstado={handleCambioEstado}
          processingId={processingId}
        />
      </div>
    );
  }

  return (
    <section className="space-y-10">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-blue-600">Repartidor</p>
          <h1 className="text-2xl font-semibold">Mis entregas</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Revisa pedidos pendientes, acéptalos o recházalos y registra el progreso en tiempo real.
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
          Actualización automática cada <strong>10&nbsp;s</strong> cuando existan entregas asignadas.
        </div>
      </header>
      {content}
    </section>
  );
}

type EntregaSectionProps = Readonly<{
  title: string;
  description: string;
  emptyMessage: string;
  entregas: EntregaResumen[];
  onCambioEstado: (
    entrega: EntregaResumen,
    codigo: EntregaEstadoCodigo,
    successMessage: string,
  ) => Promise<void>;
  processingId: number | null;
}>;

function EntregaSection({ title, description, emptyMessage, entregas, onCambioEstado, processingId }: EntregaSectionProps) {
  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300">{description}</p>
      </header>
      {entregas.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 p-6 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-300">
          {emptyMessage}
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {entregas.map((entrega) => (
            <EntregaCard
              key={entrega.id}
              entrega={entrega}
              onCambioEstado={onCambioEstado}
              disabled={processingId === entrega.id}
            />
          ))}
        </div>
      )}
    </section>
  );
}

type EntregaCardProps = Readonly<{
  entrega: EntregaResumen;
  disabled: boolean;
  onCambioEstado: (
    entrega: EntregaResumen,
    codigo: EntregaEstadoCodigo,
    successMessage: string,
  ) => Promise<void>;
}>;

function EntregaCard({ entrega, disabled, onCambioEstado }: EntregaCardProps) {
  const actions = getAvailableActions(entrega);

  const handleAction = async (action: EntregaAction) => {
    if (action.confirm && !window.confirm(action.confirm)) {
      return;
    }
    await onCambioEstado(entrega, action.codigo, action.successMessage);
  };

  const costoEnvio = entrega.pedido.envioQ;
  const totalPedido = entrega.pedido.totalQ;

  return (
    <section
      className="flex h-full flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
      aria-labelledby={`entrega-${entrega.id}`}
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 id={`entrega-${entrega.id}`} className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Pedido #{entrega.pedido.id}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {entrega.pedido.tienda.nombre}
              {entrega.pedido.tienda.ciudad ? ` · ${entrega.pedido.tienda.ciudad}` : ""}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Asignado {formatDate(entrega.asignadaEn)}
            </p>
          </div>
          <StatusBadge status={entrega.codigoEstado} />
        </div>

        <dl className="grid grid-cols-2 gap-3 text-sm text-slate-700 dark:text-slate-200">
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Costo envío</dt>
            <dd className="font-semibold">{formatCurrency(costoEnvio)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Total pedido</dt>
            <dd className="font-semibold">{formatCurrency(totalPedido)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Peso total</dt>
            <dd>{entrega.pedido.pesoTotalKg.toFixed(2)} kg</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Creado</dt>
            <dd>{formatDate(entrega.pedido.creadoEn)}</dd>
          </div>
        </dl>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {actions.map((action) => (
          <Button
            key={action.codigo}
            variant={action.variant}
            size="sm"
            disabled={disabled}
            onClick={() => void handleAction(action)}
          >
            {action.label}
          </Button>
        ))}
        <Link
          to={`/app/repartidor/entregas/${entrega.id}`}
          className="text-sm font-medium text-blue-600 transition hover:text-blue-500 hover:underline"
        >
          Ver detalle
        </Link>
      </div>
    </section>
  );
}

type EntregaAction = Readonly<{
  codigo: EntregaEstadoCodigo;
  label: string;
  variant: "primary" | "outline" | "secondary";
  confirm?: string;
  successMessage: string;
}>;

function getAvailableActions(entrega: EntregaResumen): EntregaAction[] {
  if (entrega.codigoEstado === "ASIGNADA") {
    return [
      {
        codigo: "ACEPTADA",
        label: "Aceptar entrega",
        variant: "primary",
        successMessage: "Entrega aceptada",
      },
      {
        codigo: "CANCELADA",
        label: "Rechazar",
        variant: "outline",
        confirm: "¿Quieres rechazar esta entrega? Volverá a estar disponible para otros repartidores.",
        successMessage: "Entrega rechazada",
      },
    ];
  }
  if (entrega.codigoEstado === "ACEPTADA") {
    return [
      {
        codigo: "EN_CAMINO",
        label: "Marcar en camino",
        variant: "secondary",
        successMessage: "Entrega marcada en camino",
      },
    ];
  }
  if (entrega.codigoEstado === "EN_CAMINO") {
    return [
      {
        codigo: "ENTREGADA",
        label: "Confirmar entrega",
        variant: "primary",
        confirm: "¿Confirmas que la entrega llegó al cliente?",
        successMessage: "Entrega marcada como completada",
      },
    ];
  }
  return [];
}

function formatCurrency(value: number | null) {
  const amount = value ?? 0;
  return currencyFormatter.format(amount);
}

function formatDate(value: string | null) {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return datetimeFormatter.format(date);
}
