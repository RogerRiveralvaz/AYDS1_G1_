import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import {
  updateAdminTiendaEstado,
  updateAdminTiendaActivo,
  deleteAdminTienda,
  fetchAdminTiendaById,
  type UpdateAdminTiendaEstadoParams,
} from "../api/admin.api";
import { getErrorMessage } from "../api/client";
import { queryKeys } from "../api/queryKeys";

export function useAdminTienda(id?: number) {
  const enabled = useMemo(() => typeof id === "number" && id > 0, [id]);

  return useQuery({
    queryKey: queryKeys.admin.tiendas.detail(id ?? 0),
    queryFn: () => fetchAdminTiendaById(id!),
    enabled,
    retry: false,
  });
}

export function useActualizarEstadoTienda() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, codigo }: UpdateAdminTiendaEstadoParams) => updateAdminTiendaEstado({ id, codigo }),
    onSuccess: (tienda) => {
      toast.success(`Estado actualizado a ${tienda.estado_aprobacion}`);
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.tiendas.root });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.tiendas.detail(tienda.id_tienda) });
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, "No se pudo actualizar la tienda"));
    },
  });
}

export function useActualizarActivoTienda() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, activo }: { id: number; activo: boolean }) => updateAdminTiendaActivo(id, activo),
    onSuccess: (tienda) => {
      toast.success(`La tienda ahora está ${tienda.activo ? "activa" : "inactiva"}.`);
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.tiendas.root });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.tiendas.detail(tienda.id_tienda) });
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, "No se pudo actualizar la tienda"));
    },
  });
}

export function useEliminarTienda() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteAdminTienda(id),
    onSuccess: (tienda) => {
      toast.success("La tienda fue eliminada correctamente.");
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.tiendas.root });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.tiendas.detail(tienda.id_tienda) });
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, "No se pudo eliminar la tienda"));
    },
  });
}
