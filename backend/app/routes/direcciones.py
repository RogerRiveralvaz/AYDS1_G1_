from __future__ import annotations

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from marshmallow import Schema, fields, validate

from ..schemas.usuario import DireccionInputSchema, DireccionSchema
from ..services import ServiceError
from ..services.direccion_service import DireccionService
from ..utils.decorators import roles_required

bp = Blueprint("direcciones", __name__)

_direccion_service = DireccionService()
_direccion_schema = DireccionSchema()
_direcciones_schema = DireccionSchema(many=True)


class DireccionCreateSchema(DireccionInputSchema):
    predeterminada = fields.Bool(load_default=False)


class DireccionUpdateSchema(Schema):
    etiqueta = fields.Str(load_default=None, validate=validate.Length(max=80))
    linea1 = fields.Str(validate=validate.Length(min=3, max=160))
    linea2 = fields.Str(load_default=None, validate=validate.Length(max=160))
    ciudad = fields.Str(validate=validate.Length(min=2, max=80))
    estado = fields.Str(load_default=None, validate=validate.Length(max=80))
    codigo_postal = fields.Str(load_default=None, validate=validate.Length(max=20))
    pais = fields.Str(load_default=None, validate=validate.Length(equal=2))
    ubicacion = fields.Str(load_default=None)


@bp.errorhandler(ServiceError)
def _handle_service_error(err: ServiceError):
    return jsonify({"message": err.message}), err.status_code


@bp.get("")
@jwt_required()
@roles_required("CLIENTE")
def listar_direcciones():
    user_id = get_jwt_identity()
    direcciones = _direccion_service.listar(user_id)
    return jsonify({"direcciones": _direcciones_schema.dump(direcciones)})


@bp.post("")
@jwt_required()
@roles_required("CLIENTE")
def crear_direccion():
    payload = DireccionCreateSchema().load(request.get_json() or {})
    predeterminada = payload.pop("predeterminada", False)
    direccion = _direccion_service.crear(get_jwt_identity(), payload, predeterminada=predeterminada)
    return jsonify({"direccion": _direccion_schema.dump(direccion)}), 201


@bp.patch("/<int:direccion_id>")
@jwt_required()
@roles_required("CLIENTE")
def actualizar_direccion(direccion_id: int):
    payload = DireccionUpdateSchema(partial=True).load(request.get_json() or {})
    direccion = _direccion_service.actualizar(get_jwt_identity(), direccion_id, payload)
    return jsonify({"direccion": _direccion_schema.dump(direccion)})


@bp.delete("/<int:direccion_id>")
@jwt_required()
@roles_required("CLIENTE")
def eliminar_direccion(direccion_id: int):
    _direccion_service.eliminar(get_jwt_identity(), direccion_id)
    return jsonify({"message": "Direccion eliminada"})


@bp.post("/<int:direccion_id>/predeterminada")
@jwt_required()
@roles_required("CLIENTE")
def establecer_predeterminada(direccion_id: int):
    direccion = _direccion_service.establecer_predeterminada(get_jwt_identity(), direccion_id)
    return jsonify({"direccion": _direccion_schema.dump(direccion)})
