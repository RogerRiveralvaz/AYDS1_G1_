import { useQuery } from "@tanstack/react-query";

import { fetchMisEntregas } from "../api/entregas.api";
import { queryKeys } from "../api/queryKeys";

type EntregasQueryData = Awaited<ReturnType<typeof fetchMisEntregas>>;

export function useEntregas(filters?: Record<string, unknown>) {
  return useQuery<EntregasQueryData>({
    queryKey: queryKeys.entregas.list(filters),
    queryFn: () => fetchMisEntregas(filters),
    placeholderData: (previousData) => previousData,
  });
}
