import { useParams } from "react-router-dom";

export default function TiendaDetallePage() {
  const { id } = useParams();

  return (
    <section aria-labelledby="titulo-tienda" className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-wide text-blue-600">Tienda #{id}</p>
        <h1 id="titulo-tienda" className="text-3xl font-semibold">
          Detalle de la tienda
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Presenta la información de la tienda, categorías, horarios y productos agrupados.
        </p>
      </header>
      <div className="rounded-lg border border-dashed border-slate-300 p-6 text-sm leading-6 text-slate-500 dark:border-slate-700">
        <ul className="list-disc space-y-2 pl-5">
          <li>Sección hero con datos generales, rating y estado abierto/cerrado.</li>
          <li>Tabs o acordeones por categoría mostrando <strong>CardProducto</strong>.</li>
          <li>Botones para agregar al carrito con feedback inmediato.</li>
          <li>Mapa opcional con ubicación de la tienda.</li>
        </ul>
      </div>
    </section>
  );
}
