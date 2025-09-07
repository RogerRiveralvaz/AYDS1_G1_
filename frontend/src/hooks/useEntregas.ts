import { useQuery } from "@tanstack/react-query";

import { fetchEntregas } from "../api/entregas.api";
import { queryKeys } from "../api/queryKeys";

export function useEntregas(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: queryKeys.entregas.list(filters),
    queryFn: () => fetchEntregas(filters),
    keepPreviousData: true,
  });
}
