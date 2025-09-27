
import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
import { Skeleton } from "../../../components/ui/Skeleton";
import {
  useActualizarEstadoTienda,
  useActualizarActivoTienda,
  useEliminarTienda,
  useAdminTienda,
} from "../../../hooks/useAdminTienda";
import { formatDateTime } from "../../../utils/format";
import type { HorarioTienda, TiendaAdmin } from "../../../api/types";

const dayLabels = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"];

type PendingAction = "aprobar" | "rechazar" | "activar" | "suspender" | "eliminar" | null;

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
  const actualizarActivo = useActualizarActivoTienda();
  const eliminarTienda = useEliminarTienda();
  const [accion, setAccion] = useState<PendingAction>(null);

  const horarios = useMemo<HorarioTienda[]>(() => tienda?.horarios ?? tienda?.horario ?? [], [tienda]);
  const direccion = useMemo(() => formatDireccion(tienda), [tienda]);

  const handleConfirm = async () => {
    if (!tiendaId || !accion) {
      setAccion(null);
      return;
    }
    try {
      if (accion === "aprobar") {
        await actualizarEstado.mutateAsync({ id: tiendaId, codigo: "APPROVED" });
      } else if (accion === "rechazar") {
        await actualizarEstado.mutateAsync({ id: tiendaId, codigo: "REJECTED" });
      } else if (accion === "activar") {
        await actualizarActivo.mutateAsync({ id: tiendaId, activo: true });
      } else if (accion === "suspender") {
        await actualizarActivo.mutateAsync({ id: tiendaId, activo: false });
      } else if (accion === "eliminar") {
        await eliminarTienda.mutateAsync(tiendaId);
      }
      setAccion(null);
    } catch (error) {
      console.error(error);
    }
  };

  const confirmLoading =
    actualizarEstado.isPending || actualizarActivo.isPending || eliminarTienda.isPending;

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
        <HeaderSection
          tienda={tienda}
          direccion={direccion}
          onApprove={() => setAccion("aprobar")}
          onReject={() => setAccion("rechazar")}
          onActivate={() => setAccion("activar")}
          onSuspend={() => setAccion("suspender")}
          onDelete={() => setAccion("eliminar")}
          loading={confirmLoading}
        />
        <DetailCards tienda={tienda} direccion={direccion} />
        <HorariosSection horarios={horarios} />
      </div>
    );
  }, [confirmLoading, direccion, horarios, isError, isPending, refetch, tienda]);

  return (
    <section className="space-y-6">
      {content}

      <ConfirmDialog
        isOpen={accion !== null}
        title={getConfirmTitle(accion)}
        description={getConfirmDescription(accion)}
        confirmText={getConfirmLabel(accion)}
        cancelText="Cancelar"
        variant={accion === "rechazar" || accion === "eliminar" ? "danger" : "default"}
        isSubmitting={confirmLoading}
        onCancel={() => setAccion(null)}
        onConfirm={handleConfirm}
      />
    </section>
  );
}

type HeaderSectionProps = Readonly<{
  tienda?: TiendaAdmin;
  direccion: string;
  onApprove: () => void;
  onReject: () => void;
  onActivate: () => void;
  onSuspend: () => void;
  onDelete: () => void;
  loading: boolean;
}>;

