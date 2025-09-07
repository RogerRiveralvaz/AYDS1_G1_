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
  pais: z.string().length(2, "Usa el cA3digo ISO (ej. GT)").default("GT"),
  referencia: z.string().optional(),
});

const clienteSchema = z.object({
  telefono: telefonoSchema,
  direccion: direccionSchema,
});

const tiendaSchema = z.object({
  telefono: telefonoSchema,
  razon_social: z.string().min(3, "Requerido"),
  email_contacto: z.string().email(),
  cuenta_bancaria: z.string().min(6, "Requerido"),
  url_logo: z.string().url().optional().or(z.literal("")),
  direccion: direccionSchema.partial({ referencia: true }).optional(),
});

const repartidorSchema = z.object({
  telefono: telefonoSchema.optional(),
  dpi: z.string().min(6, "Requerido"),
  vehiculo_tipo: z.enum(["BICICLETA", "MOTO", "AUTO"] as const),
  cuenta_bancaria: z.string().min(6, "Requerido"),
  url_foto: z.string().url(),
  licencia_numero: z.string().optional(),
  licencia_tipo: z.enum(["MOTO", "AUTO", "NO_APLICA"] as const).optional(),
  placa: z.string().optional(),
});

const adminSchema = z.object({
  telefono: telefonoSchema.optional(),
});

export type ClienteDetails = z.infer<typeof clienteSchema>;
export type TiendaDetails = z.infer<typeof tiendaSchema>;
export type RepartidorDetails = z.infer<typeof repartidorSchema>;
export type AdminDetails = z.infer<typeof adminSchema>;

export type RoleDetailsResult =
  | ({ rol: "CLIENTE" } & ClienteDetails)
  | ({ rol: "TIENDA" } & TiendaDetails)
  | ({ rol: "REPARTIDOR" } & RepartidorDetails)
  | ({ rol: "ADMIN" } & AdminDetails);

