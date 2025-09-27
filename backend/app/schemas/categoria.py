from __future__ import annotations

from marshmallow import Schema, fields


class CategoriaSchema(Schema):
    id_categoria = fields.Int()
    nombre = fields.Str()
    slug = fields.Str()
    activo = fields.Bool()
