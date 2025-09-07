export default function PedidosPage() {
  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Pedidos recibidos</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Bandeja organizada por estado (Pendiente, Preparación, Listo) con acciones para cada pedido.
          </p>
        </div>
        <div className="rounded-md border border-slate-200 px-4 py-2 text-xs text-slate-500 dark:border-slate-700">
          Próximamente: panel Kanban o tabs con contadores.
        </div>
      </header>
      <div className="rounded-lg border border-dashed border-slate-300 p-6 text-sm text-slate-500 dark:border-slate-700">
        <p>
          Usa <strong>TanStack Query</strong> para agrupar pedidos por estado y ejecutar mutaciones <code>PATCH /pedidos/:id/estado</code> con confirmación.
        </p>
        <p className="mt-2 text-xs text-slate-400">
          Añade sonidos o toasts para nuevos pedidos (polling o WebSocket opcional).
        </p>
      </div>
    </section>
  );
}
