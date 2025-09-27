
SET NAMES utf8mb4;
SET time_zone = '+00:00';
START TRANSACTION;

INSERT IGNORE INTO rol (codigo, nombre) VALUES
  ('ADMIN','Administrador'),
  ('CLIENTE','Cliente'),
  ('TIENDA','Tienda'),
  ('REPARTIDOR','Repartidor');

INSERT IGNORE INTO estado_aprobacion (id_estado_aprobacion, codigo, nombre) VALUES
  (1,'PENDING','Pendiente'),
  (2,'APPROVED','Aprobada'),
  (3,'REJECTED','Rechazada'),
  (4,'SUSPENDED','Suspendida');

INSERT IGNORE INTO estado_pedido (id_estado_pedido, codigo, nombre) VALUES
  (1,'PENDING','Pendiente'),
  (2,'PREPARING','En preparación'),
  (3,'READY','Listo para entrega'),
  (4,'ON_ROUTE','En camino'),
  (5,'DELIVERED','Entregado'),
  (6,'CANCELLED','Cancelado');

INSERT IGNORE INTO estado_entrega (id_estado_entrega, codigo, nombre) VALUES
  (1,'ASIGNADA','Asignada'),
  (2,'ACEPTADA','Aceptada'),
  (3,'EN_CAMINO','En camino'),
  (4,'ENTREGADA','Entregada'),
  (5,'CANCELADA','Cancelada');

INSERT IGNORE INTO categoria (nombre, slug, activo) VALUES
  ('Supermercado','supermercado',1),
  ('Farmacia','farmacia',1),
  ('Ferretería','ferreteria',1),
  ('Abarrotes','abarrotes',1),
  ('Lácteos','lacteos',1),
  ('Panadería','panaderia',1),
  ('Bebidas','bebidas',1),
  ('Medicamentos','medicamentos',1),
  ('Higiene','higiene',1),
  ('Herramientas','herramientas',1),
  ('Materiales','materiales',1);

SET @cat_super := (SELECT id_categoria FROM categoria WHERE slug='supermercado' LIMIT 1);
SET @cat_farma := (SELECT id_categoria FROM categoria WHERE slug='farmacia' LIMIT 1);
SET @cat_ferr  := (SELECT id_categoria FROM categoria WHERE slug='ferreteria' LIMIT 1);
SET @cat_abarr := (SELECT id_categoria FROM categoria WHERE slug='abarrotes' LIMIT 1);
SET @cat_lact  := (SELECT id_categoria FROM categoria WHERE slug='lacteos' LIMIT 1);
SET @cat_pana  := (SELECT id_categoria FROM categoria WHERE slug='panaderia' LIMIT 1);
SET @cat_bebi  := (SELECT id_categoria FROM categoria WHERE slug='bebidas' LIMIT 1);
SET @cat_meds  := (SELECT id_categoria FROM categoria WHERE slug='medicamentos' LIMIT 1);
SET @cat_hig   := (SELECT id_categoria FROM categoria WHERE slug='higiene' LIMIT 1);
SET @cat_herr  := (SELECT id_categoria FROM categoria WHERE slug='herramientas' LIMIT 1);
SET @cat_mat   := (SELECT id_categoria FROM categoria WHERE slug='materiales' LIMIT 1);

INSERT INTO tarifa_envio (ambito, tarifa_base_q, base_kg, extra_q_por_kg, activo)
SELECT 'GLOBAL', 12.00, 2.000, 3.00, 1
WHERE NOT EXISTS (
  SELECT 1 FROM tarifa_envio WHERE ambito='GLOBAL' AND activo=1
);

SET @pass := 'pbkdf2:sha256:260000$saltsalt$3b63e43705918a0d1b8af94776fc3141e5fae170e1569252d657a0b1c9e3ee1e';

INSERT INTO usuario (username, email, password_hash, nombres, apellidos, genero, telefono, activo)
VALUES ('admin', 'admin@miapp.gt', @pass, 'Admin', 'Principal', 'O', '2222-0000', 1);

INSERT IGNORE INTO usuario_rol (id_usuario, id_rol)
SELECT u.id_usuario, r.id_rol
FROM usuario u CROSS JOIN rol r
WHERE u.email='admin@miapp.gt' AND r.codigo='ADMIN';

