from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..extensions import db

if TYPE_CHECKING:  # pragma: no cover - used only for type checking
    from .pedido import Entrega, Pedido
    from .tienda import Tienda
    from .usuario import PerfilRepartidor
    from .usuario_rol import UsuarioRol


class Rol(db.Model):
    __tablename__ = "rol"

    id_rol: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    codigo: Mapped[str] = mapped_column(db.String(32), unique=True, nullable=False)
    nombre: Mapped[str] = mapped_column(db.String(64), nullable=False)

    usuarios: Mapped[list["UsuarioRol"]] = relationship(
        "UsuarioRol", back_populates="rol", cascade="all, delete-orphan"
    )


class EstadoAprobacion(db.Model):
    __tablename__ = "estado_aprobacion"

    id_estado_aprobacion: Mapped[int] = mapped_column(primary_key=True)
    codigo: Mapped[str] = mapped_column(db.String(24), unique=True, nullable=False)
    nombre: Mapped[str] = mapped_column(db.String(64), nullable=False)

    perfiles_repartidor: Mapped[list["PerfilRepartidor"]] = relationship(
        "PerfilRepartidor", back_populates="estado_aprobacion"
    )
    tiendas: Mapped[list["Tienda"]] = relationship("Tienda", back_populates="estado_aprobacion")


class EstadoPedido(db.Model):
    __tablename__ = "estado_pedido"

    id_estado_pedido: Mapped[int] = mapped_column(primary_key=True)
    codigo: Mapped[str] = mapped_column(db.String(24), unique=True, nullable=False)
    nombre: Mapped[str] = mapped_column(db.String(64), nullable=False)

    pedidos: Mapped[list["Pedido"]] = relationship("Pedido", back_populates="estado")


class EstadoEntrega(db.Model):
    __tablename__ = "estado_entrega"

    id_estado_entrega: Mapped[int] = mapped_column(primary_key=True)
    codigo: Mapped[str] = mapped_column(db.String(24), unique=True, nullable=False)
    nombre: Mapped[str] = mapped_column(db.String(64), nullable=False)

    entregas: Mapped[list["Entrega"]] = relationship("Entrega", back_populates="estado")

