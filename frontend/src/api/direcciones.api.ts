import { apiClient } from "./client";

export type DireccionPayload = {
  etiqueta?: string | null;
  linea1: string;
  linea2?: string | null;
  ciudad: string;
  estado?: string | null;
  codigo_postal?: string | null;
  pais?: string;
  ubicacion?: string | null;
};

export type Direccion = DireccionPayload & {
  id: number;
  creado_en?: string;
  es_predeterminada: boolean;
};

type ApiDireccion = {
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
};

function mapDireccion(api: ApiDireccion): Direccion {
  return {
    id: api.id_direccion,
    etiqueta: api.etiqueta ?? null,
    linea1: api.linea1,
    linea2: api.linea2 ?? null,
    ciudad: api.ciudad,
    estado: api.estado ?? null,
    codigo_postal: api.codigo_postal ?? null,
    pais: api.pais ?? "GT",
    ubicacion: api.ubicacion ?? null,
    creado_en: api.creado_en,
    es_predeterminada: Boolean(api.es_predeterminada),
  };
}

export async function fetchDirecciones() {
  const { data } = await apiClient.get<{ direcciones: ApiDireccion[] }>("/direcciones");
  return (data.direcciones ?? []).map(mapDireccion);
}

export async function crearDireccion(payload: DireccionPayload & { predeterminada?: boolean }) {
  const { predeterminada, ...rest } = payload;
  const { data } = await apiClient.post<{ direccion: ApiDireccion }>("/direcciones", {
    ...rest,
    predeterminada: Boolean(predeterminada),
  });
  return mapDireccion(data.direccion);
}

export async function actualizarDireccion(id: number, payload: Partial<DireccionPayload>) {
  const { data } = await apiClient.patch<{ direccion: ApiDireccion }>(`/direcciones/${id}`, payload);
  return mapDireccion(data.direccion);
}

export async function eliminarDireccion(id: number) {
  await apiClient.delete(`/direcciones/${id}`);
}

export async function establecerDireccionPredeterminada(id: number) {
  const { data } = await apiClient.post<{ direccion: ApiDireccion }>(`/direcciones/${id}/predeterminada`, {});
  return mapDireccion(data.direccion);
}
