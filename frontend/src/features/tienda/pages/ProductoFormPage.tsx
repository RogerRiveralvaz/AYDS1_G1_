import { useEffect, useMemo } from "react";
import { Controller, useForm, type SubmitHandler, type Resolver, type FieldErrors } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import { fetchProducto, crearProducto, actualizarProducto, type ProductoPayload } from "../../../api/tiendas.api";
import { fetchCategorias } from "../../../api/catalogo.api";
import { queryKeys } from "../../../api/queryKeys";
import { ImageUploader, type ImageValue } from "../../../components/forms/ImageUploader";
import { FormField } from "../../../components/ui/FormField";
import { Input } from "../../../components/ui/Input";
import { Textarea } from "../../../components/ui/Textarea";
import { Select } from "../../../components/ui/Select";
import { Switch } from "../../../components/ui/Switch";
import { Button } from "../../../components/ui/Button";
import { Skeleton } from "../../../components/ui/Skeleton";

interface ProductoFormValues {
  nombre: string;
  descripcion_corta?: string;
  precio: number;
  peso_kg: number;
  sku?: string;
  stock: number;
  umbral_bajo: number;
  es_oferta: boolean;
  es_nuevo: boolean;
  activo: boolean;
  id_categoria: string;
  imagenes: ImageValue[];
}

const imagenSchema = z.object({
  url: z
    .string()
    .trim()
    .min(1, { message: "Ingresa la URL" })
    .regex(/^https?:\/\/.+/i, { message: "Ingresa una URL válida" }),
  principal: z.boolean().optional(),
  orden: z.number().int().positive().optional(),
});

const productoSchema: z.ZodType<ProductoFormValues> = z
  .object({
    nombre: z.string().trim().min(2, { message: "El nombre debe tener al menos 2 caracteres" }).max(160),
    descripcion_corta: z
      .string()
      .trim()
      .max(300, { message: "Máximo 300 caracteres" })
      .optional(),
    precio: z.coerce.number().min(0.01, { message: "El precio debe ser mayor a 0" }),
    peso_kg: z.coerce.number().min(0.01, { message: "El peso debe ser mayor a 0" }),
    sku: z
      .string()
      .trim()
      .max(64, { message: "Máximo 64 caracteres" })
      .optional(),
    stock: z.coerce.number().int({ message: "Solo números enteros" }).min(0, { message: "Ingresa el stock" }),
    umbral_bajo: z
      .coerce
      .number()
      .int({ message: "Solo números enteros" })
      .min(0, { message: "Ingresa el umbral" })
      .max(99999, { message: "El máximo permitido es 99999" }),
    es_oferta: z.boolean().default(false),
    es_nuevo: z.boolean().default(false),
    activo: z.boolean().default(true),
    id_categoria: z
      .string()
      .trim()
      .min(1, { message: "Selecciona una categoría" }),
    imagenes: z.array(imagenSchema).min(1, { message: "Agrega al menos una imagen" }),
  })
  .superRefine((values, ctx) => {
    if (values.imagenes.length > 0 && !values.imagenes.some((imagen) => imagen.principal)) {
      ctx.addIssue({
        path: ["imagenes"],
        code: "custom",
        message: "Marca una imagen como principal",
      });
    }
  });

const defaultValues: ProductoFormValues = {
  nombre: "",
  descripcion_corta: "",
  precio: 0,
  peso_kg: 0,
  sku: "",
  stock: 0,
  umbral_bajo: 5,
  es_oferta: false,
  es_nuevo: false,
  activo: true,
  id_categoria: "",
  imagenes: [],
};

