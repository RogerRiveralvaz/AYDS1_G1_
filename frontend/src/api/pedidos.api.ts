import { apiClient } from "./client";
import type { Tienda } from "./catalogo.api";

export type PedidoItem = {
  id: number;
  productoId: number;
  nombre: string;
  cantidad: number;
  precio_unitario: number;
  total_linea: number;
};

export type HistorialEstado = {
  estado: string;
  codigo: string;
  cambiado_por: number;
  cambiado_en: string;
  nota?: string | null;
};

export type PedidoResumen = {
  id: number;
  estado: string;
  codigo_estado: string;
  subtotal: number;
  envio: number;
  total: number;
  peso_total: number;
  creado_en: string;
  tienda: Tienda | null;
};

export type PedidoDetalle = PedidoResumen & {
  direccion_entrega: string | null;
  notas?: string | null;
  items: PedidoItem[];
  historial: HistorialEstado[];
};

type ApiPedidoResumen = {
  id_pedido: number;
  estado: string;
  codigo_estado: string;
  subtotal_q: string | number;
  envio_q: string | number;
  total_q: string | number;
  peso_total_kg: string | number;
  creado_en: string;
  tienda?: Partial<Tienda> & { id_tienda?: number; categoria?: string | null; categorias?: string[] | null; logo?: string | null };
};

type ApiPedidoDetalle = ApiPedidoResumen & {
  direccion_entrega?: string | null;
  notas?: string | null;
  items: Array<{
    id_item_pedido: number;
    id_producto: number;
    nombre_producto: string;
    precio_unit_q: string | number;
    cantidad: number;
    total_linea_q: string | number;
  }>;
  historial: Array<{
    estado: string;
    codigo: string;
    cambiado_por: number;
    cambiado_en: string;
    nota?: string | null;
  }>;
};

type ApiPedidosResponse = { pedidos: ApiPedidoResumen[]; meta?: { total: number; page: number; per_page: number } };
type ApiPedidoDetalleResponse = { pedido: ApiPedidoDetalle };

const defaultMeta = { total: 0, page: 1, per_page: 10 };

function mapTiendaFromPedido(api?: ApiPedidoResumen["tienda"]) : Tienda | null {
  if (!api || !api.id_tienda) {
    return null;
  }
  let categorias: string[] = [];
  if (Array.isArray(api.categorias) && api.categorias.length > 0) {
    categorias = api.categorias.filter((value): value is string => Boolean(value));
  } else if (api.categoria) {
    categorias = [api.categoria];
  }
  return {
    id: api.id_tienda,
    nombre: api.nombre ?? "",
    ciudad: api.ciudad ?? null,
    categorias,
    descripcion: api.direccion ?? null,
    direccion: api.direccion ?? null,
    logo_url: api.logo ?? undefined,
    abierto: api.abierto ?? false,
    horario: api.horario,
    promocion_activa: api.promocion_activa,
  };
}

function mapPedidoResumen(api: ApiPedidoResumen): PedidoResumen {
  return {
    id: api.id_pedido,
    estado: api.estado,
    codigo_estado: api.codigo_estado,
    subtotal: Number(api.subtotal_q ?? 0),
    envio: Number(api.envio_q ?? 0),
    total: Number(api.total_q ?? 0),
    peso_total: Number(api.peso_total_kg ?? 0),
    creado_en: api.creado_en,
    tienda: mapTiendaFromPedido(api.tienda),
  };
}

function mapPedidoDetalle(api: ApiPedidoDetalle): PedidoDetalle {
  return {
    ...mapPedidoResumen(api),
    direccion_entrega: api.direccion_entrega ?? null,
    notas: api.notas ?? null,
    items: (api.items ?? []).map((item) => ({
      id: item.id_item_pedido,
      productoId: item.id_producto,
      nombre: item.nombre_producto,
      cantidad: item.cantidad,
      precio_unitario: Number(item.precio_unit_q ?? 0),
      total_linea: Number(item.total_linea_q ?? 0),
    })),
    historial: (api.historial ?? []).map((entry) => ({
      estado: entry.estado,
      codigo: entry.codigo,
      cambiado_por: entry.cambiado_por,
      cambiado_en: entry.cambiado_en,
      nota: entry.nota ?? null,
    })),
  };
}

export async function fetchPedidos(params?: Record<string, unknown>) {
  const { data } = await apiClient.get<ApiPedidosResponse>("/pedidos", { params });
  return {
    data: (data.pedidos ?? []).map(mapPedidoResumen),
    meta: data.meta ?? defaultMeta,
  };
}

export async function fetchPedidoDetalle(id: number | string) {
  const { data } = await apiClient.get<ApiPedidoDetalleResponse>(`/pedidos/${id}`);
  return mapPedidoDetalle(data.pedido);
}

export async function crearPedido(payload: { direccion_id: number; notas?: string }) {
  const { data } = await apiClient.post<ApiPedidoDetalleResponse>("/pedidos", payload);
  return mapPedidoDetalle(data.pedido);
}

export async function fetchPedidosTienda(params?: Record<string, unknown>) {
  const { data } = await apiClient.get<ApiPedidosResponse>("/pedidos/tienda", { params });
  return {
    data: (data.pedidos ?? []).map(mapPedidoResumen),
    meta: data.meta ?? defaultMeta,
  };
}

export async function actualizarEstadoPedidoTienda(
  pedidoId: number | string,
  payload: { codigo: string; nota?: string | null },
) {
  const { data } = await apiClient.patch<ApiPedidoDetalleResponse>(`/pedidos/${pedidoId}/estado`, payload);
  return mapPedidoDetalle(data.pedido);
}
