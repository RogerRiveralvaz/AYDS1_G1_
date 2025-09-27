# Historias de Usuario - RapiEntrega

## Épica: Gestión de Usuarios

### HU001 - Registro de Cliente
**Como** cliente potencial  
**Quiero** registrarme en la plataforma con mis datos personales  
**Para** poder realizar pedidos de productos a domicilio  

**Criterios de aceptación:**
- Puedo ingresar nombre, apellido, género, dirección, teléfono, fecha de nacimiento, correo y contraseña
- La contraseña debe cumplir políticas de seguridad robustas
- Recibo un código de verificación por correo electrónico
- Mi cuenta queda inactiva hasta verificar el correo

### HU002 - Registro de Repartidor
**Como** repartidor potencial  
**Quiero** registrarme con mis documentos y datos del vehículo  
**Para** poder trabajar realizando entregas  

**Criterios de aceptación:**
- Puedo subir mi fotografía (obligatoria)
- Registro mi DPI, licencia, tipo de vehículo, placa y cuenta bancaria
- Mi solicitud queda pendiente de aprobación por el administrador
- Recibo notificación del estado de mi solicitud

### HU003 - Registro de Tienda
**Como** dueño de negocio  
**Quiero** registrar mi tienda en la plataforma  
**Para** vender mis productos a más clientes  

**Criterios de aceptación:**
- Registro información del negocio: nombre, representante, DPI/NIT, dirección
- Puedo subir el logo de mi tienda
- Defino mis horarios de atención y categoría de productos
- Mi solicitud queda pendiente de aprobación

### HU004 - Iniciar Sesión
**Como** usuario registrado  
**Quiero** iniciar sesión con mi correo y contraseña  
**Para** acceder a las funcionalidades según mi rol  

**Criterios de aceptación:**
- Soy redirigido a mi panel correspondiente según mi rol
- Solo puedo acceder si mi cuenta está activa y aprobada
- Recibo un token de sesión que expira en 15 minutos
- Puedo cerrar sesión cuando lo desee

## Épica: Funcionalidades del Cliente

### HU005 - Explorar Tiendas
**Como** cliente  
**Quiero** explorar las tiendas disponibles  
**Para** encontrar productos que necesito  

**Criterios de aceptación:**
- Puedo buscar tiendas por nombre
- Puedo filtrar por categoría de productos
- Veo horarios de atención y si tienen promociones activas
- Puedo identificar si una tienda está cerrada temporalmente

### HU006 - Navegar Catálogo de Productos
**Como** cliente  
**Quiero** ver los productos de una tienda  
**Para** decidir qué comprar  

**Criterios de aceptación:**
- Los productos están organizados por categorías
- Veo imagen, nombre, descripción, precio y peso de cada producto
- Puedo navegar entre diferentes secciones (nuevos, ofertas, más vendidos)
- No puedo ver la cantidad exacta de stock disponible

### HU007 - Gestionar Carrito de Compras
**Como** cliente  
**Quiero** agregar productos a mi carrito  
**Para** organizar mi pedido antes de comprarlo  

**Criterios de aceptación:**
- Puedo agregar productos de una misma tienda
- Puedo modificar cantidades o eliminar productos
- Veo el subtotal y el costo de envío calculado automáticamente
- Puedo volver al catálogo para seguir comprando

### HU008 - Realizar Pedido
**Como** cliente  
**Quiero** confirmar mi pedido  
**Para** recibir los productos en mi domicilio  

**Criterios de aceptación:**
- Puedo seleccionar o registrar una dirección de entrega
- Veo el resumen completo antes de confirmar
- Recibo un número de orden y confirmación por correo
- El pedido se registra con estado "Pendiente"

### HU009 - Rastrear Pedido
**Como** cliente  
**Quiero** ver el estado de mi pedido  
**Para** saber cuándo llegará mi entrega  

**Criterios de aceptación:**
- Veo una línea de progreso con los estados: Pendiente, En preparación, En camino, Entregado
- La información se actualiza en tiempo real
- Puedo acceder al seguimiento desde mi historial de pedidos

### HU010 - Ver Historial de Compras
**Como** cliente  
**Quiero** consultar mis pedidos anteriores  
**Para** revisar mis compras pasadas  

**Criterios de aceptación:**
- Veo todos mis pedidos ordenados por fecha
- Puedo filtrar por tienda, fecha o estado
- Veo detalles completos de cada pedido
- Puedo acceder al seguimiento de pedidos activos

## Épica: Funcionalidades de Tienda

### HU011 - Gestionar Productos
**Como** dueño de tienda  
**Quiero** administrar mi catálogo de productos  
**Para** mantener mi inventario actualizado  

