from __future__ import annotations

import enum
from datetime import datetime, time
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..extensions import db

if TYPE_CHECKING:  # pragma: no cover
    from .categoria import Categoria
    from .pedido import Pedido
    from .producto import Producto
    from .rol import EstadoAprobacion
    from .usuario import Direccion, Usuario


class Tienda(db.Model):
    __tablename__ = "tienda"

    id_tienda: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    id_usuario_duenio: Mapped[int] = mapped_column(
        ForeignKey("usuario.id_usuario", ondelete="RESTRICT"), nullable=False
    )
    razon_social: Mapped[str] = mapped_column(db.String(160), nullable=False)
    identificacion_legal: Mapped[str | None] = mapped_column(db.String(32))
    email: Mapped[str] = mapped_column(db.String(160), nullable=False)
    telefono: Mapped[str] = mapped_column(db.String(32), nullable=False)
    url_logo: Mapped[str | None] = mapped_column(db.String(255))
    id_categoria: Mapped[int | None] = mapped_column(ForeignKey("categoria.id_categoria"))
    cuenta_bancaria: Mapped[str] = mapped_column(db.String(64), nullable=False)
    id_direccion: Mapped[int | None] = mapped_column(ForeignKey("direccion.id_direccion"))
    id_estado_aprobacion: Mapped[int] = mapped_column(
        ForeignKey("estado_aprobacion.id_estado_aprobacion"), nullable=False
    )
    aprobado_por: Mapped[int | None] = mapped_column(ForeignKey("usuario.id_usuario"))
    aprobado_en: Mapped[datetime | None] = mapped_column(db.DateTime())
    activo: Mapped[bool] = mapped_column(db.Boolean(), nullable=False, default=False)
    creado_en: Mapped[datetime] = mapped_column(
        db.DateTime(), nullable=False, server_default=db.text("CURRENT_TIMESTAMP")
    )
    actualizado_en: Mapped[datetime] = mapped_column(
        db.DateTime(),
        nullable=False,
        server_default=db.text("CURRENT_TIMESTAMP"),
        server_onupdate=db.text("CURRENT_TIMESTAMP"),
    )

    duenio: Mapped["Usuario"] = relationship(
        "Usuario", back_populates="tiendas", foreign_keys=[id_usuario_duenio]
    )
    aprobador: Mapped[Usuario | None] = relationship(
        "Usuario", foreign_keys=[aprobado_por]
    )
    categoria: Mapped[Categoria | None] = relationship(
        "Categoria", back_populates="tiendas"
    )
    direccion: Mapped[Direccion | None] = relationship(
        "Direccion", back_populates="tiendas"
    )
    estado_aprobacion: Mapped["EstadoAprobacion"] = relationship(
        "EstadoAprobacion", back_populates="tiendas"
    )
    horarios: Mapped[list["HorarioTienda"]] = relationship(
        "HorarioTienda", back_populates="tienda", cascade="all, delete-orphan"
    )
    productos: Mapped[list["Producto"]] = relationship(
        "Producto", back_populates="tienda", cascade="all, delete-orphan"
    )
    tarifas_envio: Mapped[list["TarifaEnvio"]] = relationship(
        "TarifaEnvio", back_populates="tienda", cascade="all, delete-orphan"
    )
    pedidos: Mapped[list["Pedido"]] = relationship("Pedido", back_populates="tienda")


class HorarioTienda(db.Model):
    __tablename__ = "horario_tienda"

    id_horario_tienda: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    id_tienda: Mapped[int] = mapped_column(
        ForeignKey("tienda.id_tienda", ondelete="CASCADE"), nullable=False
    )
    dia_semana: Mapped[int] = mapped_column(db.SmallInteger(), nullable=False)
    hora_apertura: Mapped[time | None] = mapped_column(db.Time())
    hora_cierre: Mapped[time | None] = mapped_column(db.Time())
    cerrado: Mapped[bool] = mapped_column(db.Boolean(), nullable=False, default=False)

    tienda: Mapped[Tienda] = relationship("Tienda", back_populates="horarios")

    __table_args__ = (
        UniqueConstraint("id_tienda", "dia_semana", name="uq_tienda_dia"),
        db.CheckConstraint("dia_semana BETWEEN 0 AND 6", name="chk_dia_semana"),
    )


class TarifaAmbitoEnum(enum.Enum):
    GLOBAL = "GLOBAL"
    TIENDA = "TIENDA"


class TarifaEnvio(db.Model):
    __tablename__ = "tarifa_envio"

    id_tarifa_envio: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    ambito: Mapped[TarifaAmbitoEnum] = mapped_column(
        db.Enum(TarifaAmbitoEnum, name="tarifa_ambito_enum"), nullable=False, default=TarifaAmbitoEnum.GLOBAL
    )
    id_tienda: Mapped[int | None] = mapped_column(
        ForeignKey("tienda.id_tienda", ondelete="CASCADE"), nullable=True
    )
    tarifa_base_q: Mapped[float] = mapped_column(db.Numeric(10, 2), nullable=False)
    base_kg: Mapped[float] = mapped_column(db.Numeric(8, 3), nullable=False)
    extra_q_por_kg: Mapped[float] = mapped_column(db.Numeric(10, 2), nullable=False)
    activo: Mapped[bool] = mapped_column(db.Boolean(), nullable=False, default=True)
    creado_en: Mapped[datetime] = mapped_column(
        db.DateTime(), nullable=False, server_default=db.text("CURRENT_TIMESTAMP")
    )

    tienda: Mapped[Tienda | None] = relationship("Tienda", back_populates="tarifas_envio")



