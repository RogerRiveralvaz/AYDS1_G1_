from __future__ import annotations

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from marshmallow import Schema, fields, validate

from ..schemas.tienda import TiendaOwnerSchema
from ..schemas.usuario import PerfilRepartidorAdminSchema, UsuarioSchema
from ..services import ServiceError
from ..services.admin_service import AdminService
from ..utils.decorators import roles_required
from ..utils.pagination import get_pagination, paginate_sequence

bp = Blueprint("admin", __name__)

_admin_service = AdminService()
_tienda_schema = TiendaOwnerSchema(many=True)
_repartidor_schema = PerfilRepartidorAdminSchema(many=True)
_usuario_schema = UsuarioSchema(many=True)


class EstadoAprobacionSchema(Schema):
    codigo = fields.Str(required=True, validate=validate.Length(min=3, max=20))


@bp.errorhandler(ServiceError)
def _handle_service_error(err: ServiceError):
    return jsonify({"message": err.message}), err.status_code


@bp.get("/tiendas")
@jwt_required()
@roles_required("ADMIN")
def listar_tiendas_admin():
    estado = request.args.get("estado")
    page, per_page = get_pagination()
    tiendas = _admin_service.listar_tiendas(estado_codigo=estado)
    tiendas_pag, meta = paginate_sequence(tiendas, page, per_page)
    return jsonify({"tiendas": _tienda_schema.dump(tiendas_pag), "meta": meta})


@bp.patch("/tiendas/<int:tienda_id>")
@jwt_required()
@roles_required("ADMIN")
def actualizar_estado_tienda(tienda_id: int):
    payload = EstadoAprobacionSchema().load(request.get_json() or {})
    tienda = _admin_service.actualizar_estado_tienda(tienda_id, payload["codigo"], get_jwt_identity())
    return jsonify({"tienda": TiendaOwnerSchema().dump(tienda)})


@bp.get("/repartidores")
@jwt_required()
@roles_required("ADMIN")
def listar_repartidores():
    estado = request.args.get("estado")
    page, per_page = get_pagination()
    repartidores = _admin_service.listar_repartidores(estado_codigo=estado)
    repartidores_pag, meta = paginate_sequence(repartidores, page, per_page)
    return jsonify({"repartidores": _repartidor_schema.dump(repartidores_pag), "meta": meta})


@bp.patch("/repartidores/<int:repartidor_id>")
@jwt_required()
@roles_required("ADMIN")
def actualizar_repartidor(repartidor_id: int):
    payload = EstadoAprobacionSchema().load(request.get_json() or {})
    repartidor = _admin_service.actualizar_estado_repartidor(
        repartidor_id, payload["codigo"], get_jwt_identity()
    )
    return jsonify({"repartidor": PerfilRepartidorAdminSchema().dump(repartidor)})


@bp.get("/clientes")
@jwt_required()
@roles_required("ADMIN")
def listar_clientes():
    page, per_page = get_pagination()
    clientes = _admin_service.listar_clientes()
    clientes_pag, meta = paginate_sequence(clientes, page, per_page)
    return jsonify({"clientes": _usuario_schema.dump(clientes_pag), "meta": meta})


@bp.get("/resumen")
@jwt_required()
@roles_required("ADMIN")
def resumen_admin():
    resumen = _admin_service.resumen_metricas()
    return jsonify({"resumen": resumen})
