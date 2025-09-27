import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import {
  fetchProductosTienda,
  cambiarEstadoProducto,
  eliminarProducto,
  type ProductoOwner,
} from "../../../api/tiendas.api";
import { queryKeys } from "../../../api/queryKeys";
import { formatCurrency } from "../../../utils/format";
import { DataTable } from "../../../components/tables/DataTable";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";
import { Switch } from "../../../components/ui/Switch";
import { SearchInput } from "../../../components/ui/SearchInput";
import { Select } from "../../../components/ui/Select";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";

type EstadoFiltro = "todos" | "activos" | "inactivos";

export default function ProductosPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [terminoBusqueda, setTerminoBusqueda] = useState("");
  const [estado, setEstado] = useState<EstadoFiltro>("todos");
  const [productoPorEliminar, setProductoPorEliminar] = useState<ProductoOwner | null>(null);
  const [productoEnToggle, setProductoEnToggle] = useState<number | null>(null);

  const { data: productos = [], isLoading, isError } = useQuery({
    queryKey: queryKeys.tienda.productos.list(),
    queryFn: fetchProductosTienda,
  });

  const toggleEstado = useMutation({
    mutationFn: ({ id, activo }: { id: number; activo: boolean }) => cambiarEstadoProducto(id, activo),
    onMutate: ({ id }) => {
      setProductoEnToggle(id);
    },
    onSuccess: (producto) => {
      toast.success(`Producto ${producto.activo ? "activado" : "desactivado"}`);
      queryClient.invalidateQueries({ queryKey: queryKeys.tienda.productos.list() });
    },
    onError: () => {
      toast.error("No se pudo actualizar el estado del producto");
    },
    onSettled: () => {
      setProductoEnToggle(null);
    },
  });

  const eliminar = useMutation({
    mutationFn: (id: number) => eliminarProducto(id),
    onSuccess: () => {
      toast.success("Producto eliminado");
      queryClient.invalidateQueries({ queryKey: queryKeys.tienda.productos.list() });
    },
    onError: () => {
      toast.error("No se pudo eliminar el producto");
    },
    onSettled: () => {
      setProductoPorEliminar(null);
    },
  });

  const filteredProducts = useMemo(() => {
    const termino = terminoBusqueda.trim().toLowerCase();
    return productos.filter((producto) => {
      const coincideBusqueda = termino
        ? producto.nombre.toLowerCase().includes(termino) || producto.sku?.toLowerCase().includes(termino)
        : true;

      let coincideEstado = true;
      if (estado === "activos") {
        coincideEstado = producto.activo;
      } else if (estado === "inactivos") {
        coincideEstado = !producto.activo;
      }

      return coincideBusqueda && coincideEstado;
    });
  }, [productos, terminoBusqueda, estado]);

  const handleToggle = useCallback(
    (producto: ProductoOwner) => {
      toggleEstado.mutate({ id: producto.id_producto, activo: !producto.activo });
    },
    [toggleEstado],
  );

  const handleEdit = useCallback(
    (producto: ProductoOwner) => {
      navigate(`/app/tienda/productos/${producto.id_producto}/editar`);
    },
    [navigate],
  );

  const handleDeleteRequest = useCallback((producto: ProductoOwner) => {
    setProductoPorEliminar(producto);
  }, []);

  const columnas = useMemo<ColumnDef<ProductoOwner, unknown>[]>(
    () => [
      {
        header: "Producto",
        accessorKey: "nombre",
        cell: ({ row }) => <ProductoResumenCell producto={row.original} />,
      },
      {
        header: "Precio",
        accessorKey: "precio",
        cell: ({ row }) => <ProductoPrecioCell producto={row.original} />,
      },
      {
        header: "Stock",
        accessorKey: "stock",
        cell: ({ row }) => <ProductoStockCell producto={row.original} />,
      },
      {
        header: "Etiquetas",
        cell: ({ row }) => <ProductoEtiquetasCell producto={row.original} />,
      },
      {
        header: "Acciones",
        cell: ({ row }) => (
          <AccionesProductoCell
            producto={row.original}
            disabled={productoEnToggle === row.original.id_producto && toggleEstado.isPending}
            onToggle={handleToggle}
            onEdit={handleEdit}
            onDelete={handleDeleteRequest}
          />
        ),
      },
    ],
    [productoEnToggle, toggleEstado.isPending, handleToggle, handleEdit, handleDeleteRequest],
  );

  const opcionesEstado: Array<{ value: EstadoFiltro; label: string }> = [
    { value: "todos", label: "Todos" },
    { value: "activos", label: "Activos" },
    { value: "inactivos", label: "Inactivos" },
  ];

  if (isError) {
    return (
      <section className="space-y-4">
        <header>
          <h1 className="text-2xl font-semibold">Productos</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Hubo un problema al cargar tus productos. Intenta nuevamente en unos minutos.
          </p>
        </header>
        <Button onClick={() => queryClient.invalidateQueries({ queryKey: queryKeys.tienda.productos.list() })}>
          Reintentar
        </Button>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Productos</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Administra el catálogo, carga imágenes y controla el stock en tiempo real.
          </p>
        </div>
        <Button onClick={() => navigate("/app/tienda/productos/nuevo")}>Nuevo producto</Button>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          placeholder="Buscar por nombre o SKU"
          onSearch={setTerminoBusqueda}
          defaultValue={terminoBusqueda}
        />
        <Select
          value={estado}
          onChange={(event) => setEstado(event.target.value as EstadoFiltro)}
          className="w-40"
        >
          {opcionesEstado.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>

      <DataTable
        data={filteredProducts}
        columns={columnas}
        loading={isLoading}
        emptyState="Aún no tienes productos registrados"
      />

      <ConfirmDialog
        isOpen={Boolean(productoPorEliminar)}
        title="Eliminar producto"
        description={
          <p>
            ¿Deseas eliminar <strong>{productoPorEliminar?.nombre}</strong>? Esta acción no se puede deshacer y se
            retirará del catálogo y de los pedidos abiertos.
          </p>
        }
        variant="danger"
        confirmText="Eliminar"
        isSubmitting={eliminar.isPending}
        onCancel={() => setProductoPorEliminar(null)}
        onConfirm={() => (productoPorEliminar ? eliminar.mutate(productoPorEliminar.id_producto) : undefined)}
      />
    </section>
  );
}

interface ProductoCellProps {
  readonly producto: ProductoOwner;
}

function ProductoResumenCell({ producto }: ProductoCellProps) {
  const imagenPrincipal = producto.imagenes.find((imagen) => imagen.principal);
  return (
    <div className="flex items-center gap-3">
      {imagenPrincipal ? (
        <img
          src={imagenPrincipal.url}
          alt={producto.nombre}
          className="h-12 w-12 rounded-md object-cover"
          loading="lazy"
        />
      ) : (
        <div className="flex h-12 w-12 items-center justify-center rounded-md bg-slate-100 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-300">
          Sin imagen
        </div>
      )}
      <div>
        <p className="font-semibold text-slate-900 dark:text-slate-100">{producto.nombre}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">SKU: {producto.sku ?? "—"}</p>
      </div>
    </div>
  );
}

function ProductoPrecioCell({ producto }: ProductoCellProps) {
  return <span>{formatCurrency(producto.precio)}</span>;
}

function ProductoStockCell({ producto }: ProductoCellProps) {
  const esBajo = producto.stock <= producto.umbral_bajo;
  return (
    <div className="flex flex-col text-sm">
      <span className="font-medium">{producto.stock} unidades</span>
      <span className="text-xs text-slate-500 dark:text-slate-400">Umbral: {producto.umbral_bajo}</span>
      {esBajo ? <Badge variant="warning">Stock bajo</Badge> : null}
    </div>
  );
}

function ProductoEtiquetasCell({ producto }: ProductoCellProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {producto.es_oferta ? <Badge variant="danger">Oferta</Badge> : null}
      {producto.es_nuevo ? <Badge variant="info">Nuevo</Badge> : null}
      {producto.activo ? <Badge variant="success">Activo</Badge> : <Badge variant="default">Inactivo</Badge>}
    </div>
  );
}

interface AccionesProductoCellProps {
  readonly producto: ProductoOwner;
  readonly disabled: boolean;
  readonly onToggle: (producto: ProductoOwner) => void;
  readonly onEdit: (producto: ProductoOwner) => void;
  readonly onDelete: (producto: ProductoOwner) => void;
}

function AccionesProductoCell({ producto, disabled, onToggle, onEdit, onDelete }: AccionesProductoCellProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Switch
        checked={producto.activo}
        label={producto.activo ? "Activo" : "Inactivo"}
        disabled={disabled}
        onCheckedChange={() => onToggle(producto)}
      />
      <Button variant="outline" size="sm" onClick={() => onEdit(producto)}>
        Editar
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="text-red-600 hover:text-red-500"
        onClick={() => onDelete(producto)}
      >
        Eliminar
      </Button>
    </div>
  );
}
