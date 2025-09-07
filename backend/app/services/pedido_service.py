from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Iterable

from sqlalchemy.orm import joinedload, selectinload

from ..extensions import db
from ..models import (
    Direccion,
    EstadoPedido,
    HistorialEstadoPedido,
    ItemPedido,
    Pedido,
    Producto,
    Tienda,
)
from . import NotFoundError, ServiceError
from .carrito_service import CarritoService

_PEDIDO_TRANSICIONES: dict[str, set[str]] = {
    "PENDIENTE": {"CONFIRMADO"},
    "CONFIRMADO": {"ENTREGADO"},
    "ENTREGADO": set(),
}


class PedidoService:
    def __init__(self) -> None:
        self._carrito_service = CarritoService()

    def crear_pedido(self, user_id: int, direccion_id: int, notas: str | None = None) -> Pedido:
        carrito = self._carrito_service.obtener(user_id)
        if not carrito.items:
            raise ServiceError("El carrito esta vacio", status_code=400)

        direccion = Direccion.query.filter_by(id_direccion=direccion_id, id_usuario=user_id).first()
        if not direccion:
            raise NotFoundError("Direccion no encontrada")

        resumen = self._carrito_service.resumen(carrito)
        tienda = resumen["tienda"]
        if not tienda or not tienda.activo:
            raise ServiceError("La tienda asociada no esta activa", status_code=400)

        estado_inicial = self._estado_por_codigo("PENDIENTE")

        pedido = Pedido(
            id_cliente=user_id,
            id_tienda=tienda.id_tienda,
            id_direccion_entrega=direccion.id_direccion,
            id_estado_pedido=estado_inicial.id_estado_pedido,
            subtotal_q=resumen["subtotal"],
            envio_q=resumen["envio"],
            total_q=resumen["total"],
            peso_total_kg=resumen["peso_total"],
            notas=notas,
        )
        db.session.add(pedido)
        db.session.flush()

        for item in carrito.items:
            producto = (
                db.session.query(Producto)
                .filter_by(id_producto=item.id_producto)
                .with_for_update()
                .one()
            )
            if producto.stock < item.cantidad:
                raise ServiceError(f"Stock insuficiente para {producto.nombre}", status_code=422)
            producto.stock -= item.cantidad
            db.session.add(
                ItemPedido(
                    pedido=pedido,
                    producto=producto,
                    nombre_producto=producto.nombre,
                    precio_unit_q=producto.precio,
                    peso_unit_kg=producto.peso_kg,
                    cantidad=item.cantidad,
                    total_linea_q=Decimal(producto.precio) * item.cantidad,
                )
            )

        db.session.add(
            HistorialEstadoPedido(
                pedido=pedido,
                id_estado_pedido=estado_inicial.id_estado_pedido,
                cambiado_por=user_id,
                nota="Pedido creado",
            )
        )

        self._carrito_service.vaciar(user_id)
        db.session.commit()
        return pedido

    def listar_pedidos_cliente(self, user_id: int) -> Iterable[Pedido]:
        return (
            Pedido.query.options(selectinload(Pedido.items))
            .filter_by(id_cliente=user_id)
            .order_by(Pedido.creado_en.desc())
            .all()
        )

    def obtener_pedido_cliente(self, user_id: int, pedido_id: int) -> Pedido:
        pedido = (
            Pedido.query.options(
                selectinload(Pedido.items),
                selectinload(Pedido.historial).joinedload(HistorialEstadoPedido.estado),
                joinedload(Pedido.tienda),
                joinedload(Pedido.estado),
            )
            .filter_by(id_pedido=pedido_id, id_cliente=user_id)
            .first()
        )
        if not pedido:
            raise NotFoundError("Pedido no encontrado")
        return pedido

    def listar_pedidos_tienda(self, tienda: Tienda, estado_codigo: str | None = None) -> Iterable[Pedido]:
        query = (
            Pedido.query.options(selectinload(Pedido.items), joinedload(Pedido.estado))
            .filter_by(id_tienda=tienda.id_tienda)
            .order_by(Pedido.creado_en.desc())
        )
        if estado_codigo:
            estado = self._estado_por_codigo(estado_codigo)
            query = query.filter(Pedido.id_estado_pedido == estado.id_estado_pedido)
        return query.all()

    def obtener_pedido_tienda(self, tienda: Tienda, pedido_id: int) -> Pedido:
        pedido = (
            Pedido.query.options(
                selectinload(Pedido.items),
                selectinload(Pedido.historial).joinedload(HistorialEstadoPedido.estado),
                joinedload(Pedido.tienda),
                joinedload(Pedido.estado),
            )
            .filter_by(id_pedido=pedido_id, id_tienda=tienda.id_tienda)
            .first()
        )
        if not pedido:
            raise NotFoundError("Pedido no encontrado")
        return pedido

    def cambiar_estado(self, pedido_id: int, codigo_estado: str, actor_id: int, nota: str | None = None) -> Pedido:
        pedido = Pedido.query.get(pedido_id)
        if not pedido:
            raise NotFoundError("Pedido no encontrado")

        estado = self._estado_por_codigo(codigo_estado)
        if pedido.estado and pedido.estado.id_estado_pedido == pedido.id_estado_pedido:
            estado_actual = pedido.estado.codigo
        else:
            estado_actual_obj = EstadoPedido.query.get(pedido.id_estado_pedido)
            estado_actual = estado_actual_obj.codigo if estado_actual_obj else None

        if estado_actual == codigo_estado:
            return pedido
        if estado_actual and codigo_estado not in _PEDIDO_TRANSICIONES.get(estado_actual, set()):
            raise ServiceError("Transicion de pedido no valida", status_code=422)

        pedido.id_estado_pedido = estado.id_estado_pedido
        pedido.estado = estado
        if codigo_estado == "CONFIRMADO" and not pedido.confirmado_en:
            pedido.confirmado_en = datetime.utcnow()
        db.session.add(
            HistorialEstadoPedido(
                pedido=pedido,
                id_estado_pedido=estado.id_estado_pedido,
                cambiado_por=actor_id,
                nota=nota,
            )
        )
        db.session.commit()
        return pedido

    def _estado_por_codigo(self, codigo: str) -> EstadoPedido:
        estado = EstadoPedido.query.filter_by(codigo=codigo).first()
        if not estado:
            raise NotFoundError(f"Estado {codigo} no configurado")
        return estado
