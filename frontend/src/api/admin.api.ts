import { apiClient } from "./client";
import type { AdminResumen, PaginationMeta, TiendaAdmin } from "./types";

export interface AdminTiendasParams {
  page?: number;
  per_page?: number;
  estado?: string;
}

export interface AdminTiendasResponse {
  tiendas: TiendaAdmin[];
  meta: PaginationMeta;
}

export async function fetchAdminResumen() {
  const { data } = await apiClient.get<{ resumen: AdminResumen }>("/admin/resumen");
  return data.resumen;
}

export async function fetchAdminTiendas(params: AdminTiendasParams = {}) {
  const { data } = await apiClient.get<AdminTiendasResponse>("/admin/tiendas", {
    params,
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
