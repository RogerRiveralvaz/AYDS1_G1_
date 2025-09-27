import { apiClient } from "./client";
import type { Direccion, HorarioTienda } from "./types";

const BASE_PATH = "/tiendas/mi";

type ApiProducto = {
  id_producto: number;
  nombre: string;
  descripcion_corta?: string | null;
  precio: string | number;
  peso_kg: string | number;
  sku?: string | null;
  stock: number;
  umbral_bajo?: number | null;
  es_oferta?: boolean;
  es_nuevo?: boolean;
  activo?: boolean;
  id_categoria?: number | null;
  imagenes?: Array<{
    url: string;
    principal?: boolean;
    orden?: number;
  }>;
};

type ApiTienda = {
  id_tienda: number;
  razon_social: string;
  identificacion_legal?: string | null;
  email: string;
  telefono: string;
  url_logo?: string | null;
  cuenta_bancaria: string;
  estado_aprobacion?: string | null;
  direccion_detalle?: Direccion | null;
  horarios?: HorarioTienda[] | null;
  activo?: boolean;
  id_categoria?: number | null;
};

type ApiTarifa = {
  tarifa_base_q: string | number;
  base_kg: string | number;
  extra_q_por_kg: string | number;
  activo: boolean;
  tiempo_estimado?: string | null;
};

type ApiDashboard = {
  pedidos_totales: number;
  ingresos: string | number;
  productos_vendidos: number;
  clientes_unicos: number;
};

