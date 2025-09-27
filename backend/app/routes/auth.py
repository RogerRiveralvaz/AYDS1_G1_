from __future__ import annotations

from datetime import datetime
from sqlalchemy import text
from werkzeug.security import generate_password_hash

from flask import Blueprint, jsonify, request
from flask_jwt_extended import (
    create_access_token,
    get_jwt,
    get_jwt_identity,
    jwt_required,
)
from marshmallow import Schema, fields, validate
import re
from ..extensions import db, jwt
from ..models import TokenRevocado, Usuario
from ..schemas.usuario import LoginSchema, UsuarioRegisterSchema, UsuarioSchema, VerifyEmailSchema
from ..services import ServiceError
from ..services.auth_service import AuthService

bp = Blueprint("auth", __name__)

DEFAULT_AVATAR_URL = "https://thumbs.dreamstime.com/b/perfil-de-un-perro-del-perro-perdiguero-de-oro-23053593.jpg"

def _payload():
    # Soporta JSON y multipart/form-data
    if request.content_type and "multipart/form-data" in request.content_type:
        return {k: v for k, v in request.form.items()}
    return request.get_json(silent=True) or {}

def _require(data, fields):
    missing = [f for f in fields if not str(data.get(f, "")).strip()]
    if missing:
        raise ValueError(f"Faltan campos obligatorios: {', '.join(missing)}")

def _fetch_one(sql: str, **params):
    return db.session.execute(text(sql), params).mappings().first()

def _fetch_all(sql: str, **params):
    return db.session.execute(text(sql), params).mappings().all()

def _exec(sql: str, **params):
    return db.session.execute(text(sql), params)

def _pending_status_id():
    row = _fetch_one(
        "SELECT id_estado_aprobacion FROM estado_aprobacion "
        "WHERE UPPER(codigo) IN ('PENDIENTE','PENDING') "
        "ORDER BY id_estado_aprobacion LIMIT 1"
    )
    return row["id_estado_aprobacion"] if row else 1

def _slugify_username(s: str) -> str:
    s = s.lower()
    s = re.sub(r"[^a-z0-9._-]+", "", s)
    return s[:32] or "user"  # límite razonable

def _unique_username(base: str) -> str:
    base = _slugify_username(base)
    candidate = base
    i = 1
    while _fetch_one("SELECT id_usuario FROM usuario WHERE username=:u LIMIT 1", u=candidate):
        i += 1
        candidate = f"{base}{i}"
    return candidate



_auth_service = AuthService()
_register_schema = UsuarioRegisterSchema()
_login_schema = LoginSchema()
_usuario_schema = UsuarioSchema()
_verify_schema = VerifyEmailSchema()


class EmailOnlySchema(Schema):
    email = fields.Email(required=True)


class PasswordResetSchema(Schema):
    email = fields.Email(required=True)
    codigo = fields.Str(required=True)
    nueva_password = fields.Str(required=True, validate=validate.Length(min=10))


@bp.errorhandler(ServiceError)
def _handle_service_error(err: ServiceError):
    return jsonify({"message": err.message}), err.status_code


