from __future__ import annotations

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from ..schemas.pago import PagoCreateSchema, PagoSchema
from ..services import ServiceError
from ..services.pago_service import PagoService
from ..services.pedido_service import PedidoService
from ..services.tienda_service import TiendaService
from ..utils.decorators import roles_required

bp = Blueprint("pagos", __name__)

_pago_service = PagoService()
_pedido_service = PedidoService()
_tienda_service = TiendaService()
_pago_schema = PagoSchema()
_pagos_schema = PagoSchema(many=True)
_crear_schema = PagoCreateSchema()


@bp.errorhandler(ServiceError)
def _handle_service_error(err: ServiceError):
    return jsonify({"message": err.message}), err.status_code


@bp.post("/")
@jwt_required()
@roles_required("CLIENTE")
def registrar_pago():
    payload = _crear_schema.load(request.get_json() or {})
    pedido = _pedido_service.obtener_pedido_cliente(get_jwt_identity(), payload["pedido_id"])
    pago = _pago_service.registrar_pago(pedido.id_pedido, payload)
    return jsonify({"pago": _pago_schema.dump(pago)}), 201


@bp.get("/<int:pedido_id>")
@jwt_required()
@roles_required("CLIENTE", "TIENDA")
def listar_pagos(pedido_id: int):
    usuario_id = get_jwt_identity()
    autorizado = True
    try:
        _pedido_service.obtener_pedido_cliente(usuario_id, pedido_id)
    except ServiceError:
        try:
            tienda = _tienda_service.obtener_activa(usuario_id)
            _pedido_service.obtener_pedido_tienda(tienda, pedido_id)
        except ServiceError as err:
            autorizado = False
            error_resp = err
    if not autorizado:
        return jsonify({"message": error_resp.message}), error_resp.status_code
    pagos = _pago_service.listar_por_pedido(pedido_id)
    return jsonify({"pagos": _pagos_schema.dump(pagos)})
