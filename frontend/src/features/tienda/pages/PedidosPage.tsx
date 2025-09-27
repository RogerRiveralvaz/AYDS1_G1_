import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { DndContext, useDraggable, useDroppable, type DragEndEvent, type DragStartEvent } from "@dnd-kit/core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import clsx from "clsx";

import { queryKeys } from "../../../api/queryKeys";
import { asignarEntrega, fetchRepartidoresDisponibles, type RepartidorDisponible } from "../../../api/entregas.api";
import { fetchPedidosTienda, actualizarEstadoPedidoTienda, type PedidoResumen } from "../../../api/pedidos.api";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
import { Modal } from "../../../components/ui/Modal";
import { Select } from "../../../components/ui/Select";
import { Skeleton } from "../../../components/ui/Skeleton";
import { Spinner } from "../../../components/ui/Spinner";

const currencyFormatter = new Intl.NumberFormat("es-GT", {
  style: "currency",
  currency: "GTQ",
  minimumFractionDigits: 2,
});

type EstadoTransition = {
  code: string;
  label: string;
  confirmMessage: string;
  apiCode?: string;
  action?: "assignDelivery";
};

type EstadoConfig = {
  code: string;
  label: string;
  accent: "warning" | "info" | "success" | "default" | "danger";
  emptyMessage: string;
  aliases?: string[];
  next?: EstadoTransition;
};

const ESTADOS: EstadoConfig[] = [
  {
    code: "PENDIENTE",
    label: "Pendientes",
    accent: "warning",
    emptyMessage: "No tienes pedidos pendientes por ahora.",
    next: {
      code: "CONFIRMADO",
      label: "Mover a preparación",
      confirmMessage: "¿Confirmas que iniciarás la preparación de este pedido?",
      apiCode: "CONFIRMADO",
    },
    aliases: ["PENDIENTE", "PENDING"],
  },
  {
    code: "CONFIRMADO",
    label: "En preparación",
    accent: "info",
    emptyMessage: "No hay pedidos en preparación.",
    next: {
      code: "ASIGNAR_ENTREGA",
      label: "Enviar con repartidor",
      confirmMessage: "Selecciona un repartidor disponible para este pedido.",
      action: "assignDelivery",
    },
    aliases: ["CONFIRMADO", "CONFIRMED", "PREPARACION", "PREPARING", "READY"],
  },
  {
    code: "ENTREGADO",
    label: "Entregados",
    accent: "success",
    emptyMessage: "Aún no hay pedidos entregados.",
    aliases: ["ENTREGADO", "DELIVERED", "LISTO"],
  },
];

const ESTADO_ALIAS_MAP = new Map<string, EstadoConfig["code"]>();
for (const estado of ESTADOS) {
  ESTADO_ALIAS_MAP.set(estado.code.toUpperCase(), estado.code);
  for (const alias of estado.aliases ?? []) {
    ESTADO_ALIAS_MAP.set(alias.toUpperCase(), estado.code);
  }
}

function normalizarEstado(codigo: string | null | undefined): EstadoConfig["code"] | undefined {
  if (!codigo) {
    return undefined;
  }
  return ESTADO_ALIAS_MAP.get(codigo.toUpperCase());
}

const pollIntervalMs = 20_000;

type PedidoTablero = PedidoResumen & { estadoTablero: string };

type PendingAction = {
  pedido: PedidoTablero;
  next: EstadoTransition;
};

