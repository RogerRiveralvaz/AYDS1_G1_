import { useState } from "react";
import type { FormEvent } from "react";

import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { requestPasswordReset } from "../../../api/auth.api";
import { getErrorMessage } from "../../../api/client";

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const emailField = formData.get("email");
    const email = typeof emailField === "string" ? emailField.trim() : "";
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      const response = await requestPasswordReset(email);
      setMessage(response.message ?? `Enviamos instrucciones a ${email}`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto max-w-md space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">Recuperar contrasena</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Ingresa tu correo y te enviaremos un enlace para restablecer tu contrasena.
        </p>
      </header>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="space-y-1">
          <label htmlFor="email" className="text-sm font-medium">
            Correo
          </label>
          <Input id="email" name="email" type="email" required />
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {message ? <p className="text-sm text-emerald-600">{message}</p> : null}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Enviando" : "Enviar instrucciones"}
        </Button>
      </form>
    </section>
  );
}
