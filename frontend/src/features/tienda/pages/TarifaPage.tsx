import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import toast from "react-hot-toast";

import { queryKeys } from "../../../api/queryKeys";
import { obtenerTarifaEnvio, actualizarTarifaEnvio, type TarifaEnvio } from "../../../api/tiendas.api";
import { FormField } from "../../../components/ui/FormField";
import { Input } from "../../../components/ui/Input";
import { Textarea } from "../../../components/ui/Textarea";
import { Switch } from "../../../components/ui/Switch";
import { Button } from "../../../components/ui/Button";
import { Skeleton } from "../../../components/ui/Skeleton";
import { Tooltip } from "../../../components/ui/Tooltip";

const tarifaSchema = z.object({
  tarifa_base_q: z.number().min(0, { message: "Debe ser mayor o igual a 0" }).max(9999.99, { message: "Máximo Q9999.99" }),
  base_kg: z.number().min(0.1, { message: "Mínimo 0.1 kg" }).max(100, { message: "Máximo 100 kg" }),
  extra_q_por_kg: z.number().min(0, { message: "Debe ser mayor o igual a 0" }).max(999.99, { message: "Máximo Q999.99" }),
  tiempo_estimado: z
    .string()
    .trim()
    .min(3, { message: "Describe un tiempo aproximado" })
    .max(80, { message: "Máximo 80 caracteres" }),
  activo: z.boolean(),
});

type TarifaPayload = z.infer<typeof tarifaSchema>;

type TarifaFormValues = {
  tarifa_base_q: string;
  base_kg: string;
  extra_q_por_kg: string;
  tiempo_estimado: string;
  activo: boolean;
};

const defaultValues: TarifaFormValues = {
  tarifa_base_q: "0.00",
  base_kg: "1",
  extra_q_por_kg: "0.00",
  tiempo_estimado: "24 - 48 horas",
  activo: true,
};

function mapTarifaToForm(tarifa?: TarifaEnvio | null): TarifaFormValues {
  if (!tarifa) {
    return { ...defaultValues };
  }
  return {
    tarifa_base_q: tarifa.tarifa_base_q.toString(),
    base_kg: tarifa.base_kg.toString(),
    extra_q_por_kg: tarifa.extra_q_por_kg.toString(),
    tiempo_estimado: tarifa.tiempo_estimado ?? defaultValues.tiempo_estimado,
    activo: tarifa.activo,
  };
}

function parseDecimal(value: string): number | null {
  const normalized = value.replace(/,/g, ".").trim();
  if (normalized === "") {
    return null;
  }
  const numeric = Number(normalized);
  if (!Number.isFinite(numeric)) {
    return null;
  }
  return numeric;
}

type InfoTooltipProps = Readonly<{ content: string }>;

function InfoTooltip({ content }: InfoTooltipProps) {
  return (
    <Tooltip content={content}>
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-600 dark:bg-blue-500/10 dark:text-blue-300">
        i
      </span>
    </Tooltip>
  );
}

