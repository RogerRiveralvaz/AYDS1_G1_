import { apiClient } from "./client";

export type PagoPayload = {
  pedido_id: number;
  metodo: string;
  monto: number;
  referencia?: string;
};

export async function crearPago(payload: PagoPayload) {
  const { data } = await apiClient.post("/pagos", payload);
  return data;
}

export async function fetchPagos(params?: Record<string, unknown>) {
  const { data } = await apiClient.get("/pagos", { params });
  return data;
}
