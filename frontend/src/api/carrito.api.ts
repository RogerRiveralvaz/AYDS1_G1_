import { apiClient } from "./client";
import type { Tienda } from "./catalogo.api";

export type CarritoItem = {
  id: number;
  productoId: number;
  nombre: string;
  precio: number;
  cantidad: number;
  subtotal: number;
};

export type CarritoResumen = {
  subtotal: number;
  envio: number;
  total: number;
  peso_total: number;
  tienda?: Tienda | null;
};

export type CarritoResponse = {
  items: CarritoItem[];
  resumen: CarritoResumen;
};

type ApiCarritoItem = {
  id_item_carrito: number;
  id_producto: number;
  nombre: string;
  precio_unitario: string | number;
  cantidad: number;
  subtotal: string | number;
};

type ApiCarritoResumen = {
  subtotal: string | number;
  envio: string | number;
  total: string | number;
  peso_total: string | number;
  tienda?: Partial<Tienda> & { id_tienda?: number; logo?: string | null; categoria?: string | null; categorias?: string[] | null };
};

type ApiCarritoResponse = {
  carrito: {
    items: ApiCarritoItem[];
    resumen: ApiCarritoResumen;
  };
};

function mapCarritoItem(item: ApiCarritoItem): CarritoItem {
  return {
    id: item.id_item_carrito,
    productoId: item.id_producto,
    nombre: item.nombre,
    precio: Number(item.precio_unitario),
    cantidad: item.cantidad,
    subtotal: Number(item.subtotal),
  };
}

function mapResumen(resumen: ApiCarritoResumen): CarritoResumen {
  const tiendaApi = resumen.tienda;
  let tienda: Tienda | null = null;
  if (tiendaApi && tiendaApi.id_tienda) {
    tienda = {
      id: tiendaApi.id_tienda,
      nombre: tiendaApi.nombre ?? "",
      ciudad: tiendaApi.ciudad ?? null,
      categorias: Array.isArray(tiendaApi.categorias) && tiendaApi.categorias.length > 0
        ? tiendaApi.categorias.filter((value): value is string => Boolean(value))
        : tiendaApi.categoria
          ? [tiendaApi.categoria]
          : [],
      descripcion: tiendaApi.direccion ?? null,
      direccion: tiendaApi.direccion ?? null,
      logo_url: tiendaApi.logo ?? undefined,
      abierto: tiendaApi.abierto ?? false,
      horario: tiendaApi.horario,
      promocion_activa: tiendaApi.promocion_activa,
    };
  }
  return {
    subtotal: Number(resumen.subtotal ?? 0),
    envio: Number(resumen.envio ?? 0),
    total: Number(resumen.total ?? 0),
    peso_total: Number(resumen.peso_total ?? 0),
    tienda,
  };
}

function mapCarritoResponse(data: ApiCarritoResponse): CarritoResponse {
  const carrito = data.carrito ?? { items: [], resumen: { subtotal: 0, envio: 0, total: 0, peso_total: 0 } };
  return {
    items: (carrito.items ?? []).map(mapCarritoItem),
    resumen: mapResumen(carrito.resumen ?? { subtotal: 0, envio: 0, total: 0, peso_total: 0 }),
  };
}

export async function fetchCarrito() {
  const { data } = await apiClient.get<ApiCarritoResponse>("/carrito");
  return mapCarritoResponse(data);
}

export async function agregarProductoAlCarrito(payload: { id_producto: number; cantidad: number }) {
  const { data } = await apiClient.post<ApiCarritoResponse>("/carrito/items", payload);
  return mapCarritoResponse(data);
}

export async function actualizarCantidadItem(params: { idItem: number; idProducto: number; cantidad: number }) {
  const { idItem, idProducto, cantidad } = params;
  const { data } = await apiClient.patch<ApiCarritoResponse>(`/carrito/items/${idItem}`, {
    id_producto: idProducto,
    cantidad,
  });
  return mapCarritoResponse(data);
}

export async function eliminarItem(idItem: number) {
  const { data } = await apiClient.delete<ApiCarritoResponse>(`/carrito/items/${idItem}`);
  return mapCarritoResponse(data);
}

export async function vaciarCarrito() {
  await apiClient.delete<{ message: string }>("/carrito");
}
