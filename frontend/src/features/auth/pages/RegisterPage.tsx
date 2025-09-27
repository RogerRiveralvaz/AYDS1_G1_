import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { getErrorMessage } from "../../../api/client";
import { login, register as registerApi } from "../../../api/auth.api";
import { useAuthStore } from "../../../app/store/auth";

const ROLE_ROUTES: Record<string, string> = {
  admin: "/app/admin",
  tienda: "/app/tienda",
  repartidor: "/app/repartidor",
  cliente: "/app/cliente",
};

type RoleCode = "CLIENTE" | "REPARTIDOR" | "TIENDA" | "ADMIN";

function getDefaultRoute(roles: string[] | undefined) {
  if (!roles || roles.length === 0) return "/";
  const normalized = roles.map((r) => r.toLowerCase());
  if (normalized.includes("admin")) return ROLE_ROUTES.admin;
  if (normalized.includes("tienda")) return ROLE_ROUTES.tienda;
  if (normalized.includes("repartidor")) return ROLE_ROUTES.repartidor;
  if (normalized.includes("cliente")) return ROLE_ROUTES.cliente;
  return ROLE_ROUTES[normalized[0]] ?? "/";
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState<RoleCode>("CLIENTE");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Campos base (usuario)
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Cliente
  const [cliGenero, setCliGenero] = useState<"" | "M" | "F" | "O">("");
  const [cliTelefono, setCliTelefono] = useState("");
  const [cliFechaNac, setCliFechaNac] = useState("");
  const [cliDireccion, setCliDireccion] = useState("");

  // Repartidor
  const [repDpi, setRepDpi] = useState("");
  const [repFechaNac, setRepFechaNac] = useState("");
  const [repDireccion, setRepDireccion] = useState("");
  const [repTelefono, setRepTelefono] = useState("");
  const [repFoto, setRepFoto] = useState<File | null>(null);
  const [repLicNum, setRepLicNum] = useState("");
  const [repLicTipo, setRepLicTipo] = useState<"MOTO" | "AUTO" | "NO_APLICA">("NO_APLICA");
  const [repVehTipo, setRepVehTipo] = useState<"BICICLETA" | "MOTO" | "AUTO">("BICICLETA");
  const [repPlaca, setRepPlaca] = useState("");
  const [repCuenta, setRepCuenta] = useState("");

  // Tienda
  const [tieRazon, setTieRazon] = useState("");
  const [tieRepresentante, setTieRepresentante] = useState("");
  const [tieIdent, setTieIdent] = useState(""); // DPI o NIT
  const [tieTelefono, setTieTelefono] = useState("");
  const [tieLogo, setTieLogo] = useState<File | null>(null);
  const [tieHorarios, setTieHorarios] = useState("");
  const [tieCategoria, setTieCategoria] = useState(""); // nombre o slug
  const [tieCuenta, setTieCuenta] = useState("");
  const [tieDireccion, setTieDireccion] = useState("");

  // Admin
  const [admNivel, setAdmNivel] = useState("");
  const [admFoto, setAdmFoto] = useState<File | null>(null);

  const title = useMemo(() => {
    switch (role) {
      case "CLIENTE": return "Registro de Cliente";
      case "REPARTIDOR": return "Registro de Repartidor";
      case "TIENDA": return "Registro de Tienda";
      case "ADMIN": return "Registro de Administrador";
    }
  }, [role]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      // armamos FormData para soportar archivos (foto/logo)
      const fd = new FormData();

      // Campos base mapeados a tu DB:
      // usuario: email, password (el back hará hash), nombres, apellidos
      fd.append("rol_codigo", role); // {CLIENTE|REPARTIDOR|TIENDA|ADMIN}
      fd.append("nombres", nombres.trim());
      fd.append("apellidos", apellidos.trim());
      fd.append("email", email.trim());
      fd.append("password", password); // política de seguridad se valida en backend

      if (role === "CLIENTE") {
        // Tabla usuario + direccion + perfil_cliente (back lo desglosa)
        if (cliGenero) fd.append("genero", cliGenero);
        if (cliTelefono) fd.append("telefono", cliTelefono.trim());
        if (cliFechaNac) fd.append("fecha_nacimiento", cliFechaNac); // YYYY-MM-DD
        if (cliDireccion) fd.append("direccion", cliDireccion.trim()); // el backend puede crear registro en 'direccion'
      }

      if (role === "REPARTIDOR") {
        // perfil_repartidor + usuario/direccion
        fd.append("dpi", repDpi.trim());
        if (repFechaNac) fd.append("fecha_nacimiento", repFechaNac);
        if (repDireccion) fd.append("direccion_residencia", repDireccion.trim());
        if (repTelefono) fd.append("telefono", repTelefono.trim());
        if (repFoto) fd.append("fotografia", repFoto); // obligatorio
        if (repLicNum) fd.append("licencia_numero", repLicNum.trim());
        fd.append("licencia_tipo", repLicTipo);
        fd.append("vehiculo_tipo", repVehTipo);
        if (repPlaca) fd.append("placa", repPlaca.trim());
        fd.append("cuenta_bancaria", repCuenta.trim());
      }

      if (role === "TIENDA") {
        // tienda + usuario/duenio + direccion
        fd.append("razon_social", tieRazon.trim());
        fd.append("representante", tieRepresentante.trim());
        if (tieIdent) fd.append("identificacion_legal", tieIdent.trim()); // DPI o NIT
        fd.append("telefono", tieTelefono.trim());
        if (tieLogo) fd.append("logo", tieLogo);
        if (tieHorarios) fd.append("horarios", tieHorarios.trim());
        if (tieCategoria) fd.append("categoria", tieCategoria.trim()); // nombre/slug; el back puede resolver id_categoria
        fd.append("cuenta_bancaria", tieCuenta.trim());
        if (tieDireccion) fd.append("direccion", tieDireccion.trim());
      }

      if (role === "ADMIN") {
        fd.append("nivel_permisos", admNivel.trim());
        if (admFoto) fd.append("fotografia", admFoto);
      }

      // hit al backend (usa /auth/register existente)
      await registerApi(fd, true); // true = multipart

      // login automático
      const session = await login({ email, password });
      useAuthStore.getState().setSession({
        user: session.user,
        accessToken: session.access_token,
        refreshToken: session.refresh_token,
      });
      const redirect = getDefaultRoute(session.user.roles);
      navigate(redirect, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, "No se pudo crear la cuenta"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-2 text-center">
        <h1 className="text-3xl font-semibold">{title}</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Completa el formulario según tu rol. No se requiere verificación por correo.
        </p>
      </header>

      {/* Selector de rol */}
      <div className="flex flex-wrap gap-2 justify-center">
        {(["CLIENTE", "REPARTIDOR", "TIENDA", "ADMIN"] as RoleCode[]).map((r) => (
          <Button
            key={r}
            type="button"
            variant={role === r ? "default" : "outline"}
            onClick={() => setRole(r)}
          >
            {r}
          </Button>
        ))}
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
      >
        {/* Campos base */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium" htmlFor="nombres">Nombres</label>
            <Input id="nombres" value={nombres} onChange={(e) => setNombres(e.target.value)} required />
          </div>
          <div>
            <label className="text-sm font-medium" htmlFor="apellidos">Apellidos</label>
            <Input id="apellidos" value={apellidos} onChange={(e) => setApellidos(e.target.value)} required />
          </div>
          <div>
            <label className="text-sm font-medium" htmlFor="email">Correo electrónico</label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="text-sm font-medium" htmlFor="password">Contraseña</label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <p className="text-xs text-slate-500 mt-1">
              Debe cumplir política robusta (se validará en el backend).
            </p>
          </div>
        </div>

        {/* Campos por rol */}
        {role === "CLIENTE" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Datos de Cliente</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium" htmlFor="genero">Género</label>
                <select
                  id="genero"
                  className="w-full rounded-md border border-slate-300 bg-transparent p-2"
                  value={cliGenero}
                  onChange={(e) => setCliGenero(e.target.value as any)}
                >
                  <option value="">Selecciona</option>
                  <option value="M">Masculino</option>
                  <option value="F">Femenino</option>
                  <option value="O">Otro</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium" htmlFor="cliTelefono">Teléfono</label>
                <Input id="cliTelefono" value={cliTelefono} onChange={(e) => setCliTelefono(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium" htmlFor="cliFecha">Fecha de nacimiento</label>
                <Input id="cliFecha" type="date" value={cliFechaNac} onChange={(e) => setCliFechaNac(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium" htmlFor="cliDir">Dirección</label>
              <Input id="cliDir" value={cliDireccion} onChange={(e) => setCliDireccion(e.target.value)} />
            </div>
          </div>
        )}

        {role === "REPARTIDOR" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Datos de Repartidor</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium" htmlFor="repDpi">DPI</label>
                <Input id="repDpi" value={repDpi} onChange={(e) => setRepDpi(e.target.value)} required />
              </div>
              <div>
                <label className="text-sm font-medium" htmlFor="repFecha">Fecha de nacimiento</label>
                <Input id="repFecha" type="date" value={repFechaNac} onChange={(e) => setRepFechaNac(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium" htmlFor="repTel">Teléfono</label>
                <Input id="repTel" value={repTelefono} onChange={(e) => setRepTelefono(e.target.value)} />
              </div>
              <div className="md:col-span-3">
                <label className="text-sm font-medium" htmlFor="repDir">Dirección de residencia</label>
                <Input id="repDir" value={repDireccion} onChange={(e) => setRepDireccion(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium" htmlFor="repLicNum">Licencia de conducir (opcional si bicicleta)</label>
                <Input id="repLicNum" value={repLicNum} onChange={(e) => setRepLicNum(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium" htmlFor="repLicTipo">Tipo de licencia</label>
                <select
                  id="repLicTipo"
                  className="w-full rounded-md border border-slate-300 bg-transparent p-2"
                  value={repLicTipo}
                  onChange={(e) => setRepLicTipo(e.target.value as any)}
                >
                  <option value="NO_APLICA">No aplica</option>
                  <option value="MOTO">Moto</option>
                  <option value="AUTO">Auto</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium" htmlFor="repVehTipo">Tipo de vehículo</label>
                <select
                  id="repVehTipo"
                  className="w-full rounded-md border border-slate-300 bg-transparent p-2"
                  value={repVehTipo}
                  onChange={(e) => setRepVehTipo(e.target.value as any)}
                  required
                >
                  <option value="BICICLETA">Bicicleta</option>
                  <option value="MOTO">Moto</option>
                  <option value="AUTO">Auto</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium" htmlFor="repPlaca">Placa (si aplica)</label>
                <Input id="repPlaca" value={repPlaca} onChange={(e) => setRepPlaca(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium" htmlFor="repCuenta">Cuenta bancaria</label>
                <Input id="repCuenta" value={repCuenta} onChange={(e) => setRepCuenta(e.target.value)} required />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium" htmlFor="repFoto">Fotografía (obligatoria)</label>
                <input
                  id="repFoto"
                  name="repFoto"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setRepFoto(e.target.files?.[0] ?? null)}
                  className="block w-full text-sm"
                  required
                />
              </div>
            </div>
          </div>
        )}

        {role === "TIENDA" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Datos de Tienda</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium" htmlFor="razon">Nombre del negocio (razón social)</label>
                <Input id="razon" value={tieRazon} onChange={(e) => setTieRazon(e.target.value)} required />
              </div>
              <div>
                <label className="text-sm font-medium" htmlFor="rep">Representante o encargado</label>
                <Input id="rep" value={tieRepresentante} onChange={(e) => setTieRepresentante(e.target.value)} required />
              </div>
              <div>
                <label className="text-sm font-medium" htmlFor="ident">Documento (DPI o NIT)</label>
                <Input id="ident" value={tieIdent} onChange={(e) => setTieIdent(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium" htmlFor="telTienda">Teléfono de contacto</label>
                <Input id="telTienda" value={tieTelefono} onChange={(e) => setTieTelefono(e.target.value)} required />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium" htmlFor="direccionTienda">Dirección física</label>
                <Input id="direccionTienda" value={tieDireccion} onChange={(e) => setTieDireccion(e.target.value)} required />
              </div>
              <div>
                <label className="text-sm font-medium" htmlFor="categoria">Categoría de productos</label>
                <Input id="categoria" value={tieCategoria} onChange={(e) => setTieCategoria(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium" htmlFor="cuentaTienda">Número de cuenta bancaria</label>
                <Input id="cuentaTienda" value={tieCuenta} onChange={(e) => setTieCuenta(e.target.value)} required />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium" htmlFor="horarios">Horarios de atención</label>
                <Input id="horarios" value={tieHorarios} onChange={(e) => setTieHorarios(e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium" htmlFor="logo">Logo del negocio</label>
                <input
                  id="logo"
                  name="logo"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setTieLogo(e.target.files?.[0] ?? null)}
                  className="block w-full text-sm"
                />
              </div>
            </div>
          </div>
        )}

        {role === "ADMIN" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Datos de Administrador</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium" htmlFor="admNivel">Nivel de permisos</label>
                <Input id="admNivel" value={admNivel} onChange={(e) => setAdmNivel(e.target.value)} required />
              </div>
              <div>
                <label className="text-sm font-medium" htmlFor="admFoto">Fotografía (opcional)</label>
                <input
                  id="admFoto"
                  name="admFoto"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setAdmFoto(e.target.files?.[0] ?? null)}
                  className="block w-full text-sm"
                />
              </div>
            </div>
          </div>
        )}

        {error ? <p className="text-sm text-red-600" role="alert">{error}</p> : null}

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "Creando cuenta..." : "Crear cuenta"}
        </Button>

        <p className="text-xs text-slate-500">
          ¿Ya tienes cuenta?{" "}
          <Link to="/auth/login" className="text-blue-600 hover:underline">
            Inicia sesión
          </Link>
        </p>
      </form>
    </section>
  );
}
