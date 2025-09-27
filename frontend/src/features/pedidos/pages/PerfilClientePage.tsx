import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { crearDireccion, eliminarDireccion, establecerDireccionPredeterminada, fetchDirecciones, actualizarDireccion, type Direccion } from "../../../api/direcciones.api";
import { Badge } from "../../../components/ui/Badge";
import { fetchPerfilCliente, updatePerfilCliente, type UsuarioPerfil } from "../../../api/usuarios.api";
import { queryKeys } from "../../../api/queryKeys";
import { Button } from "../../../components/ui/Button";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
import { FormField } from "../../../components/ui/FormField";
import { Input } from "../../../components/ui/Input";
import { Modal } from "../../../components/ui/Modal";
import { Select } from "../../../components/ui/Select";
import { Switch } from "../../../components/ui/Switch";
import { useToast } from "../../../hooks/useToast";
import { formatDate } from "../../../utils/format";

const perfilSchema = z.object({
  nombres: z.string().min(2).max(80),
  apellidos: z.string().min(2).max(80),
  genero: z.string().optional(),
  telefono: z.string().optional(),
  fecha_nacimiento: z.string().optional(),
  url_foto: z.string().url({ message: 'Ingresa una URL valida' }).optional(),
});

const direccionSchema = z.object({
  etiqueta: z.string().min(2).max(80),
  linea1: z.string().min(3).max(160),
  linea2: z.string().optional(),
  ciudad: z.string().min(2).max(80),
  estado: z.string().optional(),
  codigo_postal: z.string().optional(),
  pais: z.string().length(2),
  ubicacion: z.string().optional(),
  predeterminada: z.boolean(),
});

type PerfilFormValues = z.input<typeof perfilSchema>;
type PerfilFormOutput = z.output<typeof perfilSchema>;
type DireccionFormValues = z.input<typeof direccionSchema>;
type DireccionFormOutput = z.output<typeof direccionSchema>;

type PreferenciasNotificacion = { email: boolean; sms: boolean };
const PREFERENCIAS_KEY = 'cliente-preferencias';

