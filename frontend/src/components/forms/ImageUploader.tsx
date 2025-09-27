import { useCallback, useMemo, useState } from "react";
import { useDropzone, type DropEvent } from "react-dropzone";
import { Star, StarOff, Trash2, Upload, ArrowUp, ArrowDown } from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { cn } from "../../utils/cn";

export type ImageValue = {
  url: string;
  principal?: boolean;
  orden?: number;
};

interface ImageUploaderProps {
  readonly value?: ImageValue[];
  readonly onChange?: (imagenes: ImageValue[]) => void;
  readonly maxImages?: number;
  readonly disabled?: boolean;
  readonly className?: string;
}

const ACCEPTED_PATTERNS = ["http://", "https://"];

export function ImageUploader({ value = [], onChange, maxImages = 8, disabled, className }: Readonly<ImageUploaderProps>) {
  const [pendingUrl, setPendingUrl] = useState("");

  const normalized = useMemo(() => {
    return value
      .map((imagen, index) => ({
        ...imagen,
        orden: imagen.orden ?? index + 1,
      }))
      .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
  }, [value]);

  const update = useCallback(
    (imagenes: ImageValue[]) => {
      const withOrder = imagenes.map((imagen, index) => ({
        ...imagen,
        orden: index + 1,
      }));
      onChange?.(withOrder);
    },
    [onChange],
  );

  const addUrl = useCallback(
    (url: string) => {
      const trimmed = url.trim();
      if (!trimmed) {
        return;
      }
      if (normalized.length >= maxImages) {
        toast.error(`Solo puedes agregar hasta ${maxImages} imágenes.`);
        return;
      }
      if (!ACCEPTED_PATTERNS.some((pattern) => trimmed.toLowerCase().startsWith(pattern))) {
        toast.error("Ingresa una URL pública que inicie con http:// o https://");
        return;
      }
      if (!/^https?:\/\//i.test(trimmed)) {
        toast.error("La URL no es válida.");
        return;
      }
      if (normalized.some((imagen) => imagen.url === trimmed)) {
        toast("Esta imagen ya está en la galería.");
        return;
      }
      update([
        ...normalized,
        {
          url: trimmed,
          principal: normalized.length === 0,
        },
      ]);
      setPendingUrl("");
    },
    [normalized, maxImages, update],
  );

  const onDrop = useCallback(
    (acceptedFiles: File[], _rejected: unknown, event: DropEvent) => {
      const uriList =
        (event && "dataTransfer" in event && event.dataTransfer?.getData("text/uri-list")) ||
        (event && "nativeEvent" in event && "dataTransfer" in event.nativeEvent
          ? event.nativeEvent.dataTransfer?.getData("text/uri-list")
          : undefined);
      if (uriList) {
        const first = uriList.split("\n").find((line) => Boolean(line.trim()));
        if (first) {
          addUrl(first.trim());
          return;
        }
      }
      if (acceptedFiles.length > 0) {
        toast("Para adjuntar imágenes debes contar con un enlace público (CDN, Firebase, etc.).");
      }
    },
    [addUrl],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    noClick: true,
    disabled,
  });

  const togglePrincipal = useCallback(
    (url: string) => {
      update(
        normalized.map((imagen) => ({
          ...imagen,
          principal: imagen.url === url,
        })),
      );
    },
    [normalized, update],
  );

  const removeImage = useCallback(
    (url: string) => {
      update(normalized.filter((imagen) => imagen.url !== url));
    },
    [normalized, update],
  );

  const moveImage = useCallback(
    (url: string, direction: -1 | 1) => {
      const index = normalized.findIndex((imagen) => imagen.url === url);
      if (index < 0) return;
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= normalized.length) return;
      const reordered = [...normalized];
      const [item] = reordered.splice(index, 1);
      reordered.splice(newIndex, 0, item);
      update(reordered);
    },
    [normalized, update],
  );

  return (
    <div className={cn("space-y-4", className)}>
      <div
        {...getRootProps()}
        className={cn(
          "relative flex min-h-[140px] flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 p-6 text-center transition dark:border-slate-700",
          isDragActive ? "border-blue-500 bg-blue-50/40 dark:bg-blue-500/10" : "hover:border-blue-400",
          disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
        )}
      >
        <input {...getInputProps()} aria-label="Área para arrastrar imágenes" />
        <Upload className="h-8 w-8 text-slate-400" aria-hidden />
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Arrastra y suelta imágenes o pega la URL pública. La primera imagen se marcará como principal.
        </p>
        <div className="mt-4 flex w-full flex-col items-center gap-2 sm:flex-row">
          <Input
            value={pendingUrl}
            onChange={(event) => setPendingUrl(event.currentTarget.value)}
            placeholder="https://..."
            aria-label="URL de la imagen"
            disabled={disabled}
          />
          <Button
            type="button"
            variant="secondary"
            className="w-full sm:w-auto"
            onClick={() => addUrl(pendingUrl)}
            disabled={disabled || !pendingUrl}
          >
            Agregar imagen
          </Button>
        </div>
      </div>

      {normalized.length > 0 ? (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {normalized.map((imagen, index) => (
            <li
              key={imagen.url}
              className="relative overflow-hidden rounded-lg border border-slate-200 shadow-sm transition hover:ring-2 hover:ring-blue-500 dark:border-slate-700"
            >
              <img src={imagen.url} alt={`Imagen ${index + 1}`} className="h-40 w-full object-cover" loading="lazy" />
              <div className="flex items-center justify-between gap-2 border-t border-slate-200 bg-white/90 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-900/90">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition hover:bg-blue-50 dark:hover:bg-blue-500/20"
                    onClick={() => togglePrincipal(imagen.url)}
                    disabled={disabled}
                  >
                    {imagen.principal ? (
                      <>
                        <Star className="h-4 w-4 text-amber-500" aria-hidden />
                        Principal
                      </>
                    ) : (
                      <>
                        <StarOff className="h-4 w-4 text-slate-400" aria-hidden />
                        Marcar principal
                      </>
                    )}
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    className="rounded-md p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-800"
                    onClick={() => moveImage(imagen.url, -1)}
                    disabled={disabled || index === 0}
                    aria-label="Mover hacia arriba"
                  >
                    <ArrowUp className="h-4 w-4" aria-hidden />
                  </button>
                  <button
                    type="button"
                    className="rounded-md p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-800"
                    onClick={() => moveImage(imagen.url, 1)}
                    disabled={disabled || index === normalized.length - 1}
                    aria-label="Mover hacia abajo"
                  >
                    <ArrowDown className="h-4 w-4" aria-hidden />
                  </button>
                  <button
                    type="button"
                    className="rounded-md p-1 text-red-500 transition hover:bg-red-50 hover:text-red-600 dark:text-red-400 dark:hover:bg-red-950"
                    onClick={() => removeImage(imagen.url)}
                    disabled={disabled}
                    aria-label="Eliminar imagen"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-500 dark:text-slate-400">Todavía no has agregado imágenes.</p>
      )}
    </div>
  );
}
