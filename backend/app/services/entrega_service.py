from __future__ import annotations

from datetime import datetime, timezone
from typing import Iterable

from sqlalchemy.orm import joinedload, selectinload

from ..extensions import db
from ..models import Entrega, EstadoEntrega, EstadoPedido, Pedido, PerfilRepartidor, SeguimientoEntrega, Tienda
from . import NotFoundError, ServiceError
from .pedido_service import PedidoService

_ENTREGA_TRANSICIONES: dict[str, set[str]] = {
    "ASIGNADA": {"ACEPTADA", "CANCELADA"},
    "ACEPTADA": {"EN_CAMINO", "CANCELADA"},
    "EN_CAMINO": {"ENTREGADA"},
    "ENTREGADA": set(),
    "CANCELADA": set(),
}


class EntregaService:
    def __init__(self) -> None:
        self._pedido_service = PedidoService()

    def asignar_entrega(self, tienda: Tienda, pedido_id: int, repartidor_id: int) -> Entrega:
        pedido = self._pedido_service.obtener_pedido_tienda(tienda, pedido_id)
        if Entrega.query.filter_by(id_pedido=pedido_id).first():
            raise ServiceError("El pedido ya tiene una entrega asignada", status_code=409)

        perfil = PerfilRepartidor.query.filter_by(id_usuario=repartidor_id, activo=True).first()
        if not perfil:
            raise ServiceError("El repartidor no esta activo", status_code=400)

        estado = self._estado_por_codigo("ASIGNADA")
        entrega = Entrega(
            pedido=pedido,
            id_repartidor=repartidor_id,
            id_estado_entrega=estado.id_estado_entrega,
            asignada_en=datetime.now(timezone.utc),
        )
        db.session.add(entrega)
        db.session.commit()
        return entrega

    def listar_para_repartidor(self, repartidor_id: int, codigo_estado: str | None = None) -> Iterable[Entrega]:
        query = (
            Entrega.query.options(
                joinedload(Entrega.pedido).joinedload(Pedido.tienda),
                joinedload(Entrega.estado),
            )
            .filter_by(id_repartidor=repartidor_id)
            .order_by(Entrega.asignada_en.desc())
        )
        if codigo_estado:
            estado = self._estado_por_codigo(codigo_estado)
            query = query.filter(Entrega.id_estado_entrega == estado.id_estado_entrega)
        return query.all()

    def obtener_para_repartidor(self, repartidor_id: int, entrega_id: int) -> Entrega:
        entrega = (
            Entrega.query.options(
                selectinload(Entrega.seguimiento),
                joinedload(Entrega.pedido).selectinload(Pedido.items),
                joinedload(Entrega.estado),
            )
            .filter_by(id_entrega=entrega_id, id_repartidor=repartidor_id)
            .first()
        )
        if not entrega:
            raise NotFoundError("Entrega no encontrada")
        return entrega

    def cambiar_estado(self, entrega: Entrega, codigo_estado: str) -> Entrega:
        entrega = Entrega.query.options(joinedload(Entrega.estado)).get(entrega.id_entrega)
        if not entrega:
            raise NotFoundError("Entrega no encontrada")

        estado = self._estado_por_codigo(codigo_estado)
        if entrega.estado and entrega.estado.id_estado_entrega == entrega.id_estado_entrega:
            estado_actual = entrega.estado.codigo
        else:
            estado_actual_obj = EstadoEntrega.query.get(entrega.id_estado_entrega)
            estado_actual = estado_actual_obj.codigo if estado_actual_obj else None

        if estado_actual == codigo_estado:
            return entrega
        if estado_actual and codigo_estado not in _ENTREGA_TRANSICIONES.get(estado_actual, set()):
            raise ServiceError("Transicion de entrega no valida", status_code=422)

        entrega.id_estado_entrega = estado.id_estado_entrega
        entrega.estado = estado
        ahora = datetime.now(timezone.utc)
        self._aplicar_transicion(entrega, codigo_estado, ahora)
        db.session.commit()
        return entrega

    def _aplicar_transicion(self, entrega: Entrega, codigo_estado: str, marca_tiempo: datetime) -> None:
        if codigo_estado == "ACEPTADA":
            entrega.aceptada_en = marca_tiempo
            return
        if codigo_estado == "EN_CAMINO":
            entrega.recogida_en = marca_tiempo
            return
        if codigo_estado == "ENTREGADA":
            entrega.entregada_en = marca_tiempo
            self._finalizar_pedido(entrega)
            return
        if codigo_estado == "CANCELADA":
            entrega.aceptada_en = None
            entrega.recogida_en = None
            entrega.entregada_en = None

    def _finalizar_pedido(self, entrega: Entrega) -> None:
        pedido = entrega.pedido or Pedido.query.get(entrega.id_pedido)
        if not pedido:
            return
        if pedido.estado and pedido.estado.id_estado_pedido == pedido.id_estado_pedido:
            pedido_estado = pedido.estado.codigo
        else:
            pedido_estado_obj = EstadoPedido.query.get(pedido.id_estado_pedido)
            pedido_estado = pedido_estado_obj.codigo if pedido_estado_obj else None
        if pedido_estado not in {"CONFIRMADO", "ENTREGADO"}:
            self._pedido_service.cambiar_estado(
                entrega.id_pedido,
                "CONFIRMADO",
                entrega.id_repartidor,
                "Confirmacion automatica por entrega",
            )
        self._pedido_service.cambiar_estado(
            entrega.id_pedido,
            "ENTREGADO",
            entrega.id_repartidor,
            "Entrega confirmada",
        )

    def registrar_seguimiento(self, entrega: Entrega, lat: float, lng: float, nota: str | None = None) -> SeguimientoEntrega:
        seguimiento = SeguimientoEntrega(
            entrega=entrega,
            id_repartidor=entrega.id_repartidor,
            ubicacion=f"{lat},{lng}",
            nota_estado=nota,
        )
        db.session.add(seguimiento)
        db.session.commit()
        return seguimiento

    def _estado_por_codigo(self, codigo: str) -> EstadoEntrega:
        estado = EstadoEntrega.query.filter_by(codigo=codigo).first()
        if not estado:
            raise NotFoundError(f"Estado de entrega {codigo} no configurado")
        return estado
