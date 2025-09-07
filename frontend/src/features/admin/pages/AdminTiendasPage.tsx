export default function AdminTiendasPage() {
  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Tiendas</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Lista de tiendas con filtros por estado de aprobación y botones para aprobar o rechazar.
          </p>
        </div>
        <div className="rounded-md border border-slate-200 px-4 py-2 text-xs text-slate-500 dark:border-slate-700">
          Añade vista detallada y herramientas de búsqueda avanzada.
        </div>
      </header>
      <div className="rounded-lg border border-dashed border-slate-300 p-6 text-sm text-slate-500 dark:border-slate-700">
        <p>
          Implementa <strong>DataTable</strong> con acciones masivas y confirm dialogs antes de cambiar estados.
        </p>
      </div>
    </section>
  );
}
