import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import type { RoleCode } from "../../../app/store/auth";

import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Stepper } from "../../../components/ui/Stepper";
import { login, register, resendVerification, verifyEmail } from "../../../api/auth.api";
import { getErrorMessage } from "../../../api/client";
import { useToast } from "../../../hooks/useToast";
import { useAuthStore } from "../../../app/store/auth";
import { RegisterAccountStep, type AccountStepValues } from "../components/RegisterAccountStep";
import { RegisterRoleStep, type RoleDetailsResult } from "../components/RegisterRoleStep";
import { useRegisterFlow } from "../hooks/useRegisterFlow";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initialRole = (params.get("rol") as RoleCode | null) ?? "CLIENTE";
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const { state, setAccount, setDetails, setStep, setVerificationCode, apiPayload, reset } = useRegisterFlow();

  useEffect(() => {
    if (!state.account) {
      setAccount({
        rol_codigo: initialRole,
        nombres: "",
        apellidos: "",
        email: "",
        password: "",
        confirmPassword: "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentRole = state.account?.rol_codigo ?? initialRole;

  const steps = useMemo(
    () => [
      { id: "account", label: "Cuenta", description: "Datos basicos" },
      { id: "details", label: "Detalles", description: "Informacion del rol" },
      { id: "verify", label: "Verificacion", description: "Confirma tu correo" },
    ],
    [],
  );

  const handleAccountSubmit = useCallback(
    (values: AccountStepValues) => {
      setAccount(values);
      setStep("details");
    },
    [setAccount, setStep],
  );

  const handleDetailsSubmit = useCallback(
    async (values: RoleDetailsResult) => {
      setSubmitting(true);
      try {
        setDetails(values);
        if (!apiPayload) {
          return;
        }
        const response = await register(apiPayload);
        setVerificationCode(response.verificationCode);
        toast.show("Revisa tu correo para el codigo de verificacion", "success");
        setStep("verify");
      } catch (error) {
        toast.show(getErrorMessage(error), "error");
        setStep("details");
      } finally {
        setSubmitting(false);
      }
    },
    [apiPayload, setDetails, setStep, setVerificationCode, toast],
  );

  const handleVerification = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!state.account?.email || !state.account?.password) {
        return;
      }
      const formData = new FormData(event.currentTarget);
      const code = String(formData.get("code") ?? "").trim();

      setVerifying(true);
      try {
        await verifyEmail({ email: state.account.email, codigo: code });
        toast.show("Correo verificado. Iniciando sesion", "success");
        const session = await login({ email: state.account.email, password: state.account.password });
        useAuthStore.getState().setSession({
          user: session.user,
          accessToken: session.access_token,
          refreshToken: session.refresh_token,
        });
        navigate(`/app/${session.user.roles[0].toLowerCase()}`, { replace: true });
        reset();
      } catch (error) {
        toast.show(getErrorMessage(error, "Codigo invalido"), "error");
      } finally {
        setVerifying(false);
      }
    },
    [navigate, reset, state.account?.email, state.account?.password, toast],
  );

  const handleBack = useCallback(() => {
    if (state.step === "verify") {
      setStep("details");
    } else if (state.step === "details") {
      setStep("account");
    }
  }, [setStep, state.step]);

  const handleResend = useCallback(async () => {
    if (!state.account?.email) return;
    setVerifying(true);
    try {
      const response = await resendVerification(state.account.email);
      setVerificationCode(response.codigo);
      setResendMessage(response.message ?? "Codigo reenviado. Revisa tu correo");
    } catch (error) {
      toast.show(getErrorMessage(error, "No se pudo reenviar el codigo"), "error");
    } finally {
      setVerifying(false);
    }
  }, [setVerificationCode, state.account?.email, toast]);

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
          Registro {currentRole.toLowerCase()}
        </p>
        <h1 className="text-3xl font-semibold">Crear cuenta</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Completa el formulario en tres pasos para comenzar a usar AYD Express.
        </p>
      </header>

      <Stepper steps={steps} currentStep={state.step} />

      {state.step === "account" ? (
        <RegisterAccountStep
          defaultValues={state.account ?? ({ rol_codigo: currentRole } as AccountStepValues)}
          onSubmit={handleAccountSubmit}
          currentStep={state.step}
        />
      ) : null}

      {state.step === "details" && state.account ? (
        <RegisterRoleStep
          role={state.account.rol_codigo}
          accountEmail={state.account.email}
          defaultValues={state.details}
          onBack={handleBack}
          onSubmit={handleDetailsSubmit}
          submitting={submitting}
        />
      ) : null}

      {state.step === "verify" && state.account ? (
        <div className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <form onSubmit={handleVerification} className="space-y-4" noValidate>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Enviamos un codigo de 6 digitos a <strong>{state.account.email}</strong>. Ingresa el codigo para finalizar el registro.
            </p>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="code">
              Codigo de verificacion
            </label>
            <Input id="code" name="code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required />
            {state.tempVerificationCode ? (
              <p className="text-xs text-slate-500">
                Codigo temporal para pruebas: <span className="font-mono">{state.tempVerificationCode}</span>
              </p>
            ) : null}
            {resendMessage ? <p className="text-xs text-emerald-500">{resendMessage}</p> : null}
            <div className="flex items-center justify-between">
              <Button type="button" variant="outline" onClick={handleBack}>
                Atras
              </Button>
              <div className="flex items-center gap-2">
                <Button type="button" variant="ghost" onClick={handleResend} disabled={verifying}>
                  Reenviar codigo
                </Button>
                <Button type="submit" disabled={verifying}>
                  {verifying ? "Verificando" : "Verificar"}
                </Button>
              </div>
            </div>
          </form>
        </div>
      ) : null}

      <p className="text-xs text-slate-500">
        Ya tienes cuenta? <Link to="/auth/login" className="text-blue-600 hover:underline">Inicia sesion</Link>
      </p>
    </section>
  );
}
