# Manual Técnico - RapiEntrega

## Tabla de Contenido
1. [Introducción](#introducción)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Tecnologías Utilizadas](#tecnologías-utilizadas)
4. [Estructura del Proyecto](#estructura-del-proyecto)
5. [Instalación y Configuración](#instalación-y-configuración)
6. [API Endpoints](#api-endpoints)
7. [Base de Datos](#base-de-datos)
8. [Autenticación y Seguridad](#autenticación-y-seguridad)
9. [Pruebas](#pruebas)
10. [Despliegue](#despliegue)

## Introducción

RapiEntrega es una aplicación web full-stack desarrollada con arquitectura cliente-servidor, utilizando Python para el backend y JavaScript/TypeScript para el frontend.

### Características Técnicas Principales
- **Arquitectura**: REST API + SPA (Single Page Application)
- **Base de Datos**: MySQL/PostgreSQL relacional
- **Autenticación**: JWT (JSON Web Tokens)
- **Tiempo de sesión**: 15 minutos con renovación automática
- **Encriptación**: Contraseñas hasheadas con bcrypt

## Arquitectura del Sistema

### Patrón Arquitectónico
El sistema implementa una **arquitectura de 3 capas**:

1. **Capa de Presentación (Frontend)**
   - Interfaz de usuario responsiva
   - Gestión de estado del cliente
   - Comunicación con API REST

2. **Capa de Lógica de Negocio (Backend)**
   - Procesamiento de reglas de negocio
   - Validación de datos
   - Gestión de autenticación y autorización

3. **Capa de Datos (Base de Datos)**
   - Persistencia de información
   - Integridad referencial
   - Consultas optimizadas

### Comunicación Entre Capas
- **Frontend ↔ Backend**: API REST con formato JSON sobre HTTPS
- **Backend ↔ Base de Datos**: ORM (SQLAlchemy) para abstracción de datos

## Tecnologías Utilizadas

### Backend
- **Lenguaje**: Python 3.8+
- **Framework**: Flask o FastAPI
- **ORM**: SQLAlchemy
- **Autenticación**: PyJWT para tokens JWT
- **Validación**: Pydantic (schemas)
- **Base de Datos**: MySQL/PostgreSQL
- **Testing**: pytest

### Frontend  
- **Lenguaje**: TypeScript
- **Framework**: React/Vue.js (basado en estructura src/)
- **Build Tool**: Vite
- **Empaquetado**: Node.js con npm/yarn
- **Estilos**: Tailwind CSS/Material UI/PrimeFaces

### Herramientas de Desarrollo
- **Control de Versiones**: Git con GitFlow
- **Testing E2E**: Cypress/Selenium
- **Gestión de Dependencias**: 
  - Backend: pip/pipenv
  - Frontend: npm/yarn

### Descripción de Módulos Backend

#### `/models/`
Contiene las clases que representan las entidades de la base de datos:
- `usuario.py`: Modelo de usuarios con roles
- `tienda.py`: Modelo de tiendas y productos  
- `pedido.py`: Modelo de pedidos e items
- `entrega.py`: Modelo de entregas y seguimiento
...

#### `/routes/`
Define los endpoints de la API REST:
- `auth.py`: Autenticación y registro
- `cliente.py`: Endpoints para clientes
- `tienda.py`: Endpoints para tiendas  
- `repartidor.py`: Endpoints para repartidores
- `admin.py`: Endpoints para administradores

#### `/services/`
Implementa la lógica de negocio:
- `auth_service.py`: Autenticación y tokens
- `email_service.py`: Envío de correos
- `pedido_service.py`: Procesamiento de pedidos
- `envio_service.py`: Cálculo de costos de envío

#### `/schemas/`
Validación de entrada y salida de datos:
- `usuario_schema.py`: Validación de usuarios
- `producto_schema.py`: Validación de productos
- `pedido_schema.py`: Validación de pedidos

## Instalación y Configuración

### Prerrequisitos
- Python 3.8+
- Node.js 14+
- MySQL/PostgreSQL
- Git

### Configuración del Backend

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd ayd/backend
```

2. **Crear entorno virtual**
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows
```

3. **Instalar dependencias**
```bash
pip install -r requirements.txt
```

4. **Configurar variables de entorno**
```bash
cp .env.example .env
# Editar .env con tus configuraciones
```

5. **Configurar base de datos**
```bash
# Ejecutar el script datos.sql en tu gestor de BD
mysql -u usuario -p < ../datos.sql
```

6. **Ejecutar migraciones** (si aplica)
```bash
python manage.py db init
python manage.py db migrate
python manage.py db upgrade
```

### Configuración del Frontend

1. **Instalar dependencias**
```bash
cd ../frontend
npm install
```

2. **Configurar variables de entorno**
```bash
cp .env.example .env
# Configurar URL del backend API
```

3. **Ejecutar en modo desarrollo**
```bash
npm run dev
```

### Variables de Entorno Backend

```env
# Base de datos
DATABASE_URL=mysql://user:password@localhost/entregas_db
DB_HOST=localhost
DB_USER=usuario
DB_PASSWORD=contraseña
DB_NAME=entregas_db

# JWT
JWT_SECRET_KEY=tu-clave-secreta-muy-segura
JWT_ACCESS_TOKEN_EXPIRES=900  # 15 minutos

# Email
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=tu-email@gmail.com
MAIL_PASSWORD=tu-app-password

# Aplicación
FLASK_ENV=development
SECRET_KEY=clave-secreta-para-sesiones
```

### Variables de Entorno Frontend

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_APP_NAME=RapiEntrega
VITE_UPLOAD_MAX_SIZE=5242880  # 5MB
```

## API Endpoints

### Autenticación
```
POST /api/auth/register          # Registro de usuario
POST /api/auth/login             # Inicio de sesión
POST /api/auth/logout            # Cerrar sesión
POST /api/auth/verify-email      # Verificar correo
POST /api/auth/refresh-token     # Renovar token
```

### Clientes
```
GET  /api/client/tiendas         # Listar tiendas
GET  /api/client/productos       # Listar productos
POST /api/client/carrito         # Gestionar carrito
POST /api/client/pedido          # Crear pedido
GET  /api/client/pedidos         # Historial pedidos
GET  /api/client/pedido/{id}     # Seguimiento pedido
```

### Tiendas
```
GET  /api/store/productos        # Listar mis productos
POST /api/store/producto         # Crear producto
PUT  /api/store/producto/{id}    # Editar producto
GET  /api/store/pedidos          # Pedidos recibidos
PUT  /api/store/pedido/{id}      # Actualizar estado pedido
GET  /api/store/reportes         # Reportes de ventas
```

### Repartidores
```
GET  /api/delivery/pedidos       # Pedidos disponibles
POST /api/delivery/aceptar/{id}  # Aceptar pedido
PUT  /api/delivery/estado/{id}   # Actualizar estado entrega
GET  /api/delivery/historial     # Historial entregas
GET  /api/delivery/ganancias     # Reporte ganancias
```

### Administradores
```
GET  /api/admin/solicitudes      # Solicitudes pendientes
POST /api/admin/aprobar/{id}     # Aprobar solicitud
GET  /api/admin/usuarios         # Gestionar usuarios
GET  /api/admin/estadisticas     # Estadísticas sistema
POST /api/admin/suspender/{id}   # Suspender cuenta
```

## Base de Datos

### Motor de Base de Datos
- **Recomendado**: MySQL 8.0+ o PostgreSQL 12+
- **Charset**: UTF8MB4 para soporte completo Unicode
- **Engine**: InnoDB para transacciones ACID

### Características Técnicas
- **Relaciones**: 25+ tablas con integridad referencial
- **Índices**: Optimización en campos de búsqueda frecuente
- **Constraints**: Validaciones a nivel de base de datos
- **Stored Procedures**: Para cálculos complejos (opcional)

### Tablas Principales
1. **usuario**: Información base de todos los usuarios
2. **tienda**: Datos de las tiendas registradas
3. **producto**: Catálogo de productos por tienda
4. **pedido**: Órdenes realizadas por clientes
5. **entrega**: Asignación y seguimiento de entregas

### Backup y Mantenimiento
```bash
# Backup diario
mysqldump -u usuario -p entregas_db > backup_$(date +%Y%m%d).sql

# Restauración
mysql -u usuario -p entregas_db < backup_20250926.sql
```

## Autenticación y Seguridad

### JWT Implementation
- **Algoritmo**: HS256
- **Tiempo de vida**: 15 minutos
- **Refresh**: Automático en cada request válido
- **Claims incluidos**: user_id, rol, email, exp

### Políticas de Seguridad
1. **Contraseñas**:
   - Mínimo 8 caracteres
   - Al menos 1 mayúscula, 1 minúscula, 1 número
   - Hash con bcrypt (cost factor 12)

2. **Sesiones**:
   - Tokens almacenados en httpOnly cookies
   - Invalidación en logout
   - Lista negra de tokens revocados

3. **API Security**:
   - Rate limiting por IP
   - CORS configurado para dominios específicos
   - Validación de entrada en todos los endpoints


## Pruebas

### Estructura de Testing

#### Pruebas Unitarias (Backend)
```bash
# Ejecutar todas las pruebas
pytest

# Con coverage
pytest --cov=app tests/

# Pruebas específicas
pytest tests/test_auth.py -v
```

#### Pruebas E2E (Frontend)
```bash
# Cypress
npm run cypress:open

# Headless
npm run cypress:run
```

### Casos de Prueba Mínimos Requeridos

#### Backend (Unitarias)
1. **test_registro_cliente**: Validación de registro de cliente
2. **test_login_usuario**: Proceso de autenticación
3. **test_calculo_envio**: Lógica de cálculo de costos
4. **test_creacion_pedido**: Flujo de creación de pedidos
5. **test_gestion_productos**: CRUD de productos

#### Frontend (E2E)  
1. **test_flujo_registro_login**: Registro e inicio de sesión completo
2. **test_realizar_pedido**: Desde búsqueda hasta confirmación
3. **test_gestion_tienda**: Panel de administración de tienda
4. **test_proceso_entrega**: Flujo del repartidor
5. **test_panel_admin**: Funcionalidades administrativas

## Despliegue

### Entornos
- **Desarrollo**: Local con hot-reload
- **Testing**: Servidor de pruebas con datos de prueba
- **Producción**: Servidor en la nube con SSL

### Configuración de Producción

#### Backend (Flask/Gunicorn)
```bash
# Instalar servidor WSGI
pip install gunicorn

# Ejecutar en producción
gunicorn -w 4 -b 0.0.0.0:5000 wsgi:app
```

#### Frontend (Build estático)
```bash
# Construir para producción
npm run build

# Servir con nginx/apache
cp -r dist/* /var/www/html/
```

### Docker (Opcional)
```dockerfile
# Dockerfile para backend
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 5000
CMD ["gunicorn", "-b", "0.0.0.0:5000", "wsgi:app"]
```
### Checklist de Despliegue
- [ ] Variables de entorno configuradas
- [ ] Base de datos migrada
- [ ] SSL certificado instalado
- [ ] Backups automatizados configurados
- [ ] Monitoring y logs configurados
- [ ] Rate limiting activado
- [ ] CORS configurado correctamente

## Troubleshooting Común

### Problemas de Base de Datos
- **Error de conexión**: Verificar credenciales en .env
- **Tablas no existen**: Ejecutar script datos.sql
- **Encoding issues**: Verificar charset UTF8MB4

### Problemas de CORS
- **Frontend no puede conectar**: Configurar CORS en backend
- **Cookies no se envían**: Verificar sameSite y secure flags

### Problemas de JWT
- **Token expirado constantemente**: Verificar sincronización de tiempo
- **Invalid signature**: Verificar JWT_SECRET_KEY entre entornos