type RegisterRoleStepProps = {
  role: RoleCode;
  accountEmail: string;
  defaultValues?: Partial<RoleDetailsResult>;
  onBack: () => void;
  onSubmit: (values: RoleDetailsResult) => Promise<void> | void;
  submitting?: boolean;
};

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
  const form = useForm<ClienteDetails>({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      telefono: "",
      direccion: {
        linea1: "",
        ciudad: "",
        pais: "GT",
        referencia: "",
      },
      ...defaultValues,
    },
  });

  const {
    handleSubmit,
    register,
    formState: { errors },
  } = form;

  return (
    <form
      className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
    >
      <FormField label="TelAfono" required error={errors.telefono?.message}>
        <Input {...register("telefono")} inputMode="tel" autoComplete="tel" />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="DirecciA3n" required error={errors.direccion?.linea1?.message}>
          <Input {...register("direccion.linea1")} placeholder="Calle, nAomero" />
        </FormField>
        <FormField label="Ciudad" required error={errors.direccion?.ciudad?.message}>
          <Input {...register("direccion.ciudad")} />
        </FormField>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="PaAs" required error={errors.direccion?.pais?.message}>
          <Input {...register("direccion.pais")} maxLength={2} placeholder="GT" />
        </FormField>
        <FormField label="Referencia" error={errors.direccion?.referencia?.message}>
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
  const form = useForm<TiendaDetails>({
    resolver: zodResolver(tiendaSchema),
    defaultValues: {
      telefono: "",
      razon_social: "",
      email_contacto: accountEmail,
      cuenta_bancaria: "",
      url_logo: "",
      direccion: {
        linea1: "",
        ciudad: "",
        pais: "GT",
      },
      ...defaultValues,
    },
  });

  const {
    handleSubmit,
    register,
    formState: { errors },
  } = form;

  return (
    <form
      className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
    >
      <FormField label="RazA3n social" required error={errors.razon_social?.message}>
        <Input {...register("razon_social")} />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="TelAfono" required error={errors.telefono?.message}>
          <Input {...register("telefono")} inputMode="tel" />
        </FormField>
        <FormField label="Correo de contacto" required error={errors.email_contacto?.message}>
          <Input type="email" {...register("email_contacto")} />
        </FormField>
      </div>
      <FormField label="Cuenta bancaria" required error={errors.cuenta_bancaria?.message}>
        <Input {...register("cuenta_bancaria")} />
      </FormField>
      <FormField label="Logo (URL)" error={errors.url_logo?.message}>
        <Input type="url" placeholder="https://..." {...register("url_logo")} />
      </FormField>
      <fieldset className="space-y-3 rounded-lg border border-dashed border-slate-300 p-4 text-sm dark:border-slate-700">
        <legend className="px-2 text-xs font-semibold uppercase tracking-wide text-slate-400">DirecciA3n</legend>
        <div className="grid gap-3 sm:grid-cols-3">
          <FormField label="DirecciA3n" error={errors.direccion?.linea1?.message}>
            <Input {...register("direccion.linea1")} />
          </FormField>
          <FormField label="Ciudad" error={errors.direccion?.ciudad?.message}>
            <Input {...register("direccion.ciudad")} />
          </FormField>
          <FormField label="PaAs" error={errors.direccion?.pais?.message}>
            <Input maxLength={2} {...register("direccion.pais")} />
          </FormField>
        </div>
      </fieldset>
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
  const form = useForm<RepartidorDetails>({
    resolver: zodResolver(repartidorSchema),
    defaultValues: {
      telefono: "",
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

  const {
    handleSubmit,
    register,
    formState: { errors },
  } = form;

  return (
    <form
      className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
    >
      <FormField label="DPI" required error={errors.dpi?.message}>
        <Input {...register("dpi")} />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Tipo de vehAculo" required error={errors.vehiculo_tipo?.message}>
          <Select {...register("vehiculo_tipo")}>
            <option value="BICICLETA">Bicicleta</option>
            <option value="MOTO">Moto</option>
            <option value="AUTO">AutomA3vil</option>
          </Select>
        </FormField>
        <FormField label="Cuenta bancaria" required error={errors.cuenta_bancaria?.message}>
          <Input {...register("cuenta_bancaria")} />
        </FormField>
      </div>
      <FormField label="Foto (URL)" required error={errors.url_foto?.message}>
        <Input type="url" placeholder="https://" {...register("url_foto")} />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-3">
        <FormField label="Licencia nAomero" error={errors.licencia_numero?.message}>
          <Input {...register("licencia_numero")} />
        </FormField>
        <FormField label="Tipo de licencia" error={errors.licencia_tipo?.message}>
          <Select {...register("licencia_tipo")}> 
            <option value="NO_APLICA">No aplica</option>
            <option value="MOTO">Moto</option>
            <option value="AUTO">Auto</option>
          </Select>
        </FormField>
        <FormField label="Placa" error={errors.placa?.message}>
          <Input {...register("placa")} />
        </FormField>
      </div>
      <FormField label="TelAfono" error={errors.telefono?.message}>
        <Input {...register("telefono")} inputMode="tel" />
      </FormField>
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
  const form = useForm<AdminDetails>({
    resolver: zodResolver(adminSchema),
    defaultValues: {
      telefono: "",
      ...defaultValues,
    },
  });

  const {
    handleSubmit,
    register,
    formState: { errors },
  } = form;

  return (
    <form
      className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
    >
      <FormField label="TelAfono" error={errors.telefono?.message}>
        <Input {...register("telefono")} inputMode="tel" />
      </FormField>
      <div className="rounded-md border border-dashed border-slate-300 p-4 text-xs text-slate-500 dark:border-slate-700">
        <p>Como administrador no necesitas mAs datos, pero podrAs completarlos luego en tu perfil.</p>
      </div>
      <Actions submitting={submitting} onBack={onBack} />
    </form>
  );
}

function Actions({ submitting, onBack }: Readonly<{ submitting?: boolean; onBack: () => void }>) {
  return (
    <div className="flex justify-between">
      <Button type="button" variant="outline" onClick={onBack}>
        AtrAs
      </Button>
      <Button type="submit" disabled={submitting}>
        {submitting ? "Guardandoa" : "Continuar"}
      </Button>
    </div>
  );
}
