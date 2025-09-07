import pytest

from app import create_app
from app.extensions import db
from app.models import (
    EstadoAprobacion,
    EstadoEntrega,
    EstadoPedido,
    Rol,
    TarifaAmbitoEnum,
    TarifaEnvio,
    Usuario,
    UsuarioRol,
)
from app.utils.security import hash_password


@pytest.fixture()
def app():
    app = create_app("testing")
    with app.app_context():
        db.create_all()
        _seed_defaults()
        yield app
        db.session.remove()
        db.drop_all()


@pytest.fixture()
def client(app):
    return app.test_client()


@pytest.fixture()
def admin_headers(app):
    usuario = Usuario(
        email="admin@example.com",
        password_hash=hash_password("AdminPass123!"),
        nombres="Admin",
        apellidos="Sistema",
        activo=True,
    )
    rol_admin = Rol.query.filter_by(codigo="ADMIN").first()
    usuario.roles.append(UsuarioRol(rol=rol_admin))
    db.session.add(usuario)
    db.session.commit()

    client = app.test_client()
    response = client.post(
        "/api/auth/login",
        json={"email": "admin@example.com", "password": "AdminPass123!"},
    )
    tokens = response.get_json()
    access = tokens["access_token"]
    return {"Authorization": f"Bearer {access}"}


def _seed_defaults():
    roles = [
        Rol(codigo="CLIENTE", nombre="Cliente"),
        Rol(codigo="REPARTIDOR", nombre="Repartidor"),
        Rol(codigo="TIENDA", nombre="Tienda"),
        Rol(codigo="ADMIN", nombre="Administrador"),
    ]
    estados_aprobacion = [
        EstadoAprobacion(id_estado_aprobacion=1, codigo="PENDIENTE", nombre="Pendiente"),
        EstadoAprobacion(id_estado_aprobacion=2, codigo="APROBADO", nombre="Aprobado"),
        EstadoAprobacion(id_estado_aprobacion=3, codigo="RECHAZADO", nombre="Rechazado"),
    ]
    estados_pedido = [
        EstadoPedido(id_estado_pedido=1, codigo="PENDIENTE", nombre="Pendiente"),
        EstadoPedido(id_estado_pedido=2, codigo="CONFIRMADO", nombre="Confirmado"),
        EstadoPedido(id_estado_pedido=3, codigo="ENTREGADO", nombre="Entregado"),
    ]
    estados_entrega = [
        EstadoEntrega(id_estado_entrega=1, codigo="ASIGNADA", nombre="Asignada"),
        EstadoEntrega(id_estado_entrega=2, codigo="ACEPTADA", nombre="Aceptada"),
        EstadoEntrega(id_estado_entrega=3, codigo="EN_CAMINO", nombre="En camino"),
        EstadoEntrega(id_estado_entrega=4, codigo="ENTREGADA", nombre="Entregada"),
    ]
    tarifa_global = TarifaEnvio(
        ambito=TarifaAmbitoEnum.GLOBAL,
        tarifa_base_q=5,
        base_kg=2,
        extra_q_por_kg=2,
        activo=True,
    )
    db.session.add_all(
        roles + estados_aprobacion + estados_pedido + estados_entrega + [tarifa_global]
    )
    db.session.commit()
