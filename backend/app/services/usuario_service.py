from __future__ import annotations

from typing import Iterable

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
        usuario = Usuario.query.get(user_id)
        if not usuario:
            raise NotFoundError("Usuario no encontrado")
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