function toNumber(value: string | number | null | undefined) {
  if (value === null || value === undefined) {
    return 0;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export type ProductoImagenInput = {
  url: string;
  principal?: boolean;
  orden?: number;
};

export type ProductoPayload = {
  nombre: string;
  descripcion_corta?: string;
  precio: number | string;
  peso_kg: number | string;
  sku?: string;
  stock: number;
  umbral_bajo?: number;
  es_oferta?: boolean;
  es_nuevo?: boolean;
  activo?: boolean;
  id_categoria?: number | null;
  imagenes?: ProductoImagenInput[];
};

export type ProductoOwner = {
  id_producto: number;
  nombre: string;
  descripcion_corta: string | null;
  precio: number;
  peso_kg: number;
  sku?: string | null;
  stock: number;
  umbral_bajo: number;
  es_oferta: boolean;
  es_nuevo: boolean;
  activo: boolean;
  id_categoria: number | null;
  imagenes: ProductoImagenInput[];
};

export type TiendaOwner = {
  id_tienda: number;
  razon_social: string;
  identificacion_legal?: string | null;
  email: string;
  telefono: string;
  url_logo?: string | null;
  cuenta_bancaria: string;
  estado_aprobacion?: string | null;
  direccion_detalle?: Direccion | null;
  horarios?: HorarioTienda[];
  activo: boolean;
  id_categoria: number | null;
};

export type TiendaDashboard = {
  pedidos_totales: number;
  ingresos: number;
  productos_vendidos: number;
  clientes_unicos: number;
};

export type TarifaEnvio = {
  tarifa_base_q: number;
  base_kg: number;
  extra_q_por_kg: number;
  activo: boolean;
  tiempo_estimado?: string | null;
};

function mapProducto(api: ApiProducto): ProductoOwner {
  return {
    id_producto: api.id_producto,
    nombre: api.nombre,
    descripcion_corta: api.descripcion_corta ?? null,
    precio: toNumber(api.precio),
    peso_kg: toNumber(api.peso_kg),
    sku: api.sku ?? null,
    stock: api.stock,
    umbral_bajo: api.umbral_bajo ?? 0,
    es_oferta: Boolean(api.es_oferta),
    es_nuevo: Boolean(api.es_nuevo),
    activo: Boolean(api.activo ?? true),
    id_categoria: api.id_categoria ?? null,
    imagenes: (api.imagenes ?? []).map((imagen, index) => ({
      url: imagen.url,
      principal: Boolean(imagen.principal),
      orden: typeof imagen.orden === "number" ? imagen.orden : index + 1,
    })),
  };
}

function mapTienda(api: ApiTienda): TiendaOwner {
  return {
    id_tienda: api.id_tienda,
    razon_social: api.razon_social,
    identificacion_legal: api.identificacion_legal ?? null,
    email: api.email,
    telefono: api.telefono,
    url_logo: api.url_logo ?? null,
    cuenta_bancaria: api.cuenta_bancaria,
    estado_aprobacion: api.estado_aprobacion ?? null,
    direccion_detalle: api.direccion_detalle ?? null,
    horarios: api.horarios ?? [],
    activo: Boolean(api.activo),
    id_categoria: api.id_categoria ?? null,
  };
}

function mapTarifa(api: ApiTarifa): TarifaEnvio {
  return {
    tarifa_base_q: toNumber(api.tarifa_base_q),
    base_kg: toNumber(api.base_kg),
    extra_q_por_kg: toNumber(api.extra_q_por_kg),
    activo: api.activo,
    tiempo_estimado: api.tiempo_estimado ?? null,
  };
}

export async function fetchMiTienda() {
  const { data } = await apiClient.get<{ tienda: ApiTienda }>(`${BASE_PATH}`);
  return mapTienda(data.tienda);
}

export async function actualizarMiTienda(payload: Partial<TiendaOwner> & { direccion?: Direccion | null; horarios?: HorarioTienda[] | null }) {
  const { data } = await apiClient.patch<{ tienda: ApiTienda }>(`${BASE_PATH}`, payload);
  return mapTienda(data.tienda);
}

export async function fetchTiendaDashboard() {
  const { data } = await apiClient.get<{ resumen: ApiDashboard }>(`${BASE_PATH}/reportes`);
  const resumen = data.resumen;
  return {
    pedidos_totales: resumen.pedidos_totales,
    ingresos: toNumber(resumen.ingresos),
    productos_vendidos: resumen.productos_vendidos,
    clientes_unicos: resumen.clientes_unicos,
  } as TiendaDashboard;
}

export async function fetchProductosTienda() {
  const { data } = await apiClient.get<{ productos: ApiProducto[] }>(`${BASE_PATH}/productos`);
  return (data.productos ?? []).map(mapProducto);
}

export async function fetchProducto(productoId: number | string) {
  const { data } = await apiClient.get<{ producto: ApiProducto }>(`${BASE_PATH}/productos/${productoId}`);
  return mapProducto(data.producto);
}

function serializeProductoPayload(payload: Partial<ProductoPayload>) {
  return {
    ...payload,
    precio: payload.precio !== undefined ? String(payload.precio) : undefined,
    peso_kg: payload.peso_kg !== undefined ? String(payload.peso_kg) : undefined,
    imagenes: payload.imagenes?.map((imagen, index) => ({
      url: imagen.url,
      principal: Boolean(imagen.principal),
      orden: imagen.orden ?? index + 1,
    })),
  };
}

export async function crearProducto(payload: ProductoPayload) {
  const body = serializeProductoPayload(payload);
  const { data } = await apiClient.post<{ producto: ApiProducto }>(`${BASE_PATH}/productos`, body);
  return mapProducto(data.producto);
}

export async function actualizarProducto(productoId: number | string, payload: Partial<ProductoPayload>) {
  const body = serializeProductoPayload(payload);
  const { data } = await apiClient.patch<{ producto: ApiProducto }>(`${BASE_PATH}/productos/${productoId}`, body);
  return mapProducto(data.producto);
}

export async function cambiarEstadoProducto(productoId: number | string, activo: boolean) {
  const { data } = await apiClient.patch<{ producto: ApiProducto }>(
    `${BASE_PATH}/productos/${productoId}/estado`,
    { activo },
  );
  return mapProducto(data.producto);
}

export async function eliminarProducto(productoId: number | string) {
  await apiClient.delete(`${BASE_PATH}/productos/${productoId}`);
}

export async function obtenerTarifaEnvio() {
  const { data } = await apiClient.get<{ tarifa: ApiTarifa | null }>(`${BASE_PATH}/tarifa`);
  return data.tarifa ? mapTarifa(data.tarifa) : null;
}

export async function actualizarTarifaEnvio(payload: TarifaEnvio) {
  const body = {
    tarifa_base_q: String(payload.tarifa_base_q),
    base_kg: String(payload.base_kg),
    extra_q_por_kg: String(payload.extra_q_por_kg),
    activo: payload.activo,
    tiempo_estimado: payload.tiempo_estimado ?? null,
  };
  const { data } = await apiClient.put<{ tarifa: ApiTarifa }>(`${BASE_PATH}/tarifa`, body);
  return mapTarifa(data.tarifa);
}
