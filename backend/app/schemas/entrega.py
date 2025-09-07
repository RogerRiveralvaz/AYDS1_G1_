from marshmallow import Schema, fields

from .pedido import PedidoResumenSchema


class EntregaSchema(Schema):
    id_entrega = fields.Int()
    estado = fields.Str(attribute="estado.nombre")
    codigo_estado = fields.Str(attribute="estado.codigo")
    asignada_en = fields.DateTime()
    aceptada_en = fields.DateTime(allow_none=True)
    recogida_en = fields.DateTime(allow_none=True)
    entregada_en = fields.DateTime(allow_none=True)
    pedido = fields.Nested(PedidoResumenSchema)


class SeguimientoSchema(Schema):
    id_seguimiento = fields.Int()
    ubicacion = fields.Str()
    registrado_en = fields.DateTime()
    nota_estado = fields.Str(allow_none=True)
