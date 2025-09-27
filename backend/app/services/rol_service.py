from __future__ import annotations

from ..extensions import db
from ..models import Rol
from . import ConflictError, NotFoundError


class RolService:
    def list_roles(self) -> list[Rol]:
        return Rol.query.order_by(Rol.nombre).all()

    def get_by_codigo(self, codigo: str) -> Rol:
        rol = Rol.query.filter_by(codigo=codigo).first()
        if not rol:
            raise NotFoundError("Rol no encontrado")
        return rol

    def create_role(self, data: dict) -> Rol:
        codigo = data.get("codigo")
        if Rol.query.filter_by(codigo=codigo).first():
            raise ConflictError("El rol ya existe")
        rol = Rol(codigo=codigo, nombre=data.get("nombre"))
        db.session.add(rol)
        db.session.commit()
        return rol
