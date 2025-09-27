import { apiClient } from "./client";
import type { Direccion } from "./direcciones.api";
import type { UsuarioResumen } from "./types";

export type UsuarioPerfil = UsuarioResumen & {
  direccion_defecto_id?: number | null;
  direcciones: Direccion[];
};

type ApiUsuario = UsuarioResumen & {
  direccion_defecto_id?: number | null;
  direcciones?: Array<{
    id_direccion: number;
    etiqueta?: string | null;
    linea1: string;
    linea2?: string | null;
    ciudad: string;
    estado?: string | null;
    codigo_postal?: string | null;
    pais: string;
    ubicacion?: string | null;
    creado_en?: string;
    es_predeterminada?: boolean;
  }>;
};

function mapDireccion(api: NonNullable<ApiUsuario['direcciones']>[number]): Direccion {
  return {
    id: api.id_direccion,
    etiqueta: api.etiqueta ?? null,
    linea1: api.linea1,
    linea2: api.linea2 ?? null,
    ciudad: api.ciudad,
    estado: api.estado ?? null,
    codigo_postal: api.codigo_postal ?? null,
    pais: api.pais,
    ubicacion: api.ubicacion ?? null,
    creado_en: api.creado_en,
    es_predeterminada: Boolean(api.es_predeterminada),
  };
}

function mapUsuario(api: ApiUsuario): UsuarioPerfil {
  const direcciones = (api.direcciones ?? []).map(mapDireccion);
  return {
    ...api,
    direcciones,
    direccion_defecto_id: api.direccion_defecto_id ??
      direcciones.find((direccion) => direccion.es_predeterminada)?.id ?? null,
  };
}

export async function fetchUsuarios(params?: Record<string, unknown>) {
  const { data } = await apiClient.get<{ usuarios: ApiUsuario[] }>("/usuarios", { params });
  return (data.usuarios ?? []).map(mapUsuario);
}

export async function fetchUsuarioDetalle(id: number | string) {
  const { data } = await apiClient.get<{ usuario: ApiUsuario }>(`/usuarios/${id}`);
  return mapUsuario(data.usuario);
}

export async function updateUsuario(id: number | string, payload: Record<string, unknown>) {
  const { data } = await apiClient.patch<{ usuario: ApiUsuario }>(`/usuarios/${id}`, payload);
  return mapUsuario(data.usuario);
}

export async function fetchPerfilCliente() {
  const { data } = await apiClient.get<{ usuario: ApiUsuario }>("/usuarios/me");
  return mapUsuario(data.usuario);
}

export async function updatePerfilCliente(payload: Record<string, unknown>) {
  const { data } = await apiClient.patch<{ usuario: ApiUsuario }>("/usuarios/me", payload);
  return mapUsuario(data.usuario);
}
