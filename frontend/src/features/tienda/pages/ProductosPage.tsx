export default function ProductosPage() {
  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Productos</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Administra el catálogo, carga imágenes y controla el stock en tiempo real.
          </p>
        </div>
        <button
          type="button"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
        >
          Nuevo producto
        </button>
      </header>
      <div className="rounded-lg border border-dashed border-slate-300 p-6 text-sm text-slate-500 dark:border-slate-700">
        <p>
          Inserta una <strong>DataTable</strong> con filtros por estado, categoría y control de paginación remota.
        </p>
        <p className="mt-2 text-xs text-slate-400">Usa <code>PUT /tienda/productos/:id</code> para actualizar stock y estado.</p>
      </div>
    </section>
  );
}
