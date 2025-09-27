from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..extensions import db

if TYPE_CHECKING:  # pragma: no cover
    from .producto import Producto
    from .rol import EstadoEntrega, EstadoPedido
    from .tienda import Tienda
    from .usuario import Direccion, PerfilCliente, Usuario


class Carrito(db.Model):
    __tablename__ = "carrito"

    id_carrito: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    id_usuario: Mapped[int] = mapped_column(
        ForeignKey("usuario.id_usuario", ondelete="CASCADE"), nullable=False, unique=True
    )
    actualizado_en: Mapped[datetime] = mapped_column(
        db.DateTime(),
        nullable=False,
        server_default=db.text("CURRENT_TIMESTAMP"),
        server_onupdate=db.text("CURRENT_TIMESTAMP"),
    )

    usuario: Mapped["Usuario"] = relationship("Usuario")
    items: Mapped[list["ItemCarrito"]] = relationship(
        "ItemCarrito", back_populates="carrito", cascade="all, delete-orphan"
    )


class ItemCarrito(db.Model):
    __tablename__ = "item_carrito"

    id_item_carrito: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    id_carrito: Mapped[int] = mapped_column(
        ForeignKey("carrito.id_carrito", ondelete="CASCADE"), nullable=False
    )
    id_producto: Mapped[int] = mapped_column(
        ForeignKey("producto.id_producto", ondelete="RESTRICT"), nullable=False
    )
    cantidad: Mapped[int] = mapped_column(db.Integer(), nullable=False)

    carrito: Mapped[Carrito] = relationship("Carrito", back_populates="items")
    producto: Mapped["Producto"] = relationship("Producto", back_populates="items_carrito")

    __table_args__ = (
        db.UniqueConstraint("id_carrito", "id_producto", name="uq_carrito_producto"),
        db.CheckConstraint("cantidad > 0", name="chk_cantidad_ic"),
    )


class Pedido(db.Model):
    __tablename__ = "pedido"

    id_pedido: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    id_cliente: Mapped[int] = mapped_column(
        ForeignKey("usuario.id_usuario", ondelete="RESTRICT"), nullable=False
    )
    id_tienda: Mapped[int] = mapped_column(
        ForeignKey("tienda.id_tienda", ondelete="RESTRICT"), nullable=False
    )
    id_direccion_entrega: Mapped[int] = mapped_column(
        ForeignKey("direccion.id_direccion", ondelete="RESTRICT"), nullable=False
    )
    id_estado_pedido: Mapped[int] = mapped_column(
        ForeignKey("estado_pedido.id_estado_pedido"), nullable=False
    )
    subtotal_q: Mapped[float] = mapped_column(db.Numeric(12, 2), nullable=False)
    envio_q: Mapped[float] = mapped_column(db.Numeric(12, 2), nullable=False)
    total_q: Mapped[float] = mapped_column(db.Numeric(12, 2), nullable=False)
    peso_total_kg: Mapped[float] = mapped_column(db.Numeric(10, 3), nullable=False, default=0)
    notas: Mapped[str | None] = mapped_column(db.String(300))
    creado_en: Mapped[datetime] = mapped_column(
        db.DateTime(), nullable=False, server_default=db.text("CURRENT_TIMESTAMP")
    )
    confirmado_en: Mapped[datetime | None] = mapped_column(db.DateTime())

    cliente: Mapped["Usuario"] = relationship("Usuario", foreign_keys=[id_cliente])
    tienda: Mapped["Tienda"] = relationship("Tienda", back_populates="pedidos")
    direccion_entrega: Mapped["Direccion"] = relationship("Direccion")
    estado: Mapped["EstadoPedido"] = relationship("EstadoPedido", back_populates="pedidos")
    items: Mapped[list["ItemPedido"]] = relationship(
        "ItemPedido", back_populates="pedido", cascade="all, delete-orphan"
    )
    historial: Mapped[list["HistorialEstadoPedido"]] = relationship(
        "HistorialEstadoPedido", back_populates="pedido", cascade="all, delete-orphan"
    )
    entrega: Mapped[Entrega | None] = relationship(
        "Entrega", back_populates="pedido", uselist=False, cascade="all, delete-orphan"
    )
    pagos: Mapped[list["Pago"]] = relationship(
        "Pago", back_populates="pedido", cascade="all, delete-orphan"
    )

    __table_args__ = (
        db.CheckConstraint("subtotal_q >= 0", name="chk_subtotal"),
        db.CheckConstraint("envio_q >= 0", name="chk_envio"),
        db.CheckConstraint("total_q >= 0", name="chk_total"),
    )


class ItemPedido(db.Model):
    __tablename__ = "item_pedido"

    id_item_pedido: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    id_pedido: Mapped[int] = mapped_column(
        ForeignKey("pedido.id_pedido", ondelete="CASCADE"), nullable=False
    )
    id_producto: Mapped[int] = mapped_column(
        ForeignKey("producto.id_producto", ondelete="RESTRICT"), nullable=False
    )
    nombre_producto: Mapped[str] = mapped_column(db.String(160), nullable=False)
    precio_unit_q: Mapped[float] = mapped_column(db.Numeric(10, 2), nullable=False)
    peso_unit_kg: Mapped[float] = mapped_column(db.Numeric(8, 3), nullable=False)
    cantidad: Mapped[int] = mapped_column(db.Integer(), nullable=False)
    total_linea_q: Mapped[float] = mapped_column(db.Numeric(12, 2), nullable=False)

    pedido: Mapped[Pedido] = relationship("Pedido", back_populates="items")
    producto: Mapped["Producto"] = relationship("Producto", back_populates="items_pedido")

    __table_args__ = (db.CheckConstraint("cantidad > 0", name="chk_cantidad_ip"),)


