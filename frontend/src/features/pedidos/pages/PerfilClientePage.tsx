export default function PerfilClientePage() {
  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Mi perfil</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Formulario para actualizar datos personales, gestionar direcciones y preferencias.
        </p>
      </header>
      <div className="rounded-lg border border-dashed border-slate-300 p-6 text-sm text-slate-500 dark:border-slate-700">
        <ul className="list-disc space-y-2 pl-5">
          <li>Datos básicos con validaciones y máscara de teléfono.</li>
          <li>Lista de direcciones con opción de establecer predeterminada y editar en modal.</li>
          <li>Sección para cambiar contraseña y configurar notificaciones.</li>
        </ul>
      </div>
    </section>
  );
}
