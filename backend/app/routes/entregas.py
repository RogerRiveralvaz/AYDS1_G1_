from __future__ import annotations

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from marshmallow import Schema, fields, validate

from ..schemas.entrega import EntregaSchema, SeguimientoSchema
from ..services import ServiceError
from ..services.entrega_service import EntregaService
from ..services.tienda_service import TiendaService
from ..utils.decorators import roles_required

bp = Blueprint("entregas", __name__)

_entrega_service = EntregaService()
_tienda_service = TiendaService()
_entrega_schema = EntregaSchema()
_entregas_schema = EntregaSchema(many=True)
_seguimiento_schema = SeguimientoSchema(many=True)


class AsignarEntregaSchema(Schema):
    pedido_id = fields.Int(required=True)
    repartidor_id = fields.Int(required=True)


class EstadoEntregaSchema(Schema):
    codigo = fields.Str(required=True)


class SeguimientoPayloadSchema(Schema):
    lat = fields.Float(required=True)
    lng = fields.Float(required=True)
    nota = fields.Str(load_default=None, validate=validate.Length(max=160))


@bp.errorhandler(ServiceError)
def _handle_service_error(err: ServiceError):
    return jsonify({"message": err.message}), err.status_code


@bp.post("/asignar")
@jwt_required()
@roles_required("TIENDA")
def asignar_entrega():
    tienda = _tienda_service.obtener_activa(get_jwt_identity())
    payload = AsignarEntregaSchema().load(request.get_json() or {})
    entrega = _entrega_service.asignar_entrega(tienda, payload["pedido_id"], payload["repartidor_id"])
    return jsonify({"entrega": _entrega_schema.dump(entrega)}), 201


@bp.get("/mis")
@jwt_required()
@roles_required("REPARTIDOR")
def listar_entregas_repartidor():
    estado = request.args.get("estado")
    entregas = _entrega_service.listar_para_repartidor(get_jwt_identity(), estado)
    return jsonify({"entregas": _entregas_schema.dump(entregas)})


@bp.get("/mis/<int:entrega_id>")
@jwt_required()
@roles_required("REPARTIDOR")
def detalle_entrega(entrega_id: int):
    entrega = _entrega_service.obtener_para_repartidor(get_jwt_identity(), entrega_id)
    data = _entrega_schema.dump(entrega)
    data["seguimiento"] = _seguimiento_schema.dump(entrega.seguimiento)
    return jsonify({"entrega": data})


@bp.post("/mis/<int:entrega_id>/estado")
@jwt_required()
@roles_required("REPARTIDOR")
def actualizar_estado_entrega(entrega_id: int):
    payload = EstadoEntregaSchema().load(request.get_json() or {})
    entrega = _entrega_service.obtener_para_repartidor(get_jwt_identity(), entrega_id)
    entrega = _entrega_service.cambiar_estado(entrega, payload["codigo"])
    data = _entrega_schema.dump(entrega)
    data["seguimiento"] = _seguimiento_schema.dump(entrega.seguimiento)
    return jsonify({"entrega": data})


@bp.post("/mis/<int:entrega_id>/seguimiento")
@jwt_required()
@roles_required("REPARTIDOR")
def registrar_seguimiento(entrega_id: int):
    payload = SeguimientoPayloadSchema().load(request.get_json() or {})
    entrega = _entrega_service.obtener_para_repartidor(get_jwt_identity(), entrega_id)
    seguimiento = _entrega_service.registrar_seguimiento(
        entrega, payload["lat"], payload["lng"], payload.get("nota")
    )
    return jsonify({"seguimiento": _seguimiento_schema.dump([seguimiento])[0]})
