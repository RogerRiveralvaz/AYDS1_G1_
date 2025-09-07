import pytest
from decimal import Decimal

from app.extensions import db
from app.models import (
    Direccion,
    EstadoPedido,
    PerfilRepartidor,
    Pedido,
    Producto,
    TarifaAmbitoEnum,
    TarifaEnvio,
    Tienda,
    Usuario,
    UsuarioRol,
    VehiculoTipoEnum,
)
from app.services import ServiceError
from app.services.admin_service import AdminService
from app.services.auth_service import AuthService
from app.services.carrito_service import CarritoService
from app.services.entrega_service import EntregaService
from app.services.pedido_service import PedidoService
from app.utils.security import hash_password


def _crear_usuario(email: str, rol_codigo: str, activo: bool = True) -> Usuario:
    usuario = Usuario(
        email=email,
        password_hash=hash_password("TestPass123!"),
        nombres="Nombre",
        apellidos="Apellido",
        activo=activo,
    )
    from app.models import Rol

    rol = Rol.query.filter_by(codigo=rol_codigo).first()
    usuario.roles.append(UsuarioRol(rol=rol))
    db.session.add(usuario)
    db.session.commit()
    return usuario


def _crear_tienda(usuario: Usuario, estado_codigo: str = "APROBADO") -> Tienda:
    from app.models import EstadoAprobacion

    estado = EstadoAprobacion.query.filter_by(codigo=estado_codigo).first()
    tienda = Tienda(
        duenio=usuario,
        razon_social="Super Tienda",
        telefono="55555555",
        email=usuario.email,
        cuenta_bancaria="123456",
        id_estado_aprobacion=estado.id_estado_aprobacion,
        activo=estado_codigo == "APROBADO",
    )
    db.session.add(tienda)
    db.session.commit()
    return tienda


def _login(client, email: str, password: str) -> dict:
    resp = client.post("/api/auth/login", json={"email": email, "password": password})
    assert resp.status_code == 200
    return resp.get_json()


def _crear_producto(tienda: Tienda, precio: Decimal = Decimal("10.00"), peso: Decimal = Decimal("1.5")) -> Producto:
    producto = Producto(
        tienda=tienda,
        nombre="Producto",
        precio=precio,
        peso_kg=peso,
        stock=100,
        umbral_bajo=5,
    )
    db.session.add(producto)
    db.session.commit()
    return producto


def test_carrito_calcula_envio(app):
    with app.app_context():
        cliente = _crear_usuario("cliente@test.com", "CLIENTE")
        tienda_user = _crear_usuario("tienda@test.com", "TIENDA")
        tienda = _crear_tienda(tienda_user)
        producto = _crear_producto(tienda)

        servicio = CarritoService()
        servicio.agregar_producto(cliente.id_usuario, producto.id_producto, 3)
        carrito = servicio.obtener(cliente.id_usuario)
        resumen = servicio.resumen(carrito)

        assert resumen["subtotal"] == Decimal("30.00")
        assert resumen["peso_total"] == Decimal("4.5")
        assert resumen["envio"] == Decimal("11")
        assert resumen["total"] == Decimal("41.00")


def test_pedido_creacion_descontar_stock(app):
    with app.app_context():
        cliente = _crear_usuario("cliente2@test.com", "CLIENTE")
        tienda_user = _crear_usuario("tienda2@test.com", "TIENDA")
        tienda = _crear_tienda(tienda_user)
        producto = _crear_producto(tienda)

        direccion = Direccion(
            id_usuario=cliente.id_usuario,
            linea1="Calle 1",
            ciudad="Ciudad",
            pais="GT",
        )
        db.session.add(direccion)
        db.session.commit()

        carrito_srv = CarritoService()
        pedido_srv = PedidoService()

        carrito_srv.agregar_producto(cliente.id_usuario, producto.id_producto, 2)
        pedido = pedido_srv.crear_pedido(cliente.id_usuario, direccion.id_direccion)

        db.session.refresh(producto)
        assert producto.stock == 98
        assert pedido.total_q == Decimal("27.00")
        assert pedido.peso_total_kg == Decimal("3.0")


def test_admin_aprueba_tienda(app):
    with app.app_context():
        admin = _crear_usuario("admin2@test.com", "ADMIN")
        tienda_user = _crear_usuario("tienda3@test.com", "TIENDA")
        tienda = _crear_tienda(tienda_user, estado_codigo="PENDIENTE")

        admin_srv = AdminService()
        tienda_actualizada = admin_srv.actualizar_estado_tienda(
            tienda.id_tienda, "APROBADO", admin.id_usuario
        )

        assert tienda_actualizada.activo is True
        assert tienda_actualizada.aprobado_por == admin.id_usuario