**Criterios de aceptación:**
- Puedo crear, editar, activar y desactivar productos
- Registro nombre, descripción, precio, peso, stock, categoría e imagen
- Puedo marcar productos como "oferta" o "nuevos"
- Los cambios se reflejan inmediatamente en el catálogo

### HU012 - Procesar Pedidos
**Como** dueño de tienda  
**Quiero** gestionar los pedidos que recibo  
**Para** preparar y despachar los productos correctamente  

**Criterios de aceptación:**
- Recibo notificaciones inmediatas de nuevos pedidos
- Puedo ver todos los detalles del pedido
- Puedo aceptar o rechazar pedidos
- Puedo cambiar el estado a "En preparación" o "Listo para entrega"

### HU013 - Ver Reportes de Ventas
**Como** dueño de tienda  
**Quiero** consultar estadísticas de mis ventas  
**Para** tomar decisiones de negocio  

**Criterios de aceptación:**
- Veo historial de pedidos con filtros por fecha, estado y monto
- Consulto productos más vendidos y horarios de mayor demanda
- Veo ingresos acumulados por periodo
- Los datos se presentan en tablas y gráficos

### HU014 - Recibir Alertas de Stock
**Como** dueño de tienda  
**Quiero** ser notificado cuando mis productos tengan stock bajo  
**Para** reabastecer mi inventario a tiempo  

**Criterios de aceptación:**
- Recibo correos automáticos cuando el stock esté bajo
- La alerta incluye el producto y cantidad actual
- Puedo configurar el umbral mínimo de stock por producto

## Épica: Funcionalidades del Repartidor

### HU015 - Ver Pedidos Disponibles
**Como** repartidor  
**Quiero** ver los pedidos que puedo tomar  
**Para** elegir cuáles entregar  

**Criterios de aceptación:**
- Veo lista de pedidos con información de tienda, cliente y dirección
- Puedo ver el peso total y costo de envío calculado
- Veo la distancia estimada entre tienda y destino
- Puedo aceptar o rechazar pedidos

### HU016 - Gestionar Entregas
**Como** repartidor  
**Quiero** actualizar el estado de mis entregas  
**Para** mantener informados a los clientes  

**Criterios de aceptación:**
- Puedo marcar como "recogido" al llegar a la tienda
- Puedo marcar como "entregado" al completar la entrega
- Los cambios de estado se reflejan en el seguimiento del cliente
- Puedo agregar notas sobre el estado de la entrega

### HU017 - Ver Historial de Entregas
**Como** repartidor  
**Quiero** consultar mis entregas realizadas  
**Para** llevar control de mis ganancias  

**Criterios de aceptación:**
- Veo todas mis entregas con fecha, hora y dirección
- Consulto la distancia recorrida por cada entrega
- Veo el cálculo de mis ganancias por periodo
- Puedo filtrar por fechas o estados

## Épica: Funcionalidades del Administrador

### HU018 - Aprobar Tiendas
**Como** administrador  
**Quiero** revisar y aprobar solicitudes de tiendas  
**Para** mantener la calidad del servicio  

**Criterios de aceptación:**
- Veo lista de solicitudes pendientes con todos los datos
- Puedo aprobar o rechazar solicitudes con justificación
- Puedo suspender tiendas que incumplan políticas
- Los dueños reciben notificación del estado de su solicitud

### HU019 - Aprobar Repartidores
**Como** administrador  
**Quiero** revisar y aprobar solicitudes de repartidores  
**Para** asegurar personal confiable  

**Criterios de aceptación:**
- Reviso documentos, fotografía y datos del vehículo
- Puedo aprobar o rechazar con comentarios
- Puedo suspender repartidores por incumplimientos
- Los repartidores reciben notificación del resultado

### HU020 - Gestionar Clientes
**Como** administrador  
**Quiero** supervisar las cuentas de clientes  
**Para** mantener un ambiente seguro  

**Criterios de aceptación:**
- Accedo a información de todos los clientes registrados
- Veo historial de pedidos y actividad de cada cliente
- Puedo suspender cuentas por comportamiento inadecuado
- Mantengo registro de incidencias y valoraciones

### HU021 - Ver Estadísticas del Sistema
**Como** administrador  
**Quiero** consultar métricas generales de la plataforma  
**Para** tomar decisiones estratégicas  

**Criterios de aceptación:**
- Veo número de pedidos diarios y semanales
- Consulto ingresos totales por tienda y periodo
- Reviso productos más vendidos a nivel general
- Accedo a reportes de crecimiento y actividad de usuarios