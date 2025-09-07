import { useParams } from "react-router-dom";

export default function PedidoDetallePage() {
  const { id } = useParams();

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-wide text-blue-600">Pedido #{id}</p>
        <h1 className="text-2xl font-semibold">Detalle del pedido</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Muestra el timeline con los estados del pedido, la lista de productos y el seguimiento de entrega.
        </p>
      </header>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-semibold">Timeline</h2>
          <p className="text-sm text-slate-500">
            Implementa <strong>TimelineEstadoPedido</strong> con iconografía accesible y marcas de tiempo.
          </p>
        </div>
        <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-semibold">Entrega</h2>
          <p className="text-sm text-slate-500">
            Muestra estado actual de la entrega, datos de repartidor y mapa con ruta (poll cada 5–10 s).
          </p>
        </div>
      </div>
    </section>
  );
}
