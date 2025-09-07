export default function AdminClientesPage() {
  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Clientes</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Consulta rápida de clientes registrados, con estadísticas y filtros por actividad.
        </p>
      </header>
      <div className="rounded-lg border border-dashed border-slate-300 p-6 text-sm text-slate-500 dark:border-slate-700">
        <p>
          Usa tablas ligeras con paginación y exportar CSV. Considera mostrar últimos pedidos y direcciones registradas.
        </p>
      </div>
    </section>
  );
}
