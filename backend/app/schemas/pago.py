from marshmallow import Schema, fields, validate


class PagoCreateSchema(Schema):
    pedido_id = fields.Int(required=True)
    monto_q = fields.Decimal(required=True, as_string=True)
    moneda = fields.Str(load_default="GTQ", validate=validate.Length(equal=3))
    metodo = fields.Str(required=True, validate=validate.Length(min=3, max=40))
    estado = fields.Str(load_default="PENDIENTE", validate=validate.Length(min=3, max=24))
    proveedor = fields.Str(load_default=None, validate=validate.Length(max=40))
    referencia_proveedor = fields.Str(load_default=None, validate=validate.Length(max=80))
    pagado_en = fields.DateTime(load_default=None)


class PagoSchema(Schema):
    id_pago = fields.Int(dump_only=True)
    monto_q = fields.Decimal(as_string=True)
    moneda = fields.Str()
    metodo = fields.Str()
    estado = fields.Str()
    proveedor = fields.Str(allow_none=True)
    referencia_proveedor = fields.Str(allow_none=True)
    pagado_en = fields.DateTime(allow_none=True)
    creado_en = fields.DateTime()
