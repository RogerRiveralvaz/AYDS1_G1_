export default function AdminPanelPage() {
  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Resumen general</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Supervisión de métricas globales, pedidos por día y top de tiendas/productos.
        </p>
      </header>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {["Pedidos totales", "Ingresos", "Repartidores activos", "Tiendas pendientes"].map((title) => (
          <article key={title} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-sm font-medium text-slate-500">{title}</h2>
            <p className="mt-3 text-2xl font-semibold text-slate-900 dark:text-slate-100">--</p>
          </article>
        ))}
      </div>
      <div className="rounded-lg border border-dashed border-slate-300 p-6 text-sm text-slate-500 dark:border-slate-700">
        <p>
          Inserta gráficos comparativos y filtros por rango de fechas usando <strong>Recharts</strong> y React Query.
        </p>
      </div>
    </section>
  );
}
