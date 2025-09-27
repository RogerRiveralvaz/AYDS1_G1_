import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useNavigate } from "react-router-dom";

import { crearPedido } from "../../../api/pedidos.api";
import {
  crearDireccion,
  establecerDireccionPredeterminada,
  fetchDirecciones,
  type Direccion,
} from "../../../api/direcciones.api";
import { fetchCarrito } from "../../../api/carrito.api";
import { queryKeys } from "../../../api/queryKeys";
import { Button } from "../../../components/ui/Button";
import { FormField } from "../../../components/ui/FormField";
import { Input } from "../../../components/ui/Input";
import { Modal } from "../../../components/ui/Modal";
import { Skeleton } from "../../../components/ui/Skeleton";
import { Textarea } from "../../../components/ui/Textarea";
import { useToast } from "../../../hooks/useToast";
import { formatCurrency, formatWeightKg } from "../../../utils/format";

const direccionSchema = z.object({
  etiqueta: z.string().min(2, "Ingresa una etiqueta").max(80),
  linea1: z.string().min(3, "Ingresa la direccion").max(160),
  linea2: z.string().optional(),
  ciudad: z.string().min(2, "Ingresa la ciudad").max(80),
  estado: z.string().optional(),
  codigo_postal: z.string().optional(),
  pais: z.string().length(2, "Usa el codigo ISO de 2 letras").default("GT"),
  ubicacion: z.string().optional(),
  predeterminada: z.boolean().default(false),
});

type DireccionFormValues = z.input<typeof direccionSchema>;
type DireccionFormOutput = z.output<typeof direccionSchema>;

const DIRECCION_SKELETON_KEYS = ["direccion-skel-1", "direccion-skel-2"] as const;
const ITEM_SKELETON_KEYS = ["item-skel-1", "item-skel-2", "item-skel-3"] as const;