INSERT INTO usuario (username, email, password_hash, nombres, apellidos, genero, telefono, activo)
VALUES
 ('ana.gt',   'ana.gt@example.com',   @pass, 'Ana',   'López', 'F', '2222-1001', 1),
 ('bruno.gt', 'bruno.gt@example.com', @pass, 'Bruno', 'Pérez', 'M', '2222-1002', 1),
 ('carla.gt', 'carla.gt@example.com', @pass, 'Carla', 'Gómez', 'F', '2222-1003', 1);

INSERT IGNORE INTO usuario_rol (id_usuario, id_rol)
SELECT u.id_usuario, r.id_rol
FROM usuario u CROSS JOIN rol r
WHERE u.email IN ('ana.gt@example.com','bruno.gt@example.com','carla.gt@example.com')
  AND r.codigo='CLIENTE';

INSERT INTO direccion (id_usuario, etiqueta, linea1, ciudad, pais, ubicacion)
VALUES
 ((SELECT id_usuario FROM usuario WHERE email='ana.gt@example.com'),
  'Casa', 'Avenida Reforma 12-34, Zona 10', 'Guatemala', 'GT', '14.604,-90.517'),
 ((SELECT id_usuario FROM usuario WHERE email='bruno.gt@example.com'),
  'Casa', 'Blvd. Los Próceres 18 calle 24-69, Zona 10', 'Guatemala', 'GT', '14.598,-90.511'),
 ((SELECT id_usuario FROM usuario WHERE email='carla.gt@example.com'),
  'Casa', 'Calzada Roosevelt 22-43, Zona 11', 'Guatemala', 'GT', '14.630,-90.563');

INSERT INTO perfil_cliente (id_usuario, id_direccion_defecto)
SELECT u.id_usuario, d.id_direccion
FROM usuario u
JOIN direccion d ON d.id_usuario=u.id_usuario AND d.etiqueta='Casa'
WHERE u.email IN ('ana.gt@example.com','bruno.gt@example.com','carla.gt@example.com');

INSERT INTO usuario (username, email, password_hash, nombres, apellidos, telefono, activo)
VALUES
 ('ltorre.owner', 'owner@latorre.example.com', @pass, 'Sofía', 'Martínez', '2333-2001', 1),
 ('galeno.owner', 'owner@galeno.example.com',  @pass, 'Mario', 'Ramírez',  '2333-2002', 1),
 ('epa.owner',    'owner@epa.example.com',     @pass, 'Elena', 'Ruiz',     '2333-2003', 1);

INSERT IGNORE INTO usuario_rol (id_usuario, id_rol)
SELECT u.id_usuario, r.id_rol
FROM usuario u CROSS JOIN rol r
WHERE u.email IN ('owner@latorre.example.com','owner@galeno.example.com','owner@epa.example.com')
  AND r.codigo='TIENDA';

INSERT INTO direccion (etiqueta, linea1, ciudad, pais)
VALUES
 ('Local', 'Avenida Reforma 13-10, Zona 9', 'Guatemala', 'GT'),
 ('Local', 'Blvd. Los Próceres 20-30, Zona 10', 'Guatemala', 'GT'),
 ('Local', 'Calzada Roosevelt 45-01, Zona 11', 'Guatemala', 'GT');

INSERT INTO tienda (id_usuario_duenio, razon_social, identificacion_legal, email, telefono, url_logo,
                    id_categoria, cuenta_bancaria, id_direccion, id_estado_aprobacion, aprobado_por,
                    aprobado_en, activo)