def test_auth_password_reset(app):
    with app.app_context():
        auth_srv = AuthService()
        usuario = _crear_usuario("reset@test.com", "CLIENTE")
        usuario.activo = True
        db.session.commit()

        codigo = auth_srv.request_password_reset(usuario.email)
        auth_srv.reset_password(usuario.email, codigo, "NuevaClaveSegura1!")

        _, access, _ = auth_srv.authenticate(usuario.email, "NuevaClaveSegura1!")
        assert access


def test_entrega_flujo(app):
    with app.app_context():
        cliente = _crear_usuario("cliente4@test.com", "CLIENTE")
        tienda_user = _crear_usuario("tienda4@test.com", "TIENDA")
        tienda = _crear_tienda(tienda_user)
        producto = _crear_producto(tienda)

        direccion = Direccion(
            id_usuario=cliente.id_usuario,
            linea1="Zona 1",
            ciudad="Ciudad",
            pais="GT",
        )
        db.session.add(direccion)
        db.session.commit()

        carrito_srv = CarritoService()
        pedido_srv = PedidoService()
        entrega_srv = EntregaService()

        carrito_srv.agregar_producto(cliente.id_usuario, producto.id_producto, 1)
        pedido = pedido_srv.crear_pedido(cliente.id_usuario, direccion.id_direccion)

        repartidor_user = _crear_usuario("rep@test.com", "REPARTIDOR")
        perfil = PerfilRepartidor(
            id_usuario=repartidor_user.id_usuario,
            dpi="123456789",
            vehiculo_tipo=VehiculoTipoEnum.MOTO,
            cuenta_bancaria="98765",
            url_foto="https://example.com/foto.jpg",
            id_estado_aprobacion=2,
            activo=True,
        )
        db.session.add(perfil)
        db.session.commit()

        entrega = entrega_srv.asignar_entrega(tienda, pedido.id_pedido, repartidor_user.id_usuario)
        entrega = entrega_srv.cambiar_estado(
            entrega_srv.obtener_para_repartidor(repartidor_user.id_usuario, entrega.id_entrega), "ACEPTADA"
        )
        entrega = entrega_srv.cambiar_estado(entrega, "EN_CAMINO")
        entrega = entrega_srv.cambiar_estado(entrega, "ENTREGADA")

        assert entrega.entregada_en is not None
        pedido_actualizado = Pedido.query.get(pedido.id_pedido)
        estado_entregado = EstadoPedido.query.filter_by(codigo="ENTREGADO").first()
        assert pedido_actualizado.id_estado_pedido == estado_entregado.id_estado_pedido




def test_cliente_no_puede_actualizar_estado_pedido(app, client):
    with app.app_context():
        cliente = _crear_usuario("cliente_perm@test.com", "CLIENTE")
        tienda_user = _crear_usuario("tienda_perm@test.com", "TIENDA")
        tienda = _crear_tienda(tienda_user)
        producto = _crear_producto(tienda)
        direccion = Direccion(
            id_usuario=cliente.id_usuario,
            linea1="Calle 1",
            ciudad="Ciudad",
            pais="GT",
        )
        db.session.add(direccion)
        db.session.commit()
        carrito_srv = CarritoService()
        pedido_srv = PedidoService()
        carrito_srv.agregar_producto(cliente.id_usuario, producto.id_producto, 1)
        pedido = pedido_srv.crear_pedido(cliente.id_usuario, direccion.id_direccion)
        pedido_id = pedido.id_pedido
    tokens = _login(client, "cliente_perm@test.com", "TestPass123!")
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}
    resp = client.patch(
        f"/api/pedidos/{pedido_id}/estado",
        headers=headers,
        json={"codigo": "CONFIRMADO"},
    )
    assert resp.status_code == 403



def test_repartidor_no_puede_acceder_admin(app, client):
    with app.app_context():
        repartidor = _crear_usuario("rep_admin@test.com", "REPARTIDOR")
        perfil = PerfilRepartidor(
            id_usuario=repartidor.id_usuario,
            dpi="1234567890",
            vehiculo_tipo=VehiculoTipoEnum.MOTO,
            cuenta_bancaria="123456789",
            url_foto="https://example.com/foto.jpg",
            id_estado_aprobacion=2,
            activo=True,
        )
        db.session.add(perfil)
        db.session.commit()
    tokens = _login(client, "rep_admin@test.com", "TestPass123!")
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}
    resp = client.get("/api/admin/tiendas", headers=headers)
    assert resp.status_code == 403



