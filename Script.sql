CREATE DATABASE entregas_db;
USE entregas_db;
-- Tabla: roles
CREATE TABLE rol (
  id_rol BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  codigo VARCHAR(32) NOT NULL UNIQUE,
  nombre VARCHAR(64) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla: estados de aprobación
CREATE TABLE estado_aprobacion (
  id_estado_aprobacion TINYINT UNSIGNED PRIMARY KEY,
  codigo VARCHAR(24) NOT NULL UNIQUE,
  nombre VARCHAR(64) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla: estados de pedido
CREATE TABLE estado_pedido (
  id_estado_pedido TINYINT UNSIGNED PRIMARY KEY,
  codigo VARCHAR(24) NOT NULL UNIQUE,
  nombre VARCHAR(64) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla: estados de entrega
CREATE TABLE estado_entrega (
  id_estado_entrega TINYINT UNSIGNED PRIMARY KEY,
  codigo VARCHAR(24) NOT NULL UNIQUE,
  nombre VARCHAR(64) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla: categorías
CREATE TABLE categoria (
  id_categoria BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  id_categoria_padre BIGINT UNSIGNED NULL,
  nombre VARCHAR(100) NOT NULL,
  slug VARCHAR(120) NOT NULL UNIQUE,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  CONSTRAINT fk_categoria_padre FOREIGN KEY (id_categoria_padre) REFERENCES categoria(id_categoria) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla: usuarios
CREATE TABLE usuario (
  id_usuario BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(160) NULL UNIQUE,
  email VARCHAR(160) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  nombres VARCHAR(80) NOT NULL,
  apellidos VARCHAR(80) NOT NULL,
  genero ENUM('M','F','O') NULL,
  telefono VARCHAR(32) NULL,
  fecha_nacimiento DATE NULL,
  url_foto VARCHAR(255) NULL,
  activo TINYINT(1) NOT NULL DEFAULT 0,
  creado_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  actualizado_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla: usuario_rol
CREATE TABLE usuario_rol (
  id_usuario BIGINT UNSIGNED NOT NULL,
  id_rol BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (id_usuario, id_rol),
  CONSTRAINT fk_ur_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE CASCADE,
  CONSTRAINT fk_ur_rol FOREIGN KEY (id_rol) REFERENCES rol(id_rol) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla: verificaciones de correo
CREATE TABLE verificacion_correo (
  id_verificacion BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  id_usuario BIGINT UNSIGNED NOT NULL,
  codigo VARCHAR(10) NOT NULL,
  expira_en DATETIME(3) NOT NULL,
  consumido_en DATETIME(3) NULL,
  creado_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_verif_usuario_activa (id_usuario, consumido_en),
  CONSTRAINT fk_verif_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla: tokens revocados
CREATE TABLE token_revocado (
  jti CHAR(36) PRIMARY KEY,
  id_usuario BIGINT UNSIGNED NOT NULL,
  expira_en DATETIME(3) NOT NULL,
  revocado_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_trev_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla: direcciones
CREATE TABLE direccion (
  id_direccion BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  id_usuario BIGINT UNSIGNED NULL,
  etiqueta VARCHAR(80) NULL,
  linea1 VARCHAR(160) NOT NULL,
  linea2 VARCHAR(160) NULL,
  ciudad VARCHAR(80) NOT NULL,
  estado VARCHAR(80) NULL,
  codigo_postal VARCHAR(20) NULL,
  pais CHAR(2) NOT NULL DEFAULT 'GT',
  ubicacion POINT SRID 4326 NULL,
  creado_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_dir_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;



-- Tabla: perfiles de cliente
CREATE TABLE perfil_cliente (
  id_usuario BIGINT UNSIGNED PRIMARY KEY,
  id_direccion_defecto BIGINT UNSIGNED NULL,
  CONSTRAINT fk_pc_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE CASCADE,
  CONSTRAINT fk_pc_dir_defecto FOREIGN KEY (id_direccion_defecto) REFERENCES direccion(id_direccion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla: perfiles de repartidor
CREATE TABLE perfil_repartidor (
  id_usuario BIGINT UNSIGNED PRIMARY KEY,
  dpi VARCHAR(32) NOT NULL,
  licencia_numero VARCHAR(32) NULL,
  licencia_tipo ENUM('MOTO','AUTO','NO_APLICA') NULL,
  vehiculo_tipo ENUM('BICICLETA','MOTO','AUTO') NOT NULL,
  placa VARCHAR(16) NULL,
  cuenta_bancaria VARCHAR(64) NOT NULL,
  url_foto VARCHAR(255) NOT NULL,
  id_estado_aprobacion TINYINT UNSIGNED NOT NULL,
  aprobado_por BIGINT UNSIGNED NULL,
  aprobado_en DATETIME(3) NULL,
  activo TINYINT(1) NOT NULL DEFAULT 0,
  CONSTRAINT fk_pr_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE CASCADE,
  CONSTRAINT fk_pr_estado FOREIGN KEY (id_estado_aprobacion) REFERENCES estado_aprobacion(id_estado_aprobacion),
  CONSTRAINT fk_pr_aprobado_por FOREIGN KEY (aprobado_por) REFERENCES usuario(id_usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla: tiendas
CREATE TABLE tienda (
  id_tienda BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  id_usuario_duenio BIGINT UNSIGNED NOT NULL,
  razon_social VARCHAR(160) NOT NULL,
  identificacion_legal VARCHAR(32) NULL,
  email VARCHAR(160) NOT NULL,
  telefono VARCHAR(32) NOT NULL,
  url_logo VARCHAR(255) NULL,
  id_categoria BIGINT UNSIGNED NULL,
  cuenta_bancaria VARCHAR(64) NOT NULL,
  id_direccion BIGINT UNSIGNED NULL,
  id_estado_aprobacion TINYINT UNSIGNED NOT NULL,
  aprobado_por BIGINT UNSIGNED NULL,
  aprobado_en DATETIME(3) NULL,
  activo TINYINT(1) NOT NULL DEFAULT 0,
  creado_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  actualizado_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_tienda_duenio FOREIGN KEY (id_usuario_duenio) REFERENCES usuario(id_usuario) ON DELETE RESTRICT,
  CONSTRAINT fk_tienda_cat FOREIGN KEY (id_categoria) REFERENCES categoria(id_categoria),
  CONSTRAINT fk_tienda_dir FOREIGN KEY (id_direccion) REFERENCES direccion(id_direccion),
  CONSTRAINT fk_tienda_estado FOREIGN KEY (id_estado_aprobacion) REFERENCES estado_aprobacion(id_estado_aprobacion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla: horarios de tienda
CREATE TABLE horario_tienda (
  id_horario_tienda BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  id_tienda BIGINT UNSIGNED NOT NULL,
  dia_semana TINYINT UNSIGNED NOT NULL,
  hora_apertura TIME NULL,
  hora_cierre TIME NULL,
  cerrado TINYINT(1) NOT NULL DEFAULT 0,
  UNIQUE KEY uq_tienda_dia (id_tienda, dia_semana),
  CONSTRAINT chk_dia_semana CHECK (dia_semana BETWEEN 0 AND 6),
  CONSTRAINT fk_ht_tienda FOREIGN KEY (id_tienda) REFERENCES tienda(id_tienda) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla: productos
CREATE TABLE producto (
  id_producto BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  id_tienda BIGINT UNSIGNED NOT NULL,
  id_categoria BIGINT UNSIGNED NULL,
  nombre VARCHAR(160) NOT NULL,
  descripcion_corta VARCHAR(300) NULL,
  precio DECIMAL(10,2) NOT NULL,
  peso_kg DECIMAL(8,3) NOT NULL,
  sku VARCHAR(64) NULL,
  stock INT UNSIGNED NOT NULL DEFAULT 0,
  umbral_bajo INT UNSIGNED NOT NULL DEFAULT 5,
  es_oferta TINYINT(1) NOT NULL DEFAULT 0,
  es_nuevo TINYINT(1) NOT NULL DEFAULT 0,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  creado_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  actualizado_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  FULLTEXT KEY ft_producto (nombre, descripcion_corta),
  CONSTRAINT chk_precio CHECK (precio >= 0),
  CONSTRAINT chk_peso CHECK (peso_kg >= 0),
  CONSTRAINT fk_prod_tienda FOREIGN KEY (id_tienda) REFERENCES tienda(id_tienda) ON DELETE CASCADE,
  CONSTRAINT fk_prod_cat FOREIGN KEY (id_categoria) REFERENCES categoria(id_categoria)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla: imágenes de producto
CREATE TABLE imagen_producto (
  id_imagen_producto BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  id_producto BIGINT UNSIGNED NOT NULL,
  url VARCHAR(255) NOT NULL,
  principal TINYINT(1) NOT NULL DEFAULT 0,
  orden INT NOT NULL DEFAULT 0,
  CONSTRAINT fk_iprod_producto FOREIGN KEY (id_producto) REFERENCES producto(id_producto) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla: alertas de stock
CREATE TABLE alerta_stock (
  id_alerta_stock BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  id_producto BIGINT UNSIGNED NOT NULL,
  stock_momento INT UNSIGNED NOT NULL,
  creado_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_astock_producto FOREIGN KEY (id_producto) REFERENCES producto(id_producto) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla: tarifas de envío
CREATE TABLE tarifa_envio (
  id_tarifa_envio BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  ambito ENUM('GLOBAL','TIENDA') NOT NULL DEFAULT 'GLOBAL',
  id_tienda BIGINT UNSIGNED NULL,
  tarifa_base_q DECIMAL(10,2) NOT NULL,
  base_kg DECIMAL(8,3) NOT NULL,
  extra_q_por_kg DECIMAL(10,2) NOT NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  creado_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_tenvio_tienda FOREIGN KEY (id_tienda) REFERENCES tienda(id_tienda) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla: carritos
CREATE TABLE carrito (
  id_carrito BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  id_usuario BIGINT UNSIGNED NOT NULL UNIQUE,
  actualizado_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_car_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla: ítems de carrito
CREATE TABLE item_carrito (
  id_item_carrito BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  id_carrito BIGINT UNSIGNED NOT NULL,
  id_producto BIGINT UNSIGNED NOT NULL,
  cantidad INT UNSIGNED NOT NULL,
  UNIQUE KEY uq_carrito_producto (id_carrito, id_producto),
  CONSTRAINT chk_cantidad_ic CHECK (cantidad > 0),
  CONSTRAINT fk_ic_carrito FOREIGN KEY (id_carrito) REFERENCES carrito(id_carrito) ON DELETE CASCADE,
  CONSTRAINT fk_ic_producto FOREIGN KEY (id_producto) REFERENCES producto(id_producto) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla: pedidos
CREATE TABLE pedido (
  id_pedido BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  id_cliente BIGINT UNSIGNED NOT NULL,
  id_tienda BIGINT UNSIGNED NOT NULL,
  id_direccion_entrega BIGINT UNSIGNED NOT NULL,
  id_estado_pedido TINYINT UNSIGNED NOT NULL,
  subtotal_q DECIMAL(12,2) NOT NULL,
  envio_q DECIMAL(12,2) NOT NULL,
  total_q DECIMAL(12,2) NOT NULL,
  peso_total_kg DECIMAL(10,3) NOT NULL DEFAULT 0,
  notas VARCHAR(300) NULL,
  creado_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  confirmado_en DATETIME(3) NULL,
  CONSTRAINT chk_subtotal CHECK (subtotal_q >= 0),
  CONSTRAINT chk_envio CHECK (envio_q >= 0),
  CONSTRAINT chk_total CHECK (total_q >= 0),
  CONSTRAINT fk_ped_cliente FOREIGN KEY (id_cliente) REFERENCES usuario(id_usuario) ON DELETE RESTRICT,
  CONSTRAINT fk_ped_tienda FOREIGN KEY (id_tienda) REFERENCES tienda(id_tienda) ON DELETE RESTRICT,
  CONSTRAINT fk_ped_dir FOREIGN KEY (id_direccion_entrega) REFERENCES direccion(id_direccion) ON DELETE RESTRICT,
  CONSTRAINT fk_ped_estado FOREIGN KEY (id_estado_pedido) REFERENCES estado_pedido(id_estado_pedido)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla: ítems de pedido
CREATE TABLE item_pedido (
  id_item_pedido BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  id_pedido BIGINT UNSIGNED NOT NULL,
  id_producto BIGINT UNSIGNED NOT NULL,
  nombre_producto VARCHAR(160) NOT NULL,
  precio_unit_q DECIMAL(10,2) NOT NULL,
  peso_unit_kg DECIMAL(8,3) NOT NULL,
  cantidad INT UNSIGNED NOT NULL,
  total_linea_q DECIMAL(12,2) NOT NULL,
  CONSTRAINT chk_cantidad_ip CHECK (cantidad > 0),
  CONSTRAINT fk_ip_pedido FOREIGN KEY (id_pedido) REFERENCES pedido(id_pedido) ON DELETE CASCADE,
  CONSTRAINT fk_ip_producto FOREIGN KEY (id_producto) REFERENCES producto(id_producto) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla: historial de estados de pedido
CREATE TABLE historial_estado_pedido (
  id_historial BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  id_pedido BIGINT UNSIGNED NOT NULL,
  id_estado_pedido TINYINT UNSIGNED NOT NULL,
  cambiado_por BIGINT UNSIGNED NULL,
  nota VARCHAR(200) NULL,
  cambiado_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_hep_pedido FOREIGN KEY (id_pedido) REFERENCES pedido(id_pedido) ON DELETE CASCADE,
  CONSTRAINT fk_hep_estado FOREIGN KEY (id_estado_pedido) REFERENCES estado_pedido(id_estado_pedido),
  CONSTRAINT fk_hep_usuario FOREIGN KEY (cambiado_por) REFERENCES usuario(id_usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla: entregas
CREATE TABLE entrega (
  id_entrega BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  id_pedido BIGINT UNSIGNED NOT NULL UNIQUE,
  id_repartidor BIGINT UNSIGNED NOT NULL,
  id_estado_entrega TINYINT UNSIGNED NOT NULL,
  asignada_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  aceptada_en DATETIME(3) NULL,
  recogida_en DATETIME(3) NULL,
  entregada_en DATETIME(3) NULL,
  distancia_km DECIMAL(8,2) NULL,
  pago_repartidor_q DECIMAL(10,2) NULL,
  CONSTRAINT fk_ent_pedido FOREIGN KEY (id_pedido) REFERENCES pedido(id_pedido) ON DELETE CASCADE,
  CONSTRAINT fk_ent_repartidor FOREIGN KEY (id_repartidor) REFERENCES usuario(id_usuario) ON DELETE RESTRICT,
  CONSTRAINT fk_ent_estado FOREIGN KEY (id_estado_entrega) REFERENCES estado_entrega(id_estado_entrega)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla: seguimiento de entregas
CREATE TABLE seguimiento_entrega (
  id_seguimiento BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  id_entrega BIGINT UNSIGNED NOT NULL,
  id_repartidor BIGINT UNSIGNED NOT NULL,
  ubicacion POINT SRID 4326 NOT NULL,
  registrado_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  nota_estado VARCHAR(160) NULL,
  CONSTRAINT fk_seg_entrega FOREIGN KEY (id_entrega) REFERENCES entrega(id_entrega) ON DELETE CASCADE,
  CONSTRAINT fk_seg_repartidor FOREIGN KEY (id_repartidor) REFERENCES usuario(id_usuario),
  SPATIAL INDEX idx_seg_ubicacion (ubicacion),
  INDEX idx_seg_registrado (registrado_en)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla: pagos
CREATE TABLE pago (
  id_pago BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  id_pedido BIGINT UNSIGNED NOT NULL,
  monto_q DECIMAL(12,2) NOT NULL,
  moneda CHAR(3) NOT NULL DEFAULT 'GTQ',
  metodo VARCHAR(40) NOT NULL,
  estado VARCHAR(24) NOT NULL,
  proveedor VARCHAR(40) NULL,
  referencia_proveedor VARCHAR(80) NULL,
  pagado_en DATETIME(3) NULL,
  creado_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT chk_monto_pago CHECK (monto_q >= 0),
  CONSTRAINT fk_pago_pedido FOREIGN KEY (id_pedido) REFERENCES pedido(id_pedido) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