class HistorialEstadoPedido(db.Model):
    __tablename__ = "historial_estado_pedido"

    id_historial: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    id_pedido: Mapped[int] = mapped_column(
        ForeignKey("pedido.id_pedido", ondelete="CASCADE"), nullable=False
    )
    id_estado_pedido: Mapped[int] = mapped_column(
        ForeignKey("estado_pedido.id_estado_pedido"), nullable=False
    )
    cambiado_por: Mapped[int | None] = mapped_column(ForeignKey("usuario.id_usuario"))
    nota: Mapped[str | None] = mapped_column(db.String(200))
    cambiado_en: Mapped[datetime] = mapped_column(
        db.DateTime(), nullable=False, server_default=db.text("CURRENT_TIMESTAMP")
    )

    pedido: Mapped[Pedido] = relationship("Pedido", back_populates="historial")
    estado: Mapped["EstadoPedido"] = relationship("EstadoPedido")
    usuario: Mapped[Usuario | None] = relationship("Usuario")


class Entrega(db.Model):
    __tablename__ = "entrega"

    id_entrega: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    id_pedido: Mapped[int] = mapped_column(
        ForeignKey("pedido.id_pedido", ondelete="CASCADE"), nullable=False, unique=True
    )
    id_repartidor: Mapped[int] = mapped_column(
        ForeignKey("usuario.id_usuario", ondelete="RESTRICT"), nullable=False
    )
    id_estado_entrega: Mapped[int] = mapped_column(
        ForeignKey("estado_entrega.id_estado_entrega"), nullable=False
    )
    asignada_en: Mapped[datetime] = mapped_column(
        db.DateTime(), nullable=False, server_default=db.text("CURRENT_TIMESTAMP")
    )
    aceptada_en: Mapped[datetime | None] = mapped_column(db.DateTime())
    recogida_en: Mapped[datetime | None] = mapped_column(db.DateTime())
    entregada_en: Mapped[datetime | None] = mapped_column(db.DateTime())
    distancia_km: Mapped[float | None] = mapped_column(db.Numeric(8, 2))
    pago_repartidor_q: Mapped[float | None] = mapped_column(db.Numeric(10, 2))

    pedido: Mapped[Pedido] = relationship("Pedido", back_populates="entrega")
    repartidor: Mapped["Usuario"] = relationship("Usuario")
    estado: Mapped["EstadoEntrega"] = relationship("EstadoEntrega", back_populates="entregas")
    seguimiento: Mapped[list["SeguimientoEntrega"]] = relationship(
        "SeguimientoEntrega", back_populates="entrega", cascade="all, delete-orphan"
    )


class SeguimientoEntrega(db.Model):
    __tablename__ = "seguimiento_entrega"

    id_seguimiento: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    id_entrega: Mapped[int] = mapped_column(
        ForeignKey("entrega.id_entrega", ondelete="CASCADE"), nullable=False
    )
    id_repartidor: Mapped[int] = mapped_column(ForeignKey("usuario.id_usuario"), nullable=False)
    ubicacion: Mapped[str] = mapped_column(db.String(255), nullable=False)
    registrado_en: Mapped[datetime] = mapped_column(
        db.DateTime(), nullable=False, server_default=db.text("CURRENT_TIMESTAMP")
    )
    nota_estado: Mapped[str | None] = mapped_column(db.String(160))

    entrega: Mapped[Entrega] = relationship("Entrega", back_populates="seguimiento")
    repartidor: Mapped["Usuario"] = relationship("Usuario")

    __table_args__ = (
        db.Index("idx_seg_registrado", "registrado_en"),
    )


class Pago(db.Model):
    __tablename__ = "pago"

    id_pago: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    id_pedido: Mapped[int] = mapped_column(
        ForeignKey("pedido.id_pedido", ondelete="CASCADE"), nullable=False
    )
    monto_q: Mapped[float] = mapped_column(db.Numeric(12, 2), nullable=False)
    moneda: Mapped[str] = mapped_column(db.String(3), nullable=False, default="GTQ")
    metodo: Mapped[str] = mapped_column(db.String(40), nullable=False)
    estado: Mapped[str] = mapped_column(db.String(24), nullable=False)
    proveedor: Mapped[str | None] = mapped_column(db.String(40))
    referencia_proveedor: Mapped[str | None] = mapped_column(db.String(80))
    pagado_en: Mapped[datetime | None] = mapped_column(db.DateTime())
    creado_en: Mapped[datetime] = mapped_column(
        db.DateTime(), nullable=False, server_default=db.text("CURRENT_TIMESTAMP")
    )

    pedido: Mapped[Pedido] = relationship("Pedido", back_populates="pagos")

    __table_args__ = (db.CheckConstraint("monto_q >= 0", name="chk_monto_pago"),)



