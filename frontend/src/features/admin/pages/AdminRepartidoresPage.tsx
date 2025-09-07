export default function AdminRepartidoresPage() {
  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Repartidores</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Gestiona aprobaciones, estados de perfil y documentación de repartidores.
          </p>
        </div>
        <div className="rounded-md border border-slate-200 px-4 py-2 text-xs text-slate-500 dark:border-slate-700">
          Incluye filtros por estado de aprobación y activo/inactivo.
        </div>
      </header>
      <div className="rounded-lg border border-dashed border-slate-300 p-6 text-sm text-slate-500 dark:border-slate-700">
        <p>
          Usa tablas con acciones contextualizadas y modales para revisar detalles del perfil (DPI, vehículo, etc.).
        </p>
      </div>
    </section>
  );
}