VALUES
 ((SELECT id_usuario FROM usuario WHERE email='owner@latorre.example.com'),
  'Supermercados La Torre (Demo)', '1234567-8', 'contacto@latorre.example.com', '2444-3001', NULL,
  @cat_super, 'CTA-GT-0001-00',
  (SELECT MIN(id_direccion) FROM direccion WHERE etiqueta='Local'),
  2, (SELECT id_usuario FROM usuario WHERE email='owner@latorre.example.com'), NOW(), 1),

 ((SELECT id_usuario FROM usuario WHERE email='owner@galeno.example.com'),
  'Farmacias Galeno (Demo)', '2345678-9', 'contacto@galeno.example.com', '2444-3002', NULL,
  @cat_farma, 'CTA-GT-0002-00',
  (SELECT MIN(id_direccion) FROM direccion WHERE etiqueta='Local')+1,
  2, (SELECT id_usuario FROM usuario WHERE email='owner@galeno.example.com'), NOW(), 1),

 ((SELECT id_usuario FROM usuario WHERE email='owner@epa.example.com'),
  'EPA Guatemala (Demo)', '3456789-0', 'contacto@epa.example.com', '2444-3003', NULL,
  @cat_ferr, 'CTA-GT-0003-00',
  (SELECT MIN(id_direccion) FROM direccion WHERE etiqueta='Local')+2,
  2, (SELECT id_usuario FROM usuario WHERE email='owner@epa.example.com'), NOW(), 1);


SET @tienda_latorre := (SELECT id_tienda FROM tienda WHERE razon_social='Supermercados La Torre (Demo)' LIMIT 1);
SET @tienda_galeno  := (SELECT id_tienda FROM tienda WHERE razon_social='Farmacias Galeno (Demo)' LIMIT 1);
SET @tienda_epa     := (SELECT id_tienda FROM tienda WHERE razon_social='EPA Guatemala (Demo)' LIMIT 1);

INSERT INTO producto (id_tienda, id_categoria, nombre, descripcion_corta, precio, peso_kg, sku, stock, umbral_bajo, es_oferta, es_nuevo, activo)
VALUES
 (@tienda_latorre, @cat_abarr, 'Incaparina 500 g',          'Mezcla fortificada',      22.00, 0.500, 'LTR-INC-500G', 120, 10, 0, 1, 1),
 (@tienda_latorre, @cat_abarr, 'Frijol negro 2 lb',         'Grano entero',            34.00, 0.907, 'LTR-FRI-2LB',  100, 10, 0, 0, 1),
 (@tienda_latorre, @cat_abarr, 'Arroz blanco 5 lb',         'Selección extra',         42.00, 2.268, 'LTR-ARR-5LB',  140, 12, 0, 0, 1),
 (@tienda_latorre, @cat_abarr, 'Azúcar morena 2 lb',        'Caña guatemalteca',       20.00, 0.907, 'LTR-AZU-2LB',  200, 15, 0, 0, 1),
 (@tienda_latorre, @cat_abarr, 'Café molido 500 g',         'Tueste medio',            55.00, 0.500, 'LTR-CAF-500G',  80,  8, 0, 0, 1),
 (@tienda_latorre, @cat_abarr, 'Harina de maíz 4 lb',       'Para tortillas',          36.00, 1.814, 'LTR-HAR-4LB',   90,  8, 0, 0, 1);

INSERT INTO producto (id_tienda, id_categoria, nombre, descripcion_corta, precio, peso_kg, sku, stock, umbral_bajo, es_oferta, es_nuevo, activo)
VALUES
 (@tienda_galeno, @cat_meds, 'Suero oral en polvo 400 g',   'Fórmula de rehidratación', 38.00, 0.400, 'GAL-SUE-400G', 120, 10, 0, 1, 1),
 (@tienda_galeno, @cat_hig,  'Alcohol antiséptico 1000 g',  '70% v/v',                 45.00, 1.000, 'GAL-ALC-1KG',   90,  8, 0, 0, 1),
 (@tienda_galeno, @cat_hig,  'Jabón líquido 1000 g',        'Antibacterial',           55.00, 1.000, 'GAL-JAB-1KG',   60,  6, 0, 0, 1),
 (@tienda_galeno, @cat_hig,  'Algodón 250 g',               'Uso médico',              22.00, 0.250, 'GAL-ALG-250G',  70,  8, 0, 0, 1),
 (@tienda_galeno, @cat_hig,  'Gel antibacterial 1000 g',    'Uso familiar',            65.00, 1.000, 'GAL-GEL-1KG',   70,  8, 0, 0, 1),
 (@tienda_galeno, @cat_meds, 'Vitamina C granel 2 lb',      'Presentación a granel',  120.00, 0.907, 'GAL-VIT-2LB',   40,  5, 0, 0, 1);

