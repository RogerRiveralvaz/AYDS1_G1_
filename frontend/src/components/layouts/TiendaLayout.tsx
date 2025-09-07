import { Link } from "react-router-dom";

import { RoleLayout } from "./RoleLayout";

const navItems = [
  { to: "/app/tienda/panel", label: "Panel" },
  { to: "/app/tienda/productos", label: "Productos" },
  { to: "/app/tienda/pedidos", label: "Pedidos" },
  { to: "/app/tienda/tarifa", label: "Tarifa de envío" },
  { to: "/app/tienda/perfil", label: "Perfil" },
];

export default function TiendaLayout() {
  return (
    <RoleLayout
      roleLabel="Tienda"
      navItems={navItems}
      headerContent={
        <Link
          to="/"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
        >
          Ver sitio
        </Link>
      }
    />
  );
}
