import { apiClient } from "./client";

export type Rol = {
  id: number;
  codigo: string;
  nombre: string;
};

export async function fetchRoles() {
  const { data } = await apiClient.get<Rol[]>("/roles");
  return data;
}
