from __future__ import annotations

import math
from datetime import datetime
from decimal import Decimal

from sqlalchemy.orm import selectinload

from ..extensions import db
from ..models import Carrito, ItemCarrito, Producto, TarifaEnvio, Tienda
from . import NotFoundError, ServiceError


class CarritoService:
    def obtener(self, user_id: int) -> Carrito:
        carrito = (
            Carrito.query.options(
                selectinload(Carrito.items).selectinload(ItemCarrito.producto).selectinload(Producto.tienda)
            )
            .filter_by(id_usuario=user_id)
            .first()
        )
        if carrito:
            return carrito
        carrito = Carrito(id_usuario=user_id)
        db.session.add(carrito)
        db.session.commit()
        return carrito

    def agregar_producto(self, user_id: int, producto_id: int, cantidad: int) -> Carrito:
        if cantidad <= 0:
            raise ServiceError("La cantidad debe ser positiva", status_code=422)
        carrito = self.obtener(user_id)
        producto = Producto.query.filter_by(id_producto=producto_id, activo=True).first()
        if not producto:
            raise NotFoundError("Producto no disponible")
        if producto.stock < cantidad:
            raise ServiceError("Stock insuficiente", status_code=422)

        if carrito.items and any(item.producto.id_tienda != producto.id_tienda for item in carrito.items):
            raise ServiceError("El carrito solo admite productos de una tienda a la vez", status_code=409)

        item = next((item for item in carrito.items if item.id_producto == producto_id), None)
        if item:
            nueva_cantidad = item.cantidad + cantidad
            if producto.stock < nueva_cantidad:
                raise ServiceError("Stock insuficiente", status_code=422)
            item.cantidad = nueva_cantidad
        else:
            carrito.items.append(ItemCarrito(producto=producto, cantidad=cantidad))

        carrito.actualizado_en = datetime.utcnow()
        db.session.commit()
        return carrito

    def actualizar_cantidad(self, user_id: int, item_id: int, cantidad: int) -> Carrito:
        if cantidad <= 0:
            return self.eliminar_item(user_id, item_id)
        carrito = self.obtener(user_id)
        item = next((i for i in carrito.items if i.id_item_carrito == item_id), None)
        if not item:
            raise NotFoundError("Item no encontrado en el carrito")
        if item.producto.stock < cantidad:
            raise ServiceError("Stock insuficiente", status_code=422)
        item.cantidad = cantidad
        carrito.actualizado_en = datetime.utcnow()
        db.session.commit()
        return carrito

    def eliminar_item(self, user_id: int, item_id: int) -> Carrito:
        carrito = self.obtener(user_id)
        item = next((i for i in carrito.items if i.id_item_carrito == item_id), None)
        if not item:
            raise NotFoundError("Item no encontrado en el carrito")
        carrito.items.remove(item)
        db.session.delete(item)
        carrito.actualizado_en = datetime.utcnow()
        db.session.commit()
        return carrito

    def vaciar(self, user_id: int) -> None:
        carrito = self.obtener(user_id)
        for item in list(carrito.items):
            db.session.delete(item)
        carrito.items.clear()
        carrito.actualizado_en = datetime.utcnow()
        db.session.commit()

    def resumen(self, carrito: Carrito) -> dict:
        subtotal = Decimal("0.00")
        peso_total = Decimal("0.00")
        tienda: Tienda | None = None
        for item in carrito.items:
            producto = item.producto
            subtotal += Decimal(producto.precio) * item.cantidad
            peso_total += Decimal(producto.peso_kg) * item.cantidad
            tienda = producto.tienda

        envio = self._calcular_envio(tienda, peso_total)
        total = subtotal + envio
        return {
            "subtotal": subtotal,
            "peso_total": peso_total,
            "envio": envio,
            "total": total,
            "tienda": tienda,
        }

    def _calcular_envio(self, tienda: Tienda | None, peso_total: Decimal) -> Decimal:
        if not tienda or peso_total <= 0:
            return Decimal("0.00")

        tarifa = self._obtener_tarifa(tienda.id_tienda)
        base = Decimal(str(tarifa.tarifa_base_q))
        base_kg = Decimal(str(tarifa.base_kg))
        extra_valor = Decimal(str(tarifa.extra_q_por_kg))

        if peso_total <= base_kg:
            return base
        extra_peso = peso_total - base_kg
        extra_unidades = Decimal(math.ceil(extra_peso))
        return base + extra_unidades * extra_valor

    def _obtener_tarifa(self, tienda_id: int) -> TarifaEnvio:
        tarifa = (
            TarifaEnvio.query.filter_by(id_tienda=tienda_id, activo=True)
            .order_by(TarifaEnvio.id_tarifa_envio.desc())
            .first()
        )
        if tarifa:
            return tarifa
        tarifa_global = (
            TarifaEnvio.query.filter_by(ambito="GLOBAL", activo=True)
            .order_by(TarifaEnvio.id_tarifa_envio.desc())
            .first()
        )
        if tarifa_global:
            return tarifa_global
        # Valores por defecto segun enunciado: base 5 hasta 2kg y 2 por kilogramo extra
        return TarifaEnvio(
            tarifa_base_q=Decimal("5.00"),
            base_kg=Decimal("2"),
            extra_q_por_kg=Decimal("2.00"),
        )
