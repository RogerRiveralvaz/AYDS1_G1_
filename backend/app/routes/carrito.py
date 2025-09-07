from __future__ import annotations

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from marshmallow import Schema, fields, validate

from ..schemas.carrito import CarritoDetalleSchema, CarritoResumenSchema, ItemCarritoSchema
from ..services import ServiceError
from ..services.carrito_service import CarritoService
from ..utils.decorators import roles_required

bp = Blueprint("carrito", __name__)

_carrito_service = CarritoService()
_items_schema = ItemCarritoSchema(many=True)
_resumen_schema = CarritoResumenSchema()
_carrito_schema = CarritoDetalleSchema()


class ItemPayloadSchema(Schema):
    id_producto = fields.Int(required=True)
    cantidad = fields.Int(required=True, validate=validate.Range(min=1))


@bp.errorhandler(ServiceError)
def _handle_service_error(err: ServiceError):
    return jsonify({"message": err.message}), err.status_code


@bp.get("")
@jwt_required()
@roles_required("CLIENTE")
def obtener_carrito():
    user_id = get_jwt_identity()
    carrito = _carrito_service.obtener(user_id)
    resumen = _carrito_service.resumen(carrito)
    data = {
        "items": _items_schema.dump(carrito.items),
        "resumen": _resumen_schema.dump(resumen),
    }
    return jsonify({"carrito": _carrito_schema.dump(data)})


@bp.post("/items")
@jwt_required()
@roles_required("CLIENTE")
def agregar_item():
    payload = ItemPayloadSchema().load(request.get_json() or {})
    carrito = _carrito_service.agregar_producto(
        get_jwt_identity(), payload["id_producto"], payload["cantidad"]
    )
    resumen = _carrito_service.resumen(carrito)
    data = {
        "items": _items_schema.dump(carrito.items),
        "resumen": _resumen_schema.dump(resumen),
    }
    return jsonify({"carrito": _carrito_schema.dump(data)})


@bp.patch("/items/<int:item_id>")
@jwt_required()
@roles_required("CLIENTE")
def actualizar_item(item_id: int):
    payload = ItemPayloadSchema().load(request.get_json() or {})
    carrito = _carrito_service.actualizar_cantidad(
        get_jwt_identity(), item_id, payload["cantidad"]
    )
    resumen = _carrito_service.resumen(carrito)
    data = {
        "items": _items_schema.dump(carrito.items),
        "resumen": _resumen_schema.dump(resumen),
    }
    return jsonify({"carrito": _carrito_schema.dump(data)})


@bp.delete("/items/<int:item_id>")
@jwt_required()
@roles_required("CLIENTE")
def eliminar_item(item_id: int):
    carrito = _carrito_service.eliminar_item(get_jwt_identity(), item_id)
    resumen = _carrito_service.resumen(carrito)
    data = {
        "items": _items_schema.dump(carrito.items),
        "resumen": _resumen_schema.dump(resumen),
    }
    return jsonify({"carrito": _carrito_schema.dump(data)})


@bp.delete("")
@jwt_required()
@roles_required("CLIENTE")
def vaciar_carrito():
    _carrito_service.vaciar(get_jwt_identity())
    return jsonify({"message": "Carrito vaciado"})

