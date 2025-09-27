from __future__ import annotations

from datetime import datetime

from ..extensions import db
from ..models import Pago, Pedido
from . import NotFoundError, ServiceError


class PagoService:
    def registrar_pago(self, pedido_id: int, data: dict) -> Pago:
        pedido = Pedido.query.get(pedido_id)
        if not pedido:
            raise NotFoundError("Pedido no encontrado")
        monto = data.get("monto_q")
        if monto is None:
            raise ServiceError("Monto requerido", status_code=422)
        pago = Pago(
            pedido=pedido,
            monto_q=monto,
            moneda=data.get("moneda", "GTQ"),
            metodo=data.get("metodo", "EFECTIVO"),
            estado=data.get("estado", "PENDIENTE"),
            proveedor=data.get("proveedor"),
            referencia_proveedor=data.get("referencia_proveedor"),
            pagado_en=data.get("pagado_en", datetime.utcnow()),
        )
        db.session.add(pago)
        db.session.commit()
        return pago

    def listar_por_pedido(self, pedido_id: int) -> list[Pago]:
        return Pago.query.filter_by(id_pedido=pedido_id).order_by(Pago.creado_en.desc()).all()
