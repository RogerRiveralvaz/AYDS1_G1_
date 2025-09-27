from __future__ import annotations

from datetime import datetime

from flask import Blueprint, jsonify, request
from flask_jwt_extended import (
    create_access_token,
    get_jwt,
    get_jwt_identity,
    jwt_required,
)
from marshmallow import Schema, fields, validate

from ..extensions import db, jwt
from ..models import TokenRevocado, Usuario
from ..schemas.usuario import LoginSchema, UsuarioRegisterSchema, UsuarioSchema, VerifyEmailSchema
from ..services import ServiceError
from ..services.auth_service import AuthService

bp = Blueprint("auth", __name__)

_auth_service = AuthService()
_register_schema = UsuarioRegisterSchema()
_login_schema = LoginSchema()
_usuario_schema = UsuarioSchema()
_verify_schema = VerifyEmailSchema()


class EmailOnlySchema(Schema):
    email = fields.Email(required=True)


class PasswordResetSchema(Schema):
    email = fields.Email(required=True)
    codigo = fields.Str(required=True)
    nueva_password = fields.Str(required=True, validate=validate.Length(min=10))


@bp.errorhandler(ServiceError)
def _handle_service_error(err: ServiceError):
    return jsonify({"message": err.message}), err.status_code


@bp.post("/register")
def register_usuario():
    payload = _register_schema.load(request.get_json() or {})
    usuario, codigo = _auth_service.register(payload)
    data = _usuario_schema.dump(usuario)
    data["codigo_verificacion"] = codigo  # facilitar pruebas; en produccion se envia por correo
    return jsonify({"usuario": data, "message": "Registro creado. Verifica tu correo."}), 201


@bp.post("/login")
def login():
    credentials = _login_schema.load(request.get_json() or {})
    usuario, access_token, refresh_token = _auth_service.authenticate(
        credentials["email"], credentials["password"]
    )
    return jsonify(
        {
            "usuario": _usuario_schema.dump(usuario),
            "access_token": access_token,
            "refresh_token": refresh_token,
        }
    )


@bp.post("/refresh")
@jwt_required(refresh=True)
def refresh_token():
    identity = get_jwt_identity()
    claims = get_jwt()
    roles = claims.get("roles", [])
    usuario = Usuario.query.get(identity)
    if not usuario:
        return jsonify({"message": "Usuario no encontrado"}), 404
    additional_claims = {"roles": roles, "nombre": usuario.nombres, "apellido": usuario.apellidos}
    new_token = create_access_token(identity=identity, additional_claims=additional_claims)
    return jsonify({"access_token": new_token})


@bp.post("/logout")
@jwt_required()
def logout():
    jti = get_jwt()["jti"]
    user_id = get_jwt_identity()
    exp_ts = get_jwt()["exp"]
    expires = datetime.utcfromtimestamp(exp_ts)
    _auth_service.revoke_token(jti, user_id, expires)
    return jsonify({"message": "Sesion finalizada"})


@bp.post("/verify-email")
def verify_email():
    data = _verify_schema.load(request.get_json() or {})
    usuario = _auth_service.verify_email(data["email"], data["codigo"])
    return jsonify({"usuario": _usuario_schema.dump(usuario)})


@bp.post("/resend-verification")
def resend_verification():
    data = EmailOnlySchema().load(request.get_json() or {})
    codigo = _auth_service.resend_verification(data["email"])
    return jsonify({"message": "Codigo reenviado", "codigo": codigo})


@bp.post("/request-password-reset")
def request_password_reset():
    data = EmailOnlySchema().load(request.get_json() or {})
    codigo = _auth_service.request_password_reset(data["email"])
    return jsonify({"message": "Solicitud registrada", "codigo": codigo})


@bp.post("/reset-password")
def reset_password():
    data = PasswordResetSchema().load(request.get_json() or {})
    _auth_service.reset_password(data["email"], data["codigo"], data["nueva_password"])
    return jsonify({"message": "Contrase?a actualizada"})


@jwt.token_in_blocklist_loader
def check_if_token_revoked(_jwt_header, jwt_payload):
    jti = jwt_payload["jti"]
    return TokenRevocado.query.filter_by(jti=jti).first() is not None


@jwt.user_lookup_loader
def lookup_user(_jwt_header, jwt_payload):
    identity = jwt_payload["sub"]
    return db.session.get(Usuario, identity)
