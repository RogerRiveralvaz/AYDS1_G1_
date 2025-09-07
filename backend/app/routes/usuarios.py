from __future__ import annotations

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from ..schemas.usuario import UsuarioSchema, UsuarioUpdateSchema
from ..services import ServiceError
from ..services.usuario_service import UsuarioService
from ..utils.decorators import admin_required

bp = Blueprint("usuarios", __name__)

_usuario_service = UsuarioService()
_usuario_schema = UsuarioSchema()
_usuarios_schema = UsuarioSchema(many=True)
_update_schema = UsuarioUpdateSchema()


@bp.errorhandler(ServiceError)
def _handle_service_error(err: ServiceError):
    return jsonify({"message": err.message}), err.status_code


@bp.get("/")
@jwt_required()
@admin_required
def list_usuarios():
    rol = request.args.get("rol")
    usuarios = _usuario_service.list_usuarios(rol_codigo=rol)
    return jsonify({"usuarios": _usuarios_schema.dump(usuarios)})


@bp.get("/me")
@jwt_required()
def obtener_perfil():
    user_id = get_jwt_identity()
    usuario = _usuario_service.get_by_id(user_id)
    return jsonify({"usuario": _usuario_schema.dump(usuario)})


@bp.get("/<int:user_id>")
@jwt_required()
@admin_required
def obtener_usuario(user_id: int):
    usuario = _usuario_service.get_by_id(user_id)
    return jsonify({"usuario": _usuario_schema.dump(usuario)})


@bp.patch("/<int:user_id>")
@jwt_required()
@admin_required
def actualizar_usuario(user_id: int):
    payload = _update_schema.load(request.get_json() or {})
    usuario = _usuario_service.get_by_id(user_id)

    roles = payload.get("roles")
    if roles is not None:
        usuario = _usuario_service.asignar_roles(usuario, roles)
    if "activo" in payload:
        usuario = _usuario_service.actualizar_estado(usuario, payload["activo"])

    return jsonify({"usuario": _usuario_schema.dump(usuario)})
