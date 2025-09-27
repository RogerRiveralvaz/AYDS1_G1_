from marshmallow import Schema, fields

from .tienda import TiendaPublicSchema


class ItemPedidoSchema(Schema):
    id_item_pedido = fields.Int(dump_only=True)
    id_producto = fields.Int(attribute="id_producto", dump_only=True)
    nombre_producto = fields.Str()
    precio_unit_q = fields.Decimal(as_string=True)
    cantidad = fields.Int()
    total_linea_q = fields.Decimal(as_string=True)


class HistorialEstadoSchema(Schema):
    estado = fields.Str(attribute="estado.nombre")
    codigo = fields.Str(attribute="estado.codigo")
    cambiado_por = fields.Int()
    cambiado_en = fields.DateTime()
    nota = fields.Str(allow_none=True)


class PedidoResumenSchema(Schema):
    id_pedido = fields.Int()
    estado = fields.Str(attribute="estado.nombre")
    codigo_estado = fields.Str(attribute="estado.codigo")
    subtotal_q = fields.Decimal(as_string=True)
    envio_q = fields.Decimal(as_string=True)
    total_q = fields.Decimal(as_string=True)
    peso_total_kg = fields.Decimal(as_string=True)
    creado_en = fields.DateTime()
    tienda = fields.Nested(TiendaPublicSchema)


class PedidoDetalleSchema(PedidoResumenSchema):
    direccion_entrega = fields.Str(attribute="direccion_entrega.linea1")
    items = fields.List(fields.Nested(ItemPedidoSchema))
    historial = fields.List(fields.Nested(HistorialEstadoSchema))
    notas = fields.Str(allow_none=True)
