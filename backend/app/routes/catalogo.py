from __future__ import annotations

from flask import Blueprint, jsonify, request

from ..models.categoria import Categoria
from ..schemas.categoria import CategoriaSchema
from ..schemas.producto import ProductoSchema
from ..schemas.tienda import TiendaDetalleSchema, TiendaPublicSchema
from ..services.catalogo_service import CatalogoService
from ..utils.pagination import get_pagination, paginate_sequence

bp = Blueprint("catalogo", __name__)

_catalogo_service = CatalogoService()
_tiendas_schema = TiendaPublicSchema(many=True)
_tienda_detalle_schema = TiendaDetalleSchema()
_productos_schema = ProductoSchema(many=True)
_categorias_schema = CategoriaSchema(many=True)


@bp.get("/tiendas")
def listar_tiendas():
    args = request.args
    categoria_id = int(args.get("categoria")) if args.get("categoria") else None
    ciudad = args.get("ciudad")
    texto = args.get("q")
    solo_abiertas = args.get("abiertas") == "1"
    page, per_page = get_pagination()
    tiendas = _catalogo_service.listar_tiendas(
        categoria_id=categoria_id,
        texto=texto,
        ciudad=ciudad,
        solo_abiertas=solo_abiertas,
    )
    tiendas_pag, meta = paginate_sequence(tiendas, page, per_page)
    return jsonify({"tiendas": _tiendas_schema.dump(tiendas_pag), "meta": meta})


@bp.get("/tiendas/<int:tienda_id>")
def detalle_tienda(tienda_id: int):
    try:
        tienda = _catalogo_service.detalle_tienda(tienda_id)
    except LookupError:
        return jsonify({"message": "Tienda no encontrada"}), 404

    data = _tienda_detalle_schema.dump(tienda)
    return jsonify({"tienda": data})


@bp.get("/productos")
def buscar_productos():
    texto = request.args.get("q", "")
    page, per_page = get_pagination()
    if not texto:
        _, meta = paginate_sequence([], page, per_page)
        return jsonify({"productos": [], "meta": meta})
    categoria_id = int(request.args.get("categoria")) if request.args.get("categoria") else None
    tienda_id = int(request.args.get("tienda")) if request.args.get("tienda") else None
    productos = _catalogo_service.buscar_productos(texto, categoria_id=categoria_id, tienda_id=tienda_id)
    productos_pag, meta = paginate_sequence(productos, page, per_page)
    return jsonify({"productos": _productos_schema.dump(productos_pag), "meta": meta})


@bp.get("/categorias")
def listar_categorias():
    categorias = Categoria.query.filter_by(activo=True).order_by(Categoria.nombre).all()
    return jsonify({"categorias": _categorias_schema.dump(categorias)})
