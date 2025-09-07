import { useParams } from "react-router-dom";

export default function RepartidorEntregaDetallePage() {
  const { id } = useParams();

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-wide text-blue-600">Entrega #{id}</p>
        <h1 className="text-2xl font-semibold">Detalle de entrega</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Información de recogida y destino, historial de estados y mapa de navegación.
        </p>
      </header>
      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-semibold">Acciones</h2>
          <p className="text-sm text-slate-500">
            Botones para cambiar estado (Aceptada, En camino, Entregada) con confirmaciones y bloqueo según transición válida.
          </p>
        </div>
        <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-semibold">Mapa</h2>
          <p className="text-sm text-slate-500">
            Usa <strong>react-leaflet</strong> para mostrar ruta y enviar ubicación actual del repartidor.
          </p>
        </div>
      </div>
    </section>
  );
}
