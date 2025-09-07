from marshmallow import Schema, fields, validate


class RolSchema(Schema):
    id_rol = fields.Int(dump_only=True)
    codigo = fields.Str(required=True)
    nombre = fields.Str(required=True)


class RolCreateSchema(Schema):
    codigo = fields.Str(required=True, validate=validate.Length(min=2, max=32))
    nombre = fields.Str(required=True, validate=validate.Length(min=2, max=64))
