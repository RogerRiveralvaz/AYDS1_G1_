from __future__ import annotations

from sqlalchemy import func
from sqlalchemy.orm import joinedload, selectinload

from ..extensions import db
from ..models import Direccion, HorarioTienda, ItemPedido, Pedido, TarifaEnvio, Tienda
from . import NotFoundError, ServiceError


def _normalize_latlng(valor: str) -> str:
    try:
        lat_str, lng_str = [parte.strip() for parte in valor.split(",", 1)]
        lat = float(lat_str)
        lng = float(lng_str)
        return f"{lat:.6f},{lng:.6f}"
    except (ValueError, TypeError):
        return valor


class TiendaService:
    def obtener_por_usuario(self, user_id: int) -> Tienda:
        tienda = (
            Tienda.query.options(
                joinedload(Tienda.direccion),
                selectinload(Tienda.horarios),
                joinedload(Tienda.estado_aprobacion),
            )
            .filter_by(id_usuario_duenio=user_id)
            .first()
        )
        if not tienda:
            raise NotFoundError("El usuario no tiene una tienda asociada")
        return tienda

    def obtener_activa(self, user_id: int) -> Tienda:
        tienda = self.obtener_por_usuario(user_id)
        if not tienda.activo:
            raise ServiceError("La tienda aun no ha sido aprobada", status_code=403)
        return tienda

    def actualizar_tienda(self, tienda: Tienda, data: dict) -> Tienda:
        for campo in [
            "razon_social",
            "identificacion_legal",
            "email",
            "telefono",
            "url_logo",
            "id_categoria",
            "cuenta_bancaria",
        ]:
            if campo in data and data[campo] is not None:
                setattr(tienda, campo, data[campo])
        if "activo" in data:
            tienda.activo = bool(data["activo"])

        if "direccion" in data and data["direccion"]:
            direccion_data = data["direccion"]
            if tienda.direccion:
                for campo, valor in direccion_data.items():
                    if campo == "ubicacion" and isinstance(valor, str):
                        valor = _normalize_latlng(valor)
                    setattr(tienda.direccion, campo, valor)
            else:
                direccion_kwargs = direccion_data.copy()
                ubicacion = direccion_kwargs.get("ubicacion")
                if isinstance(ubicacion, str):
                    direccion_kwargs["ubicacion"] = _normalize_latlng(ubicacion)
                tienda.direccion = Direccion(**direccion_kwargs)

        if "horarios" in data and data["horarios"] is not None:
            tienda.horarios.clear()
            for horario in data["horarios"]:
                tienda.horarios.append(HorarioTienda(**horario))

        db.session.commit()
        return tienda

    def resumen(self, tienda: Tienda) -> dict:
        pedidos_totales = db.session.query(Pedido).filter_by(id_tienda=tienda.id_tienda).count()
        ingresos = (
            db.session.query(func.coalesce(func.sum(Pedido.total_q), 0))
            .filter_by(id_tienda=tienda.id_tienda)
            .scalar()
        )
        productos_vendidos = (
            db.session.query(func.coalesce(func.sum(ItemPedido.cantidad), 0))
            .join(ItemPedido.pedido)
            .filter(Pedido.id_tienda == tienda.id_tienda)
            .scalar()
        )
        clientes_unicos = (
            db.session.query(func.count(func.distinct(Pedido.id_cliente)))
            .filter_by(id_tienda=tienda.id_tienda)
            .scalar()
        )

        return {
            "pedidos_totales": int(pedidos_totales or 0),
            "ingresos": ingresos or 0,
            "productos_vendidos": int(productos_vendidos or 0),
            "clientes_unicos": int(clientes_unicos or 0),
        }

    def asegurar_propietario(self, user_id: int, tienda_id: int) -> Tienda:
        tienda = Tienda.query.filter_by(id_tienda=tienda_id, id_usuario_duenio=user_id).first()
        if not tienda:
            raise NotFoundError("No se encontro la tienda solicitada")
        return tienda

    def listar_tarifas(self, tienda: Tienda):
        return (
            TarifaEnvio.query.filter_by(id_tienda=tienda.id_tienda)
            .order_by(TarifaEnvio.id_tarifa_envio)
            .all()
        )

    def actualizar_tarifa(self, tienda: Tienda, data: dict) -> TarifaEnvio:
        tarifa = TarifaEnvio.query.filter_by(id_tienda=tienda.id_tienda).first()
        if not tarifa:
            tarifa = TarifaEnvio(tienda=tienda)
            db.session.add(tarifa)
        for campo in ["tarifa_base_q", "base_kg", "extra_q_por_kg", "activo"]:
            if campo in data and data[campo] is not None:
                setattr(tarifa, campo, data[campo])
        db.session.commit()
        return tarifa
