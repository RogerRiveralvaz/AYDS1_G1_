from flask import Flask

from .admin import bp as admin_bp
from .auth import bp as auth_bp
from .catalogo import bp as catalogo_bp
from .carrito import bp as carrito_bp
from .direcciones import bp as direcciones_bp
from .entregas import bp as entregas_bp
from .pagos import bp as pagos_bp
from .pedidos import bp as pedidos_bp
from .roles import bp as roles_bp
from .tiendas import bp as tiendas_bp
from .usuarios import bp as usuarios_bp


def register_blueprints(app: Flask) -> None:
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(roles_bp, url_prefix="/api/roles")
    app.register_blueprint(usuarios_bp, url_prefix="/api/usuarios")
    app.register_blueprint(catalogo_bp, url_prefix="/api/catalogo")
    app.register_blueprint(tiendas_bp, url_prefix="/api/tiendas")
    app.register_blueprint(carrito_bp, url_prefix="/api/carrito")
    app.register_blueprint(pedidos_bp, url_prefix="/api/pedidos")
    app.register_blueprint(direcciones_bp, url_prefix="/api/direcciones")
    app.register_blueprint(entregas_bp, url_prefix="/api/entregas")
    app.register_blueprint(pagos_bp, url_prefix="/api/pagos")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")
