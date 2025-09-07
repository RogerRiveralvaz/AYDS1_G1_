import { apiClient } from "./client";

export type PaginatedResponse<T> = {
  data: T[];
  meta: {
    total: number;
    page: number;
    per_page: number;
  };
};

export async function fetchUsuarios(params?: Record<string, unknown>) {
  const { data } = await apiClient.get<PaginatedResponse<Record<string, unknown>>>("/usuarios", {
    params,
  });
  return data;
}

export async function fetchUsuarioDetalle(id: number | string) {
  const { data } = await apiClient.get<Record<string, unknown>>(`/usuarios/${id}`);
  return data;
}

export async function updateUsuario(id: number | string, payload: Record<string, unknown>) {
  const { data } = await apiClient.put(`/usuarios/${id}`, payload);
  return data;
}
