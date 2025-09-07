import { apiClient } from "./client";
import type { PaginatedResponse } from "./usuarios.api";

export type Tienda = {
  id: number;
  nombre: string;
  ciudad: string;
  categorias: string[];
  rating?: number;
  logo_url?: string;
  abierto?: boolean;
};

export type Producto = {
  id: number;
  nombre: string;
  precio: number;
  peso_kg: number;
  imagen_url?: string;
  categoria?: string;
};

const BASE = "/catalogo";

export async function fetchTiendas(params?: Record<string, unknown>) {
  const { data } = await apiClient.get<PaginatedResponse<Tienda>>(`${BASE}/tiendas`, {
    params,
  });
  return data;
}

export async function fetchTiendaDetalle(id: number | string) {
  const { data } = await apiClient.get<Tienda & { productos: Producto[] }>(`${BASE}/tiendas/${id}`);
  return data;
}

export async function fetchProductos(tiendaId: number | string, params?: Record<string, unknown>) {
  const { data } = await apiClient.get<PaginatedResponse<Producto>>(
    `${BASE}/tiendas/${tiendaId}/productos`,
    {
      params,
    },
  );
  return data;
}
