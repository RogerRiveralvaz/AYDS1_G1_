export default function PanelPage() {
  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Panel de tienda</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          KPIs diarios, métricas clave y resumen de actividad para la tienda aprobada.
        </p>
      </header>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {["Pedidos hoy", "Ingresos", "Ticket promedio", "Productos bajos"].map((title) => (
          <article key={title} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-sm font-medium text-slate-500">{title}</h2>
            <p className="mt-3 text-2xl font-semibold text-slate-900 dark:text-slate-100">--</p>
          </article>
        ))}
      </div>
      <div className="rounded-lg border border-dashed border-slate-300 p-6 text-sm text-slate-500 dark:border-slate-700">
        <p>Utiliza <strong>Recharts</strong> para mostrar pedidos por día y ventas por categoría.</p>
      </div>
    </section>
  );
}
