import { useQuery } from "@tanstack/react-query";

import { fetchPedidos } from "../api/pedidos.api";
import { queryKeys } from "../api/queryKeys";

export function usePedidos(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: queryKeys.pedidos.list(filters),
    queryFn: () => fetchPedidos(filters),
    keepPreviousData: true,
  });
}