INSERT INTO producto (id_tienda, id_categoria, nombre, descripcion_corta, precio, peso_kg, sku, stock, umbral_bajo, es_oferta, es_nuevo, activo)
VALUES
 (@tienda_epa, @cat_mat,   'Cemento Progreso 94 lb',     'Saco de cemento',        88.00, 42.638, 'EPA-CEM-94LB', 100, 10, 0, 0, 1),
 (@tienda_epa, @cat_herr,  'Clavos para madera 2 lb',    'Calibre 2"',             56.00, 0.907,  'EPA-CLA-2LB',   80,  8, 0, 0, 1),
 (@tienda_epa, @cat_mat,   'Pintura vinílica 4 lb',      'Interior/exterior',     135.00, 1.814,  'EPA-PIN-4LB',   60,  6, 0, 0, 1),
 (@tienda_epa, @cat_herr,  'Llave inglesa 2 lb',         'Ajustable 10"',          78.00, 0.907,  'EPA-LLA-2LB',   70,  8, 0, 0, 1),
 (@tienda_epa, @cat_mat,   'Adhesivo para cerámica 4 lb','Alta adherencia',        98.00, 1.814,  'EPA-ADH-4LB',   50,  6, 0, 0, 1),
 (@tienda_epa, @cat_herr,  'Taladro percutor 6 lb',      '650W',                  455.00, 2.722,  'EPA-TAL-6LB',   30,  4, 0, 0, 1);

INSERT INTO usuario (username, email, password_hash, nombres, apellidos, telefono, activo)
VALUES
 ('ricardo.gt', 'ricardo@drivers.gt.example.com', @pass, 'Ricardo', 'Santos',    '2444-4001', 1),
 ('lucia.gt',   'lucia@drivers.gt.example.com',   @pass, 'Lucía',   'Hernández', '2444-4002', 1),
 ('jorge.gt',   'jorge@drivers.gt.example.com',   @pass, 'Jorge',   'Méndez',    '2444-4003', 1);

INSERT IGNORE INTO usuario_rol (id_usuario, id_rol)
SELECT u.id_usuario, r.id_rol
FROM usuario u CROSS JOIN rol r
WHERE u.email IN ('ricardo@drivers.gt.example.com','lucia@drivers.gt.example.com','jorge@drivers.gt.example.com')
  AND r.codigo='REPARTIDOR';

INSERT INTO perfil_repartidor
 (id_usuario, dpi, licencia_numero, licencia_tipo, vehiculo_tipo, placa, cuenta_bancaria, url_foto,
  id_estado_aprobacion, aprobado_por, aprobado_en, activo)
VALUES
 ((SELECT id_usuario FROM usuario WHERE email='ricardo@drivers.gt.example.com'),
  '3012345670101','A12345','AUTO','AUTO','P123ABC','CTA-DRI-001','https://picsum.photos/seed/ricardo-gt/200',
  2, (SELECT id_usuario FROM usuario WHERE email='owner@latorre.example.com'), NOW(), 1),

 ((SELECT id_usuario FROM usuario WHERE email='lucia@drivers.gt.example.com'),
  '3012345670102',NULL,'NO_APLICA','BICICLETA',NULL,'CTA-DRI-002','https://picsum.photos/seed/lucia-gt/200',
  2, (SELECT id_usuario FROM usuario WHERE email='owner@galeno.example.com'), NOW(), 1),

 ((SELECT id_usuario FROM usuario WHERE email='jorge@drivers.gt.example.com'),
  '3012345670103','B98765','MOTO','MOTO','M567XYZ','CTA-DRI-003','https://picsum.photos/seed/jorge-gt/200',
  2, (SELECT id_usuario FROM usuario WHERE email='owner@epa.example.com'), NOW(), 1);

COMMIT;

UPDATE tienda
SET url_logo = 'https://latorremx.vtexassets.com/assets/vtex/assets-builder/latorremx.store-theme/4.0.16/logo___266a0835296358f397047b66273cb197.svg'
WHERE id_tienda = @tienda_latorre;

UPDATE tienda
SET url_logo = 'https://www.farmaciasgaleno.com.gt/Image/Shared/SHR_HDR1.jpg'
WHERE id_tienda = @tienda_galeno;

UPDATE tienda
SET url_logo = 'https://www.epaenlinea.com/img/logo.png'
WHERE id_tienda = @tienda_epa;


