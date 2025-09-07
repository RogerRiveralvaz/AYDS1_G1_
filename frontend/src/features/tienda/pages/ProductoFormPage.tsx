import { useParams } from "react-router-dom";

export default function ProductoFormPage() {
  const { id } = useParams();
  const editing = Boolean(id);

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">{editing ? "Editar" : "Nuevo"} producto</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Formularios con validación para nombre, categoría, precio, stock y carga de imágenes.
        </p>
      </header>
      <div className="rounded-lg border border-dashed border-slate-300 p-6 text-sm text-slate-500 dark:border-slate-700">
        <ul className="list-disc space-y-2 pl-5">
          <li>Utiliza <strong>react-hook-form</strong> + <strong>Zod</strong>.</li>
          <li>Componente <strong>Uploader</strong> para imágenes y vista previa.</li>
          <li>Mensajes de error por campo y botón deshabilitado mientras se guarda.</li>
        </ul>
      </div>
    </section>
  );
}
