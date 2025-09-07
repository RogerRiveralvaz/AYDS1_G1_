import { apiClient } from "./client";
import type { PaginatedResponse } from "./usuarios.api";
import type { Producto, Tienda } from "./catalogo.api";

export type ProductoInput = {
  nombre: string;
  descripcion?: string;
  precio: number;
  peso_kg: number;
  stock: number;
  umbral_bajo?: number;
  categoria?: string;
  activo?: boolean;
};

export async function fetchTiendaDashboard() {
  const { data } = await apiClient.get("/tienda/dashboard");
  return data as Record<string, unknown>;
}

export async function crearProducto(payload: ProductoInput) {
  const { data } = await apiClient.post<Producto>("/tienda/productos", payload);
  return data;
}

export async function actualizarProducto(id: number | string, payload: Partial<ProductoInput>) {
  const { data } = await apiClient.put<Producto>(`/tienda/productos/${id}`, payload);
  return data;
}

export async function fetchProductosTienda(params?: Record<string, unknown>) {
  const { data } = await apiClient.get<PaginatedResponse<Producto>>("/tienda/productos", {
    params,
  });
  return data;
}

export async function fetchPedidosTienda(params?: Record<string, unknown>) {
  const { data } = await apiClient.get("/tienda/pedidos", { params });
  return data;
}

export async function actualizarTarifaEnvio(payload: Record<string, unknown>) {
  const { data } = await apiClient.put("/tienda/tarifa-envio", payload);
  return data;
}

export async function actualizarPerfilTienda(payload: Partial<Tienda>) {
  const { data } = await apiClient.put<Tienda>("/tienda/perfil", payload);
  return data;
}
