from marshmallow import Schema, fields, validate

_ROLES = ["CLIENTE", "TIENDA", "REPARTIDOR", "ADMIN"]


class DireccionInputSchema(Schema):
    etiqueta = fields.Str(load_default=None)
    linea1 = fields.Str(required=True, validate=validate.Length(min=3, max=160))
    linea2 = fields.Str(load_default=None, validate=validate.Length(max=160))
    ciudad = fields.Str(required=True, validate=validate.Length(min=2, max=80))
    estado = fields.Str(load_default=None, validate=validate.Length(max=80))
    codigo_postal = fields.Str(load_default=None, validate=validate.Length(max=20))
    pais = fields.Str(load_default="GT", validate=validate.Length(equal=2))
    ubicacion = fields.Str(load_default=None)


class RepartidorInputSchema(Schema):
    dpi = fields.Str(required=True, validate=validate.Length(min=6, max=32))
    licencia_numero = fields.Str(load_default=None, validate=validate.Length(max=32))
    licencia_tipo = fields.Str(load_default=None, validate=validate.OneOf(["MOTO", "AUTO", "NO_APLICA"]))
    vehiculo_tipo = fields.Str(required=True, validate=validate.OneOf(["BICICLETA", "MOTO", "AUTO"]))
    placa = fields.Str(load_default=None, validate=validate.Length(max=16))
    cuenta_bancaria = fields.Str(required=True, validate=validate.Length(min=6, max=64))
    url_foto = fields.URL(required=True)


class TiendaInputSchema(Schema):
    razon_social = fields.Str(required=True, validate=validate.Length(min=3, max=160))
    identificacion_legal = fields.Str(load_default=None, validate=validate.Length(max=32))
    email = fields.Email(required=True)
    telefono = fields.Str(required=True, validate=validate.Length(min=6, max=32))
    url_logo = fields.URL(load_default=None)
    id_categoria = fields.Int(load_default=None)
    cuenta_bancaria = fields.Str(required=True, validate=validate.Length(min=6, max=64))
    direccion = fields.Nested(DireccionInputSchema, required=False)


class UsuarioRegisterSchema(Schema):
    rol_codigo = fields.Str(required=True, validate=validate.OneOf(_ROLES))
    nombres = fields.Str(required=True, validate=validate.Length(min=2, max=80))
    apellidos = fields.Str(required=True, validate=validate.Length(min=2, max=80))
    email = fields.Email(required=True)
    password = fields.Str(required=True, validate=validate.Length(min=10))
    genero = fields.Str(load_default=None, validate=validate.OneOf(["M", "F", "O"]))
    telefono = fields.Str(load_default=None, validate=validate.Length(max=32))
    fecha_nacimiento = fields.Date(load_default=None)
    url_foto = fields.URL(load_default=None)
    direccion = fields.Nested(DireccionInputSchema, load_default=None)
    repartidor = fields.Nested(RepartidorInputSchema, load_default=None)
    tienda = fields.Nested(TiendaInputSchema, load_default=None)


class LoginSchema(Schema):
    email = fields.Email(required=True)
    password = fields.Str(required=True, validate=validate.Length(min=6))


class VerifyEmailSchema(Schema):
    email = fields.Email(required=True)
    codigo = fields.Str(required=True, validate=validate.Length(equal=6))


class UsuarioUpdateSchema(Schema):
    activo = fields.Bool(load_default=None)
    roles = fields.List(fields.Str(validate=validate.OneOf(_ROLES)), load_default=None)


class UsuarioSchema(Schema):
    id_usuario = fields.Int(dump_only=True)
    email = fields.Email(dump_only=True)
    nombres = fields.Str(dump_only=True)
    apellidos = fields.Str(dump_only=True)
    genero = fields.Str(dump_only=True)
    telefono = fields.Str(dump_only=True)
    fecha_nacimiento = fields.Date(dump_only=True)
    url_foto = fields.URL(dump_only=True, allow_none=True)
    activo = fields.Bool(dump_only=True)
    roles = fields.Method("get_roles", dump_only=True)

    class Meta:
        ordered = True

    def get_roles(self, obj):
        if not getattr(obj, "roles", None):
            return []
        return [rel.rol.codigo for rel in obj.roles]


class PerfilRepartidorAdminSchema(Schema):
    id_usuario = fields.Int()
    dpi = fields.Str()
    licencia_numero = fields.Str(allow_none=True)
    licencia_tipo = fields.Str(allow_none=True)
    vehiculo_tipo = fields.Str()
    placa = fields.Str(allow_none=True)
    cuenta_bancaria = fields.Str()
    estado_aprobacion = fields.Str(attribute="estado_aprobacion.nombre")
    activo = fields.Bool()
    usuario = fields.Nested(UsuarioSchema)

