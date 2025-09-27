import { useEffect, useMemo, useState } from "react";
import type { LatLngLiteral } from "leaflet";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import type { Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import toast from "react-hot-toast";

import { queryKeys } from "../../../api/queryKeys";
import { actualizarMiTienda, fetchMiTienda, type TiendaOwner } from "../../../api/tiendas.api";
import type { Direccion, HorarioTienda } from "../../../api/types";
import { FormField } from "../../../components/ui/FormField";
import { Input } from "../../../components/ui/Input";
import { Switch } from "../../../components/ui/Switch";
import { Button } from "../../../components/ui/Button";
import { Skeleton } from "../../../components/ui/Skeleton";
import { LogoUploader } from "../components/LogoUploader";
import { MapPicker } from "../../../components/maps/MapPicker";

const DAY_LABELS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"] as const;
const TIME_REGEX = /^([0-1]\d|2[0-3]):[0-5]\d$/;
const LAT_LNG_REGEX = /^-?\d{1,2}(?:\.\d+)?,-?\d{1,3}(?:\.\d+)?$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const horarioSchema = z
  .object({
    dia_semana: z.number().int().min(0).max(6),
    cerrado: z.boolean(),
    hora_apertura: z
      .string()
      .trim()
      .optional()
      .or(z.literal(""))
      .transform((value) => value ?? ""),
    hora_cierre: z
      .string()
      .trim()
      .optional()
      .or(z.literal(""))
      .transform((value) => value ?? ""),
  })
  .superRefine((value, ctx) => {
    if (value.cerrado) {
      return;
    }
    if (!value.hora_apertura) {
      ctx.addIssue({
        code: "custom",
        message: "Ingresa la hora de apertura",
        path: ["hora_apertura"],
      });
    } else if (!TIME_REGEX.test(value.hora_apertura)) {
      ctx.addIssue({
        code: "custom",
        message: "Formato HH:MM",
        path: ["hora_apertura"],
      });
    }
    if (!value.hora_cierre) {
      ctx.addIssue({
        code: "custom",
        message: "Ingresa la hora de cierre",
        path: ["hora_cierre"],
      });
    } else if (!TIME_REGEX.test(value.hora_cierre)) {
      ctx.addIssue({
        code: "custom",
        message: "Formato HH:MM",
        path: ["hora_cierre"],
      });
    }
    if (!value.hora_apertura || !value.hora_cierre) {
      return;
    }
    if (value.hora_apertura >= value.hora_cierre) {
      ctx.addIssue({
        code: "custom",
        message: "La apertura debe ser menor al cierre",
        path: ["hora_cierre"],
      });
    }
  });

const direccionSchema = z.object({
  linea1: z.string().trim().min(3, { message: "Ingresa la dirección principal" }).max(160),
  linea2: z
    .string()
    .trim()
    .max(160, { message: "Máximo 160 caracteres" })
    .optional()
    .or(z.literal(""))
    .transform((value) => value ?? ""),
  ciudad: z.string().trim().min(2, { message: "Ingresa la ciudad" }).max(80),
  estado: z
    .string()
    .trim()
    .max(80, { message: "Máximo 80 caracteres" })
    .optional()
    .or(z.literal(""))
    .transform((value) => value ?? ""),
  codigo_postal: z
    .string()
    .trim()
    .max(20, { message: "Máximo 20 caracteres" })
    .optional()
    .or(z.literal(""))
    .transform((value) => value ?? ""),
  pais: z
    .string()
    .trim()
    .min(2, { message: "Ingresa el código de país" })
    .max(2, { message: "Ingresa el código de país" }),
  ubicacion: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((value) => value ?? "")
    .refine((value) => !value || LAT_LNG_REGEX.test(value), {
      message: "Formato esperado: lat,lng",
    }),
});

const perfilSchema = z.object({
  razon_social: z
    .string()
    .trim()
    .min(3, { message: "Ingresa la razón social" })
    .max(160, { message: "Máximo 160 caracteres" }),
  identificacion_legal: z
    .string()
    .trim()
    .max(32, { message: "Máximo 32 caracteres" })
    .optional()
    .or(z.literal(""))
    .transform((value) => value ?? ""),
  cuenta_bancaria: z
    .string()
    .trim()
    .min(6, { message: "Ingresa la cuenta bancaria" })
    .max(64, { message: "Máximo 64 caracteres" }),
  email: z.string().trim().regex(EMAIL_REGEX, { message: "Correo electrónico inválido" }),
  telefono: z
    .string()
    .trim()
    .min(6, { message: "Ingresa el teléfono" })
    .max(32, { message: "Máximo 32 caracteres" }),
  url_logo: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((value) => value ?? "")
    .refine((value) => !value || /^https?:\/\//i.test(value), {
      message: "Ingresa un enlace válido (http/https)",
    }),
  horarios: z.array(horarioSchema).length(7),
  direccion: direccionSchema,
});

