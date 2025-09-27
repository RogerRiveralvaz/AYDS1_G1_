import os
from datetime import timedelta


def _build_database_uri() -> str:
    database_url = os.getenv("DATABASE_URL")
    if database_url:
        return database_url

    user = os.getenv("DB_USER", "root")
    password = os.getenv("DB_PASSWORD", "1234")
    host = os.getenv("DB_HOST", "localhost")
    port = os.getenv("DB_PORT", "3306")
    name = os.getenv("DB_NAME", "entregas_db")
    if password:
        return f"mysql+pymysql://{user}:{password}@{host}:{port}/{name}"
    return f"mysql+pymysql://{user}:{password}@{host}:{port}/{name}"


class BaseConfig:
    SECRET_KEY = os.getenv("SECRET_KEY", "super_secret_change_me")
    SQLALCHEMY_DATABASE_URI = _build_database_uri()
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {"pool_pre_ping": True, "pool_recycle": 280}
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "another_secret_change_me")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(
        minutes=int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES_MIN", "15"))
    )
    PROPAGATE_EXCEPTIONS = True


class DevelopmentConfig(BaseConfig):
    DEBUG = True


class TestingConfig(BaseConfig):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = os.getenv("TEST_DATABASE_URI", "sqlite:///:memory:")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=5)


class ProductionConfig(BaseConfig):
    DEBUG = False


CONFIG_MAPPING = {
    "development": DevelopmentConfig,
    "testing": TestingConfig,
    "production": ProductionConfig,
}


def get_config(name: str):
    return CONFIG_MAPPING.get(name, DevelopmentConfig)
