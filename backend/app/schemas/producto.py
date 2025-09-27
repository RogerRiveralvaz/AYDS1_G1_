from marshmallow import Schema, fields, validate


class ImagenProductoSchema(Schema):
    url = fields.URL(required=True)
    principal = fields.Bool(load_default=False)
    orden = fields.Int(load_default=0)


class ProductoBaseSchema(Schema):
    nombre = fields.Str(required=True, validate=validate.Length(min=2, max=160))
    descripcion_corta = fields.Str(load_default=None, validate=validate.Length(max=300))
    precio = fields.Decimal(required=True, as_string=True)
    peso_kg = fields.Decimal(required=True, as_string=True)
    sku = fields.Str(load_default=None, validate=validate.Length(max=64))
    stock = fields.Int(required=True, validate=validate.Range(min=0))
    umbral_bajo = fields.Int(load_default=5, validate=validate.Range(min=0))
    es_oferta = fields.Bool(load_default=False)
    es_nuevo = fields.Bool(load_default=False)
    activo = fields.Bool(load_default=True)
    id_categoria = fields.Int(load_default=None)


class ProductoCreateSchema(ProductoBaseSchema):
    imagenes = fields.List(fields.Nested(ImagenProductoSchema), load_default=[])


class ProductoUpdateSchema(ProductoBaseSchema):
    nombre = fields.Str(validate=validate.Length(min=2, max=160))
    precio = fields.Decimal(as_string=True)
    peso_kg = fields.Decimal(as_string=True)
    stock = fields.Int(validate=validate.Range(min=0))
    imagenes = fields.List(fields.Nested(ImagenProductoSchema), load_default=None)


class ProductoSchema(Schema):
    id_producto = fields.Int(dump_only=True)
    nombre = fields.Str()
    descripcion_corta = fields.Str(allow_none=True)
    precio = fields.Decimal(as_string=True)
    peso_kg = fields.Decimal(as_string=True)
    sku = fields.Str(allow_none=True)
    stock = fields.Int()
    es_oferta = fields.Bool()
    es_nuevo = fields.Bool()
    activo = fields.Bool()
    id_categoria = fields.Int(allow_none=True)
    imagenes = fields.List(fields.Nested(ImagenProductoSchema), dump_only=True)

    class Meta:
        ordered = True
