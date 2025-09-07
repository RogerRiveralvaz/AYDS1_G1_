import { apiClient } from "./client";

export type CarritoItem = {
  id: number;
  id_producto: number;
  nombre: string;
  precio: number;
  cantidad: number;
  peso_total: number;
  imagen_url?: string;
};

export type CarritoResponse = {
  items: CarritoItem[];
  subtotal: number;
  envio: number;
  total: number;
};

export async function fetchCarrito() {
  const { data } = await apiClient.get<CarritoResponse>("/carrito");
  return data;
}

export async function agregarProductoAlCarrito(payload: { id_producto: number; cantidad: number }) {
  const { data } = await apiClient.post<CarritoResponse>("/carrito/items", payload);
  return data;
}

export async function actualizarCantidadItem(idItem: number, cantidad: number) {
  const { data } = await apiClient.put<CarritoResponse>(`/carrito/items/${idItem}`, { cantidad });
  return data;
}

export async function eliminarItem(idItem: number) {
  const { data } = await apiClient.delete<CarritoResponse>(`/carrito/items/${idItem}`);
  return data;
}

export async function vaciarCarrito() {
  const { data } = await apiClient.delete<CarritoResponse>("/carrito");
  return data;
}