UPDATE usuario SET url_foto='https://picsum.photos/seed/admin-gt/200' WHERE email='admin@miapp.gt';
UPDATE usuario SET url_foto='https://picsum.photos/seed/ana-gt/200'   WHERE email='ana.gt@example.com';
UPDATE usuario SET url_foto='https://picsum.photos/seed/bruno-gt/200' WHERE email='bruno.gt@example.com';
UPDATE usuario SET url_foto='https://picsum.photos/seed/carla-gt/200' WHERE email='carla.gt@example.com';


INSERT INTO imagen_producto (id_producto, url, principal, orden) VALUES
((SELECT id_producto FROM producto WHERE sku='LTR-INC-500G' LIMIT 1), 'https://picsum.photos/seed/LTR-INC-500G/600/600', 1, 1),
((SELECT id_producto FROM producto WHERE sku='LTR-FRI-2LB'  LIMIT 1), 'https://picsum.photos/seed/LTR-FRI-2LB/600/600',   1, 1),
((SELECT id_producto FROM producto WHERE sku='LTR-ARR-5LB'  LIMIT 1), 'https://picsum.photos/seed/LTR-ARR-5LB/600/600',   1, 1),
((SELECT id_producto FROM producto WHERE sku='LTR-AZU-2LB'  LIMIT 1), 'https://picsum.photos/seed/LTR-AZU-2LB/600/600',   1, 1),
((SELECT id_producto FROM producto WHERE sku='LTR-CAF-500G' LIMIT 1), 'https://picsum.photos/seed/LTR-CAF-500G/600/600',  1, 1),
((SELECT id_producto FROM producto WHERE sku='LTR-HAR-4LB'  LIMIT 1), 'https://picsum.photos/seed/LTR-HAR-4LB/600/600',   1, 1),

((SELECT id_producto FROM producto WHERE sku='GAL-SUE-400G' LIMIT 1), 'https://picsum.photos/seed/GAL-SUE-400G/600/600',  1, 1),
((SELECT id_producto FROM producto WHERE sku='GAL-ALC-1KG'  LIMIT 1), 'https://picsum.photos/seed/GAL-ALC-1KG/600/600',   1, 1),
((SELECT id_producto FROM producto WHERE sku='GAL-JAB-1KG'  LIMIT 1), 'https://picsum.photos/seed/GAL-JAB-1KG/600/600',   1, 1),
((SELECT id_producto FROM producto WHERE sku='GAL-ALG-250G' LIMIT 1), 'https://picsum.photos/seed/GAL-ALG-250G/600/600',  1, 1),
((SELECT id_producto FROM producto WHERE sku='GAL-GEL-1KG'  LIMIT 1), 'https://picsum.photos/seed/GAL-GEL-1KG/600/600',   1, 1),
((SELECT id_producto FROM producto WHERE sku='GAL-VIT-2LB'  LIMIT 1), 'https://picsum.photos/seed/GAL-VIT-2LB/600/600',   1, 1),

((SELECT id_producto FROM producto WHERE sku='EPA-CEM-94LB' LIMIT 1), 'https://picsum.photos/seed/EPA-CEM-94LB/600/600',  1, 1),
((SELECT id_producto FROM producto WHERE sku='EPA-CLA-2LB'  LIMIT 1), 'https://picsum.photos/seed/EPA-CLA-2LB/600/600',   1, 1),
((SELECT id_producto FROM producto WHERE sku='EPA-PIN-4LB'  LIMIT 1), 'https://picsum.photos/seed/EPA-PIN-4LB/600/600',   1, 1),
((SELECT id_producto FROM producto WHERE sku='EPA-LLA-2LB'  LIMIT 1), 'https://picsum.photos/seed/EPA-LLA-2LB/600/600',   1, 1),
((SELECT id_producto FROM producto WHERE sku='EPA-ADH-4LB'  LIMIT 1), 'https://picsum.photos/seed/EPA-ADH-4LB/600/600',   1, 1),
((SELECT id_producto FROM producto WHERE sku='EPA-TAL-6LB'  LIMIT 1), 'https://picsum.photos/seed/EPA-TAL-6LB/600/600',   1, 1);
