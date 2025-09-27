import { Link, useLocation } from "react-router-dom";

export default function NotFoundPage() {
  const location = useLocation();

  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center space-y-4 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">404</p>
      <h1 className="text-3xl font-bold">Página no encontrada</h1>
      <p className="max-w-md text-sm text-slate-600 dark:text-slate-300">
        No pudimos encontrar la ruta <code className="rounded bg-slate-100 px-1 py-0.5 dark:bg-slate-800">{location.pathname}</code>.
        Verifica la URL o regresa al inicio.
      </p>
      <div className="flex gap-3">
        <Link
          to="/"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
        >
          Ir al inicio
        </Link>
        <Link
          to="/app/cliente/pedidos"
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
        >
          Mis pedidos
        </Link>
      </div>
    </main>
  );
}