export default function TarifaPage() {
  const queryClient = useQueryClient();

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    setError,
    clearErrors,
  } = useForm<TarifaFormValues>({
    defaultValues,
    mode: "onChange",
  });

  const tarifaQuery = useQuery({
    queryKey: queryKeys.tienda.tarifa,
    queryFn: () => obtenerTarifaEnvio(),
  });

  useEffect(() => {
    reset(mapTarifaToForm(tarifaQuery.data));
  }, [tarifaQuery.data, reset]);

  const mutation = useMutation({
    mutationFn: (values: TarifaEnvio) => actualizarTarifaEnvio(values),
    onSuccess: () => {
      toast.success("Tarifa actualizada correctamente");
      queryClient.invalidateQueries({ queryKey: queryKeys.tienda.tarifa });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "No se pudo guardar la tarifa";
      toast.error(message);
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    clearErrors();

    const payload: TarifaPayload = {
      tarifa_base_q: 0,
      base_kg: 0,
      extra_q_por_kg: 0,
      tiempo_estimado: values.tiempo_estimado.trim(),
      activo: values.activo,
    };

    const tarifaBase = parseDecimal(values.tarifa_base_q);
    if (tarifaBase === null) {
      setError("tarifa_base_q", {
        type: "manual",
        message: values.tarifa_base_q.trim() === "" ? "Ingresa la tarifa base" : "Ingresa un número válido",
      });
    } else {
      payload.tarifa_base_q = tarifaBase;
    }

    const baseKg = parseDecimal(values.base_kg);
    if (baseKg === null) {
      setError("base_kg", {
        type: "manual",
        message: values.base_kg.trim() === "" ? "Ingresa la base en kg" : "Ingresa un número válido",
      });
    } else {
      payload.base_kg = baseKg;
    }

    const extraKg = parseDecimal(values.extra_q_por_kg);
    if (extraKg === null) {
      setError("extra_q_por_kg", {
        type: "manual",
        message: values.extra_q_por_kg.trim() === "" ? "Ingresa el cobro extra" : "Ingresa un número válido",
      });
    } else {
      payload.extra_q_por_kg = extraKg;
    }

    if ([tarifaBase, baseKg, extraKg].some((value) => value === null)) {
      return;
    }

    const parsed = tarifaSchema.safeParse(payload);
    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        const [path] = issue.path;
        if (typeof path === "string") {
          setError(path as keyof TarifaFormValues, {
            type: "manual",
            message: issue.message,
          });
        }
      });
      return;
    }

    await mutation.mutateAsync(parsed.data);
  });

  const saving = mutation.isPending;

  return (
    <section className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold">Tarifa de envío</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Configura la tarifa preferente de tu tienda y sobrescribe la global cuando aplique.
        </p>
      </header>

      {tarifaQuery.isLoading ? (
        <div className="space-y-4">
          {["title", "grid", "switch"].map((key) => (
            <Skeleton key={key} className="h-16 w-full" />
          ))}
        </div>
      ) : (
        <form className="space-y-8" onSubmit={onSubmit} noValidate>
          <section className="grid gap-6 lg:grid-cols-2">
            <FormField
              label="Tarifa base (Q)"
              description={<InfoTooltip content="Costo inicial que se cobra hasta alcanzar el peso base." />}
              required
              error={errors.tarifa_base_q?.message}
            >
              <Input
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                disabled={saving}
                {...register("tarifa_base_q")}
              />
            </FormField>

            <FormField
              label="Base en kg"
              description={<InfoTooltip content="Peso máximo cubierto por la tarifa base." />}
              required
              error={errors.base_kg?.message}
            >
              <Input
                type="text"
                inputMode="decimal"
                placeholder="0.0"
                disabled={saving}
                {...register("base_kg")}
              />
            </FormField>

            <FormField
              label="Extra por kg (Q)"
              description={<InfoTooltip content="Monto adicional por cada kilogramo adicional." />}
              required
              error={errors.extra_q_por_kg?.message}
            >
              <Input
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                disabled={saving}
                {...register("extra_q_por_kg")}
              />
            </FormField>

            <FormField
              label="Tiempo estimado"
              description={<InfoTooltip content="Comunica al cliente cuánto tarda en promedio la entrega." />}
              required
              error={errors.tiempo_estimado?.message}
            >
              <Textarea
                rows={3}
                placeholder="Ej. 24 - 48 horas dependiendo de la zona"
                disabled={saving}
                hasError={Boolean(errors.tiempo_estimado)}
                {...register("tiempo_estimado", {
                  required: "Describe un tiempo aproximado",
                  minLength: { value: 3, message: "Incluye al menos 3 caracteres" },
                  maxLength: { value: 80, message: "Máximo 80 caracteres" },
                })}
              />
            </FormField>
          </section>

          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/70 p-4 text-sm dark:border-slate-700 dark:bg-slate-900/50">
            <div className="space-y-1">
              <p className="font-medium text-slate-700 dark:text-slate-200">Activa tu tarifa personalizada</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Cuando está activa, esta tarifa reemplaza la configuración global para tus pedidos.
              </p>
            </div>
            <Controller
              control={control}
              name="activo"
              render={({ field }) => (
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  label={field.value ? "Tarifa activa" : "Tarifa inactiva"}
                  disabled={saving}
                />
              )}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => reset(mapTarifaToForm(tarifaQuery.data))}
              disabled={saving || !isDirty}
            >
              Restablecer
            </Button>
            <Button type="submit" disabled={saving || !isDirty}>
              {saving ? "Guardando..." : "Guardar tarifa"}
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}

