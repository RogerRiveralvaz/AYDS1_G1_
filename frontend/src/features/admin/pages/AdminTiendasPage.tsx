import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  fetchAdminTiendas,
  updateAdminTiendaEstado,
  updateAdminTiendaActivo,
  deleteAdminTienda,
  type AdminTiendasParams,
  type AdminTiendasResponse,
} from "../../../api/admin.api";
import { queryKeys } from "../../../api/queryKeys";
import type { TiendaAdmin } from "../../../api/types";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
import { DataTable } from "../../../components/tables/DataTable";
import { FilterBar } from "../../../components/ui/FilterBar";
import { Paginator } from "../../../components/ui/Paginator";
import { SearchInput } from "../../../components/ui/SearchInput";
import { useToast } from "../../../hooks/useToast";
import type { ColumnDef } from "@tanstack/react-table";

const ESTADOS = [
  { value: "", label: "Todos" },
  { value: "PENDING", label: "Pendiente" },
  { value: "APPROVED", label: "Aprobada" },
  { value: "SUSPENDED", label: "Suspendida" },
  { value: "REJECTED", label: "Rechazada" },
];

const ACTIVO_OPTIONS = [
  { value: "all", label: "Todas" },
  { value: "true", label: "Activas" },
  { value: "false", label: "Inactivas" },
];