type PerfilFormValues = z.infer<typeof perfilSchema>;
type HorarioFormValue = z.infer<typeof horarioSchema>;

function createDefaultHorarios(): HorarioFormValue[] {
  return Array.from({ length: 7 }, (_, index) => ({
    dia_semana: index,
    cerrado: index === 0,
    hora_apertura: index === 0 ? "" : "09:00",
    hora_cierre: index === 0 ? "" : "18:00",
  }));
}

function createDefaultValues(): PerfilFormValues {
  return {
    razon_social: "",
    identificacion_legal: "",
    cuenta_bancaria: "",
    email: "",
    telefono: "",
    url_logo: "",
    horarios: createDefaultHorarios(),
    direccion: {
      linea1: "",
      linea2: "",
      ciudad: "",
      estado: "",
      codigo_postal: "",
      pais: "GT",
      ubicacion: "",
    },
  } satisfies PerfilFormValues;
}

function normalizeDay(value: number) {
  if (value < 7) {
    return value;
  }
  return value % 7;
}

function formatHorarioValue(value?: string | null) {
  if (!value) {
    return "";
  }
  return value.slice(0, 5);
}

function mapTiendaToForm(tienda?: TiendaOwner | null): PerfilFormValues {
  const base = createDefaultValues();
  if (!tienda) {
    return base;
  }

  const horarios = createDefaultHorarios();
  (tienda.horarios ?? []).forEach((horario) => {
    const dia = normalizeDay(horario.dia_semana);
    const index = horarios.findIndex((item) => item.dia_semana === dia);
    if (index === -1) {
      return;
    }
    const cerrado = Boolean(horario.cerrado);
    horarios[index] = {
      dia_semana: horarios[index].dia_semana,
      cerrado,
      hora_apertura: cerrado ? "" : formatHorarioValue(horario.hora_apertura),
      hora_cierre: cerrado ? "" : formatHorarioValue(horario.hora_cierre),
    };
  });

  return {
    razon_social: tienda.razon_social ?? "",
    identificacion_legal: tienda.identificacion_legal ?? "",
    cuenta_bancaria: tienda.cuenta_bancaria ?? "",
    email: tienda.email ?? "",
    telefono: tienda.telefono ?? "",
    url_logo: tienda.url_logo ?? "",
    horarios,
    direccion: {
      linea1: tienda.direccion_detalle?.linea1 ?? "",
      linea2: tienda.direccion_detalle?.linea2 ?? "",
      ciudad: tienda.direccion_detalle?.ciudad ?? "",
      estado: tienda.direccion_detalle?.estado ?? "",
      codigo_postal: tienda.direccion_detalle?.codigo_postal ?? "",
      pais: (tienda.direccion_detalle?.pais ?? "GT").toUpperCase(),
      ubicacion: tienda.direccion_detalle?.ubicacion ?? "",
    },
  } satisfies PerfilFormValues;
}

function parseUbicacion(value?: string | null): LatLngLiteral | null {
  if (!value) {
    return null;
  }
  const [latStr, lngStr] = value.split(",");
  const lat = Number(latStr);
  const lng = Number(lngStr);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }
  return { lat, lng };
}

function formatLatLng(coords: LatLngLiteral) {
  return `${coords.lat.toFixed(6)},${coords.lng.toFixed(6)}`;
}

function toTimeField(value: string) {
  if (!value) {
    return null;
  }
  if (value.length === 5) {
    return `${value}:00`;
  }
  return value;
}