export default function PerfilClientePage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [isDireccionModalOpen, setIsDireccionModalOpen] = useState(false);
  const [direccionEnEdicion, setDireccionEnEdicion] = useState<Direccion | null>(null);
  const [direccionAEliminar, setDireccionAEliminar] = useState<Direccion | null>(null);
  const [preferencias, setPreferencias] = useState<PreferenciasNotificacion>({ email: true, sms: false });

  const perfilQuery = useQuery({
    queryKey: queryKeys.perfil.me,
    queryFn: fetchPerfilCliente,
  });

  const direccionesQuery = useQuery({
    queryKey: queryKeys.direcciones.root,
    queryFn: fetchDirecciones,
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem(PREFERENCIAS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as PreferenciasNotificacion;
        setPreferencias({ email: Boolean(parsed.email), sms: Boolean(parsed.sms) });
      }
    } catch (error) {
      console.error('No se pudieron cargar las preferencias', error);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(PREFERENCIAS_KEY, JSON.stringify(preferencias));
  }, [preferencias]);

  const perfilForm = useForm<PerfilFormValues, unknown, PerfilFormOutput>({
    resolver: zodResolver(perfilSchema),
    defaultValues: {
      nombres: "",
      apellidos: "",
      genero: "",
      telefono: "",
      fecha_nacimiento: "",
      url_foto: "",
    },
  });

  useEffect(() => {
    if (perfilQuery.data) {
      const perfil = perfilQuery.data;
      perfilForm.reset({
        nombres: perfil.nombres,
        apellidos: perfil.apellidos,
        genero: perfil.genero ?? "",
        telefono: perfil.telefono ?? "",
        fecha_nacimiento: perfil.fecha_nacimiento 
          ? perfil.fecha_nacimiento.slice(0, 10)
          : "",
        url_foto: perfil.url_foto ?? "",
      });
    }
  }, [perfilQuery.data, perfilForm]);

  const direccionForm = useForm<DireccionFormValues, unknown, DireccionFormOutput>({
    resolver: zodResolver(direccionSchema),
    defaultValues: {
      etiqueta: "",
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

  const updatePerfilMutation = useMutation({
    mutationFn: updatePerfilCliente,
    onSuccess: async (perfil: UsuarioPerfil) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.perfil.me });
      toast.show("Perfil actualizado", "success");
      perfilForm.reset({
        nombres: perfil.nombres,
        apellidos: perfil.apellidos,
        genero: perfil.genero ?? "",
        telefono: perfil.telefono ?? "",
        fecha_nacimiento: perfil.fecha_nacimiento ? perfil.fecha_nacimiento.slice(0, 10) : "",
        url_foto: perfil.url_foto ?? "",
      });
    },
    onError: (error: unknown) => {
      console.error(error);
      toast.show("No se pudo actualizar el perfil", "error");
    },
  });

  const crearDireccionMutation = useMutation({
    mutationFn: crearDireccion,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.direcciones.root });
      setIsDireccionModalOpen(false);
      setDireccionEnEdicion(null);
      direccionForm.reset();
      toast.show("Direccion guardada", "success");
    },
    onError: (error: unknown) => {
      console.error(error);
      toast.show("No se pudo guardar la direccion", "error");
    },
  });

  const actualizarDireccionMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<DireccionFormOutput> }) =>
      actualizarDireccion(id, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.direcciones.root });
      setIsDireccionModalOpen(false);
      setDireccionEnEdicion(null);
      direccionForm.reset();
      toast.show("Direccion actualizada", "success");
    },
    onError: (error: unknown) => {
      console.error(error);
      toast.show("No se pudo actualizar la direccion", "error");
    },
  });

  const eliminarDireccionMutation = useMutation({
    mutationFn: eliminarDireccion,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.direcciones.root });
      setDireccionAEliminar(null);
      toast.show("Direccion eliminada", "info");
    },
    onError: (error: unknown) => {
      console.error(error);
      toast.show("No se pudo eliminar la direccion", "error");
    },
  });

  const establecerPredeterminadaMutation = useMutation({
    mutationFn: establecerDireccionPredeterminada,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.direcciones.root });
      toast.show("Direccion predeterminada actualizada", "success");
    },
    onError: (error: unknown) => {
      console.error(error);
      toast.show("No se pudo establecer la direccion predeterminada", "error");
    },
  });

  const direcciones = direccionesQuery.data ?? [];

  const preferenciasDescripcion = useMemo(() => {
    const items = [];
    if (preferencias.email) items.push('Correo electronico');
    if (preferencias.sms) items.push('SMS');
    return items.length ? items.join(' y ') : 'Sin notificaciones';
  }, [preferencias]);

  const estaProcesandoDireccion = direccionEnEdicion ? actualizarDireccionMutation.isPending : crearDireccionMutation.isPending;
  const etiquetaBotonDireccion = (() => {
    if (direccionEnEdicion) {
      return actualizarDireccionMutation.isPending ? 'Actualizando...' : 'Actualizar';
    }
    return crearDireccionMutation.isPending ? 'Guardando...' : 'Guardar';
  })();

  const handleGuardarPerfil = perfilForm.handleSubmit((values) => {
    updatePerfilMutation.mutate({
      ...values,
      genero: values.genero || undefined,
      telefono: values.telefono || undefined,
      fecha_nacimiento: values.fecha_nacimiento || undefined,
      url_foto: values.url_foto || undefined,
    });
  });

  const handleGuardarDireccion = direccionForm.handleSubmit((values) => {
    if (direccionEnEdicion) {
      const { predeterminada, ...rest } = values;
      actualizarDireccionMutation.mutate({ id: direccionEnEdicion.id, data: rest });
      if (predeterminada) {
        establecerPredeterminadaMutation.mutate(direccionEnEdicion.id);
      }
    } else {
      crearDireccionMutation.mutate(values);
    }
  });

  const handleEditarDireccion = (direccion: Direccion) => {
    setDireccionEnEdicion(direccion);
    direccionForm.reset({
      etiqueta: direccion.etiqueta ?? '',
      linea1: direccion.linea1,
      linea2: direccion.linea2 ?? '',
      ciudad: direccion.ciudad,
      estado: direccion.estado ?? '',
      codigo_postal: direccion.codigo_postal ?? '',
      pais: direccion.pais,
      ubicacion: direccion.ubicacion ?? '',
      predeterminada: direccion.es_predeterminada,
    });
    setIsDireccionModalOpen(true);
  };

  const handleCrearDireccionClick = () => {
    setDireccionEnEdicion(null);
    direccionForm.reset({ etiqueta: '', linea1: '', linea2: '', ciudad: '', estado: '', codigo_postal: '', pais: 'GT', ubicacion: '', predeterminada: false });
    setIsDireccionModalOpen(true);
  };

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Mi perfil</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">Actualiza tu informacion personal, administra tus direcciones y define preferencias de notificacion.</p>
      </header>

      <form className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900" noValidate onSubmit={handleGuardarPerfil}>
        <h2 className="text-lg font-semibold">Datos personales</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Nombres" required error={perfilForm.formState.errors.nombres?.message}>
            <Input {...perfilForm.register('nombres')} />
          </FormField>
          <FormField label="Apellidos" required error={perfilForm.formState.errors.apellidos?.message}>
            <Input {...perfilForm.register('apellidos')} />
          </FormField>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <FormField label="Genero" error={perfilForm.formState.errors.genero?.message}>
            <Select {...perfilForm.register('genero')}>
              <option value=''>Selecciona</option>
              <option value='M'>Masculino</option>
              <option value='F'>Femenino</option>
              <option value='O'>Otro</option>
            </Select>
          </FormField>
          <FormField label="Telefono" error={perfilForm.formState.errors.telefono?.message}>
            <Input {...perfilForm.register('telefono')} placeholder='555-0000' />
          </FormField>
          <FormField label="Fecha de nacimiento" error={perfilForm.formState.errors.fecha_nacimiento?.message}>
            <Input type='date' {...perfilForm.register('fecha_nacimiento')} />
          </FormField>
        </div>
        <FormField label="URL de fotografia" error={perfilForm.formState.errors.url_foto?.message}>
          <Input type='url' placeholder='https://...' {...perfilForm.register('url_foto')} />
        </FormField>
        <div className="flex justify-end">
          <Button type='submit' disabled={updatePerfilMutation.isPending}>
            {updatePerfilMutation.isPending ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </div>
      </form>

      <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Direcciones</h2>
          <Button type='button' size='sm' onClick={handleCrearDireccionClick}>Agregar direccion</Button>
        </div>
        {direccionesQuery.isLoading ? (
          <p className="text-sm text-slate-500">Cargando direcciones...</p>
        ) : null}
        {!direccionesQuery.isLoading && direcciones.length === 0 ? (
          <p className="text-sm text-slate-500">Aun no tienes direcciones registradas.</p>
        ) : null}
        <div className="space-y-3">
          {direcciones.map((direccion) => (
            <div key={direccion.id} className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{direccion.etiqueta ?? 'Sin etiqueta'}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {direccion.linea1} {direccion.linea2 ? `, ${direccion.linea2}` : ''}
                  </p>
                  <p className="text-xs text-slate-500">
                    {direccion.ciudad}, {direccion.estado ?? ''} {direccion.codigo_postal ?? ''}, {direccion.pais}
                  </p>
                  {direccion.creado_en ? (
                    <p className="text-xs text-slate-400">Registrada el {formatDate(direccion.creado_en)}</p>
                  ) : null}
                  {direccion.ubicacion ? (
                    <p className="text-xs text-slate-400">Ubicacion: {direccion.ubicacion}</p>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {direccion.es_predeterminada ? (
                    <Badge variant='info'>Predeterminada</Badge>
                  ) : null}
                  <Button size='sm' variant='outline' onClick={() => handleEditarDireccion(direccion)}>Editar</Button>
                  <Button
                    size='sm'
                    variant='ghost'
                    disabled={direccion.es_predeterminada || establecerPredeterminadaMutation.isPending}
                    onClick={() => establecerPredeterminadaMutation.mutate(direccion.id)}
                  >
                    Marcar predeterminada
                  </Button>
                  <Button
                    size='sm'
                    variant='ghost'
                    onClick={() => setDireccionAEliminar(direccion)}
                    disabled={direccion.es_predeterminada}
                  >
                    Eliminar
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-lg font-semibold">Preferencias de notificacion</h2>
        <div className="space-y-3 text-sm">
          <Switch
            checked={preferencias.email}
            onCheckedChange={(value) => setPreferencias((prev) => ({ ...prev, email: value }))}
            label='Correos de actualizacion de pedidos'
          />
          <Switch
            checked={preferencias.sms}
            onCheckedChange={(value) => setPreferencias((prev) => ({ ...prev, sms: value }))}
            label='Alertas SMS cuando el repartidor esta en camino'
          />
        </div>
        <p className="text-xs text-slate-500">Recibiras: {preferenciasDescripcion}.</p>
      </section>

      <Modal
        isOpen={isDireccionModalOpen}
        onClose={() => {
          setIsDireccionModalOpen(false);
          setDireccionEnEdicion(null);
        }}
        title={direccionEnEdicion ? 'Editar direccion' : 'Agregar direccion'}
      >
        <form className="space-y-4" onSubmit={handleGuardarDireccion} noValidate>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label='Etiqueta' required error={direccionForm.formState.errors.etiqueta?.message}>
              <Input {...direccionForm.register('etiqueta')} />
            </FormField>
            <FormField label='Pais' required error={direccionForm.formState.errors.pais?.message}>
              <Input maxLength={2} {...direccionForm.register('pais')} />
            </FormField>
          </div>
          <FormField label='Direccion' required error={direccionForm.formState.errors.linea1?.message}>
            <Input {...direccionForm.register('linea1')} />
          </FormField>
          <FormField label='Complemento' error={direccionForm.formState.errors.linea2?.message}>
            <Input {...direccionForm.register('linea2')} />
          </FormField>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label='Ciudad' required error={direccionForm.formState.errors.ciudad?.message}>
              <Input {...direccionForm.register('ciudad')} />
            </FormField>
            <FormField label='Departamento' error={direccionForm.formState.errors.estado?.message}>
              <Input {...direccionForm.register('estado')} />
            </FormField>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label='Codigo postal' error={direccionForm.formState.errors.codigo_postal?.message}>
              <Input {...direccionForm.register('codigo_postal')} />
            </FormField>
            <FormField label='Ubicacion (lat,lng)' error={direccionForm.formState.errors.ubicacion?.message}>
              <Input {...direccionForm.register('ubicacion')} />
            </FormField>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <input type='checkbox' {...direccionForm.register('predeterminada')} />
            <span>Establecer como predeterminada</span>
          </label>
          <div className="flex justify-end gap-2">
            <Button type='button' variant='ghost' onClick={() => { setIsDireccionModalOpen(false); setDireccionEnEdicion(null); }}>Cancelar</Button>
            <Button type='submit' disabled={estaProcesandoDireccion}>
              {etiquetaBotonDireccion}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(direccionAEliminar)}
        title='Eliminar direccion'
        description='Esta accion eliminara la direccion seleccionada. No podras recuperarla.'
        variant='danger'
        isSubmitting={eliminarDireccionMutation.isPending}
        onCancel={() => setDireccionAEliminar(null)}
        onConfirm={() => {
          if (direccionAEliminar) {
            eliminarDireccionMutation.mutate(direccionAEliminar.id);
          }
        }}
      />
    </section>
  );
}
