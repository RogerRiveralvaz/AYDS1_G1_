import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "../../../components/ui/Button";
import { FormField } from "../../../components/ui/FormField";
import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import { Textarea } from "../../../components/ui/Textarea";
import type { RoleCode } from "../../../app/store/auth";
import { telefonoSchema } from "../../../utils/validators";

const direccionSchema = z.object({
  linea1: z.string().min(3, "Requerido"),
  ciudad: z.string().min(2, "Requerido"),
  pais: z.string().length(2, "Usa el codigo ISO de 2 letras").default("GT"),
  referencia: z.string().optional(),
});

const clienteSchema = z.object({
  direccion: direccionSchema,
});

const tiendaSchema = z.object({
  telefono: telefonoSchema,
  razon_social: z.string().min(3, "Requerido"),
  identificacion_legal: z.string().min(3, "Requerido"),
  email_contacto: z.string().email("Correo valido"),
  cuenta_bancaria: z.string().min(6, "Requerido"),
  url_logo: z.string().url().optional().or(z.literal("")),
  categoria_id: z.coerce.number().min(1, "Selecciona una categoria"),
  direccion: direccionSchema.partial({ referencia: true }).optional(),
  horarios: z.string().optional(),
});

const repartidorSchema = z.object({
  direccion: direccionSchema,
  dpi: z.string().min(6, "Requerido"),
  vehiculo_tipo: z.enum(["BICICLETA", "MOTO", "AUTO"] as const),
  cuenta_bancaria: z.string().min(6, "Requerido"),
  url_foto: z.string().url("Debe ser una URL"),
  licencia_numero: z.string().optional(),
  licencia_tipo: z.enum(["MOTO", "AUTO", "NO_APLICA"] as const).optional(),
  placa: z.string().optional(),
});

const adminSchema = z.object({
  nivel_permisos: z.string().min(3, "Requerido"),
});

export type ClienteDetails = z.infer<typeof clienteSchema>;
export type TiendaDetails = z.infer<typeof tiendaSchema>;
export type RepartidorDetails = z.infer<typeof repartidorSchema>;
export type AdminDetails = z.infer<typeof adminSchema>;

type ClienteFormValues = z.input<typeof clienteSchema>;
type TiendaFormValues = z.input<typeof tiendaSchema>;
type RepartidorFormValues = z.input<typeof repartidorSchema>;
type AdminFormValues = z.input<typeof adminSchema>;

export type RoleDetailsResult =
  | ({ rol: "CLIENTE" } & ClienteDetails)
  | ({ rol: "TIENDA" } & TiendaDetails)
  | ({ rol: "REPARTIDOR" } & RepartidorDetails)
  | ({ rol: "ADMIN" } & AdminDetails);

const TIENDA_CATEGORIES: Array<{ id: number; label: string }> = [
  { id: 1, label: "Supermercado" },
  { id: 2, label: "Farmacia" },
  { id: 3, label: "Ferreteria" },
  { id: 4, label: "Lacteos" },
  { id: 5, label: "Panaderia" },
  { id: 6, label: "Bebidas" },
  { id: 7, label: "Medicamentos" },
  { id: 8, label: "Higiene" },
  { id: 9, label: "Herramientas" },
  { id: 10, label: "Materiales" },
];

interface RegisterRoleStepProps {
  role: RoleCode;
  accountEmail: string;
  defaultValues?: Partial<RoleDetailsResult>;
  onBack: () => void;
  onSubmit: (values: RoleDetailsResult) => Promise<void> | void;
  submitting?: boolean;
}

export function RegisterRoleStep({
  role,
  accountEmail,
  defaultValues,
  onBack,
  onSubmit,
  submitting,
}: Readonly<RegisterRoleStepProps>) {
  if (role === "CLIENTE") {
    return (
      <ClienteForm
        defaultValues={defaultValues as ClienteDetails | undefined}
        onBack={onBack}
        onSubmit={(values) => onSubmit({ rol: "CLIENTE", ...values })}
        submitting={submitting}
      />
    );
  }
  if (role === "TIENDA") {
    return (
      <TiendaForm
        defaultValues={defaultValues as TiendaDetails | undefined}
        onBack={onBack}
        onSubmit={(values) => onSubmit({ rol: "TIENDA", ...values })}
        submitting={submitting}
        accountEmail={accountEmail}
      />
    );
  }
  if (role === "REPARTIDOR") {
    return (
      <RepartidorForm
        defaultValues={defaultValues as RepartidorDetails | undefined}
        onBack={onBack}
        onSubmit={(values) => onSubmit({ rol: "REPARTIDOR", ...values })}
        submitting={submitting}
      />
    );
  }
  return (
    <AdminForm
      defaultValues={defaultValues as AdminDetails | undefined}
      onBack={onBack}
      onSubmit={(values) => onSubmit({ rol: "ADMIN", ...values })}
      submitting={submitting}
    />
  );
}