function mapFormToPayload(values: PerfilFormValues): Partial<TiendaOwner> & { direccion: Direccion; horarios: HorarioTienda[] } {
  const direccion: Direccion = {
    linea1: values.direccion.linea1.trim(),
    linea2: values.direccion.linea2.trim() || null,
    ciudad: values.direccion.ciudad.trim(),
    estado: values.direccion.estado.trim() || null,
    codigo_postal: values.direccion.codigo_postal.trim() || null,
    pais: values.direccion.pais.trim().toUpperCase(),
    ubicacion: values.direccion.ubicacion.trim() ? values.direccion.ubicacion.trim() : null,
  };

  const horarios: HorarioTienda[] = values.horarios.map((item) => ({
    dia_semana: item.dia_semana,
    cerrado: item.cerrado,
    hora_apertura: item.cerrado ? null : toTimeField(item.hora_apertura),
    hora_cierre: item.cerrado ? null : toTimeField(item.hora_cierre),
  }));

  return {
    razon_social: values.razon_social.trim(),
    identificacion_legal: values.identificacion_legal.trim() || null,
    cuenta_bancaria: values.cuenta_bancaria.trim(),
    email: values.email.trim(),
    telefono: values.telefono.trim(),
    url_logo: values.url_logo.trim() ? values.url_logo.trim() : null,
    direccion,
    horarios,
  };
}

