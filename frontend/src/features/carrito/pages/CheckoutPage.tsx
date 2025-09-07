export default function CheckoutPage() {
  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Confirmar pedido</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Paso final con selección de dirección, método de pago simulado y resumen del pedido.
        </p>
      </header>
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-lg border border-dashed border-slate-300 p-6 text-sm text-slate-500 dark:border-slate-700">
          <p>
            Inserta aquí un formulario con <strong>AddressForm</strong> y un <strong>MapaPicker</strong> para elegir la ubicación exacta.
          </p>
          <p className="mt-2 text-xs text-slate-400">Valida los campos con Zod y muestra feedback por campo.</p>
        </div>
        <aside className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-semibold">Resumen</h2>
          <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <li>Subtotal</li>
            <li>Envío calculado por peso</li>
            <li>Total</li>
          </ul>
          <p className="text-xs text-slate-400">
            Deshabilita el botón de confirmar mientras se procesa y muestra un loader global.
          </p>
        </aside>
      </div>
    </section>
  );
}
