import type { RoleCode } from "../app/store/auth";

export type PaginationMeta = {
  page: number;
  per_page: number;
  total: number;
};

export type PaginatedResponse<T> = {
  data: T[];
  meta: PaginationMeta;
};

export interface Direccion {
  etiqueta?: string | null;
  linea1: string;
  linea2?: string | null;
  ciudad: string;
  estado?: string | null;
  codigo_postal?: string | null;
  pais: string;
  ubicacion?: string | null;
}

export interface HorarioTienda {
  dia_semana: number;
  hora_apertura?: string | null;
  hora_cierre?: string | null;
  cerrado: boolean;
}

export interface ClienteDireccion extends Direccion {
  id_direccion: number;
  principal?: boolean;
}

export interface ClientePedidoTiendaResumen {
  id_tienda?: number;
  nombre?: string | null;
  razon_social?: string | null;
}

export interface ClientePedidoHistorial {
  id_pedido: number;
  total_q: number;
  estado: string;
  creado_en: string;
  tienda?: ClientePedidoTiendaResumen | null;
}

export interface ClienteAdmin {
  id_cliente: number;
  id_usuario: number;
  nombres: string;
  apellidos: string;
  nombre?: string;
  email: string;
  correo?: string;
  telefono?: string | null;
  activo: boolean;
  pedidos_totales: number;
  historial_pedidos?: ClientePedidoHistorial[];
  direcciones?: ClienteDireccion[];
}

export interface TiendaAdmin {
  id_tienda: number;
  nombre: string;
  razon_social: string;
  logo?: string | null;
  categoria?: string | null;
  direccion?: string | null;
  ciudad?: string | null;
  horario?: HorarioTienda[];
  horarios?: HorarioTienda[];
  promocion_activa?: boolean;
  abierto?: boolean;
  email: string;
  telefono: string;
  cuenta_bancaria: string;
  estado_aprobacion: string;
  estado_aprobacion_nombre?: string | null;
  direccion_detalle?: Direccion | null;
  activo: boolean;
  aprobado_en?: string | null;
  aprobado_por?: number | null;
  creado_en?: string;
  actualizado_en?: string;
}

export interface AdminResumenPedidoPorDia {
  fecha: string;
  total: number;
}

export interface AdminResumenTopTienda {
  tienda: string;
  ingresos: number | string;
}

export interface AdminResumen {
  pedidos_hoy: number;
  pedidos_totales: number;
  ingresos_totales: number | string;
  tiendas_activas: number;
  repartidores_activos: number;
  tiendas_pendientes: number;
  productos_top?: Array<{ producto: string; cantidad: number }>;
  tiendas_por_estado?: Array<{ estado: string; total: number }>;
  pedidos_por_dia?: AdminResumenPedidoPorDia[];
  top_tiendas?: AdminResumenTopTienda[];
}

export interface UsuarioResumen {
  id_usuario: number;
  email: string;
  nombres: string;
  apellidos: string;
  genero?: string | null;
  telefono?: string | null;
  fecha_nacimiento?: string | null;
  url_foto?: string | null;
  activo: boolean;
  roles: RoleCode[];
}

export interface RepartidorAdmin {
  id_usuario: number;
  dpi: string;
  licencia_numero?: string | null;
  licencia_tipo?: string | null;
  vehiculo_tipo: string;
  placa?: string | null;
  cuenta_bancaria: string;
  estado_aprobacion: string;
  activo: boolean;
  usuario: UsuarioResumen;
  updated_at?: string | null;
}
