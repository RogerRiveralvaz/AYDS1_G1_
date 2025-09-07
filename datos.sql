-- ===============================
-- Carga de datos base (semillas)
-- ===============================
SET NAMES utf8mb4;
SET time_zone = '+00:00';
START TRANSACTION;

-- Roles (idempotente)
INSERT IGNORE INTO rol (codigo, nombre) VALUES
  ('ADMIN','Administrador'),
  ('CLIENTE','Cliente'),
  ('TIENDA','Tienda'),
  ('REPARTIDOR','Repartidor');

-- Estados de aprobación (idempotente)
INSERT IGNORE INTO estado_aprobacion (id_estado_aprobacion, codigo, nombre) VALUES
  (1,'PENDING','Pendiente'),
  (2,'APPROVED','Aprobada'),
  (3,'REJECTED','Rechazada'),
  (4,'SUSPENDED','Suspendida');

-- Estados de pedido (idempotente)
INSERT IGNORE INTO estado_pedido (id_estado_pedido, codigo, nombre) VALUES
  (1,'PENDING','Pendiente'),
  (2,'PREPARING','En preparación'),
  (3,'READY','Listo para entrega'),
  (4,'ON_ROUTE','En camino'),
  (5,'DELIVERED','Entregado'),
  (6,'CANCELLED','Cancelado');

-- Estados de entrega (idempotente)
INSERT IGNORE INTO estado_entrega (id_estado_entrega, codigo, nombre) VALUES
  (1,'ASSIGNED','Asignada'),
  (2,'ACCEPTED','Aceptada'),
  (3,'PICKED_UP','Recogida'),
  (4,'ON_ROUTE','En camino'),
  (5,'DELIVERED','Entregada'),
  (6,'CANCELLED','Cancelada');

-- Categorías (producto/tienda) simples
INSERT IGNORE INTO categoria (nombre, slug, activo) VALUES
  ('Supermercado','supermercado',1),
  ('Farmacia','farmacia',1),
  ('Ferretería','ferreteria',1),
  ('Lácteos','lacteos',1),
  ('Panadería','panaderia',1),
  ('Bebidas','bebidas',1),
  ('Medicamentos','medicamentos',1),
  ('Higiene','higiene',1),
  ('Herramientas','herramientas',1),
  ('Materiales','materiales',1);

-- Cachear ids de categorías principales
SET @cat_super  := (SELECT id_categoria FROM categoria WHERE slug='supermercado' LIMIT 1);
SET @cat_farma  := (SELECT id_categoria FROM categoria WHERE slug='farmacia' LIMIT 1);
SET @cat_ferr   := (SELECT id_categoria FROM categoria WHERE slug='ferreteria' LIMIT 1);
SET @cat_lact   := (SELECT id_categoria FROM categoria WHERE slug='lacteos' LIMIT 1);
SET @cat_pana   := (SELECT id_categoria FROM categoria WHERE slug='panaderia' LIMIT 1);
SET @cat_bebi   := (SELECT id_categoria FROM categoria WHERE slug='bebidas' LIMIT 1);
SET @cat_meds   := (SELECT id_categoria FROM categoria WHERE slug='medicamentos' LIMIT 1);
SET @cat_hig    := (SELECT id_categoria FROM categoria WHERE slug='higiene' LIMIT 1);
SET @cat_herr   := (SELECT id_categoria FROM categoria WHERE slug='herramientas' LIMIT 1);
SET @cat_mat    := (SELECT id_categoria FROM categoria WHERE slug='materiales' LIMIT 1);

-- Tarifa de envío global (si no existe)
INSERT INTO tarifa_envio (ambito, tarifa_base_q, base_kg, extra_q_por_kg, activo)
SELECT 'GLOBAL', 5.00, 2.000, 2.00, 1
WHERE NOT EXISTS (
  SELECT 1 FROM tarifa_envio WHERE ambito='GLOBAL' AND activo=1
);

