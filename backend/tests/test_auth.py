from __future__ import annotations

import pytest

from app.extensions import db
from app.models import Usuario

CLIENT_DATA = {
    "rol_codigo": "CLIENTE",
    "nombres": "Juan",
    "apellidos": "Perez",
    "email": "juan@example.com",
    "password": "Str0ngPass!23",
    "telefono": "55512345",
}


def _register(client, payload):
    return client.post("/api/auth/register", json=payload)


def test_register_cliente_success(client):
    response = _register(client, CLIENT_DATA)
    assert response.status_code == 201
    body = response.get_json()
    assert body["usuario"]["activo"] is False
    assert body["usuario"]["email"] == CLIENT_DATA["email"].lower()
    assert "codigo_verificacion" in body["usuario"]

    usuario = Usuario.query.filter_by(email=CLIENT_DATA["email"].lower()).first()
    assert usuario is not None
    assert any(rel.rol.codigo == "CLIENTE" for rel in usuario.roles)


def test_register_repartidor_requires_payload(client):
    payload = {
        "rol_codigo": "REPARTIDOR",
        "nombres": "Ana",
        "apellidos": "Lopez",
        "email": "ana@example.com",
        "password": "ClaveFuerte123!",
    }
    response = _register(client, payload)
    assert response.status_code == 422
    assert "repartidor" in response.get_json()["message"].lower()


def test_verify_email_activates_user(client):
    response = _register(client, CLIENT_DATA)
    codigo = response.get_json()["usuario"]["codigo_verificacion"]
    verify = client.post("/api/auth/verify-email", json={"email": CLIENT_DATA["email"], "codigo": codigo})
    assert verify.status_code == 200
    usuario = Usuario.query.filter_by(email=CLIENT_DATA["email"]).first()
    assert usuario.activo is True


def test_login_requires_activation(client):
    _register(client, CLIENT_DATA)
    login_resp = client.post(
        "/api/auth/login",
        json={"email": CLIENT_DATA["email"], "password": CLIENT_DATA["password"]},
    )
    assert login_resp.status_code == 403


def test_login_after_verification(client):
    response = _register(client, CLIENT_DATA)
    codigo = response.get_json()["usuario"]["codigo_verificacion"]
    client.post("/api/auth/verify-email", json={"email": CLIENT_DATA["email"], "codigo": codigo})
    login_resp = client.post(
        "/api/auth/login",
        json={"email": CLIENT_DATA["email"], "password": CLIENT_DATA["password"]},
    )
    data = login_resp.get_json()
    assert login_resp.status_code == 200
    assert "access_token" in data and "refresh_token" in data


def test_roles_endpoint_requires_admin(client):
    response = client.get("/api/roles/")
    assert response.status_code == 401


def test_roles_endpoint_forbidden_for_cliente(client):
    registro = _register(client, CLIENT_DATA)
    codigo = registro.get_json()["usuario"]["codigo_verificacion"]
    client.post("/api/auth/verify-email", json={"email": CLIENT_DATA["email"], "codigo": codigo})
    login_resp = client.post(
        "/api/auth/login",
        json={"email": CLIENT_DATA["email"], "password": CLIENT_DATA["password"]},
    )
    token = login_resp.get_json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/api/roles/", headers=headers)
    assert response.status_code == 403


def test_roles_list_success_for_admin(client, admin_headers):
    response = client.get("/api/roles/", headers=admin_headers)
    assert response.status_code == 200
    roles = response.get_json()["roles"]
    assert len(roles) >= 4



def test_logout_revokes_token(client, admin_headers):
    assert client.get("/api/roles/", headers=admin_headers).status_code == 200
    logout_resp = client.post("/api/auth/logout", headers=admin_headers)
    assert logout_resp.status_code == 200
    after = client.get("/api/roles/", headers=admin_headers)
    assert after.status_code in (401, 422)



def test_refresh_returns_new_access_token(client):
    registro = _register(client, CLIENT_DATA)
    codigo = registro.get_json()["usuario"]["codigo_verificacion"]
    client.post("/api/auth/verify-email", json={"email": CLIENT_DATA["email"], "codigo": codigo})
    login_resp = client.post(
        "/api/auth/login",
        json={"email": CLIENT_DATA["email"], "password": CLIENT_DATA["password"]},
    )
    tokens = login_resp.get_json()
    refresh_token = tokens["refresh_token"]
    refresh_resp = client.post(
        "/api/auth/refresh",
        headers={"Authorization": f"Bearer {refresh_token}"},
    )
    assert refresh_resp.status_code == 200
    new_access = refresh_resp.get_json()["access_token"]
    assert new_access
    assert new_access != tokens["access_token"]
