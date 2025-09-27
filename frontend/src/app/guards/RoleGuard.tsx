import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";

import { type RoleCode, useRoles } from "../store/auth";

export function RoleGuard({ roles, children }: { readonly roles: RoleCode[]; readonly children: ReactNode }) {
  const userRoles = useRoles();
  const allowed = userRoles.some((role) => roles.includes(role));

  if (!allowed) {
    return <Navigate to="/auth/login" replace />;
  }

  return <>{children}</>;
}
