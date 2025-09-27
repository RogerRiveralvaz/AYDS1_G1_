from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..extensions import db

if TYPE_CHECKING:  # pragma: no cover
    from .categoria import Categoria
    from .pedido import ItemCarrito, ItemPedido
    from .tienda import Tienda


class Producto(db.Model):
    __tablename__ = "producto"

    id_producto: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    id_tienda: Mapped[int] = mapped_column(ForeignKey("tienda.id_tienda", ondelete="CASCADE"), nullable=False)
    id_categoria: Mapped[int | None] = mapped_column(ForeignKey("categoria.id_categoria"))
    nombre: Mapped[str] = mapped_column(db.String(160), nullable=False)
    descripcion_corta: Mapped[str | None] = mapped_column(db.String(300))
    precio: Mapped[float] = mapped_column(db.Numeric(10, 2), nullable=False)
    peso_kg: Mapped[float] = mapped_column(db.Numeric(8, 3), nullable=False)
    sku: Mapped[str | None] = mapped_column(db.String(64))
    stock: Mapped[int] = mapped_column(db.Integer(), nullable=False, default=0)
    umbral_bajo: Mapped[int] = mapped_column(db.Integer(), nullable=False, default=5)
    es_oferta: Mapped[bool] = mapped_column(db.Boolean(), nullable=False, default=False)
    es_nuevo: Mapped[bool] = mapped_column(db.Boolean(), nullable=False, default=False)
    activo: Mapped[bool] = mapped_column(db.Boolean(), nullable=False, default=True)
    creado_en: Mapped[datetime] = mapped_column(
        db.DateTime(), nullable=False, server_default=db.text("CURRENT_TIMESTAMP")
    )
    actualizado_en: Mapped[datetime] = mapped_column(
        db.DateTime(),
        nullable=False,
        server_default=db.text("CURRENT_TIMESTAMP"),
        server_onupdate=db.text("CURRENT_TIMESTAMP"),
    )

    tienda: Mapped["Tienda"] = relationship("Tienda", back_populates="productos")
    categoria: Mapped[Categoria | None] = relationship("Categoria", back_populates="productos")
    imagenes: Mapped[list["ImagenProducto"]] = relationship(
        "ImagenProducto", back_populates="producto", cascade="all, delete-orphan"
    )
    alertas_stock: Mapped[list["AlertaStock"]] = relationship(
        "AlertaStock", back_populates="producto", cascade="all, delete-orphan"
    )
    items_carrito: Mapped[list["ItemCarrito"]] = relationship("ItemCarrito", back_populates="producto")
    items_pedido: Mapped[list["ItemPedido"]] = relationship("ItemPedido", back_populates="producto")


class ImagenProducto(db.Model):
    __tablename__ = "imagen_producto"

    id_imagen_producto: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    id_producto: Mapped[int] = mapped_column(
        ForeignKey("producto.id_producto", ondelete="CASCADE"), nullable=False
    )
    url: Mapped[str] = mapped_column(db.String(255), nullable=False)
    principal: Mapped[bool] = mapped_column(db.Boolean(), nullable=False, default=False)
    orden: Mapped[int] = mapped_column(db.Integer(), nullable=False, default=0)

    producto: Mapped[Producto] = relationship("Producto", back_populates="imagenes")


class AlertaStock(db.Model):
    __tablename__ = "alerta_stock"

    id_alerta_stock: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    id_producto: Mapped[int] = mapped_column(
        ForeignKey("producto.id_producto", ondelete="CASCADE"), nullable=False
    )
    stock_momento: Mapped[int] = mapped_column(db.Integer(), nullable=False)
    creado_en: Mapped[datetime] = mapped_column(
        db.DateTime(), nullable=False, server_default=db.text("CURRENT_TIMESTAMP")
    )

    producto: Mapped[Producto] = relationship("Producto", back_populates="alertas_stock")



