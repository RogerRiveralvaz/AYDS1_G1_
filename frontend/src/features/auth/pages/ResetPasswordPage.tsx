import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { FormEvent } from "react";

import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { passwordSchema } from "../../../utils/validators";
import { resetPassword } from "../../../api/auth.api";
import { getErrorMessage } from "../../../api/client";

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token") ?? "";
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
  const passwordField = formData.get("password");
  const confirmField = formData.get("confirm");
  const emailField = formData.get("email");
  const password = typeof passwordField === "string" ? passwordField : "";
  const confirm = typeof confirmField === "string" ? confirmField : "";
  const email = typeof emailField === "string" ? emailField.trim() : "";

    if (password !== confirm) {
      setError("Las contrasenas no coinciden");
      return;
    }

    const result = passwordSchema.safeParse(password);
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Contrasena invalida");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await resetPassword({ email, codigo: token, nueva_password: password });
      navigate("/auth/login", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto max-w-md space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">Restablecer contrasena</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Ingresa tu correo y la nueva contrasena. El enlace expira en 30 minutos.
        </p>
      </header>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <Input type="hidden" name="token" value={token} />
        <div className="space-y-1">
          <label htmlFor="email" className="text-sm font-medium">
            Correo
          </label>
          <Input id="email" name="email" type="email" required />
        </div>
        <div className="space-y-1">
          <label htmlFor="password" className="text-sm font-medium">
            Nueva contrasena
          </label>
          <Input id="password" name="password" type="password" required />
        </div>
        <div className="space-y-1">
          <label htmlFor="confirm" className="text-sm font-medium">
            Confirmar contrasena
          </label>
          <Input id="confirm" name="confirm" type="password" required />
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Guardando" : "Guardar contrasena"}
        </Button>
      </form>
    </section>
  );
}