function HeaderSection({ tienda, direccion, onApprove, onReject, onActivate, onSuspend, onDelete, loading }: HeaderSectionProps) {
  if (!tienda) {
    return null;
  }
  const estado = tienda.estado_aprobacion;
  const puedeAprobar = estado !== "APPROVED";
  const puedeRechazar = estado !== "REJECTED";
  const activa = tienda.activo;

  return (
    <header className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900 md:flex-row md:items-start md:justify-between">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-wide text-blue-600">Tienda #{tienda.id_tienda}</p>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{tienda.razon_social}</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">{direccion || "Sin direccion registrada"}</p>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={estadoVariant(estado)}>{estado}</Badge>
          <Badge variant={activa ? "success" : "danger"}>{activa ? "Activa" : "Inactiva"}</Badge>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {puedeAprobar ? (
          <Button size="sm" variant="outline" onClick={onApprove} disabled={loading}>
            Aprobar
          </Button>
        ) : null}
        {puedeRechazar ? (
          <Button size="sm" variant="ghost" onClick={onReject} disabled={loading}>
            Rechazar
          </Button>
        ) : null}
        {activa ? (
          <Button size="sm" variant="ghost" onClick={onSuspend} disabled={loading}>
            Suspender
          </Button>
        ) : (
          <Button size="sm" variant="outline" onClick={onActivate} disabled={loading}>
            Activar
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={onDelete} disabled={loading}>
          Eliminar
        </Button>
      </div>
    </header>
  );
}

type DetailCardsProps = Readonly<{ tienda: TiendaAdmin; direccion: string }>;

function DetailCards({ tienda, direccion }: DetailCardsProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Datos generales</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <InfoRow label="Razon social" value={tienda.razon_social} />
          <InfoRow label="Categoria" value={tienda.categoria ?? "Sin categoria"} />
          <InfoRow label="Correo de contacto" value={tienda.email} />
          <InfoRow label="Telefono" value={tienda.telefono} />
          <InfoRow label="Cuenta bancaria" value={tienda.cuenta_bancaria} />
        </dl>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Estado y seguimiento</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <InfoRow label="Estado" value={tienda.estado_aprobacion} />
          <InfoRow label="Aprobado por" value={tienda.aprobado_por ? String(tienda.aprobado_por) : "Sin registro"} />
          <InfoRow label="Aprobado en" value={tienda.aprobado_en ? formatDateTime(tienda.aprobado_en) : "Pendiente"} />
          <InfoRow label="Actualizado" value={tienda.actualizado_en ? formatDateTime(tienda.actualizado_en) : "Sin registro"} />
        </dl>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Cobertura y estado</h2>
        <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">{direccion || "Sin direccion"}</p>
        <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
          <SummaryCard label="Promocion activa" value={tienda.promocion_activa ? "Si" : "No"} />
          <SummaryCard label="Ciudad" value={tienda.ciudad ?? "Sin dato"} />
        </div>
      </div>
    </div>
  );
}

function HorariosSection({ horarios }: { horarios: HorarioTienda[] }) {
  if (!horarios || horarios.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
        No se registraron horarios para esta tienda.
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Horarios declarados</h2>
      <ul className="mt-4 divide-y divide-slate-200 text-sm dark:divide-slate-800">
        {horarios.map((horario) => {
          const dia = dayLabels[horario.dia_semana] ?? `Dia ${horario.dia_semana}`;
          const key = `${horario.dia_semana}-${horario.hora_apertura ?? 'inicio'}-${horario.hora_cierre ?? 'fin'}-${horario.cerrado ? 1 : 0}`;
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

function LoadingState() {
  return <Skeleton className="h-64 w-full" />;
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
      <p>Error al cargar la informacion de la tienda.</p>
      <Button className="mt-3" variant="outline" onClick={onRetry}>
        Reintentar
      </Button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
      No encontramos informacion para esta tienda.
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="font-medium text-slate-900 dark:text-slate-100">{value}</dd>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
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
    const { linea1, linea2, ciudad, estado, pais, codigo_postal } = tienda.direccion_detalle;
    return [linea1, linea2, ciudad, estado, codigo_postal, pais].filter(Boolean).join(", ");
  }
  return tienda.direccion ?? "";
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

function getConfirmTitle(accion: PendingAction) {
  switch (accion) {
    case "aprobar":
      return "Aprobar tienda";
    case "rechazar":
      return "Rechazar tienda";
    case "activar":
      return "Activar tienda";
    case "suspender":
      return "Suspender tienda";
    case "eliminar":
      return "Eliminar tienda";
    default:
      return "";
  }
}

function getConfirmDescription(accion: PendingAction) {
  switch (accion) {
    case "aprobar":
      return "La tienda quedara aprobada y aparecera en el catalogo.";
    case "rechazar":
      return "La tienda sera marcada como rechazada hasta nueva revision.";
    case "activar":
      return "La tienda podra operar nuevamente.";
    case "suspender":
      return "La tienda sera suspendida temporalmente.";
    case "eliminar":
      return "La tienda se desactivara y no aparecera para los clientes.";
    default:
      return "";
  }
}

function getConfirmLabel(accion: PendingAction) {
  switch (accion) {
    case "aprobar":
      return "Aprobar";
    case "rechazar":
      return "Rechazar";
    case "activar":
      return "Activar";
    case "suspender":
      return "Suspender";
    case "eliminar":
      return "Eliminar";
    default:
      return "Confirmar";
  }
}

function estadoVariant(estado: string) {
  if (estado === "APROBADO") {
    return "success" as const;
  }
  if (estado === "RECHAZADO") {
    return "danger" as const;
  }
  if (estado === "SUSPENDED") {
    return "warning" as const;
  }
  return "info" as const;
}
