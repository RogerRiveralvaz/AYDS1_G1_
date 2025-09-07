import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { useIsAuthenticated } from "../store/auth";

export function ProtectedRoute({ children }: { readonly children: ReactNode}) {
  const isAuthenticated = useIsAuthenticated();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