export default function PedidosPage() {
  const queryClient = useQueryClient();
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [assigningPedido, setAssigningPedido] = useState<PedidoTablero | null>(null);
  const [activePedidoId, setActivePedidoId] = useState<number | null>(null);
  const knownIdsRef = useRef<Set<number>>(new Set());
  const initializedRef = useRef(false);

  const pedidosQuery = useQuery({
    queryKey: queryKeys.tienda.pedidos.list(),
    queryFn: () => fetchPedidosTienda(),
    refetchInterval: pollIntervalMs,
    refetchOnWindowFocus: true,
    staleTime: pollIntervalMs / 2,
  });

  const pedidos = useMemo(() => pedidosQuery.data?.data ?? [], [pedidosQuery.data]);
  const pedidosTablero = useMemo<PedidoTablero[]>(() => {
    return pedidos.map((pedido) => {
      const estadoTablero = normalizarEstado(pedido.codigo_estado) ?? "OTROS";
      return { ...pedido, estadoTablero };
    });
  }, [pedidos]);

  useEffect(() => {
    if (!pedidos || pedidos.length === 0) {
      if (!initializedRef.current) {
        initializedRef.current = true;
      }
      return;
    }
    const previousIds = knownIdsRef.current;
    const currentIds = new Set(pedidos.map((pedido) => pedido.id));
    if (!initializedRef.current) {
      initializedRef.current = true;
      knownIdsRef.current = currentIds;
      return;
    }
    const newPedidos = pedidos.filter((pedido) => !previousIds.has(pedido.id));
    if (newPedidos.length > 0) {
      newPedidos.forEach((pedido) => {
        toast.success(`Nuevo pedido #${pedido.id} (${currencyFormatter.format(pedido.total)})`);
      });
    }
    knownIdsRef.current = currentIds;
  }, [pedidos]);

  const mutation = useMutation({
    mutationFn: ({ pedidoId, codigo }: { pedidoId: number; codigo: string }) =>
      actualizarEstadoPedidoTienda(pedidoId, { codigo }),
    onSuccess: (updated) => {
      toast.success(`Pedido #${updated.id} actualizado a ${updated.estado}`);
      queryClient.invalidateQueries({ queryKey: queryKeys.tienda.pedidos.list() });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "No se pudo actualizar el estado";
      toast.error(message);
    },
  });

  const assignMutation = useMutation({
    mutationFn: ({ pedidoId, repartidorId }: { pedidoId: number; repartidorId: number }) =>
      asignarEntrega(pedidoId, repartidorId),
    onSuccess: (_, variables) => {
      toast.success(`Pedido #${variables.pedidoId} enviado al repartidor asignado`);
      queryClient.invalidateQueries({ queryKey: queryKeys.tienda.pedidos.list() });
      queryClient.invalidateQueries({ queryKey: queryKeys.entregas.list() });
      setAssigningPedido(null);
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "No se pudo asignar la entrega";
      toast.error(message);
    },
  });

  const grouped = useMemo(() => {
    const buckets = new Map<string, PedidoTablero[]>(
      ESTADOS.map((estado) => [estado.code, [] as PedidoTablero[]]),
    );
    const otros: PedidoTablero[] = [];
    pedidosTablero.forEach((pedido) => {
      const list = buckets.get(pedido.estadoTablero);
      if (list) {
        list.push(pedido);
      } else {
        otros.push(pedido);
      }
    });
    const sortedColumns = ESTADOS.map((estado) => ({
      estado,
      pedidos: (buckets.get(estado.code) ?? []).slice().sort((a, b) => {
        return dayjs(b.creado_en).valueOf() - dayjs(a.creado_en).valueOf();
      }),
    }));
    const otrosOrdenados = otros.slice().sort((a, b) => dayjs(b.creado_en).valueOf() - dayjs(a.creado_en).valueOf());
    return { columnas: sortedColumns, otros: otrosOrdenados };
  }, [pedidosTablero]);

  const openConfirm = (pedido: PedidoTablero, next: NonNullable<EstadoConfig["next"]>) => {
    if (next.action === "assignDelivery") {
      setAssigningPedido(pedido);
      return;
    }
    if (!next.apiCode) {
      toast.error("Esta acción no está disponible.");
      return;
    }
    setPendingAction({ pedido, next });
  };

  const closeConfirm = () => setPendingAction(null);

  const handleConfirm = async () => {
    if (!pendingAction?.next?.apiCode) return;
    await mutation.mutateAsync({ pedidoId: pendingAction.pedido.id, codigo: pendingAction.next.apiCode });
    setPendingAction(null);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const pedido = event.active.data.current?.pedido as PedidoResumen | undefined;
    if (pedido) {
      setActivePedidoId(pedido.id);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActivePedidoId(null);
    const pedido = event.active.data.current?.pedido as PedidoTablero | undefined;
    const targetEstadoCode = event.over?.id as string | undefined;
    if (!pedido || !targetEstadoCode) {
      return;
    }
    if (pedido.estadoTablero === targetEstadoCode) {
      return;
    }

    const currentEstado = ESTADOS.find((estado) => estado.code === pedido.estadoTablero);
    if (!currentEstado?.next) {
      toast.error("Este pedido no puede moverse con arrastrar y soltar.");
      return;
    }
    if (currentEstado.next.action === "assignDelivery") {
      toast.error("Asigna este pedido a un repartidor usando el botón del pedido.");
      return;
    }
    if (currentEstado.next.code !== targetEstadoCode) {
      const targetEstado = ESTADOS.find((estado) => estado.code === targetEstadoCode);
      toast.error(
        targetEstado
          ? `Solo puedes mover el pedido hacia "${targetEstado.label}" desde este estado.`
          : "No puedes mover el pedido a este estado.",
      );
      return;
    }

    openConfirm(pedido, currentEstado.next);
  };

  const handleDragCancel = () => {
    setActivePedidoId(null);
  };

  const handleAssignEntrega = async (repartidorId: number) => {
    if (!assigningPedido) {
      return;
    }
    await assignMutation.mutateAsync({ pedidoId: assigningPedido.id, repartidorId });
  };

  return (
    <section className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Pedidos recibidos</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Controla el flujo de pedidos desde que llegan hasta que están listos para entregar.
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Arrastra un pedido hacia la siguiente columna o usa el botón para avanzar su estado.
          </p>
        </div>
      </header>

      {pedidosQuery.isLoading ? (
        <div className="grid gap-6 lg:grid-cols-3">
          {["pendiente", "preparacion", "listo"].map((columnKey) => (
            <div key={columnKey} className="space-y-4">
              <Skeleton className="h-6 w-48" />
              {["a", "b", "c"].map((cardKey) => (
                <Skeleton key={`${columnKey}-${cardKey}`} className="h-40 w-full" />
              ))}
            </div>
          ))}
        </div>
      ) : (
        <>
          <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={handleDragCancel}>
            <div className="grid gap-6 lg:grid-cols-3">
              {grouped.columnas.map(({ estado, pedidos: pedidosPorEstado }) => (
                <PedidosColumn
                  key={estado.code}
                  estado={estado}
                  pedidos={pedidosPorEstado}
                  onOpenConfirm={openConfirm}
                  updatingId={mutation.isPending ? pendingAction?.pedido.id ?? null : null}
                  activePedidoId={activePedidoId}
                />
              ))}
            </div>
          </DndContext>

          {grouped.otros.length > 0 ? (
            <section className="space-y-4">
              <header className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">Otros estados</h2>
                <Badge variant="default">{grouped.otros.length}</Badge>
              </header>
              <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {grouped.otros.map((pedido) => (
                  <li key={pedido.id}>
                    <PedidoCard
                      pedido={pedido}
                      estado={{
                        code: pedido.codigo_estado,
                        label: pedido.estado,
                        accent: "default",
                        emptyMessage: "",
                      }}
                      onOpenConfirm={openConfirm}
                      isUpdating={mutation.isPending && pendingAction?.pedido.id === pedido.id}
                      isDragEnabled={false}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </>
      )}

      <AssignEntregaDialog
        pedido={assigningPedido}
        isOpen={Boolean(assigningPedido)}
        onClose={() => setAssigningPedido(null)}
        onAssign={handleAssignEntrega}
        isSubmitting={assignMutation.isPending}
      />

      <ConfirmDialog
        isOpen={Boolean(pendingAction)}
        title={pendingAction ? `Pedido #${pendingAction.pedido.id}` : ""}
        description={pendingAction?.next.confirmMessage ?? ""}
        confirmText={pendingAction?.next.label ?? "Confirmar"}
        onCancel={closeConfirm}
        onConfirm={handleConfirm}
        isSubmitting={mutation.isPending}
      />
    </section>
  );
}

type PedidoCardProps = Readonly<{
  pedido: PedidoTablero;
  estado: EstadoConfig;
  isUpdating: boolean;
  onOpenConfirm: (pedido: PedidoTablero, next: NonNullable<EstadoConfig["next"]>) => void;
  isDragEnabled?: boolean;
}>;

function PedidoCard({ pedido, estado, isUpdating, onOpenConfirm, isDragEnabled = true }: PedidoCardProps) {
  const createdAt = useMemo(() => dayjs(pedido.creado_en).format("DD/MM/YYYY HH:mm"), [pedido.creado_en]);
  const totalFormatted = useMemo(() => currencyFormatter.format(pedido.total), [pedido.total]);
  const pesoFormatted = useMemo(() => `${pedido.peso_total.toFixed(2)} kg`, [pedido.peso_total]);
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `pedido-${pedido.id}`,
    data: { pedido },
    disabled: !isDragEnabled,
  });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={clsx(
        "flex cursor-grab flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-900",
        {
          "cursor-default": !isDragEnabled,
          "opacity-60 ring-2 ring-blue-400": isDragging,
        },
      )}
      {...listeners}
      {...attributes}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">Pedido #{pedido.id}</p>
          <p className="text-xs text-slate-500">Creado {createdAt}</p>
        </div>
        <Badge variant={estado.accent} className="capitalize">
          {pedido.estado}
        </Badge>
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-slate-600 dark:text-slate-300">
        <div>
          <dt className="font-medium text-slate-500">Total</dt>
          <dd className="text-sm font-semibold text-slate-800 dark:text-slate-100">{totalFormatted}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-500">Peso total</dt>
          <dd>{pesoFormatted}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-500">Subtotal</dt>
          <dd>{currencyFormatter.format(pedido.subtotal)}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-500">Envío</dt>
          <dd>{currencyFormatter.format(pedido.envio)}</dd>
        </div>
      </dl>

      {estado.next ? (
        <div className="flex items-center justify-end gap-2">
          <Button size="sm" variant="primary" onClick={() => onOpenConfirm(pedido, estado.next!)} disabled={isUpdating}>
            {isUpdating ? (
              <Fragment>
                <Spinner size="sm" />
                <span className="ml-2">Actualizando...</span>
              </Fragment>
            ) : (
              estado.next.label
            )}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

type PedidosColumnProps = Readonly<{
  estado: EstadoConfig;
  pedidos: PedidoTablero[];
  onOpenConfirm: (pedido: PedidoTablero, next: NonNullable<EstadoConfig["next"]>) => void;
  updatingId: number | null;
  activePedidoId: number | null;
}>;

function PedidosColumn({ estado, pedidos, onOpenConfirm, updatingId, activePedidoId }: PedidosColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: estado.code });
  const isEmpty = pedidos.length === 0;

  return (
    <article
      ref={setNodeRef}
      className={clsx("flex min-h-[18rem] flex-col gap-4 rounded-xl border border-transparent p-2 transition", {
        "ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-100 dark:ring-offset-slate-900": isOver,
      })}
    >
      <header className="flex items-center justify-between gap-2 px-2">
        <h2 className="text-lg font-semibold">{estado.label}</h2>
        <Badge variant={estado.accent}>{pedidos.length}</Badge>
      </header>
      {isEmpty ? (
        <p className="rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-500 dark:border-slate-700">
          {estado.emptyMessage}
        </p>
      ) : (
        <ul className="space-y-4">
          {pedidos.map((pedido) => (
            <li key={pedido.id}>
              <PedidoCard
                pedido={pedido}
                estado={estado}
                onOpenConfirm={onOpenConfirm}
                isUpdating={updatingId === pedido.id}
                isDragEnabled={Boolean(estado.next)}
              />
            </li>
          ))}
        </ul>
      )}
      {activePedidoId && isEmpty ? (
        <p className="text-center text-xs text-slate-400">Suelta aquí para mover el pedido.</p>
      ) : null}
    </article>
  );
}

type AssignEntregaDialogProps = Readonly<{
  pedido: PedidoTablero | null;
  isOpen: boolean;
  onClose: () => void;
  onAssign: (repartidorId: number) => Promise<void>;
  isSubmitting: boolean;
}>;

function AssignEntregaDialog({ pedido, isOpen, onClose, onAssign, isSubmitting }: AssignEntregaDialogProps) {
  const [selectedId, setSelectedId] = useState<string>("");
  const repartidoresQuery = useQuery<RepartidorDisponible[]>({
    queryKey: queryKeys.tienda.repartidores.list(),
    queryFn: () => fetchRepartidoresDisponibles(),
    enabled: isOpen,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!isOpen) {
      setSelectedId("");
    }
  }, [isOpen]);

  const repartidores = repartidoresQuery.data ?? [];
  const selectedRepartidor = repartidores.find((rep) => rep.id === Number(selectedId)) ?? null;

  let content: ReactNode;
  if (repartidoresQuery.isLoading) {
    content = (
      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
        <Spinner size="sm" />
        <span>Cargando repartidores disponibles...</span>
      </div>
    );
  } else if (repartidores.length > 0) {
    content = (
      <div className="space-y-3">
        <Select
          value={selectedId}
          onChange={(event) => setSelectedId(event.target.value)}
          disabled={isSubmitting}
        >
          <option value="">Selecciona un repartidor...</option>
          {repartidores.map((repartidor) => (
            <option key={repartidor.id} value={repartidor.id}>
              {repartidor.nombreCompleto} • {repartidor.vehiculo.toLowerCase()}
            </option>
          ))}
        </Select>

        {selectedRepartidor ? (
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-200">
            <p className="font-semibold text-slate-700 dark:text-slate-100">{selectedRepartidor.nombreCompleto}</p>
            <p>Vehículo: {selectedRepartidor.vehiculo}</p>
            {selectedRepartidor.telefono ? <p>Teléfono: {selectedRepartidor.telefono}</p> : null}
          </div>
        ) : null}
      </div>
    );
  } else {
    content = (
      <div className="rounded-md border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-300">
        No hay repartidores activos disponibles en este momento. Puedes actualizar la lista más tarde.
      </div>
    );
  }

  const handleAssign = () => {
    if (!selectedId) {
      toast.error("Selecciona un repartidor para continuar.");
      return;
    }
    void onAssign(Number(selectedId)).catch(() => {
      /* El manejo de errores se realiza en la mutación principal. */
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={pedido ? `Asignar reparto para el pedido #${pedido.id}` : "Asignar entrega"}
    >
      <div className="space-y-5">
        <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
          <p>Selecciona un repartidor activo para enviar este pedido al cliente.</p>
        </div>

        {content}

        {repartidoresQuery.isError ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/30 dark:text-red-200">
            Ocurrió un error al obtener los repartidores. Intenta actualizar la lista.
          </div>
        ) : null}

        <div className="flex flex-wrap justify-between gap-3">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => repartidoresQuery.refetch()}
              disabled={repartidoresQuery.isLoading || isSubmitting}
            >
              Actualizar lista
            </Button>
            <Button
              variant="primary"
              onClick={handleAssign}
              disabled={isSubmitting || repartidores.length === 0}
            >
              {isSubmitting ? (
                <>
                  <Spinner size="sm" />
                  <span className="ml-2">Asignando...</span>
                </>
              ) : (
                "Asignar entrega"
              )}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
