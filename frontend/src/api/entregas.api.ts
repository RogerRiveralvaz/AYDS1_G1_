import { apiClient } from "./client";
import type { PaginatedResponse } from "./usuarios.api";

export type EntregaResumen = {
  id: number;
  estado: string;
  asignada_en: string;
  tienda: { nombre: string };
  direccion_entrega: string;
};

export type EntregaDetalle = EntregaResumen & {
  pedido_id: number;
  timeline: Array<{ estado: string; fecha: string; nota?: string }>;
  ubicacion_actual?: { lat: number; lng: number };
};

export async function fetchEntregas(params?: Record<string, unknown>) {
  const { data } = await apiClient.get<PaginatedResponse<EntregaResumen>>("/entregas", {
    params,
  });
  return data;
}

export async function fetchEntregaDetalle(id: number | string) {
  const { data } = await apiClient.get<EntregaDetalle>(`/entregas/${id}`);
  return data;
}

export async function actualizarEstadoEntrega(id: number | string, payload: { codigo: string; nota?: string }) {
  const { data } = await apiClient.patch<EntregaDetalle>(`/entregas/${id}/estado`, payload);
  return data;
}

export async function registrarUbicacionEntrega(id: number | string, payload: { lat: number; lng: number; nota?: string }) {
  const { data } = await apiClient.post<EntregaDetalle>(`/entregas/${id}/ubicacion`, payload);
  return data;
}