export default function AdminTiendasPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [estado, setEstado] = useState<string>("");
  const [activo, setActivo] = useState<string>("all");
  const [search, setSearch] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [perPage] = useState<number>(20);
  const [tiendaSeleccionada, setTiendaSeleccionada] = useState<TiendaAdmin | null>(null);
  const [accion, setAccion] = useState<"suspender" | "aprobar" | "eliminar" | null>(null);

  const filters = useMemo(() => {
    const params: AdminTiendasParams = { page, per_page: perPage };
    if (estado) {
      params.estado = estado;
    }
    if (activo !== "all") {
      params.activo = activo === "true";
    }
    return params;
  }, [estado, activo, page, perPage]);

  const tiendasQuery = useQuery<AdminTiendasResponse>({
    queryKey: queryKeys.admin.tiendas.list(filters),
    queryFn: () => fetchAdminTiendas(filters),
    placeholderData: (previousData) => previousData,
  });

  const tiendas = tiendasQuery.data?.tiendas ?? [];
  const meta = tiendasQuery.data?.meta ?? { page: 1, per_page: perPage, total: 0 };

  const filteredData = useMemo(() => {
    if (!search.trim()) {
      return tiendas;
    }
    const term = search.trim().toLowerCase();
    return tiendas.filter((tienda) => {
      const razon = tienda.razon_social?.toLowerCase?.() ?? "";
      const correo = (tienda.email ?? "").toLowerCase();
      return razon.includes(term) || correo.includes(term);
    });
  }, [tiendas, search]);

  const aprobarMutation = useMutation({
    mutationFn: (payload: { id: number; codigo: string }) => updateAdminTiendaEstado(payload),
    onSuccess: () => {
      toast.show("Estado actualizado", "success");
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.tiendas.root });
    },
    onError: (error: unknown) => {
      toast.show(String(error instanceof Error ? error.message : error), "error");
    },
  });

  const activoMutation = useMutation({
    mutationFn: ({ id, activo: isActive }: { id: number; activo: boolean }) => updateAdminTiendaActivo(id, isActive),
    onSuccess: () => {
      toast.show("Estado de actividad actualizado", "success");
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.tiendas.root });
    },
    onError: (error: unknown) => {
      toast.show(String(error instanceof Error ? error.message : error), "error");
    },
  });

  const eliminarMutation = useMutation({
    mutationFn: (id: number) => deleteAdminTienda(id),
    onSuccess: () => {
      toast.show("Tienda suspendida", "info");
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.tiendas.root });
    },
    onError: (error: unknown) => {
      toast.show(String(error instanceof Error ? error.message : error), "error");
    },
  });

  const abrirAccion = useCallback((tienda: TiendaAdmin, accionSeleccionada: "suspender" | "aprobar" | "eliminar") => {
    setTiendaSeleccionada(tienda);
    setAccion(accionSeleccionada);
  }, []);

  const columns = useMemo<ColumnDef<TiendaAdmin>[]>(() => [
    {
      accessorKey: "razon_social",
      header: "Tienda",
      cell: ({ row }) => (
        <div>
          <p className="font-semibold text-slate-900 dark:text-slate-100">{row.original.razon_social}</p>
          <p className="text-xs text-slate-500">{row.original.email}</p>
        </div>
      ),
    },
    {
      accessorKey: "telefono",
      header: "Contacto",
      cell: ({ row }) => row.original.telefono,
    },
    {
      accessorKey: "estado_aprobacion",
      header: "Estado",
      cell: ({ row }) => (
        <Badge variant={variantEstado(row.original.estado_aprobacion)}>
          {row.original.estado_aprobacion_nombre ?? row.original.estado_aprobacion}
        </Badge>
      ),
    },
    {
      accessorKey: "activo",
      header: "Activa",
      cell: ({ row }) => (
        <Badge variant={row.original.activo ? "success" : "danger"}>
          {row.original.activo ? "Activa" : "Inactiva"}
        </Badge>
      ),
    },
    {
      id: "acciones",
      header: "Acciones",
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => abrirAccion(row.original, "aprobar")}>Aprobar</Button>
          <Button size="sm" variant="ghost" onClick={() => abrirAccion(row.original, "suspender")}>
            Suspender
          </Button>
          <Button size="sm" variant="ghost" onClick={() => abrirAccion(row.original, "eliminar")}>
            Eliminar
          </Button>
        </div>
      ),
    },
  ], [abrirAccion]);

  const cerrarDialogo = () => {
    setTiendaSeleccionada(null);
    setAccion(null);
  };

  const ejecutarAccion = async () => {
    if (!tiendaSeleccionada || !accion) return;
    switch (accion) {
      case "aprobar":
        await aprobarMutation.mutateAsync({ id: tiendaSeleccionada.id_tienda, codigo: "APPROVED" });
        break;
      case "suspender":
        await activoMutation.mutateAsync({ id: tiendaSeleccionada.id_tienda, activo: false });
        break;
      case "eliminar":
        await eliminarMutation.mutateAsync(tiendaSeleccionada.id_tienda);
        break;
    }
    cerrarDialogo();
  };

  const dialogTitle = accion ? {
    aprobar: "Aprobar tienda",
    suspender: "Suspender tienda",
    eliminar: "Eliminar tienda",
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
        <h1 className="text-2xl font-semibold">Tiendas</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Revisa el estado de las tiendas, aprueba nuevas solicitudes o suspende comercios en segundos.
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
          placeholder="Buscar tienda o correo"
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
          {ACTIVO_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </FilterBar>

      <DataTable
        data={filteredData}
        columns={columns}
        loading={tiendasQuery.isLoading}
        emptyState="No hay tiendas con estos filtros"
        pageSize={perPage}
      />

      <Paginator
        page={meta.page}
        perPage={meta.per_page}
        total={meta.total}
        onPageChange={(value) => setPage(value)}
      />

      <ConfirmDialog
        isOpen={Boolean(tiendaSeleccionada)}
        title={dialogTitle}
        description={
          tiendaSeleccionada
            ? `${tiendaSeleccionada.razon_social}: confirma la accion seleccionada.`
            : ""
        }
        confirmText={confirmText}
        variant={dialogVariant}
        isSubmitting={aprobarMutation.isPending || activoMutation.isPending || eliminarMutation.isPending}
        onCancel={cerrarDialogo}
        onConfirm={ejecutarAccion}
      />
    </section>
  );
}

function variantEstado(codigo: string) {
  switch (codigo) {
    case "APPROVED":
      return "success" as const;
    case "REJECTED":
      return "danger" as const;
    case "SUSPENDED":
      return "warning" as const;
    default:
      return "info" as const;
  }
}