-- ===============================
-- Clientes (3) + direcciones
-- Password hash = "123456" (PBKDF2)
-- ===============================
SET @pass := 'pbkdf2:sha256:260000$saltsalt$3b63e43705918a0d1b8af94776fc3141e5fae170e1569252d657a0b1c9e3ee1e';

INSERT INTO usuario (username, email, password_hash, nombres, apellidos, genero, telefono, activo)
VALUES
 ('ana',   'ana@example.com',   @pass, 'Ana',   'López', 'F', '555-1001', 1),
 ('bruno', 'bruno@example.com', @pass, 'Bruno', 'Pérez', 'M', '555-1002', 1),
 ('carla', 'carla@example.com', @pass, 'Carla', 'Gómez', 'F', '555-1003', 1);

-- Roles clientes
INSERT IGNORE INTO usuario_rol (id_usuario, id_rol)
SELECT u.id_usuario, r.id_rol
FROM usuario u CROSS JOIN rol r
WHERE u.email IN ('ana@example.com','bruno@example.com','carla@example.com')
  AND r.codigo='CLIENTE';

-- Direcciones clientes
INSERT INTO direccion (id_usuario, etiqueta, linea1, ciudad, pais, ubicacion)
VALUES
 ((SELECT id_usuario FROM usuario WHERE email='ana@example.com'),   'Casa', 'Av. Reforma 123', 'Guatemala', 'GT', '14.634915,-90.506882'),
 ((SELECT id_usuario FROM usuario WHERE email='bruno@example.com'), 'Casa', '5a Calle 10-55',  'Guatemala', 'GT', '14.610000,-90.520000'),
 ((SELECT id_usuario FROM usuario WHERE email='carla@example.com'), 'Casa', 'Zona 10 Torre A', 'Guatemala', 'GT', '14.598000,-90.515000');


-- Perfil cliente con dirección por defecto
INSERT INTO perfil_cliente (id_usuario, id_direccion_defecto)
SELECT u.id_usuario, d.id_direccion
FROM usuario u
JOIN direccion d ON d.id_usuario=u.id_usuario AND d.etiqueta='Casa'
WHERE u.email IN ('ana@example.com','bruno@example.com','carla@example.com');

-- ===============================
-- Tiendas (3) + dueños + direcciones
-- ===============================
-- Dueños (usuarios con rol TIENDA)
INSERT INTO usuario (username, email, password_hash, nombres, apellidos, telefono, activo)
VALUES
 ('sofia', 'sofia@super.example.com', @pass, 'Sofía', 'Martínez', '555-2001', 1),
 ('mario', 'mario@farma.example.com', @pass, 'Mario', 'Ramírez', '555-2002', 1),
 ('elena', 'elena@ferre.example.com', @pass, 'Elena', 'Ruiz',    '555-2003', 1);

INSERT IGNORE INTO usuario_rol (id_usuario, id_rol)
SELECT u.id_usuario, r.id_rol FROM usuario u CROSS JOIN rol r
WHERE u.email IN ('sofia@super.example.com','mario@farma.example.com','elena@ferre.example.com')
  AND r.codigo='TIENDA';

-- Direcciones de tiendas (sin usuario si así lo prefieres)
INSERT INTO direccion (etiqueta, linea1, ciudad, pais)
VALUES
 ('Local', 'Calzada Roosevelt 45-01', 'Guatemala', 'GT'),
 ('Local', 'Blvd. Liberación 18-00',  'Guatemala', 'GT'),
 ('Local', 'Calz. San Juan 12-34',    'Guatemala', 'GT');

-- Crear tiendas (aprobadas)
INSERT INTO tienda (id_usuario_duenio, razon_social, identificacion_legal, email, telefono, url_logo,
                    id_categoria, cuenta_bancaria, id_direccion, id_estado_aprobacion, aprobado_por,
                    aprobado_en, activo)
