import os
from dotenv import load_dotenv
from flask import Flask, request
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

    cors_origins_env = os.getenv("CORS_ORIGINS")
    if cors_origins_env:
        if cors_origins_env.strip() == "*":
            allowed_origins = ["http://localhost:5173"]
        else:
            allowed_origins = [origin.strip() for origin in cors_origins_env.split(",") if origin.strip()]
    else:
        allowed_origins = ["http://localhost:5173"]

    app.config["CORS_ALLOWED_ORIGINS"] = allowed_origins

    CORS(
        app,
        resources={r"/api/*": {"origins": allowed_origins}},
        supports_credentials=True,
        allow_headers=["Content-Type", "Authorization"],
        methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        send_wildcard=False,
    )

    @app.after_request
    def _set_cors_headers(response):
        origin = request.headers.get("Origin")
        if origin and origin in app.config["CORS_ALLOWED_ORIGINS"]:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
            vary = response.headers.get("Vary")
            if vary:
                vary_values = [item.strip() for item in vary.split(",")]
                if "Origin" not in vary_values:
                    response.headers["Vary"] = f"{vary}, Origin"
            else:
                response.headers["Vary"] = "Origin"
            if request.method == "OPTIONS":
                response.headers.setdefault(
                    "Access-Control-Allow-Headers",
                    "Content-Type, Authorization",
                )
                response.headers.setdefault(
                    "Access-Control-Allow-Methods",
                    "GET, POST, PUT, PATCH, DELETE, OPTIONS",
                )
        return response

    _register_extensions(app)
    register_blueprints(app)

    return app


def _register_extensions(app: Flask) -> None:
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)