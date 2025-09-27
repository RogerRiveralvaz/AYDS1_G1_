# Requerimientos Funcionales y No Funcionales - RapiEntrega

## Requerimientos Funcionales

### RF001 - Registro y Autenticación
**Descripción:** El sistema debe permitir el registro de usuarios según su rol con validación por correo electrónico.

**Criterios de aceptación:**
- Cliente: Registro con nombre, apellido, género, dirección, teléfono, fecha nacimiento, correo, contraseña
- Repartidor: Incluye DPI, foto obligatoria, licencia de conducir, tipo de vehículo, placa, cuenta bancaria
- Tienda: Incluye nombre del negocio, representante, DPI/NIT, dirección física, logo, horarios, categoría, cuenta bancaria
- Administrador: Incluye nivel de permisos

### RF002 - Inicio de Sesión
**Descripción:** El sistema debe permitir autenticación con correo y contraseña, generando token JWT.

**Criterios de aceptación:**
- Validación de credenciales contra base de datos
- Redirección según rol detectado
- Verificación de cuenta activa y aprobada (repartidores/tiendas)
- Token JWT con expiración de 15 minutos

### RF003 - Catálogo de Tiendas y Productos
**Descripción:** Los clientes deben poder explorar tiendas y productos disponibles.

**Criterios de aceptación:**
- Búsqueda de tiendas por nombre y filtrado por categoría
- Visualización de horarios de atención y promociones activas
- Catálogo de productos organizado por categorías internas
- Mostrar imagen, nombre, descripción, precio y peso por producto
- Ocultar cantidad de stock a clientes

### RF004 - Carrito de Compras
**Descripción:** El sistema debe permitir agregar productos al carrito y gestionar el pedido.

**Criterios de aceptación:**
- Agregar/modificar cantidades/eliminar productos del carrito
- Mostrar subtotal y costos de envío
- Seleccionar dirección de entrega
- Confirmación de pedido con número de orden

### RF005 - Cálculo de Costo de Envío
**Descripción:** El sistema debe calcular el costo de envío basado en el peso total de productos.

**Criterios de aceptación:**
- Tarifa base de Q5.00 por los primeros 2 kg
- Q2.00 adicionales por cada kg extra o fracción
- Cálculo automático al agregar productos al carrito

### RF006 - Seguimiento de Pedidos
**Descripción:** Los clientes deben poder rastrear el estado de sus pedidos en tiempo real.

**Criterios de aceptación:**
- Estados: Pendiente, En preparación, En camino, Entregado
- Línea de progreso visual
- Notificación por correo electrónico de confirmación

### RF007 - Gestión de Productos (Tienda)
**Descripción:** Las tiendas deben poder administrar su catálogo de productos.

**Criterios de aceptación:**
- Crear/editar/activar/desactivar productos
- Registrar nombre, descripción, precio, peso, stock, categoría, imagen
- Marcar productos como "oferta" o "nuevos"

### RF008 - Gestión de Pedidos (Tienda)
**Descripción:** Las tiendas deben poder procesar los pedidos recibidos.

**Criterios de aceptación:**
- Recibir notificaciones inmediatas de nuevos pedidos
- Visualizar detalle completo del pedido
- Aceptar/rechazar pedidos
- Cambiar estado a "En preparación" o "Listo para entrega"

### RF009 - Notificaciones de Stock Bajo
**Descripción:** El sistema debe notificar automáticamente cuando productos tengan stock bajo.

**Criterios de aceptación:**
- Envío automático de correo electrónico
- Notificación cuando stock alcance nivel mínimo definido

### RF010 - Gestión de Entregas (Repartidor)
**Descripción:** Los repartidores deben poder gestionar las entregas asignadas.

**Criterios de aceptación:**
- Visualizar pedidos asignados con información completa
- Aceptar/rechazar pedidos
- Marcar como "recogido" al llegar a la tienda
- Marcar como "entregado" al completar la entrega

### RF011 - Administración de Tiendas y Repartidores
**Descripción:** Los administradores deben poder aprobar/rechazar solicitudes de registro.