function ClienteForm({
  defaultValues,
  onBack,
  onSubmit,
  submitting,
}: Readonly<{
  defaultValues?: ClienteDetails;
  onBack: () => void;
  onSubmit: (values: ClienteDetails) => Promise<void> | void;
  submitting?: boolean;
}>) {
  const form = useForm<ClienteFormValues, unknown, ClienteDetails>({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      direccion: {
        linea1: "",
        ciudad: "",
        pais: "GT",
        referencia: "",
        ...defaultValues?.direccion,
      },
    },
  });

  const { handleSubmit, register, formState } = form;

  return (
    <form
      className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
    >
      <h2 className="text-lg font-semibold">Direccion de entrega principal</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Direccion" required error={formState.errors.direccion?.linea1?.message}>
          <Input {...register('direccion.linea1')} placeholder="Calle, numero, zona" />
        </FormField>
        <FormField label="Ciudad" required error={formState.errors.direccion?.ciudad?.message}>
          <Input {...register('direccion.ciudad')} />
        </FormField>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Pais" required error={formState.errors.direccion?.pais?.message}>
          <Input maxLength={2} {...register("direccion.pais")} />
        </FormField>
        <FormField label="Referencia" error={formState.errors.direccion?.referencia?.message}>
          <Textarea rows={2} {...register("direccion.referencia")} />
        </FormField>
      </div>
      <Actions submitting={submitting} onBack={onBack} />
    </form>
  );
}

function TiendaForm({
  defaultValues,
  onBack,
  onSubmit,
  submitting,
  accountEmail,
}: Readonly<{
  defaultValues?: TiendaDetails;
  onBack: () => void;
  onSubmit: (values: TiendaDetails) => Promise<void> | void;
  submitting?: boolean;
  accountEmail: string;
}>) {
  const form = useForm<TiendaFormValues, unknown, TiendaDetails>({
    resolver: zodResolver(tiendaSchema),
    defaultValues: {
      telefono: "",
      razon_social: "",
      identificacion_legal: "",
      email_contacto: accountEmail,
      cuenta_bancaria: "",
      url_logo: "",
      categoria_id: TIENDA_CATEGORIES[0]?.id ?? 1,
      direccion: {
        linea1: "",
        ciudad: "",
        pais: "GT",
        referencia: "",
      },
      horarios: "",
      ...defaultValues,
    },
  });

  const { handleSubmit, register, formState } = form;

  return (
    <form
      className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
    >
      <FormField label="Nombre comercial" required error={formState.errors.razon_social?.message}>
        <Input {...register('razon_social')} />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Documento legal" required error={formState.errors.identificacion_legal?.message}>
          <Input {...register('identificacion_legal')} placeholder="DPI o NIT" />
        </FormField>
        <FormField label="Telefono" required error={formState.errors.telefono?.message}>
          <Input {...register('telefono')} inputMode="tel" />
        </FormField>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Correo de contacto" required error={formState.errors.email_contacto?.message}>
          <Input type="email" {...register('email_contacto')} />
        </FormField>
        <FormField label="Cuenta bancaria" required error={formState.errors.cuenta_bancaria?.message}>
          <Input {...register('cuenta_bancaria')} />
        </FormField>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Categoria" required error={formState.errors.categoria_id?.message}>
        <Select {...register("categoria_id", { valueAsNumber: true })}>
            {TIENDA_CATEGORIES.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.label}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Logo (URL)" error={formState.errors.url_logo?.message}>
          <Input type="url" placeholder="https://..." {...register('url_logo')} />
        </FormField>
      </div>
      <fieldset className="space-y-3 rounded-lg border border-dashed border-slate-300 p-4 text-sm dark:border-slate-700">
        <legend className="px-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Direccion</legend>
        <div className="grid gap-3 sm:grid-cols-3">
          <FormField label="Linea 1" error={formState.errors.direccion?.linea1?.message}>
            <Input {...register('direccion.linea1')} />
          </FormField>
          <FormField label="Ciudad" error={formState.errors.direccion?.ciudad?.message}>
            <Input {...register('direccion.ciudad')} />
          </FormField>
          <FormField label="Pais" error={formState.errors.direccion?.pais?.message}>
          <Input maxLength={2} {...register("direccion.pais")} />
          </FormField>
        </div>
        <FormField label="Referencia" error={formState.errors.direccion?.referencia?.message}>
          <Textarea rows={2} {...register('direccion.referencia')} />
        </FormField>
      </fieldset>
      <FormField label="Horarios (texto libre)" error={formState.errors.horarios?.message}>
        <Textarea rows={2} placeholder="Lun a Sab 08:00 - 18:00" {...register("horarios")} />
      </FormField>
      <Actions submitting={submitting} onBack={onBack} />
    </form>
  );
}

