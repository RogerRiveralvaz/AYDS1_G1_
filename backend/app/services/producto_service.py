from __future__ import annotations

from typing import Iterable

from ..extensions import db
from ..models import AlertaStock, ImagenProducto, Producto, Tienda
from ..utils.mailer import EmailMessage, send_email
from . import NotFoundError


class ProductoService:
    def listar_por_tienda(self, tienda: Tienda) -> list[Producto]:
        return Producto.query.filter_by(id_tienda=tienda.id_tienda).order_by(Producto.nombre).all()

    def obtener(self, tienda: Tienda, producto_id: int) -> Producto:
        producto = Producto.query.filter_by(id_tienda=tienda.id_tienda, id_producto=producto_id).first()
        if not producto:
            raise NotFoundError("Producto no encontrado")
        return producto

    def crear(self, tienda: Tienda, data: dict) -> Producto:
        producto = Producto(id_tienda=tienda.id_tienda)
        self._actualizar_datos(producto, data)
        db.session.add(producto)
        db.session.commit()
        self._sincronizar_imagenes(producto, data.get("imagenes", []))
        db.session.commit()
        self._verificar_stock(producto, tienda)
        db.session.commit()
        return producto

    def actualizar(self, producto: Producto, data: dict, tienda: Tienda) -> Producto:
        self._actualizar_datos(producto, data)
        if "imagenes" in data:
            self._sincronizar_imagenes(producto, data.get("imagenes", []))
        db.session.commit()
        self._verificar_stock(producto, tienda)
        db.session.commit()
        return producto

    def cambiar_estado(self, producto: Producto, activo: bool) -> Producto:
        producto.activo = activo
        db.session.commit()
        return producto

    def eliminar(self, producto: Producto) -> None:
        db.session.delete(producto)
        db.session.commit()

    # Helpers
    def _actualizar_datos(self, producto: Producto, data: dict) -> None:
        for campo in [
            "nombre",
            "descripcion_corta",
            "precio",
            "peso_kg",
            "sku",
            "stock",
            "umbral_bajo",
            "es_oferta",
            "es_nuevo",
            "activo",
            "id_categoria",
        ]:
            if campo in data and data[campo] is not None:
                setattr(producto, campo, data[campo])

    def _sincronizar_imagenes(self, producto: Producto, imagenes: Iterable[dict]) -> None:
        producto.imagenes.clear()
        for imagen in imagenes:
            url = imagen.get("url")
            if not url:
                continue
            producto.imagenes.append(
                ImagenProducto(
                    url=url,
                    principal=bool(imagen.get("principal", False)),
                    orden=int(imagen.get("orden", 0)),
                )
            )

    def _verificar_stock(self, producto: Producto, tienda: Tienda) -> None:
        if producto.stock is None or producto.umbral_bajo is None:
            return
        if producto.stock > producto.umbral_bajo:
            return

        alerta = AlertaStock(id_producto=producto.id_producto, stock_momento=producto.stock)
        db.session.add(alerta)

        subject = f"Alerta de stock bajo: {producto.nombre}"
        body = (
            f"El producto {producto.nombre} de la tienda {tienda.razon_social} tiene un stock actual "
            f"de {producto.stock} unidades, por debajo del umbral configurado ({producto.umbral_bajo})."
        )
        if tienda.email:
            send_email(EmailMessage(to=[tienda.email], subject=subject, body=body))
