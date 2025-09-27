export const ROLE_LABELS = {
  CLIENTE: "Cliente",
  TIENDA: "Tienda",
  REPARTIDOR: "Repartidor",
  ADMIN: "Administrador",
} as const;

export const PEDIDO_ESTADOS = ["PENDIENTE", "CONFIRMADO", "EN_CAMINO", "ENTREGADO"] as const;
export const ENTREGA_ESTADOS = ["ASIGNADA", "ACEPTADA", "EN_CAMINO", "ENTREGADA", "CANCELADA"] as const;

export const STORAGE_KEYS = {
  AUTH: "ayd-auth",
} as const;

export const MAP_DEFAULT_COORDS = {
  lat: 14.6349,
  lng: -90.5069,
  zoom: 12,
};
