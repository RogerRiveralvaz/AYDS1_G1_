import { Link } from "react-router-dom";

import { RoleLayout } from "./RoleLayout";

const navItems = [
  { to: "/app/repartidor/entregas", label: "Mis entregas" },
  { to: "/app/repartidor/historial", label: "Historial" },
];

export default function RepartidorLayout() {
  return (
    <RoleLayout
      roleLabel="Repartidor"
      navItems={navItems}
      headerContent={
        <Link
          to="/"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
        >
          Ayuda
        </Link>
      }
    />
  );
}
