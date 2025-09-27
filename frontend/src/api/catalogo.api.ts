import { apiClient } from "./client";

export type Tienda = {
  id: number;
  nombre: string;
  ciudad: string | null;
  categorias: string[];
  descripcion?: string | null;
  rating?: number | null;
  logo_url?: string | null;
  abierto?: boolean;
  direccion?: string | null;
  horario?: Horario[];
  promocion_activa?: boolean;
};

export type Horario = {
  dia_semana: number;
  hora_apertura?: string | null;
  hora_cierre?: string | null;
  cerrado?: boolean;
};

export type ProductoImagen = {
  url: string;
  principal?: boolean;
  orden?: number;
};

export type Categoria = {
  id: number;
  nombre: string;
  slug: string;
};

export type Producto = {
  id: number;
  nombre: string;
  descripcion?: string | null;
  precio: number;
  peso_kg: number;
  sku?: string | null;
  stock?: number;
  es_oferta?: boolean;
  es_nuevo?: boolean;
  imagenes?: ProductoImagen[];
};

const BASE = "/catalogo";

type ApiHorario = {
  dia_semana: number;
  hora_apertura?: string | null;
  hora_cierre?: string | null;
  cerrado?: boolean;
};

type ApiTienda = {
  id_tienda: number;
  nombre: string;
  ciudad?: string | null;
  categoria?: string | null;
  categorias?: string[] | null;
  direccion?: string | null;
  logo?: string | null;
  abierto?: boolean;
  horario?: ApiHorario[] | null;
  promocion_activa?: boolean;
};

type ApiProducto = {
  id_producto: number;
  nombre: string;
  descripcion_corta?: string | null;
  precio: string | number;
  peso_kg: string | number;
  sku?: string | null;
  stock?: number;
  es_oferta?: boolean;
  es_nuevo?: boolean;
  imagenes?: ProductoImagen[];
};

type TiendasResponse = {
  tiendas: ApiTienda[];
  meta: {
    page: number;
    per_page: number;
    total: number;
  };
};

type TiendaDetalleResponse = {
  tienda: ApiTienda & {
    productos: Record<string, ApiProducto[]>;
    descripcion?: string | null;
  };
};

type ApiCategoria = {
  id_categoria: number;
  nombre: string;
  slug: string;
};

const defaultMeta = { page: 1, per_page: 10, total: 0 };

function mapHorario(api?: ApiHorario[] | null): Horario[] | undefined {
  if (!api) return undefined;
  return api.map((item) => ({
    dia_semana: item.dia_semana,
    hora_apertura: item.hora_apertura ?? null,
    hora_cierre: item.hora_cierre ?? null,
    cerrado: item.cerrado ?? false,
  }));
}

function mapTienda(api: ApiTienda): Tienda {
  let categorias: string[] = [];
  if (Array.isArray(api.categorias) && api.categorias.length > 0) {
    categorias = api.categorias.filter((value): value is string => Boolean(value));
  } else if (api.categoria) {
    categorias = [api.categoria];
  }
  return {
    id: api.id_tienda,
    nombre: api.nombre,
    ciudad: api.ciudad ?? null,
    categorias,
    descripcion: api.direccion ?? null,
    direccion: api.direccion ?? null,
    logo_url: api.logo ?? undefined,
    abierto: api.abierto ?? false,
    horario: mapHorario(api.horario),
    promocion_activa: api.promocion_activa ?? false,
  };
}

function mapProducto(api: ApiProducto): Producto {
  return {
    id: api.id_producto,
    nombre: api.nombre,
    descripcion: api.descripcion_corta ?? null,
    precio: Number(api.precio),
    peso_kg: Number(api.peso_kg),
    sku: api.sku ?? undefined,
    stock: api.stock,
    es_oferta: api.es_oferta,
    es_nuevo: api.es_nuevo,
    imagenes: api.imagenes,
  };
}

function mapProductosPorCategoria(api: Record<string, ApiProducto[]>): Record<string, Producto[]> {
  return Object.entries(api ?? {}).reduce<Record<string, Producto[]>>((acc, [categoria, productos]) => {
    acc[categoria] = productos.map(mapProducto);
    return acc;
  }, {});
}

export async function fetchTiendas(params?: Record<string, unknown>) {
  const query = mapTiendasParams(params ?? {});
  const { data } = await apiClient.get<TiendasResponse>(`${BASE}/tiendas`, { params: query });
  const tiendas = (data.tiendas ?? []).map(mapTienda);
  return {
    data: tiendas,
    meta: data.meta ?? defaultMeta,
  };
}

function mapTiendasParams(params: Record<string, unknown>) {
  const mapped: Record<string, unknown> = {};
  if (params.search) {
    mapped.q = params.search;
  }
  if (params.categoria) {
    mapped.categoria = params.categoria;
  }
  if (params.ciudad) {
    mapped.ciudad = params.ciudad;
  }
  if (params.abiertas) {
    mapped.abiertas = params.abiertas === true || params.abiertas === "1" ? "1" : undefined;
  }
  if (params.page) mapped.page = params.page;
  if (params.per_page) mapped.per_page = params.per_page;
  return mapped;
}

export type TiendaDetalle = Tienda & { productos: Record<string, Producto[]> };

export async function fetchTiendaDetalle(id: number | string): Promise<TiendaDetalle> {
  const { data } = await apiClient.get<TiendaDetalleResponse>(`${BASE}/tiendas/${id}`);
  const tienda = mapTienda(data.tienda);
  const productos = mapProductosPorCategoria(data.tienda.productos ?? {});
  return {
    ...tienda,
    descripcion: data.tienda.descripcion ?? tienda.descripcion ?? null,
    productos,
  };
}

export async function fetchCategorias() {
  const { data } = await apiClient.get<{ categorias: ApiCategoria[] }>(`${BASE}/categorias`);
  return (data.categorias ?? []).map((categoria) => ({
    id: categoria.id_categoria,
    nombre: categoria.nombre,
    slug: categoria.slug,
  } satisfies Categoria));
}

export async function fetchProductos(tiendaId: number | string, params?: Record<string, unknown>) {
  const { data } = await apiClient.get<{ productos: ApiProducto[]; meta: { page: number; per_page: number; total: number } }>(
    `${BASE}/tiendas/${tiendaId}/productos`,
    {
      params,
    },
  );
  return {
    productos: (data.productos ?? []).map(mapProducto),
    meta: data.meta ?? defaultMeta,
  };
}