@bp.post("/register")
def register_usuario():
    """
    Registro simple por rol (sin verificación de correo).
    Campos base: rol_codigo, nombres, apellidos, email, password
    - CLIENTE: genero(opc), telefono(opc), fecha_nacimiento(opc), direccion(opc)
    - REPARTIDOR: dpi, vehiculo_tipo, cuenta_bancaria, + opcionales (licencia_numero, licencia_tipo, placa, direccion_residencia, telefono, fecha_nacimiento)
    - TIENDA: razon_social, representante, telefono, cuenta_bancaria, direccion (+ opcionales: identificacion_legal, horarios, categoria)
    - ADMIN: nivel_permisos(opc)
    """
    data = _payload()
    try:
        # 1) Validación base
        _require(data, ["rol_codigo", "nombres", "apellidos", "email", "password"])
        rol_codigo = str(data["rol_codigo"]).strip().upper()

        # 2) Rol válido
        rol = _fetch_one("SELECT id_rol FROM rol WHERE UPPER(codigo)=:codigo", codigo=rol_codigo)
        if not rol:
            return jsonify({"message": f"Rol inválido: {rol_codigo}"}), 400

        # 3) Email único
        exists = _fetch_one("SELECT id_usuario FROM usuario WHERE LOWER(email)=LOWER(:e)", e=data["email"])
        if exists:
            return jsonify({"message": "El correo ya está registrado"}), 400

        # 4) Hash de contraseña
        pwd_hash = generate_password_hash(str(data["password"]), method="pbkdf2:sha256", salt_length=16)
        # base para username: si lo mandan lo usamos; si no, del email antes de @
        base_username = (str(data.get("username") or "")).strip()
        if not base_username:
            base_username = str(data["email"]).split("@", 1)[0]

        username_val = _unique_username(base_username)
        # 5) Insert usuario (activo=1 para permitir login sin verificación)
        _exec(
            """
            INSERT INTO usuario (username, email, password_hash, nombres, apellidos, genero, telefono, fecha_nacimiento, url_foto, activo)
            VALUES (:username, :email, :password_hash, :nombres, :apellidos, :genero, :telefono, :fecha_nacimiento, :url_foto, :activo)
            """,
            username=username_val,
            email=data["email"].strip(),
            password_hash=pwd_hash,
            nombres=data["nombres"].strip(),
            apellidos=data["apellidos"].strip(),
            genero=data.get("genero") if data.get("genero") in ("M", "F", "O") else None,
            telefono=(data.get("telefono") or "").strip() or None,
            fecha_nacimiento=data.get("fecha_nacimiento") or None,
            url_foto=DEFAULT_AVATAR_URL,
            activo=1,
        )
        id_usuario = _fetch_one("SELECT LAST_INSERT_ID() AS id")["id"]

        # 6) Asignar rol
        _exec(
            "INSERT INTO usuario_rol (id_usuario, id_rol) VALUES (:u, :r)",
            u=id_usuario, r=rol["id_rol"]
        )

        # 7) Por rol
        if rol_codigo == "CLIENTE":
            # Dirección opcional
            id_dir_def = None
            direccion_txt = (data.get("direccion") or "").strip()
            if direccion_txt:
                _exec(
                    """
                    INSERT INTO direccion (id_usuario, etiqueta, linea1, ciudad, estado, codigo_postal, pais, ubicacion)
                    VALUES (:u, :etiqueta, :l1, :ciudad, :estado, :cp, :pais, :ubic)
                    """,
                    u=id_usuario, etiqueta="Dirección principal", l1=direccion_txt,
                    ciudad=(data.get("ciudad") or "Ciudad"),
                    estado=(data.get("estado") or None),
                    cp=(data.get("codigo_postal") or None),
                    pais="GT", ubic=None
                )
                id_dir_def = _fetch_one("SELECT LAST_INSERT_ID() AS id")["id"]

            _exec(
                "INSERT INTO perfil_cliente (id_usuario, id_direccion_defecto) VALUES (:u, :d)",
                u=id_usuario, d=id_dir_def
            )

        elif rol_codigo == "REPARTIDOR":
            _require(data, ["dpi", "vehiculo_tipo", "cuenta_bancaria"])
            id_estado_aprob = _pending_status_id()


            _exec(
                """
                INSERT INTO perfil_repartidor
                (id_usuario, dpi, licencia_numero, licencia_tipo, vehiculo_tipo, placa, cuenta_bancaria, url_foto, id_estado_aprobacion, activo)
                VALUES
                (:u, :dpi, :licnum, :lictipo, :vehtipo, :placa, :cta, :foto, :estado, :activo)
                """,
                u=id_usuario,
                dpi=(data["dpi"] or "").strip(),
                licnum=(data.get("licencia_numero") or None),
                lictipo=(data.get("licencia_tipo") or "NO_APLICA"),
                vehtipo=(data.get("vehiculo_tipo") or "BICICLETA"),
                placa=(data.get("placa") or None),
                cta=(data["cuenta_bancaria"] or "").strip(),
                foto=DEFAULT_AVATAR_URL,
                estado=id_estado_aprob,
                activo=0,
            )

            # Dirección de residencia opcional
            dir_res = (data.get("direccion_residencia") or "").strip()
            if dir_res:
                _exec(
                    """
                    INSERT INTO direccion (id_usuario, etiqueta, linea1, ciudad, estado, codigo_postal, pais, ubicacion)
                    VALUES (:u, :etiqueta, :l1, :ciudad, :estado, :cp, :pais, :ubic)
                    """,
                    u=id_usuario, etiqueta="Residencia", l1=dir_res,
                    ciudad=(data.get("ciudad") or "Ciudad"),
                    estado=(data.get("estado") or None),
                    cp=(data.get("codigo_postal") or None),
                    pais="GT", ubic=None
                )

        elif rol_codigo == "TIENDA":
            _require(data, ["razon_social", "representante", "telefono", "cuenta_bancaria", "direccion"])
            id_estado_aprob = _pending_status_id()


            # Dirección de tienda
            _exec(
                """
                INSERT INTO direccion (id_usuario, etiqueta, linea1, ciudad, estado, codigo_postal, pais, ubicacion)
                VALUES (:u, :etiqueta, :l1, :ciudad, :estado, :cp, :pais, :ubic)
                """,
                u=id_usuario, etiqueta="Dirección de tienda", l1=(data["direccion"] or "").strip(),
                ciudad=(data.get("ciudad") or "Ciudad"),
                estado=(data.get("estado") or None),
                cp=(data.get("codigo_postal") or None),
                pais="GT", ubic=None
            )
            id_dir = _fetch_one("SELECT LAST_INSERT_ID() AS id")["id"]

            # Resolver categoría por nombre/slug (opcional)
            id_categoria = None
            cat = (data.get("categoria") or "").strip()
            if cat:
                row_cat = _fetch_one(
                    "SELECT id_categoria FROM categoria WHERE LOWER(nombre)=LOWER(:q) OR LOWER(slug)=LOWER(:q) LIMIT 1",
                    q=cat,
                )
                id_categoria = row_cat["id_categoria"] if row_cat else None

            _exec(
                """
                INSERT INTO tienda
                (id_usuario_duenio, razon_social, identificacion_legal, email, telefono, url_logo,
                 id_categoria, cuenta_bancaria, id_direccion, id_estado_aprobacion, activo)
                VALUES
                (:u, :razon, :ident, :email, :tel, :logo, :idcat, :cta, :iddir, :estado, :activo)
                """,
                u=id_usuario,
                razon=(data["razon_social"] or "").strip(),
                ident=(data.get("identificacion_legal") or None),
                email=data["email"].strip(),
                tel=(data["telefono"] or "").strip(),
                logo=DEFAULT_AVATAR_URL,
                idcat=id_categoria,
                cta=(data["cuenta_bancaria"] or "").strip(),
                iddir=id_dir,
                estado=id_estado_aprob,
                activo=0,
            )
            # (Si luego quieres poblar horario_tienda a partir de "horarios", aquí iría.)

        elif rol_codigo == "ADMIN":
            # nada adicional obligatorio en BD
            pass

        # 8) Commit
        db.session.commit()

        # 9) Devolver usuario compacto + roles (lo que espera tu frontend)
        user_row = _fetch_one(
            "SELECT id_usuario, email, nombres, apellidos FROM usuario WHERE id_usuario=:id",
            id=id_usuario,
        )
        roles = [r["codigo"] for r in _fetch_all(
            "SELECT r.codigo FROM usuario_rol ur JOIN rol r ON r.id_rol=ur.id_rol WHERE ur.id_usuario=:id",
            id=id_usuario,
        )]
        usuario = {
            "id_usuario": user_row["id_usuario"],
            "email": user_row["email"],
            "nombres": user_row["nombres"],
            "apellidos": user_row["apellidos"],
            "roles": roles,
            "url_foto": DEFAULT_AVATAR_URL,
        }
        return jsonify({"usuario": usuario, "message": "Registro creado"}), 201

    except ValueError as ve:
        db.session.rollback()
        return jsonify({"message": str(ve)}), 400
    except Exception:
        db.session.rollback()
        return jsonify({"message": "Error interno al registrar"}), 500



