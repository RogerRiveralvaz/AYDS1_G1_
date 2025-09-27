
from marshmallow import Schema, fields

from .pedido import PedidoResumenSchema
from .usuario import DireccionSchema, UsuarioSchema


class ClienteAdminSchema(UsuarioSchema):
    direcciones = fields.List(fields.Nested(DireccionSchema), dump_only=True)
    pedidos_totales = fields.Int(dump_only=True)
    historial_pedidos = fields.List(fields.Nested(PedidoResumenSchema), dump_only=True)


class RepartidorAdminSchema(Schema):
    id_usuario = fields.Int()
    nombre_completo = fields.Str()
    email = fields.Email()
    telefono = fields.Str(allow_none=True)
    estado_aprobacion = fields.Str()
    activo = fields.Bool()
    vehiculo_tipo = fields.Str()
    cuenta_bancaria = fields.Str()
    url_foto = fields.URL()
    licencia_numero = fields.Str(allow_none=True)
    licencia_tipo = fields.Str(allow_none=True)
    placa = fields.Str(allow_none=True)
    updated_at = fields.DateTime(attribute="aprobado_en", allow_none=True)


class TiendaAdminSchema(Schema):
    id_tienda = fields.Int()
    razon_social = fields.Str()
    email = fields.Email()
    telefono = fields.Str()
    estado_aprobacion = fields.Str(attribute="estado_aprobacion.codigo")
    estado_aprobacion_nombre = fields.Str(attribute="estado_aprobacion.nombre")
    activo = fields.Bool()
    categoria = fields.Str(attribute="categoria.nombre", allow_none=True)
    direccion = fields.Str(attribute="direccion.linea1", allow_none=True)
    ciudad = fields.Str(attribute="direccion.ciudad", allow_none=True)
    duenio = fields.Str(attribute="duenio.nombres")
