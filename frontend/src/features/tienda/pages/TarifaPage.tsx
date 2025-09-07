export default function TarifaPage() {
  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Tarifa de envío</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Configura la tarifa preferente de tu tienda y sobrescribe la global cuando aplique.
        </p>
      </header>
      <div className="rounded-lg border border-dashed border-slate-300 p-6 text-sm text-slate-500 dark:border-slate-700">
        <ul className="list-disc space-y-2 pl-5">
          <li>Campos: tarifa base Q, base en kg, extra por kg, tiempo estimado.</li>
          <li>Validación numérica con límites mínimos y máximos.</li>
          <li>Tooltips de ayuda para explicar cada campo.</li>
        </ul>
      </div>
    </section>
  );
}
