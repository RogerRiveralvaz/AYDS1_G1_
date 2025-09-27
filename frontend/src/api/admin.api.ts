import { apiClient } from "./client";
import type { AdminResumen, PaginationMeta, TiendaAdmin, RepartidorAdmin, ClienteAdmin } from "./types";

export interface AdminPaginationParams extends Record<string, unknown> {
  page?: number;
  per_page?: number;
}

export interface AdminTiendasParams extends AdminPaginationParams {
  estado?: string;
  activo?: boolean;
}

export interface AdminTiendasResponse {
  tiendas: TiendaAdmin[];
  meta: PaginationMeta;
}

export interface AdminRepartidoresParams extends AdminPaginationParams {
  estado?: string;
  activo?: boolean;
}

export interface AdminRepartidoresResponse {
  repartidores: RepartidorAdmin[];
  meta: PaginationMeta;
}

export interface AdminClientesParams extends AdminPaginationParams {
  activo?: boolean;
}

export interface AdminClientesResponse {
  clientes: ClienteAdmin[];
  meta: PaginationMeta;
}

export async function fetchAdminResumen() {
  const { data } = await apiClient.get<{ resumen: AdminResumen }>("/admin/resumen");
  return data.resumen;
}

function mapBooleanParam(value: boolean | undefined) {
  if (typeof value === "boolean") {
    return value ? "1" : "0";
  }
  return undefined;
}

export async function fetchAdminTiendas(params: AdminTiendasParams = {}) {
  const { data } = await apiClient.get<AdminTiendasResponse>("/admin/tiendas", {
    params: {
      ...params,
      activo: mapBooleanParam(params.activo),
    },
  });
  return data;
}

export async function fetchAdminTiendaById(id: number) {
  const perPage = 100;
  let page = 1;
  while (true) {
    const { tiendas, meta } = await fetchAdminTiendas({ page, per_page: perPage });
    const found = tiendas.find((tienda) => tienda.id_tienda === id);
    if (found) {
      return found;
    }
    const total = meta?.total ?? 0;
    if (page * perPage >= total || total === 0) {
      break;
    }
    page += 1;
  }
  throw new Error("Tienda no encontrada");
}

export interface UpdateAdminTiendaEstadoParams {
  id: number;
  codigo: string;
}

export async function updateAdminTiendaEstado({ id, codigo }: UpdateAdminTiendaEstadoParams) {
  const { data } = await apiClient.patch<{ tienda: TiendaAdmin }>(`/admin/tiendas/${id}`, { codigo });
  return data.tienda;
}

export async function updateAdminTiendaActivo(id: number, activo: boolean) {
  const { data } = await apiClient.patch<{ tienda: TiendaAdmin }>(`/admin/tiendas/${id}/activo`, { activo });
  return data.tienda;
}

export async function deleteAdminTienda(id: number) {
  const { data } = await apiClient.delete<{ tienda: TiendaAdmin }>(`/admin/tiendas/${id}`);
  return data.tienda;
}

export async function fetchAdminRepartidores(params: AdminRepartidoresParams = {}) {
  const { data } = await apiClient.get<AdminRepartidoresResponse>("/admin/repartidores", {
    params: {
      ...params,
      activo: mapBooleanParam(params.activo),
    },
  });
  return data;
}

export async function updateAdminRepartidorEstado(id: number, codigo: string) {
  const { data } = await apiClient.patch<{ repartidor: RepartidorAdmin }>(`/admin/repartidores/${id}`, {
    codigo,
  });
  return data.repartidor;
}

export async function updateAdminRepartidorActivo(id: number, activo: boolean) {
  const { data } = await apiClient.patch<{ repartidor: RepartidorAdmin }>(
    `/admin/repartidores/${id}/activo`,
    { activo },
  );
  return data.repartidor;
}

export async function deleteAdminRepartidor(id: number) {
  const { data } = await apiClient.delete<{ repartidor: RepartidorAdmin }>(`/admin/repartidores/${id}`);
  return data.repartidor;
}

export async function fetchAdminClientes(params: AdminClientesParams = {}) {
  const { data } = await apiClient.get<AdminClientesResponse>("/admin/clientes", {
    params: {
      ...params,
      activo: mapBooleanParam(params.activo),
    },
  });
  return data;
}

export async function updateAdminClienteActivo(id: number, activo: boolean) {
  const { data } = await apiClient.patch<{ cliente: ClienteAdmin }>(`/admin/clientes/${id}`, { activo });
  return data.cliente;
}

export async function deleteAdminCliente(id: number) {
  const { data } = await apiClient.delete<{ cliente: ClienteAdmin }>(`/admin/clientes/${id}`);
  return data.cliente;
}
