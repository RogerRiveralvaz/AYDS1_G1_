import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { verifyEmail } from "../../../api/auth.api";
import { getErrorMessage } from "../../../api/client";

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const code = String(formData.get("code") ?? "").trim();

    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      await verifyEmail({ email, codigo: code });
      setMessage("Correo verificado. Puedes iniciar sesion.");
      setTimeout(() => navigate("/auth/login", { replace: true }), 1000);
    } catch (err) {
      setError(getErrorMessage(err, "Codigo invalido"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto max-w-md space-y-6">
      <header className="space-y-2 text-center">
        <h1 className="text-3xl font-semibold">Verificar correo</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Ingresa el codigo enviado a tu correo electronico. Expira en 10 minutos.
        </p>
      </header>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="space-y-1">
          <label htmlFor="email" className="text-sm font-medium">
            Correo
          </label>
          <Input id="email" name="email" type="email" required autoComplete="email" />
        </div>
        <div className="space-y-1">
          <label htmlFor="code" className="text-sm font-medium">
            Codigo de verificacion
          </label>
          <Input id="code" name="code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required />
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {message ? <p className="text-sm text-emerald-600">{message}</p> : null}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Verificando" : "Verificar"}
        </Button>
      </form>
    </section>
  );
}
