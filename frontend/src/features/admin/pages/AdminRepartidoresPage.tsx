import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";

import {
  fetchAdminRepartidores,
  updateAdminRepartidorEstado,
  updateAdminRepartidorActivo,
  deleteAdminRepartidor,
  type AdminRepartidoresParams,
  type AdminRepartidoresResponse,
} from "../../../api/admin.api";
import { queryKeys } from "../../../api/queryKeys";
import type { RepartidorAdmin } from "../../../api/types";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
import { DataTable } from "../../../components/tables/DataTable";
import { FilterBar } from "../../../components/ui/FilterBar";
import { Modal } from "../../../components/ui/Modal";
import { Paginator } from "../../../components/ui/Paginator";
import { SearchInput } from "../../../components/ui/SearchInput";
import { useToast } from "../../../hooks/useToast";
import { formatDate } from "../../../utils/format";

const ESTADOS = [
  { value: "", label: "Todos" },
  { value: "PENDING", label: "Pendiente" },
  { value: "APPROVED", label: "Aprobado" },
  { value: "SUSPENDED", label: "Suspendido" },
];

const ACTIVO = [
  { value: "all", label: "Todos" },
  { value: "true", label: "Activos" },
  { value: "false", label: "Inactivos" },
];

export default function AdminRepartidoresPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [estado, setEstado] = useState<string>("");
  const [activo, setActivo] = useState<string>("all");
  const [search, setSearch] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [perPage] = useState<number>(20);
  const [detalle, setDetalle] = useState<RepartidorAdmin | null>(null);
  const [accion, setAccion] = useState<"aprobar" | "suspender" | "eliminar" | null>(null);

  const filters = useMemo<AdminRepartidoresParams>(() => {
    const params: AdminRepartidoresParams = { page, per_page: perPage };
    if (estado) params.estado = estado;
    if (activo !== "all") params.activo = activo === "true";
    return params;
  }, [estado, activo, page, perPage]);

  const [repartidorSeleccionado, setRepartidorSeleccionado] = useState<RepartidorAdmin | null>(null);

  const repartidoresQuery = useQuery<AdminRepartidoresResponse>({
    queryKey: queryKeys.admin.repartidores.list(filters),
    queryFn: () => fetchAdminRepartidores(filters),
    placeholderData: (previousData) => previousData,
  });

  const repartidores = repartidoresQuery.data?.repartidores ?? [];
  const meta = repartidoresQuery.data?.meta ?? { page: 1, per_page: perPage, total: 0 };

  const filtrados = useMemo(() => {
    if (!search.trim()) return repartidores;
    const term = search.trim().toLowerCase();
    return repartidores.filter((rep) => {
      const nombre = rep.usuario?.nombres ? `${rep.usuario.nombres} ${rep.usuario.apellidos ?? ""}` : "";
      return nombre.toLowerCase().includes(term) || (rep.usuario?.email ?? "").toLowerCase().includes(term);
    });
  }, [repartidores, search]);

  const aprobarMutation = useMutation({
    mutationFn: (id: number) => updateAdminRepartidorEstado(id, "APPROVED"),
    onSuccess: () => {
      toast.show("Repartidor aprobado", "success");
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.repartidores.root });
    },
    onError: (error: unknown) => toast.show(String(error instanceof Error ? error.message : error), "error"),
  });

  const suspenderMutation = useMutation({
    mutationFn: (id: number) => updateAdminRepartidorActivo(id, false),
    onSuccess: () => {
      toast.show("Repartidor suspendido", "info");
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.repartidores.root });
    },
    onError: (error: unknown) => toast.show(String(error instanceof Error ? error.message : error), "error"),
  });

  const eliminarMutation = useMutation({
    mutationFn: (id: number) => deleteAdminRepartidor(id),
    onSuccess: () => {
      toast.show("Repartidor eliminado", "info");
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.repartidores.root });
    },
    onError: (error: unknown) => toast.show(String(error instanceof Error ? error.message : error), "error"),
  });

  const abrirAccion = useCallback((rep: RepartidorAdmin, nuevaAccion: "aprobar" | "suspender" | "eliminar") => {
    setRepartidorSeleccionado(rep);
    setAccion(nuevaAccion);
  }, [setAccion, setRepartidorSeleccionado]);

  const columns = useMemo<ColumnDef<RepartidorAdmin>[]>(() => [
    {
      accessorKey: "usuario.nombres",
      header: "Repartidor",
      cell: ({ row }) => (
        <div>
          <p className="font-semibold text-slate-900 dark:text-slate-100">
            {row.original.usuario?.nombres} {row.original.usuario?.apellidos}
          </p>
          <p className="text-xs text-slate-500">{row.original.usuario?.email}</p>
        </div>
      ),
    },
    {
      accessorKey: "vehiculo_tipo",
      header: "Vehiculo",
      cell: ({ row }) => row.original.vehiculo_tipo,
    },
    {
      accessorKey: "estado_aprobacion",
      header: "Estado",
      cell: ({ row }) => (
        <Badge variant={variantEstado(row.original.estado_aprobacion)}>
          {row.original.estado_aprobacion}
        </Badge>
      ),
    },
    {
      accessorKey: "activo",
      header: "Activo",
      cell: ({ row }) => (
        <Badge variant={row.original.activo ? "success" : "danger"}>
          {row.original.activo ? "Si" : "No"}
        </Badge>
      ),
    },
    {
      id: "acciones",
      header: "Acciones",
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => setDetalle(row.original)}>Ver detalle</Button>
          <Button size="sm" variant="outline" onClick={() => abrirAccion(row.original, "aprobar")}>Aprobar</Button>
          <Button size="sm" variant="ghost" onClick={() => abrirAccion(row.original, "suspender")}>
            Suspender
          </Button>
          <Button size="sm" variant="ghost" onClick={() => abrirAccion(row.original, "eliminar")}>Eliminar</Button>
        </div>
      ),
    },
  ], [abrirAccion]);

  const cerrarDialogo = () => {
    setAccion(null);
    setRepartidorSeleccionado(null);
  };

  const confirmarAccion = async () => {
    if (!repartidorSeleccionado || !accion) return;
    if (accion === "aprobar") {
      await aprobarMutation.mutateAsync(repartidorSeleccionado.id_usuario);
    } else if (accion === "suspender") {
      await suspenderMutation.mutateAsync(repartidorSeleccionado.id_usuario);
    } else {
      await eliminarMutation.mutateAsync(repartidorSeleccionado.id_usuario);
    }
    cerrarDialogo();
  };

  const dialogTitle = accion ? {
    aprobar: "Aprobar repartidor",
    suspender: "Suspender repartidor",
    eliminar: "Eliminar repartidor",
  }[accion] : "Confirmar accion";

  const confirmText = accion ? {
    aprobar: "Aprobar",
    suspender: "Suspender",
    eliminar: "Eliminar",
  }[accion] : "Confirmar";

  const dialogVariant = accion === "aprobar" ? "default" : "danger";

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Repartidores</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Gestiona aprobaciones, revisa documentacion y controla el estado de cada perfil activo.
        </p>
      </header>

      <FilterBar
        onReset={() => {
          setEstado("");
          setActivo("all");
          setSearch("");
          setPage(1);
        }}
      >
        <SearchInput
          placeholder="Buscar por nombre o correo"
          defaultValue={search}
          onSearch={(value) => {
            setSearch(value);
            setPage(1);
          }}
        />
        <select
          value={estado}
          onChange={(event) => {
            setEstado(event.target.value);
            setPage(1);
          }}
          className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
        >
          {ESTADOS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          value={activo}
          onChange={(event) => {
            setActivo(event.target.value);
            setPage(1);
          }}
          className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
        >
          {ACTIVO.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </FilterBar>

      <DataTable
        data={filtrados}
        columns={columns}
        loading={repartidoresQuery.isLoading}
        emptyState="No hay repartidores con estos filtros"
        pageSize={perPage}
      />

      <Paginator page={meta.page} perPage={meta.per_page} total={meta.total} onPageChange={setPage} />

      <Modal isOpen={Boolean(detalle) && !accion} onClose={() => setDetalle(null)} title="Detalle del repartidor">
        {detalle ? (
          <div className="space-y-3 text-sm">
            <p><span className="font-semibold">Nombre:</span> {detalle.usuario?.nombres} {detalle.usuario?.apellidos}</p>
            <p><span className="font-semibold">Correo:</span> {detalle.usuario?.email}</p>
            <p><span className="font-semibold">Telefono:</span> {detalle.usuario?.telefono ?? 'No registrado'}</p>
            <p><span className="font-semibold">DPI:</span> {detalle.dpi}</p>
            <p><span className="font-semibold">Vehiculo:</span> {detalle.vehiculo_tipo}</p>
            <p><span className="font-semibold">Cuenta bancaria:</span> {detalle.cuenta_bancaria}</p>
            <p><span className="font-semibold">Licencia:</span> {detalle.licencia_numero ?? 'No aplica'} ({detalle.licencia_tipo ?? 'N/A'})</p>
            <p><span className="font-semibold">Placa:</span> {detalle.placa ?? 'No aplica'}</p>
            <p><span className="font-semibold">Estado:</span> {detalle.estado_aprobacion}</p>
            <p><span className="font-semibold">Ultima revision:</span> {detalle.updated_at ? formatDate(detalle.updated_at) : 'Sin registro'}</p>
          </div>
        ) : null}
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(accion)}
        title={dialogTitle}
        description={
          repartidorSeleccionado
            ? `${repartidorSeleccionado.usuario?.nombres ?? ""} ${
                repartidorSeleccionado.usuario?.apellidos ?? ""
              }. Confirma la accion.`
            : "Confirma la accion"
        }
        confirmText={confirmText}
        variant={dialogVariant}
        isSubmitting={aprobarMutation.isPending || suspenderMutation.isPending || eliminarMutation.isPending}
        onCancel={cerrarDialogo}
        onConfirm={confirmarAccion}
      />
    </section>
  );
}

function variantEstado(codigo: string) {
  switch (codigo) {
    case "APPROVED":
      return "success" as const;
    case "SUSPENDED":
      return "warning" as const;
    case "REJECTED":
      return "danger" as const;
    default:
      return "info" as const;
  }
}
