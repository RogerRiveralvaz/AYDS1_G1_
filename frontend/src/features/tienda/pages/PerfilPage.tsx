export default function PerfilPage() {
  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Perfil de la tienda</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Información general, logo, horarios y dirección con selector en mapa.
        </p>
      </header>
      <div className="rounded-lg border border-dashed border-slate-300 p-6 text-sm text-slate-500 dark:border-slate-700">
        <ul className="list-disc space-y-2 pl-5">
          <li>Formulario dividido en secciones: datos fiscales, contacto y logística.</li>
          <li>Integrar <strong>MapaPicker</strong> basado en react-leaflet para actualizar coordenadas.</li>
          <li>Soporte de carga de logo con <strong>react-dropzone</strong> y vista previa.</li>
        </ul>
      </div>
    </section>
  );
}
