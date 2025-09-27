from __future__ import annotations

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from ..schemas.producto import (
    ProductoCreateSchema,
    ProductoSchema,
    ProductoUpdateSchema,
)
from ..schemas.tienda import (
    TarifaEnvioSchema,
    TiendaDashboardSchema,
    TiendaOwnerSchema,
    TiendaUpdateSchema,
)
from ..services import ServiceError
from ..services.producto_service import ProductoService
from ..services.tienda_service import TiendaService
from ..utils.decorators import roles_required

bp = Blueprint("tiendas", __name__)

_tienda_service = TiendaService()
_producto_service = ProductoService()
_tienda_schema = TiendaOwnerSchema()
_dashboard_schema = TiendaDashboardSchema()
_producto_schema = ProductoSchema()
_productos_schema = ProductoSchema(many=True)
_tarifa_schema = TarifaEnvioSchema()
_update_schema = TiendaUpdateSchema()
_crear_producto_schema = ProductoCreateSchema()
_update_producto_schema = ProductoUpdateSchema(partial=True)


@bp.errorhandler(ServiceError)
def _handle_service_error(err: ServiceError):
    return jsonify({"message": err.message}), err.status_code


@bp.get("/mi")
@jwt_required()
@roles_required("TIENDA")
def obtener_mi_tienda():
    tienda = _tienda_service.obtener_por_usuario(get_jwt_identity())
    return jsonify({"tienda": _tienda_schema.dump(tienda)})


@bp.patch("/mi")
@jwt_required()
@roles_required("TIENDA")
def actualizar_mi_tienda():
    payload = _update_schema.load(request.get_json() or {})
    tienda = _tienda_service.obtener_por_usuario(get_jwt_identity())
    tienda = _tienda_service.actualizar_tienda(tienda, payload)
    return jsonify({"tienda": _tienda_schema.dump(tienda)})


@bp.get("/mi/reportes")
@jwt_required()
@roles_required("TIENDA")
def obtener_reportes():
    tienda = _tienda_service.obtener_activa(get_jwt_identity())
    resumen = _tienda_service.resumen(tienda)
    return jsonify({"resumen": _dashboard_schema.dump(resumen)})


@bp.get("/mi/productos")
@jwt_required()
@roles_required("TIENDA")
def listar_productos():
    tienda = _tienda_service.obtener_activa(get_jwt_identity())
    productos = _producto_service.listar_por_tienda(tienda)
    return jsonify({"productos": _productos_schema.dump(productos)})



@bp.get("/mi/productos/<int:producto_id>")
@jwt_required()
@roles_required("TIENDA")
def obtener_producto(producto_id: int):
    tienda = _tienda_service.obtener_activa(get_jwt_identity())
    producto = _producto_service.obtener(tienda, producto_id)
    return jsonify({"producto": _producto_schema.dump(producto)})

@bp.post("/mi/productos")
@jwt_required()
@roles_required("TIENDA")
def crear_producto():
    tienda = _tienda_service.obtener_activa(get_jwt_identity())
    payload = _crear_producto_schema.load(request.get_json() or {})
    producto = _producto_service.crear(tienda, payload)
    return jsonify({"producto": _producto_schema.dump(producto)}), 201


@bp.patch("/mi/productos/<int:producto_id>")
@jwt_required()
@roles_required("TIENDA")
def actualizar_producto(producto_id: int):
    tienda = _tienda_service.obtener_activa(get_jwt_identity())
    payload = _update_producto_schema.load(request.get_json() or {})
    producto = _producto_service.obtener(tienda, producto_id)
    producto = _producto_service.actualizar(producto, payload, tienda)
    return jsonify({"producto": _producto_schema.dump(producto)})


@bp.patch("/mi/productos/<int:producto_id>/estado")
@jwt_required()
@roles_required("TIENDA")
def cambiar_estado_producto(producto_id: int):
    tienda = _tienda_service.obtener_activa(get_jwt_identity())
    datos = request.get_json(silent=True) or {}
    if "activo" not in datos:
        return jsonify({"message": "Se requiere el estado 'activo'"}), 400
    producto = _producto_service.obtener(tienda, producto_id)
    producto = _producto_service.cambiar_estado(producto, bool(datos["activo"]))
    return jsonify({"producto": _producto_schema.dump(producto)})


@bp.delete("/mi/productos/<int:producto_id>")
@jwt_required()
@roles_required("TIENDA")
def eliminar_producto(producto_id: int):
    tienda = _tienda_service.obtener_activa(get_jwt_identity())
    producto = _producto_service.obtener(tienda, producto_id)
    _producto_service.eliminar(producto)
    return jsonify({"message": "Producto eliminado"})


@bp.get("/mi/tarifa")
@jwt_required()
@roles_required("TIENDA")
def obtener_tarifa():
    tienda = _tienda_service.obtener_activa(get_jwt_identity())
    tarifa = _tienda_service.listar_tarifas(tienda)
    if not tarifa:
        return jsonify({"tarifa": None})
    return jsonify({"tarifa": _tarifa_schema.dump(tarifa[0])})


@bp.put("/mi/tarifa")
@jwt_required()
@roles_required("TIENDA")
def actualizar_tarifa():
    tienda = _tienda_service.obtener_activa(get_jwt_identity())
    payload = _tarifa_schema.load(request.get_json() or {})
    tarifa = _tienda_service.actualizar_tarifa(tienda, payload)
    return jsonify({"tarifa": _tarifa_schema.dump(tarifa)})