export default function CheckoutPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [notas, setNotas] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDireccionId, setSelectedDireccionId] = useState<number | null>(null);

  const carritoQuery = useQuery({
    queryKey: queryKeys.carrito.root,
    queryFn: fetchCarrito,
  });

  const direccionesQuery = useQuery({
    queryKey: queryKeys.direcciones.root,
    queryFn: fetchDirecciones,
  });

  const direccionForm = useForm<DireccionFormValues, unknown, DireccionFormOutput>({
    resolver: zodResolver(direccionSchema),
    defaultValues: {
      etiqueta: "Casa",
      linea1: "",
      linea2: "",
      ciudad: "",
      estado: "",
      codigo_postal: "",
      pais: "GT",
      ubicacion: "",
      predeterminada: false,
    },
  });

  useEffect(() => {
    if (direccionesQuery.data && direccionesQuery.data.length > 0) {
      const predeterminada = direccionesQuery.data.find((direccion) => direccion.es_predeterminada);
      setSelectedDireccionId((prev) => prev ?? predeterminada?.id ?? direccionesQuery.data[0].id);
    } else {
      setSelectedDireccionId(null);
    }
  }, [direccionesQuery.data]);

  const crearDireccionMutation = useMutation({
    mutationFn: crearDireccion,
    onSuccess: async (direccion: Direccion) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.direcciones.root });
      setSelectedDireccionId(direccion.id);
      setIsModalOpen(false);
      direccionForm.reset();
      toast.show("Direccion guardada", "success");
    },
    onError: (error: unknown) => {
      console.error(error);
      toast.show("No se pudo guardar la direccion", "error");
    },
  });

  const establecerPredeterminadaMutation = useMutation({
    mutationFn: establecerDireccionPredeterminada,
    onSuccess: async (direccion: Direccion) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.direcciones.root });
      setSelectedDireccionId(direccion.id);
      toast.show("Direccion predeterminada actualizada", "success");
    },
    onError: (error: unknown) => {
      console.error(error);
      toast.show("No se pudo actualizar la direccion predeterminada", "error");
    },
  });

  const crearPedidoMutation = useMutation({
    mutationFn: crearPedido,
    onSuccess: async (pedido) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.carrito.root });
      await queryClient.invalidateQueries({ queryKey: queryKeys.pedidos.root });
      toast.show("Pedido creado correctamente", "success");
      navigate(`/app/cliente/pedidos/${pedido.id}`, { replace: true });
    },
    onError: (error: unknown) => {
      console.error(error);
      toast.show("No se pudo crear el pedido", "error");
    },
  });

  const carrito = carritoQuery.data;
  const resumen = carrito?.resumen;
  const items = carrito?.items ?? [];
  const direcciones = direccionesQuery.data ?? [];
  const hayCarrito = Boolean(items.length);

  const totals = useMemo(() => ({
    subtotal: formatCurrency(resumen?.subtotal),
    envio: formatCurrency(resumen?.envio),
    total: formatCurrency(resumen?.total),
    peso: formatWeightKg(resumen?.peso_total),
  }), [resumen]);

  const handleSubmitPedido = () => {
    if (!selectedDireccionId) {
      toast.show("Selecciona una direccion para continuar", "error");
      return;
    }
    crearPedidoMutation.mutate({ direccion_id: selectedDireccionId, notas: notas.trim() || undefined });
  };

  const handleCrearDireccion = direccionForm.handleSubmit((values) => {
    crearDireccionMutation.mutate(values);
  });

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Confirmar pedido</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Revisa tu carrito, elige una direccion y confirma el pedido. El envio cobra Q5.00 por los primeros 2 kg y Q2.00 por kilo adicional o fraccion.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <header className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Direcciones guardadas</h2>
              <Button type="button" size="sm" onClick={() => setIsModalOpen(true)}>Agregar direccion</Button>
            </header>
            {direccionesQuery.isLoading ? (
              <div className="space-y-3">
                {DIRECCION_SKELETON_KEYS.map((key) => (
                  <Skeleton key={key} className="h-16 w-full" />
                ))}
              </div>
            ) : null}
            {!direccionesQuery.isLoading && direcciones.length === 0 ? (
              <p className="text-sm text-slate-500">Aun no tienes direcciones guardadas. Agrega una para continuar.</p>
            ) : null}
            <div className="space-y-3">
              {direcciones.map((direccion) => (
                <label
                  key={direccion.id}
                  className="flex cursor-pointer flex-col gap-1 rounded-lg border border-slate-200 p-4 text-sm transition hover:border-blue-500 dark:border-slate-800 dark:hover:border-blue-500"
                >
                  <span className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="direccion"
                      value={direccion.id}
                      checked={selectedDireccionId === direccion.id}
                      onChange={() => setSelectedDireccionId(direccion.id)}
                    />
                    <span className="font-medium text-slate-900 dark:text-slate-100">{direccion.etiqueta ?? "Sin etiqueta"}</span>
                    {direccion.es_predeterminada ? (
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-blue-700">Predeterminada</span>
                    ) : null}
                  </span>
                  <span className="text-slate-600 dark:text-slate-300">
                    {direccion.linea1} {direccion.linea2 ? `, ${direccion.linea2}` : ""}
                  </span>
                  <span className="text-xs text-slate-500">
                    {direccion.ciudad}, {direccion.estado ?? ""} {direccion.codigo_postal ?? ""}, {direccion.pais}
                  </span>
                  {!direccion.es_predeterminada ? (
                    <button
                      type="button"
                      className="self-start text-xs text-blue-600 hover:underline"
                      onClick={() => establecerPredeterminadaMutation.mutate(direccion.id)}
                    >
                      Marcar como predeterminada
                    </button>
                  ) : null}
                </label>
              ))}
            </div>
          </section>

          <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-semibold">Notas</h2>
            <Textarea
              rows={4}
              placeholder="Instrucciones adicionales para la entrega (opcional)"
              value={notas}
              onChange={(event) => setNotas(event.target.value)}
            />
          </section>
        </div>

        <aside className="space-y-5 rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-semibold">Resumen del pedido</h2>
          {carritoQuery.isLoading ? (
            <div className="space-y-3">
              {ITEM_SKELETON_KEYS.map((key) => (
                <Skeleton key={key} className="h-12 w-full" />
              ))}
            </div>
          ) : null}
          {!carritoQuery.isLoading && items.length === 0 ? (
            <p className="text-sm text-slate-500">Tu carrito esta vacio. Agrega productos desde el catalogo.</p>
          ) : null}
          <ul className="space-y-3 text-sm">
            {items.map((item) => (
              <li key={item.id} className="flex justify-between">
                <span>{item.nombre} x {item.cantidad}</span>
                <span>{formatCurrency(item.subtotal)}</span>
              </li>
            ))}
          </ul>
          <div className="space-y-2 border-t border-slate-200 pt-4 text-sm dark:border-slate-700">
            <ResumenRow label="Peso total" value={totals.peso} />
            <ResumenRow label="Subtotal" value={totals.subtotal} />
            <ResumenRow label="Envio" value={totals.envio} />
            <ResumenRow label="Total" value={totals.total} highlight />
          </div>
          <Button
            type="button"
            className="w-full"
            variant="primary"
            disabled={!hayCarrito || crearPedidoMutation.isPending || crearDireccionMutation.isPending}
            onClick={handleSubmitPedido}
          >
            {crearPedidoMutation.isPending ? "Procesando pedido..." : "Confirmar pedido"}
          </Button>
        </aside>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nueva direccion">
        <form className="space-y-4" onSubmit={handleCrearDireccion} noValidate>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Etiqueta" required error={direccionForm.formState.errors.etiqueta?.message}>
              <Input {...direccionForm.register("etiqueta")} placeholder="Casa" />
            </FormField>
            <FormField label="Pais" required error={direccionForm.formState.errors.pais?.message}>
              <Input maxLength={2} {...direccionForm.register("pais")} />
            </FormField>
          </div>
          <FormField label="Direccion" required error={direccionForm.formState.errors.linea1?.message}>
            <Input {...direccionForm.register("linea1")} placeholder="Calle, numero y zona" />
          </FormField>
          <FormField label="Complemento" error={direccionForm.formState.errors.linea2?.message}>
            <Input {...direccionForm.register("linea2")} placeholder="Apartamento, referencia" />
          </FormField>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Ciudad" required error={direccionForm.formState.errors.ciudad?.message}>
              <Input {...direccionForm.register("ciudad")} />
            </FormField>
            <FormField label="Departamento" error={direccionForm.formState.errors.estado?.message}>
              <Input {...direccionForm.register("estado")} />
            </FormField>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Codigo postal" error={direccionForm.formState.errors.codigo_postal?.message}>
              <Input {...direccionForm.register("codigo_postal")} />
            </FormField>
            <FormField label="Ubicacion (lat,lng)" error={direccionForm.formState.errors.ubicacion?.message}>
              <Input {...direccionForm.register("ubicacion")} placeholder="14.123,-90.123" />
            </FormField>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <input type="checkbox" {...direccionForm.register("predeterminada")} />
            <span>Establecer como predeterminada</span>
          </label>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={crearDireccionMutation.isPending}>
              {crearDireccionMutation.isPending ? "Guardando..." : "Guardar direccion"}
            </Button>
          </div>
        </form>
      </Modal>
    </section>
  );
}

function ResumenRow({ label, value, highlight }: Readonly<{ label: string; value: string; highlight?: boolean }>) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500">{label}</span>
      <span className={highlight ? "text-lg font-semibold text-slate-900 dark:text-slate-100" : "font-medium"}>{value}</span>
    </div>
  );
}
