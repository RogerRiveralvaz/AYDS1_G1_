import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "../../../components/ui/Button";
import { FormField } from "../../../components/ui/FormField";
import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import { Stepper } from "../../../components/ui/Stepper";
import type { RoleCode } from "../../../app/store/auth";
import { emailSchema, passwordSchema } from "../../../utils/validators";

const roles: Array<{ value: RoleCode; label: string }> = [
  { value: "CLIENTE", label: "Cliente" },
  { value: "TIENDA", label: "Tienda" },
  { value: "REPARTIDOR", label: "Repartidor" },
  { value: "ADMIN", label: "Administrador" },
];

const accountSchema = z
  .object({
    rol_codigo: z.enum(["CLIENTE", "TIENDA", "REPARTIDOR", "ADMIN"] as const),
    nombres: z.string().min(2, "Ingresa al menos 2 caracteres"),
    apellidos: z.string().min(2, "Ingresa al menos 2 caracteres"),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "Las contraseAas no coinciden",
      });
    }
  });

export type AccountStepValues = z.infer<typeof accountSchema>;

type RegisterAccountStepProps = {
  defaultValues: Partial<AccountStepValues>;
  onSubmit: (values: AccountStepValues) => void;
  currentStep: string;
};

export function RegisterAccountStep({ defaultValues, onSubmit, currentStep }: Readonly<RegisterAccountStepProps>) {
  const form = useForm<AccountStepValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      rol_codigo: "CLIENTE",
      nombres: "",
      apellidos: "",
      email: "",
      password: "",
      confirmPassword: "",
      ...defaultValues,
    },
  });

  const { handleSubmit, register, watch, setValue, formState } = form;

  useEffect(() => {
    if (defaultValues.rol_codigo) {
      setValue("rol_codigo", defaultValues.rol_codigo);
    }
  }, [defaultValues.rol_codigo, setValue]);

  const steps = [
    { id: "account", label: "Cuenta", description: "Datos bAsicos" },
    { id: "details", label: "Detalles", description: "InformaciA3n del rol" },
    { id: "verify", label: "VerificaciA3n", description: "CA3digo de seguridad" },
  ];

  return (
    <div className="space-y-6">
      <Stepper steps={steps} currentStep={currentStep} />
      <form
        className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <FormField label="Rol" required error={formState.errors.rol_codigo?.message}>
          <Select {...register("rol_codigo")}>{roles.map((role) => (
            <option key={role.value} value={role.value}>
              {role.label}
            </option>
          ))}</Select>
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Nombres" required error={formState.errors.nombres?.message}>
            <Input autoComplete="given-name" {...register("nombres")} />
          </FormField>
          <FormField label="Apellidos" required error={formState.errors.apellidos?.message}>
            <Input autoComplete="family-name" {...register("apellidos")} />
          </FormField>
        </div>
        <FormField label="Correo electrA3nico" required error={formState.errors.email?.message}>
          <Input type="email" autoComplete="email" {...register("email")} />
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="ContraseAa" required error={formState.errors.password?.message}>
            <Input type="password" autoComplete="new-password" {...register("password")} />
          </FormField>
          <FormField label="Confirmar contraseAa" required error={formState.errors.confirmPassword?.message}>
            <Input type="password" autoComplete="new-password" {...register("confirmPassword")} />
          </FormField>
        </div>
        <div className="rounded-md bg-blue-50 p-4 text-xs text-blue-700 dark:bg-blue-950/40 dark:text-blue-200">
          Usa una contraseAa robusta. La barra de progreso mostrarA el rol seleccionado: <strong>{watch("rol_codigo")}</strong>.
        </div>
        <div className="flex justify-end">
          <Button type="submit">Continuar</Button>
        </div>
      </form>
    </div>
  );
}
