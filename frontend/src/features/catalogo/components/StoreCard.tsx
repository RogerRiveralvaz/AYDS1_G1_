import { Link } from "react-router-dom";
import dayjs from "dayjs";

import type { Tienda } from "../../../api/catalogo.api";
import { Chip } from "../../../components/ui/Chip";
import { cn } from "../../../utils/cn";

interface StoreCardProps {
  tienda: Tienda;
  to: string;
  className?: string;
  onMouseEnter?: () => void;
  onFocus?: () => void;
}

export function StoreCard({ tienda, to, className, onMouseEnter, onFocus }: Readonly<StoreCardProps>) {
  const categorias = tienda.categorias?.slice(0, 3) ?? [];
  const restantes = Math.max((tienda.categorias?.length ?? 0) - categorias.length, 0);
  const isOpen = Boolean(tienda.abierto);
  const todaySchedule = getTodaySchedule(tienda);

  return (
    <Link
      to={to}
      className={cn(
        "flex h-full flex-col rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:border-slate-800 dark:bg-slate-900",
        className,
      )}
      onMouseEnter={onMouseEnter}
      onFocus={onFocus}
    >
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex items-start gap-4">
          <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
            {tienda.logo_url ? (
              <img
                src={tienda.logo_url}
                alt={`Logo de ${tienda.nombre}`}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs font-semibold uppercase text-slate-500">
                {tienda.nombre.slice(0, 2)}
              </div>
            )}
          </div>
          <div className="flex flex-1 items-start justify-between gap-3">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{tienda.nombre}</h3>
              <p className="text-xs text-slate-500">{tienda.ciudad ?? "Ciudad no disponible"}</p>
              {tienda.direccion ? (
                <p className="text-xs text-slate-400">{tienda.direccion}</p>
              ) : null}
              <p className="text-xs font-medium text-slate-600 dark:text-slate-300" aria-label="Horario del dia">
                {todaySchedule}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span
                className={cn(
                  "rounded-full px-2 py-1 text-xs font-medium",
                  isOpen ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600",
                )}
              >
                {isOpen ? "Abierta" : "Cerrada"}
              </span>
              {tienda.promocion_activa ? (
                <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-orange-700">
                  Promocion
                </span>
              ) : null}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {categorias.map((categoria) => (
            <Chip key={categoria} asChild>
              <span>{categoria}</span>
            </Chip>
          ))}
          {restantes > 0 ? (
            <Chip asChild>
              <span>+{restantes}</span>
            </Chip>
          ) : null}
        </div>
        {tienda.descripcion ? (
          <p className="line-clamp-2 text-sm text-slate-600 dark:text-slate-300">{tienda.descripcion}</p>
        ) : null}
      </div>
    </Link>
  );
}

const SKELETON_CHIP_KEYS = ["uno", "dos", "tres"];

export function StoreCardSkeleton() {
  return (
    <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex items-start gap-4">
        <div className="h-16 w-16 rounded-full bg-slate-200 dark:bg-slate-700" />
        <div className="flex-1 space-y-3">
          <div className="h-4 w-1/2 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-3 w-32 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-3 w-28 rounded bg-slate-200 dark:bg-slate-700" />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {SKELETON_CHIP_KEYS.map((key) => (
          <div key={key} className="h-6 w-16 rounded-full bg-slate-200 dark:bg-slate-700" />
        ))}
      </div>
      <div className="mt-auto h-12 rounded bg-slate-200 dark:bg-slate-700" />
    </div>
  );
}

function getTodaySchedule(tienda: Tienda) {
  if (!tienda.horario || tienda.horario.length === 0) {
    return "Horario no disponible";
  }
  const today = dayjs().day();
  const match = tienda.horario.find((item) => normalizeDay(item.dia_semana) === today);
  if (!match) {
    return "Horario no disponible";
  }
  if (match.cerrado) {
    return "Cerrado hoy";
  }
  if (!match.hora_apertura || !match.hora_cierre) {
    return "Horario no disponible";
  }
  return `Hoy ${match.hora_apertura} - ${match.hora_cierre}`;
}

function normalizeDay(value: number) {
  // API puede usar 0-6 (domingo-sabado) o 1-7 (lunes-domingo). Normalizamos a dayjs().day()
  if (value < 7) {
    return value;
  }
  return value % 7;
}
