from __future__ import annotations

from typing import Iterable

from sqlalchemy.orm import joinedload, selectinload

from ..extensions import db
from ..models import Rol, Usuario, UsuarioRol
from . import NotFoundError


class UsuarioService:
    def list_usuarios(self, rol_codigo: str | None = None) -> list[Usuario]:
        query = Usuario.query
        if rol_codigo:
            query = query.join(Usuario.roles).join(UsuarioRol.rol).filter(Rol.codigo == rol_codigo)
        return query.order_by(Usuario.id_usuario).all()

    def get_by_id(self, user_id: int) -> Usuario:
        usuario = (
            Usuario.query.options(
                selectinload(Usuario.roles).joinedload(UsuarioRol.rol),
                selectinload(Usuario.direcciones),
                joinedload(Usuario.perfil_cliente),
            )
            .filter_by(id_usuario=user_id)
            .first()
        )
        if not usuario:
            raise NotFoundError("Usuario no encontrado")
        perfil = usuario.perfil_cliente
        for direccion in usuario.direcciones:
            direccion.es_predeterminada = bool(perfil and perfil.id_direccion_defecto == direccion.id_direccion)
        return usuario

    def asignar_roles(self, usuario: Usuario, roles: Iterable[str]) -> Usuario:
        roles_existentes = {rel.rol.codigo for rel in usuario.roles}
        roles_objetivo = set(roles)
        if roles_existentes == roles_objetivo:
            return usuario
        usuario.roles.clear()
        for codigo in roles_objetivo:
            rol = Rol.query.filter_by(codigo=codigo).first()
            if not rol:
                raise NotFoundError(f"Rol {codigo} no encontrado")
            usuario.roles.append(UsuarioRol(usuario=usuario, rol=rol))
        db.session.commit()
        return usuario

    def actualizar_estado(self, usuario: Usuario, activo: bool | None = None) -> Usuario:
        if activo is not None:
            usuario.activo = activo
        db.session.commit()
        return usuario

    def actualizar_perfil(self, usuario: Usuario, data: dict) -> Usuario:
        for campo, valor in data.items():
            setattr(usuario, campo, valor)
        db.session.commit()
        return self.get_by_id(usuario.id_usuario)
