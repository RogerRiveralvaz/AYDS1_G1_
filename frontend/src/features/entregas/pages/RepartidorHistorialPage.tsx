export default function RepartidorHistorialPage() {
  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Historial de entregas</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Tabla con filtros por rango de fechas, distancia recorrida y estado de pago.
        </p>
      </header>
      <div className="rounded-lg border border-dashed border-slate-300 p-6 text-sm text-slate-500 dark:border-slate-700">
        <p>
          Presenta métricas como distancia total y monto acumulado. Permite exportar CSV opcional.
        </p>
      </div>
    </section>
  );
}