def test_pedido_transicion_invalida(app):
    with app.app_context():
        cliente = _crear_usuario("cliente_trans@test.com", "CLIENTE")
        tienda_user = _crear_usuario("tienda_trans@test.com", "TIENDA")
        tienda = _crear_tienda(tienda_user)
        producto = _crear_producto(tienda)
        direccion = Direccion(
            id_usuario=cliente.id_usuario,
            linea1="Linea",
            ciudad="Ciudad",
            pais="GT",
        )
        db.session.add(direccion)
        db.session.commit()
        carrito_srv = CarritoService()
        pedido_srv = PedidoService()
        carrito_srv.agregar_producto(cliente.id_usuario, producto.id_producto, 1)
        pedido = pedido_srv.crear_pedido(cliente.id_usuario, direccion.id_direccion)
        with pytest.raises(ServiceError):
            pedido_srv.cambiar_estado(pedido.id_pedido, "ENTREGADO", tienda.id_usuario_duenio)
        pedido_srv.cambiar_estado(pedido.id_pedido, "CONFIRMADO", tienda.id_usuario_duenio)
        with pytest.raises(ServiceError):
            pedido_srv.cambiar_estado(pedido.id_pedido, "PENDIENTE", tienda.id_usuario_duenio)



def test_entrega_transicion_invalida(app):
    with app.app_context():
        cliente = _crear_usuario("cliente_entrega@test.com", "CLIENTE")
        tienda_user = _crear_usuario("tienda_entrega@test.com", "TIENDA")
        tienda = _crear_tienda(tienda_user)
        producto = _crear_producto(tienda)
        direccion = Direccion(
            id_usuario=cliente.id_usuario,
            linea1="Zona",
            ciudad="Ciudad",
            pais="GT",
        )
        db.session.add(direccion)
        db.session.commit()
        carrito_srv = CarritoService()
        pedido_srv = PedidoService()
        entrega_srv = EntregaService()
        carrito_srv.agregar_producto(cliente.id_usuario, producto.id_producto, 1)
        pedido = pedido_srv.crear_pedido(cliente.id_usuario, direccion.id_direccion)
        repartidor = _crear_usuario("rep_entrega@test.com", "REPARTIDOR")
        perfil = PerfilRepartidor(
            id_usuario=repartidor.id_usuario,
            dpi="1234567891",
            vehiculo_tipo=VehiculoTipoEnum.MOTO,
            cuenta_bancaria="987654321",
            url_foto="https://example.com/foto2.jpg",
            id_estado_aprobacion=2,
            activo=True,
        )
        db.session.add(perfil)
        db.session.commit()
        entrega = entrega_srv.asignar_entrega(tienda, pedido.id_pedido, repartidor.id_usuario)
        entrega = entrega_srv.cambiar_estado(entrega_srv.obtener_para_repartidor(repartidor.id_usuario, entrega.id_entrega), "ACEPTADA")
        entrega = entrega_srv.cambiar_estado(entrega, "EN_CAMINO")
        with pytest.raises(ServiceError):
            entrega_srv.cambiar_estado(entrega, "ASIGNADA")



def test_tarifa_tienda_prioritaria(app):
    with app.app_context():
        cliente = _crear_usuario("cliente_tarifa@test.com", "CLIENTE")
        tienda_user = _crear_usuario("tienda_tarifa@test.com", "TIENDA")
        tienda = _crear_tienda(tienda_user)
        producto = _crear_producto(tienda, precio=Decimal("12.00"), peso=Decimal("0.5"))
        tarifa = TarifaEnvio(
            id_tienda=tienda.id_tienda,
            ambito=TarifaAmbitoEnum.TIENDA,
            tarifa_base_q=Decimal("15.00"),
            base_kg=Decimal("1.0"),
            extra_q_por_kg=Decimal("5.00"),
            activo=True,
        )
        db.session.add(tarifa)
        direccion = Direccion(
            id_usuario=cliente.id_usuario,
            linea1="Calle Tarifas",
            ciudad="Ciudad",
            pais="GT",
        )
        db.session.add(direccion)
        db.session.commit()
        carrito_srv = CarritoService()
        carrito_srv.agregar_producto(cliente.id_usuario, producto.id_producto, 1)
        carrito = carrito_srv.obtener(cliente.id_usuario)
        resumen = carrito_srv.resumen(carrito)
        assert resumen["envio"] == Decimal("15.00")
