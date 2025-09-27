from __future__ import annotations

from collections import defaultdict
from datetime import datetime
from typing import Iterable

from sqlalchemy import func
from sqlalchemy.orm import joinedload, selectinload

from ..extensions import db
from ..models import Direccion, EstadoAprobacion, Producto, Tienda


class CatalogoService:
    def listar_tiendas(
        self,
        categoria_id: int | None = None,
        texto: str | None = None,
        ciudad: str | None = None,
        solo_abiertas: bool = False,
    ) -> list[Tienda]:
        query = (
            Tienda.query.options(
                selectinload(Tienda.horarios),
                selectinload(Tienda.productos),
                joinedload(Tienda.direccion),
                joinedload(Tienda.categoria),
            )
            .join(Tienda.estado_aprobacion)
            .filter(
                Tienda.activo.is_(True),
                EstadoAprobacion.codigo.in_(["APROBADO", "APPROVED"]),
            )
        )

        if categoria_id:
            query = query.filter(Tienda.id_categoria == categoria_id)
        if ciudad:
            query = query.join(Tienda.direccion).filter(func.lower(Direccion.ciudad) == ciudad.lower())
        if texto:
            like = f"%{texto.lower()}%"
            query = query.filter(
                db.func.lower(Tienda.razon_social).like(like)
                | db.func.lower(Tienda.email).like(like)
            )

        tiendas = query.all()
        ahora = datetime.utcnow()
        resultado: list[Tienda] = []
        for tienda in tiendas:
            tienda.abierto = self._esta_abierta(tienda, ahora)
            tienda.tiene_promocion = any(p.es_oferta for p in tienda.productos if p.activo)
            if solo_abiertas and not tienda.abierto:
                continue
            resultado.append(tienda)
        return resultado

    def detalle_tienda(self, tienda_id: int) -> Tienda:
        tienda = (
            Tienda.query.options(
                selectinload(Tienda.productos).selectinload(Producto.imagenes),
                selectinload(Tienda.horarios),
                joinedload(Tienda.direccion),
                joinedload(Tienda.categoria),
            )
            .join(Tienda.estado_aprobacion)
            .filter(
                Tienda.id_tienda == tienda_id,
                Tienda.activo.is_(True),
                EstadoAprobacion.codigo.in_(["APROBADO", "APPROVED"]),
            )
            .first()
        )
        if not tienda:
            raise LookupError("Tienda no encontrada")

        ahora = datetime.utcnow()
        tienda.abierto = self._esta_abierta(tienda, ahora)
        tienda.tiene_promocion = any(p.es_oferta for p in tienda.productos if p.activo)
        tienda.productos_catalogo = self._agrupar_productos(tienda.productos)
        return tienda

    def buscar_productos(
        self, texto: str, categoria_id: int | None = None, tienda_id: int | None = None
    ) -> Iterable[Producto]:
        query = (
            Producto.query.join(Producto.tienda)
            .join(Tienda.estado_aprobacion)
            .filter(
                Producto.activo.is_(True),
                Tienda.activo.is_(True),
                EstadoAprobacion.codigo.in_(["APROBADO", "APPROVED"]),
            )
        )
        if categoria_id:
            query = query.filter(Producto.id_categoria == categoria_id)
        if tienda_id:
            query = query.filter(Producto.id_tienda == tienda_id)

        if texto:
            like = f"%{texto.lower()}%"
            query = query.filter(
                db.func.lower(Producto.nombre).like(like)
                | db.func.lower(Producto.descripcion_corta).like(like)
            )

        return query.options(selectinload(Producto.imagenes)).limit(50).all()

    def _esta_abierta(self, tienda: Tienda, momento: datetime) -> bool:
        if not tienda.horarios:
            return True
        dia = momento.weekday()
        hora = momento.time()
        for horario in tienda.horarios:
            if horario.dia_semana != dia:
                continue
            if horario.cerrado:
                return False
            if horario.hora_apertura and horario.hora_cierre:
                return horario.hora_apertura <= hora <= horario.hora_cierre
            return True
        return False

    def _agrupar_productos(self, productos: Iterable[Producto]) -> dict[str, list[Producto]]:
        grupos: defaultdict[str, list[Producto]] = defaultdict(list)
        for producto in productos:
            if not producto.activo:
                continue
            key = producto.categoria.nombre if producto.categoria else "General"
            grupos[key].append(producto)
        return dict(grupos)