VALUES
 ((SELECT id_usuario FROM usuario WHERE email='sofia@super.example.com'),
  'Super La Central', '1234567-8', 'contacto@supercentral.com', '555-3001', NULL,
  @cat_super, 'CTA-0001-00', (SELECT MIN(id_direccion) FROM direccion WHERE etiqueta='Local'),
  2, (SELECT id_usuario FROM usuario WHERE email='sofia@super.example.com'), NOW(), 1),

 ((SELECT id_usuario FROM usuario WHERE email='mario@farma.example.com'),
  'Farma Salud Total', '2345678-9', 'contacto@farmasalud.com', '555-3002', NULL,
  @cat_farma, 'CTA-0002-00', (SELECT MIN(id_direccion) FROM direccion WHERE etiqueta='Local')+1,
  2, (SELECT id_usuario FROM usuario WHERE email='mario@farma.example.com'), NOW(), 1),

 ((SELECT id_usuario FROM usuario WHERE email='elena@ferre.example.com'),
  'Ferretería El Martillo', '3456789-0', 'contacto@elmartillo.com', '555-3003', NULL,
  @cat_ferr, 'CTA-0003-00', (SELECT MIN(id_direccion) FROM direccion WHERE etiqueta='Local')+2,
  2, (SELECT id_usuario FROM usuario WHERE email='elena@ferre.example.com'), NOW(), 1);

-- IDs de tiendas para referencia
SET @tienda_super := (SELECT id_tienda FROM tienda WHERE razon_social='Super La Central' LIMIT 1);
SET @tienda_farma := (SELECT id_tienda FROM tienda WHERE razon_social='Farma Salud Total' LIMIT 1);
SET @tienda_ferr  := (SELECT id_tienda FROM tienda WHERE razon_social='Ferretería El Martillo' LIMIT 1);

-- ===============================
-- Productos (6 por tienda) con peso PAR (2, 4, 6 kg)
-- ===============================
-- Supermercado
INSERT INTO producto (id_tienda, id_categoria, nombre, descripcion_corta, precio, peso_kg, sku, stock, umbral_bajo, es_oferta, es_nuevo, activo)
VALUES
 (@tienda_super, @cat_lact, 'Leche Entera 6L',  'Pack 6L',          48.00, 6.000, 'SUP-LEC-001', 100, 10, 0, 1, 1),
 (@tienda_super, @cat_pana, 'Pan Integral 4U',  'Paquete 4 unidades',18.00, 4.000, 'SUP-PAN-002', 100, 10, 0, 0, 1),
 (@tienda_super, @cat_bebi, 'Agua 2L',          'Botella 2 litros',  9.00,  2.000, 'SUP-AGU-003', 120, 10, 0, 0, 1),
 (@tienda_super, @cat_lact, 'Queso Semi 2kg',   'Bloque 2kg',        95.00, 2.000, 'SUP-QUE-004', 50,  8,  0, 0, 1),
 (@tienda_super, @cat_bebi, 'Jugo Naranja 4L',  'Pack 4L',           60.00, 4.000, 'SUP-JUG-005', 70,  10, 0, 0, 1),
 (@tienda_super, @cat_pana, 'Harina 6kg',       'Harina de trigo',   72.00, 6.000, 'SUP-HAR-006', 80,  10, 0, 0, 1);

-- Farmacia
INSERT INTO producto (id_tienda, id_categoria, nombre, descripcion_corta, precio, peso_kg, sku, stock, umbral_bajo, es_oferta, es_nuevo, activo)
VALUES
 (@tienda_farma, @cat_meds, 'Analgesico 2kg',     'Presentación grande',   120.00, 2.000, 'FAR-ANA-001', 60,  5, 0, 1, 1),
 (@tienda_farma, @cat_hig,  'Shampoo 4kg',        'Bidón 4kg',              95.00,  4.000, 'FAR-SHA-002', 80,  8, 0, 0, 1),
 (@tienda_farma, @cat_hig,  'Jabón Líquido 6kg',  'Bidón 6kg',              110.00, 6.000, 'FAR-JAB-003', 50,  6, 0, 0, 1),
 (@tienda_farma, @cat_meds, 'Suero Oral 2kg',     'Botella 2kg',            40.00,  2.000, 'FAR-SUE-004', 100, 10,0, 0, 1),
 (@tienda_farma, @cat_hig,  'Alcohol 4kg',        '4kg 70%',                70.00,  4.000, 'FAR-ALC-005', 90,  8, 0, 0, 1),
 (@tienda_farma, @cat_meds, 'Vitamina C 6kg',     'Balde 6kg',              180.00, 6.000, 'FAR-VIT-006', 40,  5, 0, 0, 1);

