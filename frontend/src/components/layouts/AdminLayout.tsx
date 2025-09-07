import { Link } from "react-router-dom";

import { RoleLayout } from "./RoleLayout";

const navItems = [
  { to: "/app/admin/panel", label: "Resumen" },
  { to: "/app/admin/tiendas", label: "Tiendas" },
  { to: "/app/admin/repartidores", label: "Repartidores" },
  { to: "/app/admin/clientes", label: "Clientes" },
];

export default function AdminLayout() {
  return (
    <RoleLayout
      roleLabel="Administrador"
      navItems={navItems}
      headerContent={
        <Link
          to="/"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
        >
          Ir al sitio
        </Link>
      }
    />
  );
}