@bp.post("/login")
def login():
    credentials = _login_schema.load(request.get_json() or {})
    usuario, access_token, refresh_token = _auth_service.authenticate(
        credentials["email"], credentials["password"]
    )
    return jsonify(
        {
            "usuario": _usuario_schema.dump(usuario),
            "access_token": access_token,
            "refresh_token": refresh_token,
        }
    )


@bp.post("/refresh")
@jwt_required(refresh=True)
def refresh_token():
    identity = get_jwt_identity()
    claims = get_jwt()
    roles = claims.get("roles", [])
    usuario = Usuario.query.get(identity)
    if not usuario:
        return jsonify({"message": "Usuario no encontrado"}), 404
    additional_claims = {"roles": roles, "nombre": usuario.nombres, "apellido": usuario.apellidos}
    new_token = create_access_token(identity=identity, additional_claims=additional_claims)
    return jsonify({"access_token": new_token})


@bp.post("/logout")
@jwt_required()
def logout():
    jti = get_jwt()["jti"]
    user_id = get_jwt_identity()
    exp_ts = get_jwt()["exp"]
    expires = datetime.utcfromtimestamp(exp_ts)
    _auth_service.revoke_token(jti, user_id, expires)
    return jsonify({"message": "Sesion finalizada"})


@bp.post("/verify-email")
def verify_email():
    data = _verify_schema.load(request.get_json() or {})
    usuario = _auth_service.verify_email(data["email"], data["codigo"])
    return jsonify({"usuario": _usuario_schema.dump(usuario)})


@bp.post("/resend-verification")
def resend_verification():
    data = EmailOnlySchema().load(request.get_json() or {})
    codigo = _auth_service.resend_verification(data["email"])
    return jsonify({"message": "Codigo reenviado", "codigo": codigo})


@bp.post("/request-password-reset")
def request_password_reset():
    data = EmailOnlySchema().load(request.get_json() or {})
    codigo = _auth_service.request_password_reset(data["email"])
    return jsonify({"message": "Solicitud registrada", "codigo": codigo})


@bp.post("/reset-password")
def reset_password():
    data = PasswordResetSchema().load(request.get_json() or {})
    _auth_service.reset_password(data["email"], data["codigo"], data["nueva_password"])
    return jsonify({"message": "Contrase?a actualizada"})


@jwt.token_in_blocklist_loader
def check_if_token_revoked(_jwt_header, jwt_payload):
    jti = jwt_payload["jti"]
    return TokenRevocado.query.filter_by(jti=jti).first() is not None


@jwt.user_lookup_loader
def lookup_user(_jwt_header, jwt_payload):
    identity = jwt_payload["sub"]
    return db.session.get(Usuario, identity)
