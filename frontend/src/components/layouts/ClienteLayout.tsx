import { Link } from "react-router-dom";

import { RoleLayout } from "./RoleLayout";

const navItems = [
  { to: "/app/cliente/catalogo", label: "Catálogo" },
  { to: "/app/cliente/carrito", label: "Carrito" },
  { to: "/app/cliente/checkout", label: "Checkout" },
  { to: "/app/cliente/pedidos", label: "Pedidos" },
  { to: "/app/cliente/perfil", label: "Perfil" },
];

export default function ClienteLayout() {
  return (
    <RoleLayout
      roleLabel="Cliente"
      navItems={navItems}
      headerContent={
        <Link
          to="/"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
        >
          Ver catálogo
        </Link>
      }
    />
  );
}
