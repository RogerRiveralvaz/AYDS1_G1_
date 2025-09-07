from __future__ import annotations

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required

from ..schemas.rol import RolCreateSchema, RolSchema
from ..services import ServiceError
from ..services.rol_service import RolService
from ..utils.decorators import admin_required

bp = Blueprint("roles", __name__)

_rol_service = RolService()
_roles_schema = RolSchema(many=True)
_rol_schema = RolSchema()
_create_schema = RolCreateSchema()


@bp.errorhandler(ServiceError)
def _handle_service_error(err: ServiceError):
    return jsonify({"message": err.message}), err.status_code


@bp.get("/")
@jwt_required()
@admin_required
def list_roles():
    roles = _rol_service.list_roles()
    return jsonify({"roles": _roles_schema.dump(roles)})


@bp.post("/")
@jwt_required()
@admin_required
def create_role():
    data = _create_schema.load(request.get_json() or {})
    rol = _rol_service.create_role(data)
    return jsonify({"rol": _rol_schema.dump(rol)}), 201