-- Ferretería
INSERT INTO producto (id_tienda, id_categoria, nombre, descripcion_corta, precio, peso_kg, sku, stock, umbral_bajo, es_oferta, es_nuevo, activo)
VALUES
 (@tienda_ferr, @cat_herr, 'Cemento 50kg',      'Saco 50kg',         85.00,  6.000, 'FER-CEM-001', 100, 10, 0, 0, 1),
 (@tienda_ferr, @cat_herr, 'Martillo 2kg',      'Mango fibra',       55.00,  2.000, 'FER-MAR-002', 80,  8,  0, 0, 1),
 (@tienda_ferr, @cat_mat,  'Pintura 4kg',       'Lata 4kg',          130.00, 4.000, 'FER-PIN-003', 60,  6,  0, 0, 1),
 (@tienda_ferr, @cat_herr, 'Llave Inglesa 2kg', 'Ajustable 10"',     75.00,  2.000, 'FER-LLA-004', 70,  8,  0, 0, 1),
 (@tienda_ferr, @cat_mat,  'Adhesivo 4kg',      'Pegamento obra',    95.00,  4.000, 'FER-ADH-005', 50,  6,  0, 0, 1),
 (@tienda_ferr, @cat_herr, 'Taladro 6kg',       '650W',              450.00, 6.000, 'FER-TAL-006', 30,  4,  0, 0, 1);

-- ===============================
-- Repartidores (3) + perfiles
-- ===============================
INSERT INTO usuario (username, email, password_hash, nombres, apellidos, telefono, activo)
VALUES
 ('ricardo', 'ricardo@drivers.example.com', @pass, 'Ricardo', 'Santos', '555-4001', 1),
 ('lucia',   'lucia@drivers.example.com',   @pass, 'Lucía',   'Hernández','555-4002', 1),
 ('jorge',   'jorge@drivers.example.com',   @pass, 'Jorge',   'Méndez',  '555-4003', 1);

INSERT IGNORE INTO usuario_rol (id_usuario, id_rol)
SELECT u.id_usuario, r.id_rol FROM usuario u CROSS JOIN rol r
WHERE u.email IN ('ricardo@drivers.example.com','lucia@drivers.example.com','jorge@drivers.example.com')
  AND r.codigo='REPARTIDOR';

-- Perfiles de repartidor (aprobados)
INSERT INTO perfil_repartidor
 (id_usuario, dpi, licencia_numero, licencia_tipo, vehiculo_tipo, placa, cuenta_bancaria, url_foto,
  id_estado_aprobacion, aprobado_por, aprobado_en, activo)
VALUES
 ((SELECT id_usuario FROM usuario WHERE email='ricardo@drivers.example.com'),
  '3012345670101','A12345','AUTO','AUTO','P123ABC','CTA-DRI-001','https://picsum.photos/seed/ricardo/200',
  2, (SELECT id_usuario FROM usuario WHERE email='sofia@super.example.com'), NOW(), 1),

 ((SELECT id_usuario FROM usuario WHERE email='lucia@drivers.example.com'),
  '3012345670102',NULL,'NO_APLICA','BICICLETA',NULL,'CTA-DRI-002','https://picsum.photos/seed/lucia/200',
  2, (SELECT id_usuario FROM usuario WHERE email='mario@farma.example.com'), NOW(), 1),

 ((SELECT id_usuario FROM usuario WHERE email='jorge@drivers.example.com'),
  '3012345670103','B98765','MOTO','MOTO','M567XYZ','CTA-DRI-003','https://picsum.photos/seed/jorge/200',
  2, (SELECT id_usuario FROM usuario WHERE email='elena@ferre.example.com'), NOW(), 1);

COMMIT;
