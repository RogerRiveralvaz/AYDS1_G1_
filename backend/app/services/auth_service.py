from __future__ import annotations

import secrets
from datetime import datetime, timedelta

from flask_jwt_extended import create_access_token, create_refresh_token

from ..extensions import db
from ..models import (
    Direccion,
    EstadoAprobacion,
    GeneroEnum,
    LicenciaTipoEnum,
    PerfilCliente,
    PerfilRepartidor,
    Rol,
    Tienda,
    TokenRevocado,
    Usuario,
    UsuarioRol,
    VerificacionCorreo,
    VehiculoTipoEnum,
)
from ..utils.mailer import EmailMessage, send_email
from ..utils.security import generate_verification_code, hash_password, password_is_strong, verify_password
from . import ConflictError, NotFoundError, ServiceError


class AuthService:
    def register(self, payload: dict) -> tuple[Usuario, str]:
        email = payload["email"].lower()
        if Usuario.query.filter_by(email=email).first():
            raise ConflictError("Ya existe una cuenta con este correo electronico")
        if not password_is_strong(payload["password"]):
            raise ServiceError("La contrasena no cumple la politica de seguridad", status_code=422)

        rol_codigo = payload["rol_codigo"]
        rol = Rol.query.filter_by(codigo=rol_codigo).first()
        if not rol:
            raise NotFoundError("Rol solicitado no existe")

        genero_val = payload.get("genero")
        genero_enum = GeneroEnum(genero_val) if genero_val else None

        usuario = Usuario(
            email=email,
            password_hash=hash_password(payload["password"]),
            nombres=payload["nombres"],
            apellidos=payload["apellidos"],
            genero=genero_enum,
            telefono=payload.get("telefono"),
            fecha_nacimiento=payload.get("fecha_nacimiento"),
            url_foto=payload.get("url_foto"),
        )
        usuario.roles.append(UsuarioRol(rol=rol))

        direccion_datos = payload.get("direccion")
        direccion_creada: Direccion | None = None
        if direccion_datos:
            direccion_creada = Direccion(**self._preparar_direccion(direccion_datos))
            usuario.direcciones.append(direccion_creada)

        if rol_codigo == "CLIENTE":
            perfil = PerfilCliente(usuario=usuario)
            if direccion_creada:
                perfil.direccion_defecto = direccion_creada
            usuario.perfil_cliente = perfil
        elif rol_codigo == "REPARTIDOR":
            datos_repartidor = payload.get("repartidor")
            if not datos_repartidor:
                raise ServiceError("Se requieren los datos del repartidor", status_code=422)
            estado = self._estado_aprobacion_por_codigo("PENDIENTE")
            licencia_tipo_val = datos_repartidor.get("licencia_tipo")
            vehiculo_tipo_val = datos_repartidor.get("vehiculo_tipo")
            if not vehiculo_tipo_val:
                raise ServiceError("El tipo de vehiculo es obligatorio", status_code=422)
            perfil = PerfilRepartidor(
                usuario=usuario,
                dpi=datos_repartidor.get("dpi"),
                licencia_numero=datos_repartidor.get("licencia_numero"),
                licencia_tipo=LicenciaTipoEnum(licencia_tipo_val) if licencia_tipo_val else None,
                vehiculo_tipo=VehiculoTipoEnum(vehiculo_tipo_val),
                placa=datos_repartidor.get("placa"),
                cuenta_bancaria=datos_repartidor.get("cuenta_bancaria"),
                url_foto=datos_repartidor.get("url_foto"),
                estado_aprobacion=estado,
                activo=False,
            )
            usuario.perfil_repartidor = perfil
        elif rol_codigo == "TIENDA":
            datos_tienda = payload.get("tienda")
            if not datos_tienda:
                raise ServiceError("Se requieren los datos de la tienda", status_code=422)
            estado = self._estado_aprobacion_por_codigo("PENDIENTE")
            tienda = Tienda(
                duenio=usuario,
                razon_social=datos_tienda.get("razon_social"),
                identificacion_legal=datos_tienda.get("identificacion_legal"),
                email=datos_tienda.get("email", email),
                telefono=datos_tienda.get("telefono"),
                url_logo=datos_tienda.get("url_logo"),
                cuenta_bancaria=datos_tienda.get("cuenta_bancaria"),
                id_categoria=datos_tienda.get("id_categoria"),
                estado_aprobacion=estado,
                activo=False,
            )
            direccion_tienda = datos_tienda.get("direccion")
            if direccion_tienda:
                tienda.direccion = Direccion(**self._preparar_direccion(direccion_tienda))
            usuario.tiendas.append(tienda)
        else:
            usuario.activo = True

        db.session.add(usuario)
        db.session.commit()

        codigo = generate_verification_code()
        self._crear_codigo_verificacion(usuario, codigo)
        self._enviar_correo(usuario.email, "Codigo de verificacion", f"Tu codigo es {codigo}")
        return usuario, codigo

    def authenticate(self, email: str, password: str) -> tuple[Usuario, str, str]:
        usuario = Usuario.query.filter_by(email=email.lower()).first()
        if not usuario or not verify_password(password, usuario.password_hash):
            raise ServiceError("Credenciales invalidas", status_code=401)
        if not usuario.activo:
            raise ServiceError("La cuenta aun no se encuentra activa", status_code=403)

        roles = [rel.rol.codigo for rel in usuario.roles]
        if "REPARTIDOR" in roles and (not usuario.perfil_repartidor or not usuario.perfil_repartidor.activo):
            raise ServiceError("El repartidor debe ser aprobado por un administrador", status_code=403)
        if "TIENDA" in roles:
            tienda_activa = any(tienda.activo for tienda in usuario.tiendas)
            if not tienda_activa:
                raise ServiceError("La tienda aun no ha sido aprobada", status_code=403)

        claims = {
            "roles": roles,
            "nombre": usuario.nombres,
            "apellido": usuario.apellidos,
        }
        access_token = create_access_token(identity=usuario.id_usuario, additional_claims=claims)
        refresh_token = create_refresh_token(identity=usuario.id_usuario, additional_claims={"roles": roles})
        return usuario, access_token, refresh_token

    def verify_email(self, email: str, codigo: str) -> Usuario:
        usuario = Usuario.query.filter_by(email=email.lower()).first()
        if not usuario:
            raise NotFoundError("Cuenta no encontrada")
        verificacion = (
            VerificacionCorreo.query.filter_by(id_usuario=usuario.id_usuario, codigo=codigo, consumido_en=None)
            .order_by(VerificacionCorreo.creado_en.desc())
            .first()
        )
        if not verificacion:
            raise ServiceError("Codigo de verificacion invalido", status_code=400)
        if verificacion.expira_en < datetime.utcnow():
            raise ServiceError("El codigo de verificacion expiro", status_code=400)
        verificacion.consumido_en = datetime.utcnow()
        usuario.activo = True
        db.session.commit()
        return usuario

    def resend_verification(self, email: str) -> str:
        usuario = Usuario.query.filter_by(email=email.lower()).first()
        if not usuario:
            raise NotFoundError("Cuenta no encontrada")
        if usuario.activo:
            raise ServiceError("La cuenta ya se encuentra activa", status_code=400)
        codigo = generate_verification_code()
        self._crear_codigo_verificacion(usuario, codigo)
        self._enviar_correo(usuario.email, "Nuevo codigo de verificacion", f"Tu codigo es {codigo}")
        return codigo

    def request_password_reset(self, email: str) -> str:
        usuario = Usuario.query.filter_by(email=email.lower()).first()
        if not usuario:
            raise NotFoundError("Cuenta no encontrada")
        codigo = f"RST-{secrets.token_urlsafe(8)}"
        verificacion = VerificacionCorreo(
            usuario=usuario,
            codigo=codigo,
            expira_en=datetime.utcnow() + timedelta(minutes=20),
        )
        db.session.add(verificacion)
        db.session.commit()
        self._enviar_correo(usuario.email, "Recuperacion de contrasena", f"Codigo: {codigo}")
        return codigo

    def reset_password(self, email: str, codigo: str, nueva_password: str) -> None:
        usuario = Usuario.query.filter_by(email=email.lower()).first()
        if not usuario:
            raise NotFoundError("Cuenta no encontrada")
        verificacion = (
            VerificacionCorreo.query.filter_by(id_usuario=usuario.id_usuario, codigo=codigo, consumido_en=None)
            .order_by(VerificacionCorreo.creado_en.desc())
            .first()
        )
        if not verificacion:
            raise ServiceError("Codigo de recuperacion invalido", status_code=400)
        if verificacion.expira_en < datetime.utcnow():
            raise ServiceError("El codigo ha expirado", status_code=400)
        if not password_is_strong(nueva_password):
            raise ServiceError("La contrasena no cumple la politica de seguridad", status_code=422)
        usuario.password_hash = hash_password(nueva_password)
        verificacion.consumido_en = datetime.utcnow()
        db.session.commit()

    def revoke_token(self, jti: str, usuario_id: int, expires: datetime) -> None:
        token = TokenRevocado(jti=jti, id_usuario=usuario_id, expira_en=expires)
        db.session.add(token)
        db.session.commit()

    def _estado_aprobacion_por_codigo(self, codigo: str) -> EstadoAprobacion:
        estado = EstadoAprobacion.query.filter_by(codigo=codigo).first()
        if not estado:
            raise NotFoundError(
                "Debe existir un estado de aprobacion con codigo PENDIENTE en la base de datos"
            )
        return estado

    def _crear_codigo_verificacion(self, usuario: Usuario, codigo: str) -> None:
        verificacion = VerificacionCorreo(
            usuario=usuario,
            codigo=codigo,
            expira_en=datetime.utcnow() + timedelta(minutes=30),
        )
        db.session.add(verificacion)
        db.session.commit()

    def _preparar_direccion(self, datos: dict) -> dict:
        datos_copia = datos.copy()
        ubicacion = datos_copia.get("ubicacion")
        if isinstance(ubicacion, str):
            datos_copia["ubicacion"] = ubicacion.encode("utf-8")
        return datos_copia

    def _enviar_correo(self, correo: str, asunto: str, cuerpo: str) -> None:  # pragma: no cover
        send_email(EmailMessage(to=[correo], subject=asunto, body=cuerpo))
