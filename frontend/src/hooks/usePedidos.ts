import { useQuery } from "@tanstack/react-query";

import { fetchPedidos } from "../api/pedidos.api";
import { queryKeys } from "../api/queryKeys";

type PedidosQueryData = Awaited<ReturnType<typeof fetchPedidos>>;

export function usePedidos(filters?: Record<string, unknown>) {
  return useQuery<PedidosQueryData>({
    queryKey: queryKeys.pedidos.list(filters),
    queryFn: () => fetchPedidos(filters),
    placeholderData: (previousData) => previousData,
  });
}
