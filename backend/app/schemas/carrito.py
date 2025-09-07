from marshmallow import Schema, fields

from .tienda import TiendaPublicSchema


class ItemCarritoSchema(Schema):
    id_item_carrito = fields.Int(dump_only=True)
    id_producto = fields.Int(attribute="id_producto", dump_only=True)
    nombre = fields.Str(attribute="producto.nombre", dump_only=True)
    precio_unitario = fields.Decimal(attribute="producto.precio", as_string=True, dump_only=True)
    cantidad = fields.Int()
    subtotal = fields.Method("get_subtotal", dump_only=True)

    def get_subtotal(self, obj):
        return str(obj.cantidad * obj.producto.precio)


class CarritoResumenSchema(Schema):
    subtotal = fields.Decimal(as_string=True)
    envio = fields.Decimal(as_string=True)
    total = fields.Decimal(as_string=True)
    peso_total = fields.Decimal(as_string=True)
    tienda = fields.Nested(TiendaPublicSchema, allow_none=True)


class CarritoDetalleSchema(Schema):
    items = fields.List(fields.Nested(ItemCarritoSchema))
    resumen = fields.Nested(CarritoResumenSchema)
