import { apiClient } from "./client";

export type EntregaEstadoCodigo = "ASIGNADA" | "ACEPTADA" | "EN_CAMINO" | "ENTREGADA" | "CANCELADA";

type RepartidorDisponibleApi = {
  id: number;
  nombres: string;
  apellidos: string;
  telefono?: string | null;
  vehiculo_tipo: string;
  url_foto?: string | null;
};

type EntregaPedidoApi = {
  id_pedido: number;
  estado: string;
  codigo_estado: string;
  subtotal_q: string;
  envio_q: string;
  total_q: string;
  peso_total_kg: string;
  creado_en: string;
  tienda: {
    id_tienda?: number;
    nombre: string;
    logo?: string | null;
    ciudad?: string | null;
  };
};

type EntregaApi = {
  id_entrega: number;
  estado: string;
  codigo_estado: EntregaEstadoCodigo;
  asignada_en: string;
  aceptada_en?: string | null;
  recogida_en?: string | null;
  entregada_en?: string | null;
  distancia_km?: string | null;
  pago_repartidor_q?: string | null;
  pedido: EntregaPedidoApi;
};

type SeguimientoApi = {
  id_seguimiento: number;
  ubicacion: string;
  registrado_en: string;
  nota_estado?: string | null;
};

export type EntregaResumen = {
  id: number;
  estado: string;
  codigoEstado: EntregaEstadoCodigo;
  asignadaEn: string;
  aceptadaEn: string | null;
  recogidaEn: string | null;
  entregadaEn: string | null;
  distanciaKm: number | null;
  pagoRepartidorQ: number | null;
  pedido: {
    id: number;
    estado: string;
    codigoEstado: string;
    subtotalQ: number;
    envioQ: number;
    totalQ: number;
    pesoTotalKg: number;
    creadoEn: string;
    tienda: {
      id?: number;
      nombre: string;
      logo?: string | null;
      ciudad?: string | null;
    };
  };
};

export type EntregaDetalle = EntregaResumen & {
  seguimiento: SeguimientoApi[];
};

export type MisEntregasResponse = {
  entregas: EntregaApi[];
};

type EntregaDetalleResponse = {
  entrega: EntregaApi & { seguimiento?: SeguimientoApi[] };
};

type RepartidoresDisponiblesResponse = {
  repartidores: RepartidorDisponibleApi[];
};

export type RepartidorDisponible = {
  id: number;
  nombreCompleto: string;
  telefono: string | null;
  vehiculo: string;
  fotoUrl: string | null;
};

function parseDecimal(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function mapPedido(api: EntregaPedidoApi): EntregaResumen["pedido"] {
  return {
    id: api.id_pedido,
    estado: api.estado,
    codigoEstado: api.codigo_estado,
    subtotalQ: parseDecimal(api.subtotal_q) ?? 0,
    envioQ: parseDecimal(api.envio_q) ?? 0,
    totalQ: parseDecimal(api.total_q) ?? 0,
    pesoTotalKg: parseDecimal(api.peso_total_kg) ?? 0,
    creadoEn: api.creado_en,
    tienda: {
      id: api.tienda.id_tienda,
      nombre: api.tienda.nombre,
      logo: api.tienda.logo,
      ciudad: api.tienda.ciudad,
    },
  };
}

function mapEntrega(api: EntregaApi): EntregaResumen {
  return {
    id: api.id_entrega,
    estado: api.estado,
    codigoEstado: api.codigo_estado,
    asignadaEn: api.asignada_en,
    aceptadaEn: api.aceptada_en ?? null,
    recogidaEn: api.recogida_en ?? null,
    entregadaEn: api.entregada_en ?? null,
    distanciaKm: parseDecimal(api.distancia_km),
    pagoRepartidorQ: parseDecimal(api.pago_repartidor_q),
    pedido: mapPedido(api.pedido),
  };
}

function mapRepartidorDisponible(api: RepartidorDisponibleApi): RepartidorDisponible {
  return {
    id: api.id,
    nombreCompleto: `${api.nombres} ${api.apellidos}`.trim(),
    telefono: api.telefono ?? null,
    vehiculo: api.vehiculo_tipo,
    fotoUrl: api.url_foto ?? null,
  };
}

export async function fetchMisEntregas(params?: Record<string, unknown>) {
  const { data } = await apiClient.get<MisEntregasResponse>("/entregas/mis", { params });
  return {
    entregas: data.entregas.map(mapEntrega),
  };
}

export async function fetchEntregaDetalle(id: number | string) {
  const { data } = await apiClient.get<EntregaDetalleResponse>(`/entregas/mis/${id}`);
  const entrega = mapEntrega(data.entrega);
  return {
    ...entrega,
    seguimiento: data.entrega.seguimiento ?? [],
  } satisfies EntregaDetalle;
}

export async function actualizarEstadoEntrega(id: number | string, payload: { codigo: EntregaEstadoCodigo; nota?: string }) {
  const { data } = await apiClient.post<EntregaDetalleResponse>(`/entregas/mis/${id}/estado`, payload);
  const entrega = mapEntrega(data.entrega);
  return {
    ...entrega,
    seguimiento: data.entrega.seguimiento ?? [],
  } satisfies EntregaDetalle;
}

export async function registrarUbicacionEntrega(
  id: number | string,
  payload: { lat: number; lng: number; nota?: string },
) {
  const { data } = await apiClient.post<{ seguimiento: SeguimientoApi }>(`/entregas/mis/${id}/seguimiento`, payload);
  return data;
}

export async function fetchRepartidoresDisponibles() {
  const { data } = await apiClient.get<RepartidoresDisponiblesResponse>("/entregas/repartidores");
  return data.repartidores.map(mapRepartidorDisponible);
}

export async function asignarEntrega(pedidoId: number | string, repartidorId: number | string) {
  const { data } = await apiClient.post<{ entrega: EntregaApi }>("/entregas/asignar", {
    pedido_id: Number(pedidoId),
    repartidor_id: Number(repartidorId),
  });
  return mapEntrega(data.entrega);
}
