from __future__ import annotations

import enum
from datetime import date, datetime
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..extensions import db

if TYPE_CHECKING:  # pragma: no cover
    from .rol import EstadoAprobacion
    from .tienda import Tienda
    from .usuario_rol import UsuarioRol


class GeneroEnum(enum.Enum):
    M = "M"
    F = "F"
    O = "O"


class Usuario(db.Model):
    __tablename__ = "usuario"

    id_usuario: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    username: Mapped[str | None] = mapped_column(db.String(160), unique=True)
    email: Mapped[str] = mapped_column(db.String(160), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(db.String(255), nullable=False)
    nombres: Mapped[str] = mapped_column(db.String(80), nullable=False)
    apellidos: Mapped[str] = mapped_column(db.String(80), nullable=False)
    genero: Mapped[GeneroEnum | None] = mapped_column(
        db.Enum(GeneroEnum, name="genero_enum"), nullable=True
    )
    telefono: Mapped[str | None] = mapped_column(db.String(32))
    fecha_nacimiento: Mapped[date | None] = mapped_column(db.Date())
    url_foto: Mapped[str | None] = mapped_column(db.String(255))
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

    roles: Mapped[list["UsuarioRol"]] = relationship(
        "UsuarioRol", back_populates="usuario", cascade="all, delete-orphan"
    )
    direcciones: Mapped[list["Direccion"]] = relationship(
        "Direccion", back_populates="usuario", cascade="all, delete-orphan"
    )
    verificacion_correos: Mapped[list["VerificacionCorreo"]] = relationship(
        "VerificacionCorreo", back_populates="usuario", cascade="all, delete-orphan"
    )
    tokens_revocados: Mapped[list["TokenRevocado"]] = relationship(
        "TokenRevocado", back_populates="usuario", cascade="all, delete-orphan"
    )
    perfil_cliente: Mapped[PerfilCliente | None] = relationship(
        "PerfilCliente", back_populates="usuario", uselist=False, cascade="all, delete-orphan"
    )
    perfil_repartidor: Mapped[PerfilRepartidor | None] = relationship(
        "PerfilRepartidor",
        back_populates="usuario",
        uselist=False,
        cascade="all, delete-orphan",
        foreign_keys="PerfilRepartidor.id_usuario",
    )
    tiendas: Mapped[list["Tienda"]] = relationship(
        "Tienda",
        back_populates="duenio",
        cascade="all, delete-orphan",
        foreign_keys="Tienda.id_usuario_duenio",
    )


class VerificacionCorreo(db.Model):
    __tablename__ = "verificacion_correo"

    id_verificacion: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    id_usuario: Mapped[int] = mapped_column(
        ForeignKey("usuario.id_usuario", ondelete="CASCADE"), nullable=False
    )
    codigo: Mapped[str] = mapped_column(db.String(10), nullable=False)
    expira_en: Mapped[datetime] = mapped_column(db.DateTime(), nullable=False)
    consumido_en: Mapped[datetime | None] = mapped_column(db.DateTime())
    creado_en: Mapped[datetime] = mapped_column(
        db.DateTime(), nullable=False, server_default=db.text("CURRENT_TIMESTAMP")
    )

    usuario: Mapped[Usuario] = relationship("Usuario", back_populates="verificacion_correos")

    __table_args__ = (
        UniqueConstraint("id_usuario", "consumido_en", name="uq_verif_usuario_activa"),
    )


class TokenRevocado(db.Model):
    __tablename__ = "token_revocado"

    jti: Mapped[str] = mapped_column(db.String(36), primary_key=True)
    id_usuario: Mapped[int] = mapped_column(
        ForeignKey("usuario.id_usuario", ondelete="CASCADE"), nullable=False
    )
    expira_en: Mapped[datetime] = mapped_column(db.DateTime(), nullable=False)
    revocado_en: Mapped[datetime] = mapped_column(
        db.DateTime(), nullable=False, server_default=db.text("CURRENT_TIMESTAMP")
    )

    usuario: Mapped[Usuario] = relationship("Usuario", back_populates="tokens_revocados")


class Direccion(db.Model):
    __tablename__ = "direccion"

    id_direccion: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    id_usuario: Mapped[int | None] = mapped_column(
        ForeignKey("usuario.id_usuario", ondelete="SET NULL"), nullable=True
    )
    etiqueta: Mapped[str | None] = mapped_column(db.String(80))
    linea1: Mapped[str] = mapped_column(db.String(160), nullable=False)
    linea2: Mapped[str | None] = mapped_column(db.String(160))
    ciudad: Mapped[str] = mapped_column(db.String(80), nullable=False)
    estado: Mapped[str | None] = mapped_column(db.String(80))
    codigo_postal: Mapped[str | None] = mapped_column(db.String(20))
    pais: Mapped[str] = mapped_column(db.String(2), nullable=False, default="GT")
    ubicacion: Mapped[str | None] = mapped_column(db.String(255))
    creado_en: Mapped[datetime] = mapped_column(
        db.DateTime(), nullable=False, server_default=db.text("CURRENT_TIMESTAMP")
    )

    usuario: Mapped[Usuario | None] = relationship("Usuario", back_populates="direcciones")
    perfil_cliente: Mapped[PerfilCliente | None] = relationship(
        "PerfilCliente", back_populates="direccion_defecto", uselist=False
    )
    tiendas: Mapped[list["Tienda"]] = relationship("Tienda", back_populates="direccion")


class PerfilCliente(db.Model):
    __tablename__ = "perfil_cliente"

    id_usuario: Mapped[int] = mapped_column(
        ForeignKey("usuario.id_usuario", ondelete="CASCADE"), primary_key=True
    )
    id_direccion_defecto: Mapped[int | None] = mapped_column(
        ForeignKey("direccion.id_direccion"), nullable=True
    )

    usuario: Mapped[Usuario] = relationship("Usuario", back_populates="perfil_cliente")
    direccion_defecto: Mapped[Direccion | None] = relationship(
        "Direccion", back_populates="perfil_cliente"
    )


class LicenciaTipoEnum(enum.Enum):
    MOTO = "MOTO"
    AUTO = "AUTO"
    NO_APLICA = "NO_APLICA"


class VehiculoTipoEnum(enum.Enum):
    BICICLETA = "BICICLETA"
    MOTO = "MOTO"
    AUTO = "AUTO"


class PerfilRepartidor(db.Model):
    __tablename__ = "perfil_repartidor"

    id_usuario: Mapped[int] = mapped_column(
        ForeignKey("usuario.id_usuario", ondelete="CASCADE"), primary_key=True
    )
    dpi: Mapped[str] = mapped_column(db.String(32), nullable=False)
    licencia_numero: Mapped[str | None] = mapped_column(db.String(32))
    licencia_tipo: Mapped[LicenciaTipoEnum | None] = mapped_column(
        db.Enum(LicenciaTipoEnum, name="licencia_tipo_enum")
    )
    vehiculo_tipo: Mapped[VehiculoTipoEnum] = mapped_column(
        db.Enum(VehiculoTipoEnum, name="vehiculo_tipo_enum"), nullable=False
    )
    placa: Mapped[str | None] = mapped_column(db.String(16))
    cuenta_bancaria: Mapped[str] = mapped_column(db.String(64), nullable=False)
    url_foto: Mapped[str] = mapped_column(db.String(255), nullable=False)
    id_estado_aprobacion: Mapped[int] = mapped_column(
        ForeignKey("estado_aprobacion.id_estado_aprobacion"), nullable=False
    )
    aprobado_por: Mapped[int | None] = mapped_column(ForeignKey("usuario.id_usuario"))
    aprobado_en: Mapped[datetime | None] = mapped_column(db.DateTime())
    activo: Mapped[bool] = mapped_column(db.Boolean(), nullable=False, default=False)

    usuario: Mapped[Usuario] = relationship(
        "Usuario",
        back_populates="perfil_repartidor",
        foreign_keys=[id_usuario],
    )
    estado_aprobacion: Mapped["EstadoAprobacion"] = relationship(
        "EstadoAprobacion", back_populates="perfiles_repartidor"
    )
    aprobador: Mapped[Usuario | None] = relationship(
        "Usuario", foreign_keys=[aprobado_por]
    )
