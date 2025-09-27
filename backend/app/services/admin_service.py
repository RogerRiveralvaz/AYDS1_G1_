from __future__ import annotations

from datetime import datetime
from typing import Iterable

from sqlalchemy import func
from sqlalchemy.orm import joinedload

from ..extensions import db
from ..models import (
    EstadoAprobacion,
    ItemPedido,
    PerfilRepartidor,
    Pedido,
    Tienda,
    Usuario,
    UsuarioRol,
)
from . import NotFoundError, ServiceError


class AdminService:
    def listar_tiendas(self, estado_codigo: str | None = None) -> Iterable[Tienda]:
        query = Tienda.query.options(joinedload(Tienda.estado_aprobacion), joinedload(Tienda.duenio))
        if estado_codigo:
            estado = self._estado_aprobacion_por_codigo(estado_codigo)
            query = query.filter(Tienda.id_estado_aprobacion == estado.id_estado_aprobacion)
        return query.order_by(Tienda.creado_en.desc()).all()

    def actualizar_estado_tienda(self, tienda_id: int, codigo_estado: str, admin_id: int) -> Tienda:
        tienda = Tienda.query.get(tienda_id)
        if not tienda:
            raise NotFoundError("Tienda no encontrada")
        estado = self._estado_aprobacion_por_codigo(codigo_estado)
        tienda.id_estado_aprobacion = estado.id_estado_aprobacion
        tienda.aprobado_por = admin_id
        tienda.aprobado_en = datetime.utcnow()
        tienda.activo = codigo_estado == "APROBADO"
        db.session.commit()
        return tienda

    def listar_repartidores(self, estado_codigo: str | None = None) -> Iterable[PerfilRepartidor]:
        query = PerfilRepartidor.query.options(
            joinedload(PerfilRepartidor.usuario), joinedload(PerfilRepartidor.estado_aprobacion)
        )
        if estado_codigo:
            estado = self._estado_aprobacion_por_codigo(estado_codigo)
            query = query.filter(PerfilRepartidor.id_estado_aprobacion == estado.id_estado_aprobacion)
        return query.all()

    def actualizar_estado_repartidor(self, repartidor_id: int, codigo_estado: str, admin_id: int) -> PerfilRepartidor:
        perfil = PerfilRepartidor.query.get(repartidor_id)
        if not perfil:
            raise NotFoundError("Repartidor no encontrado")
        estado = self._estado_aprobacion_por_codigo(codigo_estado)
        perfil.id_estado_aprobacion = estado.id_estado_aprobacion
        perfil.aprobado_por = admin_id
        perfil.aprobado_en = datetime.utcnow()
        perfil.activo = codigo_estado == "APROBADO"
        db.session.commit()
        return perfil

    def listar_clientes(self) -> Iterable[Usuario]:
        return (
            Usuario.query.join(Usuario.roles)
            .filter(UsuarioRol.id_rol == self._rol_id_por_codigo("CLIENTE"))
            .order_by(Usuario.creado_en.desc())
            .all()
        )

    def resumen_metricas(self) -> dict:
        hoy = datetime.utcnow().date()
        pedidos_hoy = (
            db.session.query(func.count(Pedido.id_pedido))
            .filter(func.date(Pedido.creado_en) == hoy)
            .scalar()
        )
        ingresos_totales = db.session.query(func.coalesce(func.sum(Pedido.total_q), 0)).scalar()
        tiendas_activas = db.session.query(func.count(Tienda.id_tienda)).filter(Tienda.activo.is_(True)).scalar()
        productos_top = (
            db.session.query(ItemPedido.nombre_producto, func.sum(ItemPedido.cantidad).label("vendidos"))
            .group_by(ItemPedido.nombre_producto)
            .order_by(func.sum(ItemPedido.cantidad).desc())
            .limit(5)
            .all()
        )
        tiendas_por_estado = (
            db.session.query(EstadoAprobacion.nombre, func.count(Tienda.id_tienda))
            .join(Tienda.estado_aprobacion)
            .group_by(EstadoAprobacion.nombre)
            .all()
        )
        return {
            "pedidos_hoy": int(pedidos_hoy or 0),
            "ingresos_totales": str(ingresos_totales or 0),
            "tiendas_activas": int(tiendas_activas or 0),
            "productos_top": [
                {"producto": nombre, "cantidad": int(vendidos)} for nombre, vendidos in productos_top
            ],
            "tiendas_por_estado": [
                {"estado": estado, "total": int(total)} for estado, total in tiendas_por_estado
            ],
        }

    def _estado_aprobacion_por_codigo(self, codigo: str) -> EstadoAprobacion:
        estado = EstadoAprobacion.query.filter_by(codigo=codigo).first()
        if not estado:
            raise NotFoundError(f"Estado {codigo} no configurado")
        return estado

    def _rol_id_por_codigo(self, codigo: str) -> int:
        from ..models import Rol

        rol = Rol.query.filter_by(codigo=codigo).first()
        if not rol:
            raise ServiceError(f"Rol {codigo} no encontrado", status_code=500)
        return rol.id_rol
