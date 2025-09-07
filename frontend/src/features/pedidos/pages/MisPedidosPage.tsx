export default function MisPedidosPage() {
  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Mis pedidos</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Implementa una tabla con filtros por estado, paginación y búsqueda de referencia.
        </p>
      </header>
      <div className="rounded-lg border border-dashed border-slate-300 p-6 text-sm text-slate-500 dark:border-slate-700">
        <p>
          Usa <strong>TanStack Table</strong> para ordenar y paginar. Considera un layout responsive tipo tarjetas para móvil.
        </p>
        <p className="mt-2 text-xs text-slate-400">
          Cada fila debe enlazar al detalle y mostrar badges de estado con colores consistentes.
        </p>
      </div>
    </section>
  );
}
