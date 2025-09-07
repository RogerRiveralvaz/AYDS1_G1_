import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import type { Location } from "react-router-dom";

import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { getErrorMessage } from "../../../api/client";
import { login } from "../../../api/auth.api";
import { useAuthStore } from "../../../app/store/auth";

function getDefaultRoute(roles: string[] | undefined) {
  if (!roles || roles.length === 0) {
    return "/";
  }
  const primary = roles[0]?.toLowerCase();
  switch (primary) {
    case "cliente":
      return "/app/cliente";
    case "tienda":
      return "/app/tienda";
    case "repartidor":
      return "/app/repartidor";
    case "admin":
      return "/app/admin";
    default:
      return "/";
  }
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "").trim();

    setError(null);
    setLoading(true);
    try {
      const data = await login({ email, password });
      useAuthStore.getState().setSession({
        user: data.user,
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
      });
      const fallback = getDefaultRoute(data.user.roles);
      const redirectTo = (location.state as { from?: Location })?.from?.pathname ?? fallback;
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, "Credenciales invalidas"));
    } finally {
      setLoading(false);
    }
  }

  const disabled = useMemo(() => loading, [loading]);

  return (
    <section className="mx-auto max-w-md space-y-6">
      <header className="space-y-2 text-center">
        <h1 className="text-3xl font-semibold">Iniciar sesion</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Ingresa tu correo y contrasena para continuar. Usa el enlace de recuperacion si lo necesitas.
        </p>
      </header>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="space-y-1">
          <label htmlFor="email" className="text-sm font-medium">
            Correo electronico
          </label>
          <Input id="email" name="email" type="email" required autoComplete="email" placeholder="tu@correo.com" />
        </div>
        <div className="space-y-1">
          <label htmlFor="password" className="text-sm font-medium">
            Contrasena
          </label>
          <Input id="password" name="password" type="password" required autoComplete="current-password" />
        </div>
        {error ? <p className="text-sm text-red-600" role="alert">{error}</p> : null}
        <Button type="submit" disabled={disabled} className="w-full">
          {loading ? "Ingresando" : "Ingresar"}
        </Button>
        <div className="flex items-center justify-between text-xs text-slate-500">
          <Link to="/auth/forgot" className="font-medium text-blue-600 hover:underline">
            Olvidaste tu contrasena?
          </Link>
          <Link to="/auth/register?rol=CLIENTE" className="font-medium text-blue-600 hover:underline">
            Crear cuenta
          </Link>
        </div>
      </form>
    </section>
  );
}
