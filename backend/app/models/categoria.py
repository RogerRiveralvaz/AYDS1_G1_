from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..extensions import db

if TYPE_CHECKING:  # pragma: no cover
    from .producto import Producto
    from .tienda import Tienda


class Categoria(db.Model):
    __tablename__ = "categoria"

    id_categoria: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    id_categoria_padre: Mapped[int | None] = mapped_column(
        db.ForeignKey("categoria.id_categoria", ondelete="SET NULL")
    )
    nombre: Mapped[str] = mapped_column(db.String(100), nullable=False)
    slug: Mapped[str] = mapped_column(db.String(120), nullable=False, unique=True)
    activo: Mapped[bool] = mapped_column(db.Boolean(), nullable=False, default=True)

    categoria_padre: Mapped[Categoria | None] = relationship(
        "Categoria", remote_side="Categoria.id_categoria", back_populates="subcategorias"
    )
    subcategorias: Mapped[list["Categoria"]] = relationship(
        "Categoria", back_populates="categoria_padre"
    )
    productos: Mapped[list["Producto"]] = relationship("Producto", back_populates="categoria")
    tiendas: Mapped[list["Tienda"]] = relationship("Tienda", back_populates="categoria")


