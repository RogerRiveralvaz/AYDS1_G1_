import { Spinner } from "../ui/Spinner";

export function FullPageLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center" role="status" aria-live="polite">
      <Spinner size="lg" />
      <span className="sr-only">Cargando contenido…</span>
    </div>
  );
}
