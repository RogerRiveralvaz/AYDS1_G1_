from __future__ import annotations

from decimal import Decimal

import pytest

from app.extensions import db
from app.models import AlertaStock, EstadoAprobacion, Producto, Rol, Tienda, Usuario, UsuarioRol
from app.utils.security import hash_password


def _crear_usuario_tienda(email: str = "tienda_owner@test.com") -> tuple[Usuario, Tienda]:
    usuario = Usuario(
        email=email,
        password_hash=hash_password("TiendaPass123!"),
        nombres="Due\u00f1o",
        apellidos="Tienda",
        activo=True,
    )
    rol_tienda = Rol.query.filter_by(codigo="TIENDA").first()
    assert rol_tienda is not None
    usuario.roles.append(UsuarioRol(rol=rol_tienda))
    db.session.add(usuario)
    db.session.commit()

    estado_aprobado = EstadoAprobacion.query.filter_by(codigo="APROBADO").first()
    assert estado_aprobado is not None

    tienda = Tienda(
        duenio=usuario,
        razon_social="Tienda Central",
        telefono="55555555",
        email=usuario.email,
        cuenta_bancaria="123456789",
        id_estado_aprobacion=estado_aprobado.id_estado_aprobacion,
        activo=True,
    )
    db.session.add(tienda)
    db.session.commit()
    return usuario, tienda


@pytest.mark.usefixtures("app")
def test_tienda_crud_producto_y_alerta_stock(client):
    with client.application.app_context():
        usuario, _ = _crear_usuario_tienda()

    resp_login = client.post(
        "/api/auth/login",
        json={"email": usuario.email, "password": "TiendaPass123!"},
    )
    assert resp_login.status_code == 200
    tokens = resp_login.get_json()
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}

    payload = {
        "nombre": "Pan artesanal",
        "descripcion_corta": "Pan fresco del d\u00eda",
        "precio": "15.50",
        "peso_kg": "0.45",
        "sku": "PAN-001",
        "stock": 3,
        "umbral_bajo": 5,
        "es_oferta": True,
        "es_nuevo": True,
        "activo": True,
        "imagenes": [
            {"url": "https://example.com/pan.jpg", "principal": True, "orden": 1},
            {"url": "https://example.com/pan2.jpg", "principal": False, "orden": 2},
        ],
    }

    resp = client.post("/api/tiendas/mi/productos", json=payload, headers=headers)
    assert resp.status_code == 201
    data = resp.get_json()
    producto_id = data["producto"]["id_producto"]

    resp_get = client.get(f"/api/tiendas/mi/productos/{producto_id}", headers=headers)
    assert resp_get.status_code == 200
    producto_data = resp_get.get_json()["producto"]
    assert producto_data["nombre"] == "Pan artesanal"
    assert producto_data["stock"] == 3

    resp_patch = client.patch(
        f"/api/tiendas/mi/productos/{producto_id}",
        json={"precio": "17.00", "stock": 10, "es_oferta": False},
        headers=headers,
    )
    assert resp_patch.status_code == 200
    actualizado = resp_patch.get_json()["producto"]
    assert actualizado["precio"] == "17.00"
    assert actualizado["stock"] == 10
    assert actualizado["es_oferta"] is False

    resp_estado = client.patch(
        f"/api/tiendas/mi/productos/{producto_id}/estado",
        json={"activo": False},
        headers=headers,
    )
    assert resp_estado.status_code == 200
    assert resp_estado.get_json()["producto"]["activo"] is False

    resp_delete = client.delete(f"/api/tiendas/mi/productos/{producto_id}", headers=headers)
    assert resp_delete.status_code == 200

    resp_list = client.get("/api/tiendas/mi/productos", headers=headers)
    assert resp_list.status_code == 200
    assert resp_list.get_json()["productos"] == []

    with client.application.app_context():
        assert Producto.query.get(producto_id) is None
        alertas = AlertaStock.query.filter_by(id_producto=producto_id).all()
        assert len(alertas) == 1
        assert alertas[0].stock_momento == 3


@pytest.mark.usefixtures("app")
def test_tienda_tarifa_envio_y_resumen(client):
    with client.application.app_context():
        usuario, _ = _crear_usuario_tienda("tienda_tarifa@test.com")

    login = client.post(
        "/api/auth/login",
        json={"email": usuario.email, "password": "TiendaPass123!"},
    )
    tokens = login.get_json()
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}

    tarifa_payload = {
        "tarifa_base_q": "12.00",
        "base_kg": "1.50",
        "extra_q_por_kg": "3.25",
        "activo": True,
    }
    resp_tarifa = client.put("/api/tiendas/mi/tarifa", json=tarifa_payload, headers=headers)
    assert resp_tarifa.status_code == 200
    tarifa = resp_tarifa.get_json()["tarifa"]
    assert tarifa["tarifa_base_q"] == "12.00"
    assert tarifa["extra_q_por_kg"] == "3.25"

    resp_get_tarifa = client.get("/api/tiendas/mi/tarifa", headers=headers)
    assert resp_get_tarifa.status_code == 200
    assert resp_get_tarifa.get_json()["tarifa"]["base_kg"] == "1.50"

    resp_resumen = client.get("/api/tiendas/mi/reportes", headers=headers)
    assert resp_resumen.status_code == 200
    resumen = resp_resumen.get_json()["resumen"]
    assert set(resumen.keys()) == {
        "pedidos_totales",
        "ingresos",
        "productos_vendidos",
        "clientes_unicos",
    }
    assert Decimal(str(resumen["ingresos"])) == Decimal("0")
