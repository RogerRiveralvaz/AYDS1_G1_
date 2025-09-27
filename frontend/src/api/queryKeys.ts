export const queryKeys = {
  catalogo: {
    tiendas: {
      root: ["catalogo", "tiendas"] as const,
      list: (filters?: Record<string, unknown>) => ["catalogo", "tiendas", { filters: filters ?? {} }] as const,
      detail: (id: number) => ["catalogo", "tiendas", "detail", id] as const,
      productos: (id: number, filters?: Record<string, unknown>) =>
        ["catalogo", "tiendas", id, "productos", { filters: filters ?? {} }] as const,
    },
    categorias: ["catalogo", "categorias"] as const,
  },
  carrito: {
    root: ["carrito"] as const,
  },
  perfil: {
    me: ["perfil", "me"] as const,
  },
  direcciones: {
    root: ["direcciones"] as const,
    detail: (id: number) => ["direcciones", "detail", id] as const,
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
  tienda: {
    me: ["tienda", "mi"] as const,
    dashboard: ["tienda", "dashboard"] as const,
    productos: {
      list: () => ["tienda", "productos"] as const,
      detail: (id: number | string) => ["tienda", "productos", "detail", id] as const,
    },
    pedidos: {
      list: (filters?: Record<string, unknown>) => ["tienda", "pedidos", { filters: filters ?? {} }] as const,
    },
    tarifa: ["tienda", "tarifa"] as const,
    repartidores: {
      list: () => ["tienda", "repartidores"] as const,
    },
  },
} as const;
