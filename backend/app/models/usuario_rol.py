from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..extensions import db

if TYPE_CHECKING:  # pragma: no cover
    from .rol import Rol
    from .usuario import Usuario


class UsuarioRol(db.Model):
    __tablename__ = "usuario_rol"

    id_usuario: Mapped[int] = mapped_column(
        db.ForeignKey("usuario.id_usuario", ondelete="CASCADE"), primary_key=True
    )
    id_rol: Mapped[int] = mapped_column(
        db.ForeignKey("rol.id_rol", ondelete="RESTRICT"), primary_key=True
    )

    usuario: Mapped["Usuario"] = relationship("Usuario", back_populates="roles")
    rol: Mapped["Rol"] = relationship("Rol", back_populates="usuarios")