export default function PerfilPage() {
  const queryClient = useQueryClient();
  const defaultValues = useMemo(() => createDefaultValues(), []);
  const [mapPosition, setMapPosition] = useState<LatLngLiteral | null>(null);

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isDirty, isSubmitting },
    reset,
    watch,
    setValue,
  } = useForm<PerfilFormValues>({
    defaultValues,
    resolver: zodResolver(perfilSchema) as Resolver<PerfilFormValues>,
    mode: "onChange",
  });

  const { fields: horarioFields, replace: replaceHorarios } = useFieldArray({
    control,
    name: "horarios",
  });

  const tiendaQuery = useQuery({
    queryKey: queryKeys.tienda.me,
    queryFn: fetchMiTienda,
  });

  useEffect(() => {
    if (!tiendaQuery.data) {
      return;
    }
    const mapped = mapTiendaToForm(tiendaQuery.data);
    reset(mapped);
    replaceHorarios(mapped.horarios);
    setMapPosition(parseUbicacion(mapped.direccion.ubicacion));
  }, [tiendaQuery.data, reset, replaceHorarios]);

  const ubicacionValue = watch("direccion.ubicacion");

  useEffect(() => {
    setMapPosition(parseUbicacion(ubicacionValue));
  }, [ubicacionValue]);

  const mutation = useMutation({
    mutationFn: async (values: PerfilFormValues) => {
      const payload = mapFormToPayload(values);
      return actualizarMiTienda(payload);
    },
    onSuccess: (tiendaActualizada) => {
      toast.success("Perfil actualizado correctamente");
      const mapped = mapTiendaToForm(tiendaActualizada);
      reset(mapped);
      replaceHorarios(mapped.horarios);
      setMapPosition(parseUbicacion(mapped.direccion.ubicacion));
      queryClient.setQueryData(queryKeys.tienda.me, tiendaActualizada);
      queryClient.invalidateQueries({ queryKey: queryKeys.tienda.me });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "No se pudo actualizar el perfil";
      toast.error(message);
    },
  });

  const onSubmit = handleSubmit((values) => mutation.mutateAsync(values));

  const saving = isSubmitting || mutation.isPending;
  const loading = tiendaQuery.isLoading;
  let loadError: string | null = null;
  if (tiendaQuery.isError) {
    loadError = tiendaQuery.error instanceof Error ? tiendaQuery.error.message : "No se pudo cargar la información de la tienda";
  }

  const handleReset = () => {
    if (tiendaQuery.data) {
      const mapped = mapTiendaToForm(tiendaQuery.data);
      reset(mapped);
      replaceHorarios(mapped.horarios);
      setMapPosition(parseUbicacion(mapped.direccion.ubicacion));
    } else {
      const mapped = createDefaultValues();
      reset(mapped);
      replaceHorarios(mapped.horarios);
      setMapPosition(null);
    }
  };

  const handleMapSelect = (coords: LatLngLiteral) => {
    setMapPosition(coords);
    setValue("direccion.ubicacion", formatLatLng(coords), { shouldDirty: true });
  };

  return (
    <section className="space-y-10">
      <form className="space-y-10" onSubmit={onSubmit} noValidate>
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Perfil de la tienda</h1>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Actualiza los datos fiscales, de contacto y la información logística para tus clientes.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="ghost" onClick={handleReset} disabled={saving || !isDirty}>
              Deshacer cambios
            </Button>
            <Button type="submit" disabled={saving || !isDirty}>
              {saving ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </header>

        {loadError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
            {loadError}
          </div>
        ) : null}

        {loading ? (
          <div className="space-y-4">
            {[...Array(6).keys()].map((key) => (
              <Skeleton key={key} className="h-20 w-full" />
            ))}
          </div>
        ) : (
          <>
            <section className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold">Datos fiscales</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Información legal utilizada en comprobantes y facturación.
                </p>
              </div>
              <div className="grid gap-6 lg:grid-cols-2">
                <FormField label="Razón social" required error={errors.razon_social?.message}>
                  <Input
                    {...register("razon_social")}
                    placeholder="Mi empresa, S.A."
                    disabled={saving}
                  />
                </FormField>
                <FormField label="Identificación legal" error={errors.identificacion_legal?.message}>
                  <Input
                    {...register("identificacion_legal")}
                    placeholder="NIT / Registro"
                    disabled={saving}
                  />
                </FormField>
                <FormField label="Cuenta bancaria" required error={errors.cuenta_bancaria?.message}>
                  <Input
                    {...register("cuenta_bancaria")}
                    placeholder="Número de cuenta"
                    disabled={saving}
                  />
                </FormField>
              </div>
            </section>

            <section className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold">Contacto y branding</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Mantén tus canales de comunicación y la identidad visual actualizados.
                </p>
              </div>
              <div className="grid gap-6 lg:grid-cols-2">
                <FormField label="Correo electrónico" required error={errors.email?.message}>
                  <Input
                    {...register("email")}
                    type="email"
                    placeholder="contacto@tienda.com"
                    disabled={saving}
                  />
                </FormField>
                <FormField label="Teléfono" required error={errors.telefono?.message}>
                  <Input
                    {...register("telefono")}
                    placeholder="502 1234 5678"
                    disabled={saving}
                  />
                </FormField>
              </div>
              <FormField
                label="Logo"
                description="Arrastra una imagen o pega un enlace público."
                error={errors.url_logo?.message}
              >
                <Controller
                  name="url_logo"
                  control={control}
                  render={({ field }) => (
                    <div className="space-y-3">
                      <LogoUploader
                        value={field.value ? field.value : null}
                        onChange={(url) => field.onChange(url ?? "")}
                        disabled={saving}
                      />
                      <Input
                        type="url"
                        placeholder="https://cdn.midominio/logo.png"
                        value={field.value ?? ""}
                        onChange={(event) => field.onChange(event.target.value)}
                        disabled={saving}
                      />
                    </div>
                  )}
                />
              </FormField>
            </section>

            <section className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold">Logística</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Define horarios, dirección y ubicación para tus entregas y clientes.
                </p>
              </div>
              <div className="grid gap-8 xl:grid-cols-[1.2fr_1fr]">
                <div className="space-y-6">
                  <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="border-b border-slate-200 bg-slate-50 p-4 text-sm font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300">
                      Horarios de atención
                    </div>
                    <div className="divide-y divide-slate-200 dark:divide-slate-800">
                      {horarioFields.map((fieldItem, index) => {
                        const cerrado = watch(`horarios.${index}.cerrado`);
                        const aperturaError = errors.horarios?.[index]?.hora_apertura?.message;
                        const cierreError = errors.horarios?.[index]?.hora_cierre?.message;
                        const aperturaId = `horario-${index}-apertura`;
                        const cierreId = `horario-${index}-cierre`;
                        return (
                          <div
                            key={fieldItem.id}
                            className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between"
                          >
                            <div className="flex flex-col gap-2 md:w-48">
                              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                                {DAY_LABELS[fieldItem.dia_semana] ?? `Día ${fieldItem.dia_semana}`}
                              </span>
                              <Controller
                                name={`horarios.${index}.cerrado`}
                                control={control}
                                render={({ field: switchField }) => {
                                  const checked = Boolean(switchField.value);
                                  return (
                                    <Switch
                                      checked={checked}
                                      onCheckedChange={(value) => {
                                        switchField.onChange(value);
                                        if (value) {
                                          setValue(`horarios.${index}.hora_apertura`, "", { shouldDirty: true });
                                          setValue(`horarios.${index}.hora_cierre`, "", { shouldDirty: true });
                                        }
                                      }}
                                      label={checked ? "Cerrado" : "Abierto"}
                                      disabled={saving}
                                    />
                                  );
                                }}
                              />
                            </div>
                            <div className="flex flex-col gap-3 md:flex-row md:items-end">
                              <div className="md:w-40">
                                <label
                                  className="text-xs font-medium text-slate-600 dark:text-slate-300"
                                  htmlFor={aperturaId}
                                >
                                  Apertura
                                </label>
                                <Input
                                  id={aperturaId}
                                  type="time"
                                  step="60"
                                  disabled={saving || cerrado}
                                  {...register(`horarios.${index}.hora_apertura` as const)}
                                />
                                {aperturaError ? <p className="text-xs text-red-500">{aperturaError}</p> : null}
                              </div>
                              <div className="md:w-40">
                                <label
                                  className="text-xs font-medium text-slate-600 dark:text-slate-300"
                                  htmlFor={cierreId}
                                >
                                  Cierre
                                </label>
                                <Input
                                  id={cierreId}
                                  type="time"
                                  step="60"
                                  disabled={saving || cerrado}
                                  {...register(`horarios.${index}.hora_cierre` as const)}
                                />
                                {cierreError ? <p className="text-xs text-red-500">{cierreError}</p> : null}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <FormField label="Dirección" required error={errors.direccion?.linea1?.message}>
                      <Input
                        {...register("direccion.linea1")}
                        placeholder="1a avenida 0-00 zona 1"
                        disabled={saving}
                      />
                    </FormField>
                    <FormField label="Complemento" error={errors.direccion?.linea2?.message}>
                      <Input
                        {...register("direccion.linea2")}
                        placeholder="Apartamento, referencia, etc."
                        disabled={saving}
                      />
                    </FormField>
                    <FormField label="Ciudad" required error={errors.direccion?.ciudad?.message}>
                      <Input
                        {...register("direccion.ciudad")}
                        placeholder="Ciudad"
                        disabled={saving}
                      />
                    </FormField>
                    <FormField label="Departamento / Estado" error={errors.direccion?.estado?.message}>
                      <Input
                        {...register("direccion.estado")}
                        placeholder="Departamento"
                        disabled={saving}
                      />
                    </FormField>
                    <FormField label="Código postal" error={errors.direccion?.codigo_postal?.message}>
                      <Input
                        {...register("direccion.codigo_postal")}
                        placeholder="01001"
                        disabled={saving}
                      />
                    </FormField>
                    <FormField label="País" required description="Código ISO de 2 letras" error={errors.direccion?.pais?.message}>
                      <Input
                        {...register("direccion.pais")}
                        placeholder="GT"
                        maxLength={2}
                        disabled={saving}
                      />
                    </FormField>
                  </div>
                </div>

                <div className="space-y-4">
                  <MapPicker value={mapPosition} onChange={handleMapSelect} height={320} />
                  <FormField
                    label="Ubicación (lat,lng)"
                    description="Selecciona un punto o ingresa las coordenadas manualmente."
                    error={errors.direccion?.ubicacion?.message}
                  >
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Input
                        {...register("direccion.ubicacion")}
                        placeholder="14.634900,-90.506900"
                        disabled={saving}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setMapPosition(null);
                          setValue("direccion.ubicacion", "", { shouldDirty: true });
                        }}
                        disabled={saving}
                      >
                        Limpiar
                      </Button>
                    </div>
                  </FormField>
                </div>
              </div>
            </section>
          </>
        )}
      </form>
    </section>
  );
}
