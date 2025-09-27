import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { logout } from "../../api/auth.api";
import { useAuthStore } from "../../app/store/auth";
import { Button } from "../ui/Button";
import { RoleLayout } from "./RoleLayout";

const navItems = [
  { to: "/app/tienda/panel", label: "Panel" },
  { to: "/app/tienda/productos", label: "Productos" },
  { to: "/app/tienda/pedidos", label: "Pedidos" },
  { to: "/app/tienda/tarifa", label: "Tarifa de envío" },
  { to: "/app/tienda/perfil", label: "Perfil" },
];

export default function TiendaLayout() {
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
      roleLabel="Tienda"
      navItems={navItems}
      headerContent={
        <div className="flex items-center gap-2">
          <Link
            to="/"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            Ver sitio
          </Link>
          <Button variant="ghost" size="sm" onClick={handleLogout} disabled={isLoggingOut}>
            {isLoggingOut ? "Saliendo..." : "Cerrar sesion"}
          </Button>
        </div>
      }
    />
  );
}
