from __future__ import annotations

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from marshmallow import Schema, fields, validate

from ..schemas.pedido import PedidoDetalleSchema, PedidoResumenSchema
from ..services import ServiceError
from ..services.pedido_service import PedidoService
from ..services.tienda_service import TiendaService
from ..utils.decorators import roles_required
from ..utils.pagination import get_pagination, paginate_sequence

bp = Blueprint("pedidos", __name__)

_pedido_service = PedidoService()
_tienda_service = TiendaService()
_resumen_schema = PedidoResumenSchema(many=True)
_detalle_schema = PedidoDetalleSchema()


class PedidoCreateSchema(Schema):
    direccion_id = fields.Int(required=True)
    notas = fields.Str(load_default=None, validate=validate.Length(max=300))


class EstadoPedidoSchema(Schema):
    codigo = fields.Str(required=True)
    nota = fields.Str(load_default=None, validate=validate.Length(max=200))


@bp.errorhandler(ServiceError)
def _handle_service_error(err: ServiceError):
    return jsonify({"message": err.message}), err.status_code


@bp.post("/")
@jwt_required()
@roles_required("CLIENTE")
def crear_pedido():
    payload = PedidoCreateSchema().load(request.get_json() or {})
    pedido = _pedido_service.crear_pedido(
        get_jwt_identity(), payload["direccion_id"], payload.get("notas")
    )
    detalle = _pedido_service.obtener_pedido_cliente(get_jwt_identity(), pedido.id_pedido)
    return jsonify({"pedido": _detalle_schema.dump(detalle)}), 201


@bp.get("/")
@jwt_required()
@roles_required("CLIENTE")
def listar_pedidos_cliente():
    page, per_page = get_pagination()
    pedidos = _pedido_service.listar_pedidos_cliente(get_jwt_identity())
    pedidos_pag, meta = paginate_sequence(pedidos, page, per_page)
    return jsonify({"pedidos": _resumen_schema.dump(pedidos_pag), "meta": meta})


@bp.get("/<int:pedido_id>")
@jwt_required()
@roles_required("CLIENTE")
def detalle_pedido_cliente(pedido_id: int):
    pedido = _pedido_service.obtener_pedido_cliente(get_jwt_identity(), pedido_id)
    return jsonify({"pedido": _detalle_schema.dump(pedido)})


@bp.get("/tienda")
@jwt_required()
@roles_required("TIENDA")
def listar_pedidos_tienda():
    tienda = _tienda_service.obtener_activa(get_jwt_identity())
    estado = request.args.get("estado")
    page, per_page = get_pagination()
    pedidos = _pedido_service.listar_pedidos_tienda(tienda, estado_codigo=estado)
    pedidos_pag, meta = paginate_sequence(pedidos, page, per_page)
    return jsonify({"pedidos": _resumen_schema.dump(pedidos_pag), "meta": meta})


@bp.patch("/<int:pedido_id>/estado")
@jwt_required()
@roles_required("TIENDA")
def cambiar_estado_pedido(pedido_id: int):
    tienda = _tienda_service.obtener_activa(get_jwt_identity())
    # Verificamos pertenencia antes de actualizar
    _pedido_service.obtener_pedido_tienda(tienda, pedido_id)
    payload = EstadoPedidoSchema().load(request.get_json() or {})
    _pedido_service.cambiar_estado(pedido_id, payload["codigo"], tienda.id_usuario_duenio, payload.get("nota"))
    detalle = _pedido_service.obtener_pedido_tienda(tienda, pedido_id)
    return jsonify({"pedido": _detalle_schema.dump(detalle)})
