import { useCallback, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
import { Skeleton } from "../../../components/ui/Skeleton";
import { useActualizarEstadoTienda, useAdminTienda } from "../../../hooks/useAdminTienda";
import { formatDateTime } from "../../../utils/format";
import type { HorarioTienda, TiendaAdmin } from "../../../api/types";

const dayLabels = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];

function estadoVariant(estado: string) {
  if (estado === "APROBADO") {
    return "success" as const;
  }
  if (estado === "RECHAZADO") {
    return "danger" as const;
  }
  return "warning" as const;
}

export default function AdminTiendaDetallePage() {
  const { id } = useParams();
  const tiendaId = useMemo(() => {
    if (!id) {
      return undefined;
    }
    const numeric = Number(id);
    return Number.isFinite(numeric) ? numeric : undefined;
  }, [id]);

  const { data: tienda, isPending, isError, refetch } = useAdminTienda(tiendaId);
  const actualizarEstado = useActualizarEstadoTienda();
  const [nextEstado, setNextEstado] = useState<"APROBADO" | "RECHAZADO" | null>(null);

  const horarios = useMemo<HorarioTienda[]>(() => tienda?.horarios ?? tienda?.horario ?? [], [tienda]);
  const direccion = useMemo(() => formatDireccion(tienda), [tienda]);

  const handleConfirm = useCallback(async () => {
    if (!tiendaId || !nextEstado) {
      return;
    }
    try {
      await actualizarEstado.mutateAsync({ id: tiendaId, codigo: nextEstado });
      setNextEstado(null);
    } catch (error) {
      console.error(error);
    }
  }, [actualizarEstado, nextEstado, tiendaId]);

  const content = useMemo(() => {
    if (isPending) {
      return <LoadingState />;
    }
    if (isError) {
      return <ErrorState onRetry={refetch} />;
    }
    if (!tienda) {
      return <EmptyState />;
    }
    return (
      <div className="space-y-6">
        <InfoCards tienda={tienda} direccion={direccion} />
        <HorariosSection horarios={horarios} />
      </div>
    );
  }, [direccion, horarios, isError, isPending, refetch, tienda]);

  return (
    <section className="space-y-6">
      <HeaderSection
        tienda={tienda}
        id={id}
        isSubmitting={actualizarEstado.isPending}
        onApprove={() => setNextEstado("APROBADO")}
        onReject={() => setNextEstado("RECHAZADO")}
      />

      {content}

      <ConfirmDialog
        isOpen={nextEstado !== null}
        title={nextEstado === "APROBADO" ? "Aprobar tienda" : "Rechazar tienda"}
        description={
          nextEstado === "APROBADO"
            ? "La tienda pasará a estado aprobado y podrá operar en el catálogo de forma inmediata."
            : "La tienda será marcada como rechazada y deberá corregir su información para volver a solicitar la aprobación."
        }
        confirmText={nextEstado === "APROBADO" ? "Aprobar" : "Rechazar"}
        cancelText="Cancelar"
        variant={nextEstado === "RECHAZADO" ? "danger" : "default"}
        isSubmitting={actualizarEstado.isPending}
        onCancel={() => setNextEstado(null)}
        onConfirm={handleConfirm}
      />
    </section>
  );
}

type HeaderSectionProps = Readonly<{
  tienda?: TiendaAdmin;
  id?: string;
  onApprove: () => void;
  onReject: () => void;
  isSubmitting: boolean;
}>;

function HeaderSection({ tienda, id, onApprove, onReject, isSubmitting }: HeaderSectionProps) {
  const showApprove = Boolean(tienda && tienda.estado_aprobacion !== "APROBADO");
  const showReject = Boolean(tienda && tienda.estado_aprobacion !== "RECHAZADO");

  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-wide text-blue-600">Tienda #{id}</p>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          {tienda?.nombre ?? "Detalle de tienda"}
        </h1>
        <p className="max-w-2xl text-sm text-slate-600 dark:text-slate-300">
          Revisa la información declarada por la tienda, valida documentación clave y controla el estado de aprobación.
        </p>
        {tienda ? <HeaderBadges tienda={tienda} /> : null}
      </div>
      {tienda ? (
        <HeaderActions
          showApprove={showApprove}
          showReject={showReject}
          onApprove={onApprove}
          onReject={onReject}
          isSubmitting={isSubmitting}
        />
      ) : null}
    </header>
  );
}

type HeaderBadgesProps = Readonly<{ tienda: TiendaAdmin }>;

function HeaderBadges({ tienda }: HeaderBadgesProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 pt-1">
      <Badge variant={estadoVariant(tienda.estado_aprobacion)}>{tienda.estado_aprobacion}</Badge>
      <Badge variant={tienda.activo ? "success" : "danger"}>{tienda.activo ? "Activa" : "Inactiva"}</Badge>
      {typeof tienda.abierto === "boolean" ? (
        <Badge variant={tienda.abierto ? "info" : "warning"}>
          {tienda.abierto ? "Horario activo" : "Fuera de horario"}
        </Badge>
      ) : null}
    </div>
  );
}

