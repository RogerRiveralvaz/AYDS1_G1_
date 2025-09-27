import { z } from "zod";

export const emailSchema = z.string().email({ message: "Correo invalido" });
export const passwordSchema = z
  .string()
  .min(8, { message: "Debe tener al menos 8 caracteres" })
  .regex(/[A-Z]/, { message: "Debe incluir una mayuscula" })
  .regex(/[a-z]/, { message: "Debe incluir una minuscula" })
  .regex(/[0-9]/, { message: "Debe incluir un numero" });

export const telefonoSchema = z
  .string()
  .min(8, { message: "Debe tener al menos 8 digitos" })
  .max(15, { message: "Maximo 15 digitos" });

export const direccionSchema = z.object({
  linea1: z.string().min(3),
  ciudad: z.string().min(3),
  pais: z.string().length(2),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

export type DireccionInput = z.infer<typeof direccionSchema>;
