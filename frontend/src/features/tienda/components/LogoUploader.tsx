import { useCallback, useState } from "react";
import { useDropzone, type DropEvent } from "react-dropzone";
import { ImageUp, Upload, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "../../../components/ui/Button";
import { cn } from "../../../utils/cn";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];

type LogoUploaderProps = {
  readonly value?: string | null;
  readonly onChange?: (url: string | null) => void;
  readonly disabled?: boolean;
  readonly onUploadFile?: (file: File) => Promise<string>;
};

export function LogoUploader({ value, onChange, disabled, onUploadFile }: LogoUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);

  const handleUrl = useCallback(
    (url: string) => {
      const trimmed = url.trim();
      if (!trimmed) {
        return;
      }
      if (!/^https?:\/\//i.test(trimmed)) {
        toast.error("Ingresa un enlace que inicie con http:// o https://");
        return;
      }
      onChange?.(trimmed);
    },
    [onChange],
  );

  const handleFile = useCallback(
    async (file: File) => {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        toast.error("Formato no soportado. Usa JPG, PNG, WEBP o SVG.");
        return;
      }
      if (!onUploadFile) {
        toast("Para actualizar el logo, pega un enlace público");
        return;
      }
      try {
        setIsUploading(true);
        const url = await onUploadFile(file);
        onChange?.(url);
        toast.success("Logo actualizado");
      } catch (error) {
        const message = error instanceof Error ? error.message : "No se pudo subir el logo";
        toast.error(message);
      } finally {
        setIsUploading(false);
      }
    },
    [onChange, onUploadFile],
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
          handleUrl(first);
          return;
        }
      }
      if (acceptedFiles.length === 0) {
        return;
      }
      handleFile(acceptedFiles[0]);
    },
    [handleFile, handleUrl],
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    multiple: false,
    accept: {
      "image/jpeg": [".jpeg", ".jpg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
      "image/svg+xml": [".svg"],
    },
    disabled: disabled || isUploading,
  });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={cn(
          "flex min-h-[160px] flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-slate-300 p-6 text-center transition dark:border-slate-700",
          disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:border-blue-400",
          isDragActive ? "border-blue-500 bg-blue-50/40 dark:bg-blue-500/10" : null,
        )}
      >
        <input {...getInputProps()} aria-label="Zona de carga para el logo" />
        <Upload className="h-10 w-10 text-slate-400" aria-hidden />
        <div className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
          <p>{isUploading ? "Subiendo logo..." : "Arrastra una imagen o pega un enlace público"}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Formatos permitidos: JPG, PNG, WEBP, SVG. También puedes soltar imágenes desde otra pestaña.
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          className="mt-3"
          onClick={(event) => {
            event.stopPropagation();
            open();
          }}
          disabled={disabled || isUploading}
        >
          Seleccionar archivo
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900">
          {value ? (
            <img src={value} alt="Logo de la tienda" className="h-full w-full object-cover" />
          ) : (
            <ImageUp className="h-10 w-10 text-slate-400" aria-hidden />
          )}
        </div>
        <div className="flex flex-1 flex-col gap-2 text-sm">
          <p className="text-slate-600 dark:text-slate-300">
            {value ? "Haz clic en el botón para eliminar o carga uno nuevo." : "Aún no tienes un logo asignado."}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                if (!value) {
                  toast("No hay logo para quitar");
                  return;
                }
                onChange?.(null);
              }}
              disabled={disabled || isUploading}
            >
              <Trash2 className="mr-1 h-4 w-4" aria-hidden />
              Quitar logo
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
