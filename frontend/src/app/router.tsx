import { Suspense, lazy } from "react";
import { Navigate, RouterProvider, createBrowserRouter } from "react-router-dom";

import { FullPageLoader } from "../components/feedback/FullPageLoader";
import { ProtectedRoute } from "./guards/ProtectedRoute";
import { RoleGuard } from "./guards/RoleGuard";
import type { RoleCode } from "./store/auth";

const PublicLayout = lazy(() => import("../components/layouts/PublicLayout"));
const ClienteLayout = lazy(() => import("../components/layouts/ClienteLayout"));
const TiendaLayout = lazy(() => import("../components/layouts/TiendaLayout"));
const RepartidorLayout = lazy(() => import("../components/layouts/RepartidorLayout"));
const AdminLayout = lazy(() => import("../components/layouts/AdminLayout"));

const HomePage = lazy(() => import("../features/catalogo/pages/HomePage"));
const NotFoundPage = lazy(() => import("../features/misc/pages/NotFoundPage"));

const LoginPage = lazy(() => import("../features/auth/pages/LoginPage"));
const RegisterPage = lazy(() => import("../features/auth/pages/RegisterPage"));
const VerifyEmailPage = lazy(() => import("../features/auth/pages/VerifyEmailPage"));
const ForgotPasswordPage = lazy(() => import("../features/auth/pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("../features/auth/pages/ResetPasswordPage"));

const TiendasListadoPage = lazy(() => import("../features/catalogo/pages/TiendasListadoPage"));
const TiendaDetallePage = lazy(() => import("../features/catalogo/pages/TiendaDetallePage"));

const CarritoPage = lazy(() => import("../features/carrito/pages/CarritoPage"));
const CheckoutPage = lazy(() => import("../features/carrito/pages/CheckoutPage"));

const MisPedidosPage = lazy(() => import("../features/pedidos/pages/MisPedidosPage"));
const PedidoDetallePage = lazy(() => import("../features/pedidos/pages/PedidoDetallePage"));
const PerfilClientePage = lazy(() => import("../features/pedidos/pages/PerfilClientePage"));

const TiendaPanelPage = lazy(() => import("../features/tienda/pages/PanelPage"));
const TiendaProductosPage = lazy(() => import("../features/tienda/pages/ProductosPage"));
const TiendaProductoFormPage = lazy(() => import("../features/tienda/pages/ProductoFormPage"));
const TiendaPedidosPage = lazy(() => import("../features/tienda/pages/PedidosPage"));
const TiendaTarifaPage = lazy(() => import("../features/tienda/pages/TarifaPage"));
const TiendaPerfilPage = lazy(() => import("../features/tienda/pages/PerfilPage"));

const RepartidorEntregasPage = lazy(() => import("../features/entregas/pages/RepartidorEntregasPage"));
const RepartidorEntregaDetallePage = lazy(() => import("../features/entregas/pages/RepartidorEntregaDetallePage"));
const RepartidorHistorialPage = lazy(() => import("../features/entregas/pages/RepartidorHistorialPage"));

const AdminPanelPage = lazy(() => import("../features/admin/pages/AdminPanelPage"));
const AdminTiendasPage = lazy(() => import("../features/admin/pages/AdminTiendasPage"));
const AdminTiendaDetallePage = lazy(() => import("../features/admin/pages/AdminTiendaDetallePage"));
const AdminRepartidoresPage = lazy(() => import("../features/admin/pages/AdminRepartidoresPage"));
const AdminClientesPage = lazy(() => import("../features/admin/pages/AdminClientesPage"));

function withSuspense(node: React.ReactNode) {
  return <Suspense fallback={<FullPageLoader />}>{node}</Suspense>;
}

function withRole(roles: RoleCode[], node: React.ReactNode) {
  return (
    <ProtectedRoute>
      <RoleGuard roles={roles}>{node}</RoleGuard>
    </ProtectedRoute>
  );
}

const router = createBrowserRouter([
  {
    path: "/",
    element: withSuspense(<PublicLayout />),
    children: [
      { index: true, element: withSuspense(<HomePage />) },
      { path: "catalogo/tiendas", element: withSuspense(<TiendasListadoPage />) },
      { path: "catalogo/tiendas/:id", element: withSuspense(<TiendaDetallePage />) },
    ],
  },
  {
    path: "/auth",
    element: withSuspense(<PublicLayout />),
    children: [
      { path: "login", element: withSuspense(<LoginPage />) },
      { path: "register", element: withSuspense(<RegisterPage />) },
      { path: "verify", element: withSuspense(<VerifyEmailPage />) },
      { path: "forgot", element: withSuspense(<ForgotPasswordPage />) },
      { path: "reset", element: withSuspense(<ResetPasswordPage />) },
    ],
  },
  {
    path: "/app/cliente",
    element: withSuspense(withRole(["CLIENTE"], <ClienteLayout />)),
    children: [
      { index: true, element: <Navigate to="catalogo" replace /> },
      { path: "catalogo", element: withSuspense(<TiendasListadoPage />) },
      { path: "catalogo/:id", element: withSuspense(<TiendaDetallePage />) },
      { path: "carrito", element: withSuspense(<CarritoPage />) },
      { path: "checkout", element: withSuspense(<CheckoutPage />) },
      { path: "pedidos", element: withSuspense(<MisPedidosPage />) },
      { path: "pedidos/:id", element: withSuspense(<PedidoDetallePage />) },
      { path: "perfil", element: withSuspense(<PerfilClientePage />) },
    ],
  },
  {
    path: "/app/tienda",
    element: withSuspense(withRole(["TIENDA"], <TiendaLayout />)),
    children: [
      { index: true, element: withSuspense(<TiendaPanelPage />) },
      { path: "productos", element: withSuspense(<TiendaProductosPage />) },
      { path: "productos/nuevo", element: withSuspense(<TiendaProductoFormPage />) },
      { path: "productos/:id/editar", element: withSuspense(<TiendaProductoFormPage />) },
      { path: "pedidos", element: withSuspense(<TiendaPedidosPage />) },
      { path: "tarifa", element: withSuspense(<TiendaTarifaPage />) },
      { path: "perfil", element: withSuspense(<TiendaPerfilPage />) },
    ],
  },
  {
    path: "/app/repartidor",
    element: withSuspense(withRole(["REPARTIDOR"], <RepartidorLayout />)),
    children: [
      { index: true, element: withSuspense(<RepartidorEntregasPage />) },
      { path: "entregas", element: withSuspense(<RepartidorEntregasPage />) },
      { path: "entregas/:id", element: withSuspense(<RepartidorEntregaDetallePage />) },
      { path: "historial", element: withSuspense(<RepartidorHistorialPage />) },
    ],
  },
  {
    path: "/app/admin",
    element: withSuspense(withRole(["ADMIN"], <AdminLayout />)),
    children: [
      { index: true, element: withSuspense(<AdminPanelPage />) },
      { path: "tiendas", element: withSuspense(<AdminTiendasPage />) },
      { path: "tiendas/:id", element: withSuspense(<AdminTiendaDetallePage />) },
      { path: "repartidores", element: withSuspense(<AdminRepartidoresPage />) },
      { path: "clientes", element: withSuspense(<AdminClientesPage />) },
    ],
  },
  { path: "*", element: withSuspense(<NotFoundPage />) },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
