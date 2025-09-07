import os
from dotenv import load_dotenv
from flask import Flask
from flask_cors import CORS

from .config import get_config
from .extensions import db, migrate, jwt
from .routes import register_blueprints

load_dotenv()


def create_app(config_name: str | None = None) -> Flask:
    """Application factory used by Flask CLI or WSGI server."""
    app = Flask(__name__)

    config_name = config_name or os.getenv("FLASK_ENV", "development")
    app.config.from_object(get_config(config_name))

    cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
    allowed_origins = [origin.strip() for origin in cors_origins if origin.strip()]
    CORS(
        app,
        resources={r"/api/*": {"origins": allowed_origins}},
        supports_credentials=True,
        allow_headers=["Content-Type", "Authorization"],
        methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    )

    _register_extensions(app)
    register_blueprints(app)

    return app


def _register_extensions(app: Flask) -> None:
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
