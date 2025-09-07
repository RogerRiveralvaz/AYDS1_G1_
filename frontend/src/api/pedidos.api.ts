import { apiClient } from "./client";
import type { PaginatedResponse } from "./usuarios.api";

export type PedidoResumen = {
  id: number;
  estado: string;
  total: number;
  creado_en: string;
};

export type PedidoDetalle = PedidoResumen & {
  items: Array<{
    id: number;
    nombre: string;
    cantidad: number;
    precio: number;
    peso_kg: number;
  }>;
  direccion: Record<string, unknown>;
  timeline: Array<{ estado: string; fecha: string; nota?: string }>;
};

export async function fetchPedidos(params?: Record<string, unknown>) {
  const { data } = await apiClient.get<PaginatedResponse<PedidoResumen>>("/pedidos", {
    params,
  });
  return data;
}

export async function fetchPedidoDetalle(id: number | string) {
  const { data } = await apiClient.get<PedidoDetalle>(`/pedidos/${id}`);
  return data;
}

export async function cambiarEstadoPedido(id: number | string, payload: { codigo: string; nota?: string }) {
  const { data } = await apiClient.patch<PedidoDetalle>(`/pedidos/${id}/estado`, payload);
  return data;
}
