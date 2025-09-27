import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";

import {
  fetchAdminClientes,
  updateAdminClienteActivo,
  deleteAdminCliente,
  type AdminClientesParams,
  type AdminClientesResponse,
} from "../../../api/admin.api";
import { queryKeys } from "../../../api/queryKeys";
import type { ClienteAdmin, ClientePedidoHistorial } from "../../../api/types";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
import { DataTable } from "../../../components/tables/DataTable";
import { FilterBar } from "../../../components/ui/FilterBar";
import { Modal } from "../../../components/ui/Modal";
import { Paginator } from "../../../components/ui/Paginator";
import { SearchInput } from "../../../components/ui/SearchInput";
import { useToast } from "../../../hooks/useToast";
import { formatCurrency, formatDateTime } from "../../../utils/format";

const ACTIVO_OPTIONS = [
  { value: "all", label: "Todos" },
  { value: "true", label: "Activos" },
  { value: "false", label: "Suspendidos" },
];

export default function AdminClientesPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [activo, setActivo] = useState<string>("all");
  const [search, setSearch] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [perPage] = useState<number>(25);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<ClienteAdmin | null>(null);
  const [accion, setAccion] = useState<"activar" | "suspender" | "eliminar" | null>(null);

  const filters = useMemo<AdminClientesParams>(() => {
    const params: AdminClientesParams = { page, per_page: perPage };
    if (activo !== "all") {
      params.activo = activo === "true";
    }
    return params;
  }, [activo, page, perPage]);

  const clientesQuery = useQuery<AdminClientesResponse>({
    queryKey: queryKeys.admin.clientes.list(filters),
    queryFn: () => fetchAdminClientes(filters),
    placeholderData: (previousData) => previousData,
  });

  const clientes = useMemo(() => clientesQuery.data?.clientes ?? [], [clientesQuery.data]);
  const meta = clientesQuery.data?.meta ?? { page: 1, per_page: perPage, total: 0 };

  const resultados = useMemo(() => {
    if (!search.trim()) {
      return clientes;
    }
    const term = search.trim().toLowerCase();
    return clientes.filter((cliente) => {
      const nombre = `${cliente.nombres ?? cliente.nombre ?? ""} ${cliente.apellidos ?? ""}`.trim();
      const correo = (cliente.email ?? cliente.correo ?? "").toLowerCase();
      return nombre.toLowerCase().includes(term) || correo.includes(term);
    });
  }, [clientes, search]);

  const activarMutation = useMutation({
    mutationFn: (cliente: ClienteAdmin) => updateAdminClienteActivo(cliente.id_usuario, true),
    onSuccess: () => {
      toast.show("Cliente activado", "success");
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.clientes.root });
    },
    onError: (error: unknown) => toast.show(String(error instanceof Error ? error.message : error), "error"),
  });

  const suspenderMutation = useMutation({
    mutationFn: (cliente: ClienteAdmin) => updateAdminClienteActivo(cliente.id_usuario, false),
    onSuccess: () => {
      toast.show("Cliente suspendido", "info");
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.clientes.root });
    },
    onError: (error: unknown) => toast.show(String(error instanceof Error ? error.message : error), "error"),
  });

  const eliminarMutation = useMutation({
    mutationFn: (cliente: ClienteAdmin) => deleteAdminCliente(cliente.id_usuario),
    onSuccess: () => {
      toast.show("Cliente eliminado", "info");
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.clientes.root });
    },
    onError: (error: unknown) => toast.show(String(error instanceof Error ? error.message : error), "error"),
  });

  const abrirAccion = useCallback((cliente: ClienteAdmin, accionNueva: "activar" | "suspender" | "eliminar") => {
    setClienteSeleccionado(cliente);
    setAccion(accionNueva);
  }, []);

  const columns = useMemo<ColumnDef<ClienteAdmin>[]>(() => [
    {
      accessorKey: "nombres",
      header: "Cliente",
      cell: ({ row }) => {
        const nombre = `${row.original.nombres ?? row.original.nombre ?? ""} ${row.original.apellidos ?? ""}`.trim();
        const correo = row.original.email ?? row.original.correo ?? "";
        return (
          <div>
            <p className="font-semibold text-slate-900 dark:text-slate-100">{nombre}</p>
            <p className="text-xs text-slate-500">{correo}</p>
          </div>
        );
      },
    },
    {
      accessorKey: "pedidos_totales",
      header: "Pedidos",
      cell: ({ row }) => row.original.pedidos_totales,
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
      id: "ultimo_pedido",
      header: "Ultimo pedido",
      cell: ({ row }) => {
        const pedido = row.original.historial_pedidos?.[0];
        return pedido ? formatDateTime(pedido.creado_en) : "Sin pedidos";
      },
    },
    {
      id: "acciones",
      header: "Acciones",
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => setClienteSeleccionado(row.original)}>
            Historial
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => abrirAccion(row.original, row.original.activo ? "suspender" : "activar")}
          >
            {row.original.activo ? "Suspender" : "Activar"}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => abrirAccion(row.original, "eliminar")}>
            Eliminar
          </Button>
        </div>
      ),
    },
  ], [abrirAccion]);

  const cerrarDialogo = useCallback(() => {
    setAccion(null);
    setClienteSeleccionado(null);
  }, []);

  const confirmarAccion = useCallback(async () => {
    if (!clienteSeleccionado || !accion) return;
    if (accion === "activar") {
      await activarMutation.mutateAsync(clienteSeleccionado);
    } else if (accion === "suspender") {
      await suspenderMutation.mutateAsync(clienteSeleccionado);
    } else {
      await eliminarMutation.mutateAsync(clienteSeleccionado);
    }
    cerrarDialogo();
  }, [accion, activarMutation, clienteSeleccionado, cerrarDialogo, eliminarMutation, suspenderMutation]);

  const exportarCsv = useCallback(() => {
    const encabezados = ["Nombre", "Correo", "Telefono", "Activo", "Pedidos", "Ultimo pedido"];
    const filas = resultados.map((cliente) => {
      const ultimo = cliente.historial_pedidos?.[0];
      return [
        `${cliente.nombres ?? cliente.nombre ?? ""} ${cliente.apellidos ?? ""}`.trim(),
        cliente.email ?? cliente.correo ?? "",
        cliente.telefono ?? "",
        cliente.activo ? "SI" : "NO",
        String(cliente.pedidos_totales),
        ultimo ? formatDateTime(ultimo.creado_en) : "Sin pedidos",
      ];
    });
    const csv = [encabezados, ...filas]
      .map((fila) => fila.map(escapeCsv).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "clientes.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [resultados]);

  const direccionesSeleccionadas = clienteSeleccionado?.direcciones ?? [];
  const pedidosSeleccionados = clienteSeleccionado?.historial_pedidos ?? [];

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Clientes</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Consulta rapida de clientes registrados con accesos a pedidos recientes y direcciones.
          </p>
        </div>
        <Button variant="outline" onClick={exportarCsv} disabled={resultados.length === 0}>
          Exportar CSV
        </Button>
      </header>

      <FilterBar
        onReset={() => {
          setActivo("all");
          setSearch("");
          setPage(1);
        }}
      >
        <SearchInput
          defaultValue={search}
          placeholder="Buscar nombre o correo"
          onSearch={(value) => {
            setSearch(value);
            setPage(1);
          }}
        />
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
        data={resultados}
        columns={columns}
        loading={clientesQuery.isLoading}
        emptyState="No hay clientes registrados"
        pageSize={perPage}
      />

      <Paginator page={meta.page} perPage={meta.per_page} total={meta.total} onPageChange={setPage} />

      <Modal
        isOpen={Boolean(clienteSeleccionado) && accion === null}
        onClose={() => setClienteSeleccionado(null)}
        title="Historial del cliente"
      >
        {clienteSeleccionado ? (
          <div className="space-y-4 text-sm">
            <div>
              <p className="font-semibold">Direcciones registradas</p>
              {direccionesSeleccionadas.length === 0 ? (
                <p className="mt-2 text-xs text-slate-500">Sin direcciones registradas.</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {direccionesSeleccionadas.map((direccion) => (
                    <li
                      key={direccion.id_direccion}
                      className="rounded-md border border-slate-200 p-3 text-xs dark:border-slate-700"
                    >
                      <p>{direccion.linea1}</p>
                      <p>
                        {direccion.ciudad}, {direccion.pais}
                      </p>
                      {direccion.ubicacion ? <p>Ubicacion: {direccion.ubicacion}</p> : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <p className="font-semibold">Ultimos pedidos</p>
              {pedidosSeleccionados.length === 0 ? (
                <p className="mt-2 text-xs text-slate-500">Sin pedidos registrados.</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {pedidosSeleccionados.map((pedido) => (
                    <HistorialPedidoItem key={pedido.id_pedido} pedido={pedido} />
                  ))}
                </ul>
              )}
            </div>
          </div>
        ) : null}
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(accion)}
        title={
          accion === "activar"
            ? "Activar cliente"
            : accion === "suspender"
            ? "Suspender cliente"
            : "Eliminar cliente"
        }
        description={
          clienteSeleccionado
            ? `${clienteSeleccionado.nombres ?? clienteSeleccionado.nombre ?? ""} ${
                clienteSeleccionado.apellidos ?? ""
              }. Confirma la accion.`
            : "Confirma la accion"
        }
        confirmText={accion === "activar" ? "Activar" : accion === "suspender" ? "Suspender" : "Eliminar"}
        variant={accion === "activar" ? "default" : "danger"}
        isSubmitting={
          activarMutation.isPending || suspenderMutation.isPending || eliminarMutation.isPending
        }
        onCancel={cerrarDialogo}
        onConfirm={confirmarAccion}
      />
    </section>
  );
}

function HistorialPedidoItem({ pedido }: { pedido: ClientePedidoHistorial }) {
  return (
    <li className="rounded-md border border-slate-200 p-3 text-xs dark:border-slate-700">
      <p>Pedido #{pedido.id_pedido}</p>
      <p>Fecha: {formatDateTime(pedido.creado_en)}</p>
      <p>Total: {formatCurrency(pedido.total_q)}</p>
      <p>Estado: {pedido.estado}</p>
      <p>Tienda: {pedido.tienda?.razon_social ?? pedido.tienda?.nombre ?? "Sin dato"}</p>
    </li>
  );
}

function escapeCsv(value: string) {
  if (value.includes(",") || value.includes("\"")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
