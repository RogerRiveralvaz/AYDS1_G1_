from marshmallow import Schema, fields, validate

from .producto import ProductoSchema
from .usuario import DireccionInputSchema


class HorarioSchema(Schema):
    dia_semana = fields.Int(required=True, validate=validate.Range(min=0, max=6))
    hora_apertura = fields.Time(allow_none=True)
    hora_cierre = fields.Time(allow_none=True)
    cerrado = fields.Bool(load_default=False)


class TiendaUpdateSchema(Schema):
    razon_social = fields.Str(validate=validate.Length(min=3, max=160))
    identificacion_legal = fields.Str(load_default=None, validate=validate.Length(max=32))
    email = fields.Email(load_default=None)
    telefono = fields.Str(validate=validate.Length(min=6, max=32))
    url_logo = fields.URL(load_default=None)
    id_categoria = fields.Int(load_default=None)
    cuenta_bancaria = fields.Str(validate=validate.Length(min=6, max=64))
    direccion = fields.Nested(DireccionInputSchema, load_default=None)
    horarios = fields.List(fields.Nested(HorarioSchema), load_default=None)
    activo = fields.Bool(load_default=None)


class TiendaPublicSchema(Schema):
    id_tienda = fields.Int()
    nombre = fields.Method("get_nombre")
    logo = fields.Str(attribute="url_logo", allow_none=True)
    categoria = fields.Str(attribute="categoria.nombre", allow_none=True)
    horario = fields.List(fields.Nested(HorarioSchema), attribute="horarios", dump_only=True)
    promocion_activa = fields.Bool(attribute="tiene_promocion", dump_only=True)
    direccion = fields.Str(attribute="direccion.linea1", allow_none=True)
    ciudad = fields.Str(attribute="direccion.ciudad", allow_none=True)
    abierto = fields.Bool(dump_only=True)

    def get_nombre(self, obj):
        return obj.razon_social


class TiendaOwnerSchema(TiendaPublicSchema):
    email = fields.Email()
    telefono = fields.Str()
    cuenta_bancaria = fields.Str()
    estado_aprobacion = fields.Str(attribute="estado_aprobacion.nombre", dump_only=True)
    direccion_detalle = fields.Nested(DireccionInputSchema, attribute="direccion", dump_only=True)
    horarios = fields.List(fields.Nested(HorarioSchema), dump_only=True)


class TiendaDetalleSchema(TiendaPublicSchema):
    productos = fields.Dict(
        keys=fields.Str(),
        values=fields.List(fields.Nested(ProductoSchema)),
        attribute="productos_catalogo",
        dump_only=True,
    )
    reportes = fields.Dict(dump_only=True)


class TiendaDashboardSchema(Schema):
    pedidos_totales = fields.Int()
    ingresos = fields.Decimal(as_string=True)
    productos_vendidos = fields.Int()
    clientes_unicos = fields.Int()


class TarifaEnvioSchema(Schema):
    tarifa_base_q = fields.Decimal(required=True, as_string=True)
    base_kg = fields.Decimal(required=True, as_string=True)
    extra_q_por_kg = fields.Decimal(required=True, as_string=True)
    activo = fields.Bool(load_default=True)