type HeaderActionsProps = Readonly<{
  showApprove: boolean;
  showReject: boolean;
  onApprove: () => void;
  onReject: () => void;
  isSubmitting: boolean;
}>;

function HeaderActions({ showApprove, showReject, onApprove, onReject, isSubmitting }: HeaderActionsProps) {
  if (!showApprove && !showReject) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-3">
      {showApprove ? (
        <Button onClick={onApprove} disabled={isSubmitting}>
          Aprobar tienda
        </Button>
      ) : null}
      {showReject ? (
        <Button variant="outline" onClick={onReject} disabled={isSubmitting}>
          Rechazar
        </Button>
      ) : null}
    </div>
  );
}

function LoadingState() {
  const skeletonKeys = ["tienda-general", "tienda-estado", "tienda-direccion"] as const;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {skeletonKeys.map((key) => (
        <div
          key={key}
          className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900"
        >
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="mt-4 h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-3/4" />
          <Skeleton className="mt-2 h-4 w-2/3" />
        </div>
      ))}
    </div>
  );
}

type ErrorStateProps = Readonly<{ onRetry: () => void }>;

function ErrorState({ onRetry }: ErrorStateProps) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">
      <p>Ocurrió un error al cargar la tienda.</p>
      <Button className="mt-4" variant="primary" onClick={onRetry}>
        Reintentar
      </Button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
      No encontramos información para esta tienda.
    </div>
  );
}

type InfoCardsProps = Readonly<{ tienda: TiendaAdmin; direccion: string }>;

function InfoCards({ tienda, direccion }: InfoCardsProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Datos generales
        </h2>
        <dl className="mt-4 space-y-3 text-sm">
          <InfoRow label="Razón social" value={tienda.nombre} />
          <InfoRow label="Categoría" value={tienda.categoria ?? "Sin categoría"} />
          <InfoRow label="Correo de contacto" value={tienda.email} />
          <InfoRow label="Teléfono" value={tienda.telefono} />
        </dl>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Estado y validación
        </h2>
        <dl className="mt-4 space-y-3 text-sm">
          <InfoRow label="Estado de aprobación" value={tienda.estado_aprobacion} />
          <InfoRow label="Cuenta bancaria" value={tienda.cuenta_bancaria} />
          <InfoRow label="Aprobado en" value={tienda.aprobado_en ? formatDateTime(tienda.aprobado_en) : "Pendiente"} />
          <InfoRow
            label="Última actualización"
            value={tienda.actualizado_en ? formatDateTime(tienda.actualizado_en) : "Sin datos"}
          />
        </dl>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Dirección y cobertura
        </h2>
        <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">{direccion}</p>
        <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
          <SummaryCard label="Promoción activa" value={tienda.promocion_activa ? "Sí" : "No"} />
          <SummaryCard label="Ciudad" value={tienda.ciudad ?? "Por definir"} />
        </div>
      </div>
    </div>
  );
}

type HorariosSectionProps = Readonly<{ horarios: HorarioTienda[] }>;

function HorariosSection({ horarios }: HorariosSectionProps) {
  if (!horarios || horarios.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
        No se registraron horarios para esta tienda.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        Horarios declarados
      </h2>
      <ul className="mt-4 divide-y divide-slate-200 text-sm dark:divide-slate-800">
        {horarios.map((horario) => {
          const dia = dayLabels[horario.dia_semana] ?? `Día ${horario.dia_semana}`;
          const key = `${horario.dia_semana}-${horario.hora_apertura ?? "-"}-${horario.hora_cierre ?? "-"}-${horario.cerrado ? 1 : 0}`;
          return (
            <li key={key} className="flex items-center justify-between py-2">
              <span className="text-slate-600 dark:text-slate-300">{dia}</span>
              <span className="font-medium text-slate-900 dark:text-slate-100">{getHorarioLabel(horario)}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

type InfoRowProps = Readonly<{ label: string; value: string }>;

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div>
      <dt className="text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="font-medium text-slate-900 dark:text-slate-100">{value}</dd>
    </div>
  );
}

type SummaryCardProps = Readonly<{ label: string; value: string }>;

function SummaryCard({ label, value }: SummaryCardProps) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/60">
      <p className="font-semibold text-slate-700 dark:text-slate-200">{label}</p>
      <p className="mt-1 text-slate-500 dark:text-slate-400">{value}</p>
    </div>
  );
}

function formatDireccion(tienda?: TiendaAdmin) {
  if (!tienda) {
    return "";
  }
  if (tienda.direccion_detalle) {
    const { linea1, linea2, ciudad, estado: departamento, pais, codigo_postal } = tienda.direccion_detalle;
    return [linea1, linea2, ciudad, departamento, codigo_postal, pais].filter(Boolean).join(", ");
  }
  return tienda.direccion ?? "Sin dirección registrada";
}

function getHorarioLabel(horario: HorarioTienda) {
  if (horario.cerrado) {
    return "Cerrado";
  }
  if (horario.hora_apertura && horario.hora_cierre) {
    return `${horario.hora_apertura} - ${horario.hora_cierre}`;
  }
  return "Sin horario definido";
}
