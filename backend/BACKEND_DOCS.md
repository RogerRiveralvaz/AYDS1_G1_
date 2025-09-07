# Backend API Documentation

Este backend implementa una plataforma de entregas a domicilio con múltiples roles (cliente, tienda, repartidor, administrador). El servicio está construido con Flask, SQLAlchemy y JWT, y expone una API REST organizada en blueprints bajo el prefijo `/api`.

---

## Tabla de Contenido
- [Arquitectura General](#arquitectura-general)
- [Configuración y Puesta en Marcha](#configuración-y-puesta-en-marcha)
- [Autenticación y Seguridad](#autenticación-y-seguridad)
- [Flujos Funcionales Clave](#flujos-funcionales-clave)
  - [Registro y Activación de Cuenta](#registro-y-activación-de-cuenta)
  - [Flujo de Pedido y Entrega](#flujo-de-pedido-y-entrega)
- [Referencia de API](#referencia-de-api)
  - [Auth (`/api/auth`)](#auth-apiauth)
  - [Usuarios (`/api/usuarios`)](#usuarios-apiusuarios)
  - [Roles (`/api/roles`)](#roles-apiroles)
  - [Catálogo Público (`/api/catalogo`)](#catálogo-público-apicatalogo)
  - [Gestión de Tiendas (`/api/tiendas`)](#gestión-de-tiendas-apitiendas)
  - [Carrito (`/api/carrito`)](#carrito-apicarrito)
  - [Pedidos (`/api/pedidos`)](#pedidos-apipedidos)
  - [Pagos (`/api/pagos`)](#pagos-apipagos)
  - [Entregas (`/api/entregas`)](#entregas-apientregas)
  - [Panel Admin (`/api/admin`)](#panel-admin-apiadmin)
- [Modelos y Catálogos Relevantes](#modelos-y-catálagos-relevantes)
- [Pruebas Automatizadas](#pruebas-automatizadas)
- [Consideraciones para el Frontend](#consideraciones-para-el-frontend)

---

## Arquitectura General
- **Framework**: Flask 3 con patrón *application factory* (`app/__init__.py`).
- **Base de datos**: SQLAlchemy ORM con MySQL/PyMySQL (configurable vía `DATABASE_URL` o credenciales `.env`).
- **Migraciones**: soportadas por Flask-Migrate (pendiente generar migración inicial).
- **Serialización/validación**: Marshmallow + esquemas en `app/schemas`.
- **Autenticación**: JWT (Flask-JWT-Extended). Tokens de acceso (15 min) y refresh.
- **Organización**:
  - `app/routes`: Blueprints por contexto (auth, tiendas, pedidos, etc.).
  - `app/services`: Lógica de dominio (carrito, pedidos, entregas, admin...).
  - `app/models`: Mapas ORM del esquema SQL.
  - `app/utils`: utilidades (seguridad, decoradores, stub de correo).

---

## Configuración y Puesta en Marcha
1. **Crear entorno e instalar dependencias**
   ```bash
   python -m venv .venv
   .venv\Scripts\activate
   pip install -r requirements.txt
   ```
2. **Variables de entorno**: copiar `backend/.env.example` a `.env` y ajustar credenciales (usuario DB, secretos JWT, expiraciones).
3. **Base de datos**: crear base indicada (`DB_NAME`). Para MySQL ejecutar `Script.sql` o usar migraciones.
4. **Migraciones (opcional)**
   ```bash
   flask db init
   flask db migrate -m "initial"
   flask db upgrade
   ```
5. **Ejecutar servidor**
   ```bash
   flask --app app run --debug
   ```

---

## Autenticación y Seguridad
- JWT requerido en todos los endpoints protegidos (`Authorization: Bearer <token>`).
- Claims adicionales incluyen `roles`, `nombre`, `apellido`.
- Refresh tokens expiran según `JWT_ACCESS_TOKEN_EXPIRES_MIN` / configuración.
- Al cerrar sesión se almacena el `jti` en `token_revocado` para invalidar tokens.
- Decoradores en `app/utils/decorators.py` aplican validaciones de rol (`roles_required`, `admin_required`).

---

## Flujos Funcionales Clave

### Registro y Activación de Cuenta
1. `POST /api/auth/register`: crea usuario según rol.
   - Cliente: puede incluir dirección inicial.
  - Tienda y repartidor: requieren datos adicionales; quedan inactivos hasta aprobación admin.
2. Se genera código de verificación y se devuelve (en producción debería enviarse por correo).
3. `POST /api/auth/verify-email`: activa la cuenta al validar código.
4. Opcional: `POST /api/auth/resend-verification` para reemitir código.
5. `POST /api/auth/login`: devuelve `access_token` y `refresh_token` tras verificar credenciales y estado.

### Flujo de Pedido y Entrega
1. Cliente descubre tiendas/productos vía `/api/catalogo` y gestiona carrito (`/api/carrito`).
2. `POST /api/pedidos` crea pedido; calcula subtotal, peso y envío con tarifa configurada.
3. Tienda recibe pedido (`GET /api/pedidos/tienda`) y actualiza estado (`PATCH /api/pedidos/<id>/estado`).
4. Admin o tienda asigna repartidor (`POST /api/entregas/asignar`).
5. Repartidor consulta sus entregas (`GET /api/entregas/mis`) y actualiza estados/seguimiento.
6. Cliente puede registrar pagos (`POST /api/pagos`) y ver historial.

---

## Referencia de API

### Auth (`/api/auth`)
| Método & Ruta | Autenticación | Descripción |
|---------------|---------------|-------------|
| `POST /register` | No | Registro para CLIENTE/TIENDA/REPARTIDOR/ADMIN. Devuelve usuario + `codigo_verificacion` |
| `POST /login` | No | Autentica credenciales, responde con `access_token`, `refresh_token` y datos del usuario |
| `POST /refresh` | Refresh token | Emite nuevo access token |
| `POST /logout` | Access token | Revoca token actual |
| `POST /verify-email` | No | Valida código de activación |
| `POST /resend-verification` | No | Reenvía código (devuelve el código para pruebas) |
| `POST /request-password-reset` | No | Genera código de recuperación (prefijo `RST-`) |
| `POST /reset-password` | No | Cambia contraseña usando código válido |

### Usuarios (`/api/usuarios`)
| Ruta | Método | Rol | Descripción |
|------|--------|-----|-------------|
| `/` | GET | ADMIN | Lista usuarios con filtro opcional `?rol=` |
| `/me` | GET | Autenticado | Datos del usuario actual |
| `/<id>` | GET | ADMIN | Obtiene detalles por ID |
| `/<id>` | PATCH | ADMIN | Actualiza estado (`activo`) y/o roles |

### Roles (`/api/roles`)
| Ruta | Método | Rol | Descripción |
|------|--------|-----|-------------|
| `/` | GET | ADMIN | Lista roles disponibles |
| `/` | POST | ADMIN | Crea rol nuevo (`codigo`, `nombre`) |

### Catálogo Público (`/api/catalogo`)
| Ruta | Método | Auth | Descripción |
|------|--------|------|-------------|
| `/tiendas` | GET | Público | Listado de tiendas. Filtros: `categoria`, `ciudad`, `q` (texto), `abiertas=1` |
| `/tiendas/<id>` | GET | Público | Detalle con productos agrupados por categoría |
| `/productos` | GET | Público | Búsqueda global de productos (`q`, `categoria`, `tienda`) |

### Gestión de Tiendas (`/api/tiendas`)
> Requiere rol **TIENDA**

| Ruta | Método | Descripción |
|------|--------|-------------|
| `/mi` | GET | Información básica de la tienda propietaria |
| `/mi` | PATCH | Actualiza datos generales, dirección y horarios |
| `/mi/reportes` | GET | Indicadores: pedidos, ingresos, productos, clientes |
| `/mi/productos` | GET | Lista productos propios |
| `/mi/productos` | POST | Alta de producto (nombre, descripción, precio, peso, stock, imágenes) |
| `/mi/productos/<id>` | PATCH | Modifica atributos del producto |
| `/mi/productos/<id>/estado` | PATCH | Activa/desactiva producto (`{"activo": true}`) |
| `/mi/productos/<id>` | DELETE | Elimina producto |
| `/mi/tarifa` | GET | Consulta tarifa de envío asociada (global o propia) |
| `/mi/tarifa` | PUT | Define/actualiza tarifa para la tienda |

### Carrito (`/api/carrito`)
> Requiere rol **CLIENTE**

| Ruta | Método | Descripción |
|------|--------|-------------|
| `/` | GET | Estado actual del carrito (items + resumen) |
| `/items` | POST | Agrega producto `{id_producto, cantidad}` |
| `/items/<item_id>` | PATCH | Cambia cantidad |
| `/items/<item_id>` | DELETE | Elimina item |
| `/` | DELETE | Vacía todo el carrito |

### Pedidos (`/api/pedidos`)
| Ruta | Método | Rol | Descripción |
|------|--------|-----|-------------|
| `/` | POST | CLIENTE | Crea pedido desde carrito (requiere `direccion_id`) |
| `/` | GET | CLIENTE | Historial de pedidos del cliente |
| `/<id>` | GET | CLIENTE | Detalle con items y estados |
| `/tienda` | GET | TIENDA | Pedidos recibidos por la tienda. Filtro `?estado=` opcional |
| `/<id>/estado` | PATCH | TIENDA | Cambia estado (`codigo`, `nota`) |

### Pagos (`/api/pagos`)
| Ruta | Método | Rol | Descripción |
|------|--------|-----|-------------|
| `/` | POST | CLIENTE | Registra pago para pedido (`pedido_id`, `monto_q`, `metodo`, etc.) |
| `/<pedido_id>` | GET | CLIENTE / TIENDA | Listado de pagos del pedido (requiere pertenencia) |

### Entregas (`/api/entregas`)
| Ruta | Método | Rol | Descripción |
|------|--------|-----|-------------|
| `/asignar` | POST | TIENDA | Asigna pedido a repartidor `{pedido_id, repartidor_id}` |
| `/mis` | GET | REPARTIDOR | Lista entregas propias (`?estado=` opcional) |
| `/mis/<id>` | GET | REPARTIDOR | Detalle de entrega + seguimiento |
| `/mis/<id>/estado` | POST | REPARTIDOR | Actualiza estado (`ASIGNADA`, `ACEPTADA`, `EN_CAMINO`, `ENTREGADA`) |
| `/mis/<id>/seguimiento` | POST | REPARTIDOR | Registra ubicación `lat`, `lng`, `nota` |

### Panel Admin (`/api/admin`)
> Requiere rol **ADMIN**

| Ruta | Método | Descripción |
|------|--------|-------------|
| `/tiendas` | GET | Lista tiendas (filtro `?estado=`) |
| `/tiendas/<id>` | PATCH | Actualiza estado de aprobación (`{"codigo": "APROBADO"}`) |
| `/repartidores` | GET | Lista repartidores (filtro `?estado=`) |
| `/repartidores/<id>` | PATCH | Aprueba / rechaza repartidor |
| `/clientes` | GET | Listado de clientes registrados |
| `/resumen` | GET | Métricas: pedidos diarios, ingresos totales, tiendas activas, productos top |

---

## Modelos y Catálogos Relevantes
- **Roles (rol)**: CLIENTE, TIENDA, REPARTIDOR, ADMIN.
- **Estados de aprobación (estado_aprobacion)**: PENDIENTE, APROBADO, RECHAZADO.
- **Estados de pedido (estado_pedido)**: PENDIENTE, CONFIRMADO, ENTREGADO.
- **Estados de entrega (estado_entrega)**: ASIGNADA, ACEPTADA, EN_CAMINO, ENTREGADA.
- **Tarifa de envío (tarifa_envio)**:
  - Base global Q5 hasta 2kg, Q2 por kg o fracción adicional (configurable por tienda).

---

## Pruebas Automatizadas
- Ejecutar suite: `python -m pytest` (13 tests unitarios cubren auth, roles, carrito, pedidos, entregas, etc.).
- `tests/conftest.py` inicializa datos base (roles, estados, tarifa global) en SQLite en memoria.
- Ejemplos en `tests/test_auth.py` y `tests/test_business.py`: validar flujos de registro, recuperación de contraseña, creación de pedidos, asignación de entregas.

---

## Consideraciones para el Frontend
- **Gestión de tokens**: guardar `access_token` y `refresh_token`; renovar antes de 15 minutos usando `/api/auth/refresh`.
- **Verificación de cuenta**: mostrar pantalla para ingresar código tras registro; permitir reenviar código.
- **Flujo tienda**: restringir acciones hasta que `activo=true`. Consultar `/api/tiendas/mi` para saber estado.
- **Estados de pedido**: usar timeline (PENDIENTE → CONFIRMADO → ENTREGADO); se actualiza también desde entregas.
- **Seguimiento**: endpoint `/api/entregas/mis/<id>/seguimiento` acepta coordenadas en formato string `lat,lng` (puede integrarse con mapa).
- **Mensajes de error**: la API devuelve `{ "message": "detalle" }` con HTTP adecuado (400, 401, 403, 404, 422, 409).
- **Notificaciones**: alarma de stock bajo enviará log a `app/utils/mailer.py`; integrable con proveedor de correo.

Para cualquier expansión (por ejemplo, endpoints públicos de productos destacados, rating, etc.) la arquitectura de servicios y blueprints permite agregar rutas adicionales de forma consistente.