export default function ProductoFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const editing = Boolean(id);

  const formResolver = async (values: unknown) => {
    const parsed = productoSchema.safeParse(values);
    if (parsed.success) {
      return {
        values: parsed.data,
        errors: {},
      };
    }
      const fieldErrors = parsed.error.issues.reduce<FieldErrors<ProductoFormValues>>((acc, issue) => {
      const [first] = issue.path;
      if (typeof first !== "string") {
        return acc;
      }
      const key = first as keyof ProductoFormValues;
      if (!acc[key]) {
        (acc as Record<string, unknown>)[key] = { type: issue.code, message: issue.message };
      }
      return acc;
    }, {} as FieldErrors<ProductoFormValues>);
    return {
      values: {} as ProductoFormValues,
      errors: fieldErrors,
    };
  };

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    reset,
    watch,
  } = useForm<ProductoFormValues>({
    defaultValues,
  resolver: formResolver as unknown as Resolver<ProductoFormValues>,
    mode: "onChange",
  });

  const imagenesActuales = watch("imagenes") ?? [];

  const { data: categorias = [], isLoading: loadingCategorias } = useQuery({
    queryKey: queryKeys.catalogo.categorias,
    queryFn: fetchCategorias,
    staleTime: 1000 * 60 * 10,
  });

  const { data: producto, isLoading: loadingProducto } = useQuery({
    queryKey: queryKeys.tienda.productos.detail(id ?? "nuevo"),
    queryFn: () => fetchProducto(id as string),
    enabled: editing,
  });

  useEffect(() => {
    if (!producto) return;
    const imagenes: ImageValue[] = (producto.imagenes ?? []).map((imagen, index) => ({
      url: imagen.url,
      principal: index === 0 ? true : Boolean(imagen.principal),
      orden: imagen.orden ?? index + 1,
    }));
    if (imagenes.length > 0 && !imagenes.some((imagen) => imagen.principal)) {
      imagenes[0].principal = true;
    }
    reset({
      nombre: producto.nombre,
      descripcion_corta: producto.descripcion_corta ?? "",
      precio: producto.precio,
      peso_kg: producto.peso_kg,
      sku: producto.sku ?? "",
      stock: producto.stock,
      umbral_bajo: producto.umbral_bajo,
      es_oferta: producto.es_oferta,
      es_nuevo: producto.es_nuevo,
      activo: producto.activo,
      id_categoria: producto.id_categoria ? String(producto.id_categoria) : "",
      imagenes,
    });
  }, [producto, reset]);

  const mutation = useMutation({
    mutationFn: async (values: ProductoFormValues) => {
      const imagenes = values.imagenes.map((imagen, index) => ({
        url: imagen.url,
        principal: imagen.principal ?? index === 0,
        orden: index + 1,
      }));
      const payload: ProductoPayload = {
        nombre: values.nombre,
        descripcion_corta: values.descripcion_corta?.trim() || undefined,
        precio: Number(values.precio),
        peso_kg: Number(values.peso_kg),
        sku: values.sku?.trim() ? values.sku.trim() : undefined,
        stock: Number(values.stock),
        umbral_bajo: Number(values.umbral_bajo),
        es_oferta: values.es_oferta,
        es_nuevo: values.es_nuevo,
        activo: values.activo,
        id_categoria: values.id_categoria ? Number(values.id_categoria) : undefined,
        imagenes,
      };
      if (editing) {
        return actualizarProducto(id as string, payload);
      }
      return crearProducto(payload);
    },
    onSuccess: (resultado) => {
      toast.success(`Producto ${editing ? "actualizado" : "creado"} correctamente`);
      queryClient.invalidateQueries({ queryKey: queryKeys.tienda.productos.list() });
      queryClient.invalidateQueries({ queryKey: queryKeys.tienda.productos.detail(resultado.id_producto) });
      navigate("/app/tienda/productos");
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "No se pudo guardar el producto";
      toast.error(message);
    },
  });

  const loading = loadingProducto || (editing && !producto);

  const onSubmit: SubmitHandler<ProductoFormValues> = (values) => mutation.mutateAsync(values);

  const categoriaOptions = useMemo(() => {
    return categorias.map((categoria) => ({ value: String(categoria.id), label: categoria.nombre }));
  }, [categorias]);

  return (
    <form className="space-y-8" onSubmit={handleSubmit(onSubmit)} noValidate>
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{editing ? "Editar producto" : "Nuevo producto"}</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Completa la información obligatoria, administra las imágenes y mantén tu catálogo actualizado.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" onClick={() => navigate("/app/tienda/productos")} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting || (!isDirty && !editing)}>
            {isSubmitting ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </header>

      {loading ? (
        <div className="space-y-4">
          {["nombre", "precio", "stock", "imagenes"].map((id) => (
            <Skeleton key={id} className="h-16 w-full" />
          ))}
        </div>
      ) : (
        <>
          <section className="grid gap-6 lg:grid-cols-2">
            <FormField label="Nombre" required error={errors.nombre?.message}>
              <Controller
                name="nombre"
                control={control}
                render={({ field }) => <Input {...field} placeholder="Ej. Café tostado orgánico" disabled={isSubmitting} />}
              />
            </FormField>
            <FormField label="SKU" error={errors.sku?.message}>
              <Controller
                name="sku"
                control={control}
                render={({ field }) => <Input {...field} placeholder="Código interno" disabled={isSubmitting} />}
              />
            </FormField>
            <FormField label="Precio (Q)" required error={errors.precio?.message}>
              <Controller
                name="precio"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    placeholder="0.00"
                    disabled={isSubmitting}
                  />
                )}
              />
            </FormField>
            <FormField label="Peso (kg)" required error={errors.peso_kg?.message}>
              <Controller
                name="peso_kg"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    placeholder="0.00"
                    disabled={isSubmitting}
                  />
                )}
              />
            </FormField>
            <FormField label="Stock" required error={errors.stock?.message}>
              <Controller
                name="stock"
                control={control}
                render={({ field }) => (
                  <Input {...field} type="number" min="0" step="1" inputMode="numeric" disabled={isSubmitting} />
                )}
              />
            </FormField>
            <FormField label="Umbral de alerta" required error={errors.umbral_bajo?.message}>
              <Controller
                name="umbral_bajo"
                control={control}
                render={({ field }) => (
                  <Input {...field} type="number" min="0" step="1" inputMode="numeric" disabled={isSubmitting} />
                )}
              />
            </FormField>
          </section>

          <FormField label="Descripción breve" description="Máximo 300 caracteres" error={errors.descripcion_corta?.message}>
            <Controller
              name="descripcion_corta"
              control={control}
              render={({ field }) => (
                <Textarea
                  {...field}
                  rows={4}
                  placeholder="Describe los detalles clave, ingredientes o beneficios."
                  disabled={isSubmitting}
                  hasError={Boolean(errors.descripcion_corta)}
                />
              )}
            />
          </FormField>

          <section className="grid gap-6 lg:grid-cols-2">
            <FormField label="Categoría" description="Organiza tu catálogo para que sea más fácil de encontrar" error={errors.id_categoria?.message}>
              <Controller
                name="id_categoria"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    disabled={isSubmitting || loadingCategorias}
                    hasError={Boolean(errors.id_categoria)}
                  >
                    <option value="">Selecciona una categoría</option>
                    {categoriaOptions.map((categoria) => (
                      <option key={categoria.value} value={categoria.value}>
                        {categoria.label}
                      </option>
                    ))}
                  </Select>
                )}
              />
            </FormField>

            <div className="flex flex-col gap-4">
              <Controller
                name="es_oferta"
                control={control}
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    label="Marcar como oferta"
                    disabled={isSubmitting}
                  />
                )}
              />
              <Controller
                name="es_nuevo"
                control={control}
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    label="Producto nuevo"
                    disabled={isSubmitting}
                  />
                )}
              />
              <Controller
                name="activo"
                control={control}
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    label="Visible en catálogo"
                    disabled={isSubmitting}
                  />
                )}
              />
            </div>
          </section>

          <FormField
            label="Galería de imágenes"
            required
            description="Arrastra o pega URLs públicas de tus fotografías. La primera será la principal."
            error={errors.imagenes?.message}
          >
            <Controller
              name="imagenes"
              control={control}
              render={({ field }) => (
                <ImageUploader
                  value={field.value}
                  onChange={field.onChange}
                  maxImages={8}
                  disabled={isSubmitting}
                />
              )}
            />
            {imagenesActuales.length > 0 ? (
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                {imagenesActuales.length} {imagenesActuales.length === 1 ? "imagen" : "imágenes"} añadidas.
              </p>
            ) : null}
          </FormField>
        </>
      )}
    </form>
  );
}
