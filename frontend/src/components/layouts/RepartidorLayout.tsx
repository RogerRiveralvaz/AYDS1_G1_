import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { logout } from "../../api/auth.api";
import { useAuthStore } from "../../app/store/auth";
import { Button } from "../ui/Button";
import { RoleLayout } from "./RoleLayout";

const navItems = [
  { to: "/app/repartidor/entregas", label: "Mis entregas" },
  { to: "/app/repartidor/historial", label: "Historial" },
];

export default function RepartidorLayout() {
  const navigate = useNavigate();
  const clearSession = useAuthStore((state) => state.clearSession);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logout();
    } catch (error) {
      console.error("Error al cerrar sesion", error);
    } finally {
      clearSession();
      navigate("/auth/login", { replace: true });
      setIsLoggingOut(false);
    }
  };

  return (
    <RoleLayout
      roleLabel="Repartidor"
      navItems={navItems}
      headerContent={
        <div className="flex items-center gap-2">
          <Link
            to="/"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            Ayuda
          </Link>
          <Button variant="ghost" size="sm" onClick={handleLogout} disabled={isLoggingOut}>
            {isLoggingOut ? "Saliendo..." : "Cerrar sesion"}
          </Button>
        </div>
      }
    />
  );
}
