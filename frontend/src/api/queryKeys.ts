export const queryKeys = {
  catalogo: {
    tiendas: {
      root: ["catalogo", "tiendas"] as const,
      list: (filters?: Record<string, unknown>) => ["catalogo", "tiendas", { filters: filters ?? {} }] as const,
      detail: (id: number) => ["catalogo", "tiendas", "detail", id] as const,
      productos: (id: number, filters?: Record<string, unknown>) =>
        ["catalogo", "tiendas", id, "productos", { filters: filters ?? {} }] as const,
    },
  },
  carrito: {
    root: ["carrito"] as const,
  },
  pedidos: {
    root: ["pedidos"] as const,
    list: (filters?: Record<string, unknown>) => ["pedidos", { filters: filters ?? {} }] as const,
    detail: (id: number) => ["pedidos", "detail", id] as const,
  },
  entregas: {
    root: ["entregas"] as const,
    list: (filters?: Record<string, unknown>) => ["entregas", { filters: filters ?? {} }] as const,
    detail: (id: number) => ["entregas", "detail", id] as const,
  },
  admin: {
    resumen: ["admin", "resumen"] as const,
    tiendas: {
      root: ["admin", "tiendas"] as const,
      list: (filters?: Record<string, unknown>) => ["admin", "tiendas", { filters: filters ?? {} }] as const,
      detail: (id: number) => ["admin", "tiendas", "detail", id] as const,
    },
    repartidores: {
      root: ["admin", "repartidores"] as const,
      list: (filters?: Record<string, unknown>) => ["admin", "repartidores", { filters: filters ?? {} }] as const,
    },
    clientes: {
      root: ["admin", "clientes"] as const,
      list: (filters?: Record<string, unknown>) => ["admin", "clientes", { filters: filters ?? {} }] as const,
    },
  },
} as const;
