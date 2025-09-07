export default function RepartidorEntregasPage() {
  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Mis entregas</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Bandeja con entregas asignadas, aceptadas y en curso. Permite aceptar o rechazar.
          </p>
        </div>
        <div className="rounded-md border border-slate-200 px-4 py-2 text-xs text-slate-500 dark:border-slate-700">
          Agrega polling cada 10 s para refrescar entregas asignadas automáticamente.
        </div>
      </header>
      <div className="rounded-lg border border-dashed border-slate-300 p-6 text-sm text-slate-500 dark:border-slate-700">
        <p>
          Implementa tarjetas accesibles con botones de acción y <strong>StatusBadge</strong> según estado.
        </p>
      </div>
    </section>
  );
}
