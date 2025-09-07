import type { RoleCode } from "../app/store/auth";

export type PaginationMeta = {
  page: number;
  per_page: number;
  total: number;
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

export interface TiendaAdmin {
  id_tienda: number;
  nombre: string;
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
  direccion_detalle?: Direccion | null;
  activo: boolean;
  aprobado_en?: string | null;
  aprobado_por?: number | null;
  creado_en?: string;
  actualizado_en?: string;
}

export interface AdminResumen {
  pedidos_hoy: number;
  ingresos_totales: string;
  tiendas_activas: number;
  productos_top: Array<{ producto: string; cantidad: number }>;
  tiendas_por_estado: Array<{ estado: string; total: number }>;
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
}