function RepartidorForm({
  defaultValues,
  onBack,
  onSubmit,
  submitting,
}: Readonly<{
  defaultValues?: RepartidorDetails;
  onBack: () => void;
  onSubmit: (values: RepartidorDetails) => Promise<void> | void;
  submitting?: boolean;
}>) {
  const form = useForm<RepartidorFormValues, unknown, RepartidorDetails>({
    resolver: zodResolver(repartidorSchema),
    defaultValues: {
      direccion: {
        linea1: "",
        ciudad: "",
        pais: "GT",
        referencia: "",
      },
      dpi: "",
      vehiculo_tipo: "MOTO",
      cuenta_bancaria: "",
      url_foto: "",
      licencia_numero: "",
      licencia_tipo: "NO_APLICA",
      placa: "",
      ...defaultValues,
    },
  });

  const { handleSubmit, register, formState } = form;

  return (
    <form
      className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
    >
      <FormField label="DPI" required error={formState.errors.dpi?.message}>
        <Input {...register('dpi')} />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Tipo de vehiculo" required error={formState.errors.vehiculo_tipo?.message}>
          <Select {...register('vehiculo_tipo')}>
            <option value='BICICLETA'>Bicicleta</option>
            <option value='MOTO'>Moto</option>
            <option value='AUTO'>Automovil</option>
          </Select>
        </FormField>
        <FormField label="Cuenta bancaria" required error={formState.errors.cuenta_bancaria?.message}>
          <Input {...register('cuenta_bancaria')} />
        </FormField>
      </div>
      <FormField label="Foto (URL)" required error={formState.errors.url_foto?.message}>
        <Input type='url' placeholder='https://...' {...register('url_foto')} />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-3">
        <FormField label="Numero de licencia" error={formState.errors.licencia_numero?.message}>
          <Input {...register('licencia_numero')} />
        </FormField>
        <FormField label="Tipo de licencia" error={formState.errors.licencia_tipo?.message}>
          <Select {...register('licencia_tipo')}>
            <option value='NO_APLICA'>No aplica</option>
            <option value='MOTO'>Moto</option>
            <option value='AUTO'>Auto</option>
          </Select>
        </FormField>
        <FormField label="Placa" error={formState.errors.placa?.message}>
          <Input {...register('placa')} />
        </FormField>
      </div>
      <fieldset className="space-y-3 rounded-lg border border-dashed border-slate-300 p-4 text-sm dark:border-slate-700">
        <legend className="px-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Direccion de residencia</legend>
        <div className="grid gap-3 sm:grid-cols-3">
          <FormField label="Direccion" error={formState.errors.direccion?.linea1?.message}>
            <Input {...register('direccion.linea1')} />
          </FormField>
          <FormField label="Ciudad" error={formState.errors.direccion?.ciudad?.message}>
            <Input {...register('direccion.ciudad')} />
          </FormField>
          <FormField label="Pais" error={formState.errors.direccion?.pais?.message}>
            <Input maxLength={2} {...register('direccion.pais')} />
          </FormField>
        </div>
        <FormField label="Referencia" error={formState.errors.direccion?.referencia?.message}>
          <Textarea rows={2} {...register('direccion.referencia')} />
        </FormField>
      </fieldset>
      <Actions submitting={submitting} onBack={onBack} />
    </form>
  );
}

function AdminForm({
  defaultValues,
  onBack,
  onSubmit,
  submitting,
}: Readonly<{
  defaultValues?: AdminDetails;
  onBack: () => void;
  onSubmit: (values: AdminDetails) => Promise<void> | void;
  submitting?: boolean;
}>) {
  const form = useForm<AdminFormValues, unknown, AdminDetails>({
    resolver: zodResolver(adminSchema),
    defaultValues: {
      nivel_permisos: "",
      ...defaultValues,
    },
  });

  const { handleSubmit, register, formState } = form;

  return (
    <form
      className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
    >
      <FormField label="Nivel de permisos" required error={formState.errors.nivel_permisos?.message}>
        <Input {...register('nivel_permisos')} placeholder='Ej. supervisor, auditor' />
      </FormField>
      <div className="rounded-md border border-dashed border-slate-300 p-4 text-xs text-slate-500 dark:border-slate-700">
        <p>Podras ajustar permisos adicionales desde el panel de administracion.</p>
      </div>
      <Actions submitting={submitting} onBack={onBack} />
    </form>
  );
}

function Actions({ submitting, onBack }: Readonly<{ submitting?: boolean; onBack: () => void }>) {
  return (
    <div className="flex justify-between">
      <Button type='button' variant='outline' onClick={onBack}>
        Atras
      </Button>
      <Button type='submit' disabled={submitting}>
        {submitting ? 'Guardando...' : 'Continuar'}
      </Button>
    </div>
  );
}
