import { Link, NavLink, Outlet } from "react-router-dom";

import { SkipLink } from "../ui/SkipLink";

const publicLinks = [
  { to: "/catalogo/tiendas", label: "Tiendas" },
  { to: "/auth/login", label: "Iniciar sesión" },
  { to: "/auth/register?rol=CLIENTE", label: "Registrarse" },
];

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-slate-100">
      <SkipLink />
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link to="/" className="text-lg font-semibold">
            AYD Express
          </Link>
          <nav aria-label="Principal" className="hidden items-center gap-6 text-sm font-medium md:flex">
            {publicLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  isActive ? "text-blue-600" : "text-slate-600 hover:text-blue-600"
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main id="contenido-principal" className="mx-auto min-h-[calc(100vh-5rem)] max-w-6xl px-4 py-8">
        <Outlet />
      </main>
      <footer className="mt-12 border-t border-slate-200 bg-white/70 py-6 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900/70">
        © {new Date().getFullYear()} AYD Express. Todos los derechos reservados.
      </footer>
    </div>
  );
}