**Criterios de aceptación:**
- Revisar solicitudes de nuevas tiendas
- Aprobar/rechazar/suspender tiendas
- Revisar solicitudes de nuevos repartidores  
- Aprobar/rechazar/suspender repartidores

### RF012 - Gestión de Clientes (Administrador)
**Descripción:** Los administradores deben poder supervisar las cuentas de clientes.

**Criterios de aceptación:**
- Acceso a información de todos los clientes registrados
- Visualizar historial de pedidos y actividad
- Suspender cuentas por comportamiento inadecuado

### RF013 - Reportes y Estadísticas
**Descripción:** El sistema debe generar reportes para tiendas y administradores.

**Criterios de aceptación:**
- Historial de pedidos con filtros por fecha, estado, cliente, monto
- Métricas de productos más vendidos
- Reportes de ingresos por periodo
- Estadísticas generales del sistema (mínimo 4 reportes)

### RF014 - Historial de Compras y Entregas
**Descripción:** Usuarios deben poder consultar su historial de transacciones.

**Criterios de aceptación:**
- Clientes: Historial de pedidos con detalles completos
- Repartidores: Historial de entregas con cálculo de ganancias

## Requerimientos No Funcionales

### RNF001 - Seguridad de Contraseñas
**Descripción:** Las contraseñas deben ser almacenadas de forma segura.
**Criterio:** Encriptación con algoritmo robusto (bcrypt recomendado)

### RNF002 - Seguridad de Sesiones
**Descripción:** El sistema debe manejar sesiones de forma segura.
**Criterio:** Tokens JWT con expiración de 15 minutos, invalidación al cerrar sesión

### RNF003 - Política de Contraseñas
**Descripción:** Las contraseñas deben cumplir políticas de seguridad robustas.
**Criterio:** Mínimo 8 caracteres, incluir mayúsculas, minúsculas, números y símbolos

### RNF004 - Disponibilidad
**Descripción:** El sistema debe estar disponible la mayor parte del tiempo.
**Criterio:** Disponibilidad del 95% o superior

### RNF005 - Usabilidad
**Descripción:** La interfaz debe ser intuitiva y accesible.
**Criterio:** Implementación de al menos 6 principios heurísticos de Jakob Nielsen

### RNF006 - Responsividad
**Descripción:** La aplicación debe funcionar en diferentes dispositivos.
**Criterio:** Diseño responsive que funcione en móviles, tablets y desktop

### RNF007 - Tecnología de Estilizado
**Descripción:** Uso de framework moderno para interfaces.
**Criterio:** Implementar Tailwind CSS, PrimeFaces o Material UI

### RNF008 - Verificación de Cuentas
**Descripción:** Las cuentas deben ser verificadas antes de su activación.
**Criterio:** Envío de código/PIN de verificación por correo electrónico

### RNF009 - Almacenamiento de Datos
**Descripción:** El sistema debe usar base de datos para persistencia.
**Criterio:** Base de datos local o en la nube (recomendado en la nube)

### RNF010 - Documentación
**Descripción:** El proyecto debe estar completamente documentado.
**Criterio:** Documentación en formato Markdown almacenada en repositorio

### RNF011 - Pruebas de Calidad
**Descripción:** El sistema debe ser probado exhaustivamente.
**Criterio:** Mínimo 5 pruebas unitarias y 5 pruebas end-to-end (E2E)

### RNF012 - Compatibilidad
**Descripción:** La aplicación debe funcionar en navegadores modernos.
**Criterio:** Compatible con Chrome, Firefox, Safari y Edge (últimas versiones)

### RNF013 - Escalabilidad
**Descripción:** El sistema debe soportar múltiples tiendas y usuarios concurrentes.
**Criterio:** Arquitectura que permita crecimiento sin degradación significativa del rendimiento

### RNF014 - Notificaciones
**Descripción:** El sistema debe enviar notificaciones oportunas.
**Criterio:** Notificaciones inmediatas para pedidos y automáticas para stock bajo