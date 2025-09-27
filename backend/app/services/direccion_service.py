from __future__ import annotations

from typing import Iterable

from sqlalchemy.orm import joinedload

from ..extensions import db
from ..models import Direccion, PerfilCliente
from . import NotFoundError


class DireccionService:
    def listar(self, user_id: int) -> list[Direccion]:
        direcciones = (
            Direccion.query.filter_by(id_usuario=user_id)
            .order_by(Direccion.id_direccion.asc())
            .all()
        )
        perfil = self._obtener_o_crear_perfil(user_id)
        for direccion in direcciones:
            direccion.es_predeterminada = perfil.id_direccion_defecto == direccion.id_direccion
        return direcciones

    def crear(self, user_id: int, data: dict, predeterminada: bool = False) -> Direccion:
        direccion = Direccion(id_usuario=user_id, **data)
        db.session.add(direccion)
        db.session.flush()
        perfil = self._obtener_o_crear_perfil(user_id)
        if predeterminada or perfil.id_direccion_defecto is None:
            perfil.id_direccion_defecto = direccion.id_direccion
        db.session.commit()
        direccion.es_predeterminada = perfil.id_direccion_defecto == direccion.id_direccion
        return direccion

    def actualizar(self, user_id: int, direccion_id: int, data: dict) -> Direccion:
        direccion = self._obtener(user_id, direccion_id)
        for campo, valor in data.items():
            setattr(direccion, campo, valor)
        db.session.commit()
        perfil = direccion.usuario.perfil_cliente
        direccion.es_predeterminada = bool(perfil and perfil.id_direccion_defecto == direccion.id_direccion)
        return direccion

    def eliminar(self, user_id: int, direccion_id: int) -> None:
        direccion = self._obtener(user_id, direccion_id)
        perfil = self._obtener_o_crear_perfil(user_id)
        db.session.delete(direccion)
        db.session.flush()
        if perfil.id_direccion_defecto == direccion_id:
            perfil.id_direccion_defecto = self._buscar_otra_direccion(user_id, excluir=direccion_id)
        db.session.commit()

    def establecer_predeterminada(self, user_id: int, direccion_id: int) -> Direccion:
        direccion = self._obtener(user_id, direccion_id)
        perfil = self._obtener_o_crear_perfil(user_id)
        perfil.id_direccion_defecto = direccion.id_direccion
        db.session.commit()
        direccion.es_predeterminada = True
        return direccion

    def _obtener(self, user_id: int, direccion_id: int) -> Direccion:
        direccion = (
            Direccion.query.options(joinedload(Direccion.usuario).joinedload(PerfilCliente.direccion_defecto))
            .filter_by(id_usuario=user_id, id_direccion=direccion_id)
            .first()
        )
        if not direccion:
            raise NotFoundError("Direccion no encontrada")
        return direccion

    def _obtener_o_crear_perfil(self, user_id: int) -> PerfilCliente:
        perfil = PerfilCliente.query.filter_by(id_usuario=user_id).first()
        if perfil:
            return perfil
        perfil = PerfilCliente(id_usuario=user_id)
        db.session.add(perfil)
        db.session.flush()
        return perfil

    def _buscar_otra_direccion(self, user_id: int, excluir: int) -> int | None:
        direccion = (
            Direccion.query.filter(
                Direccion.id_usuario == user_id, Direccion.id_direccion != excluir
            )
            .order_by(Direccion.id_direccion.asc())
            .first()
        )
        return direccion.id_direccion if direccion else None
