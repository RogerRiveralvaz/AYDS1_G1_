from __future__ import annotations

from functools import wraps
from typing import Callable

from flask import abort
from flask_jwt_extended import get_jwt, verify_jwt_in_request


def roles_required(*role_codes: str) -> Callable:
    def decorator(fn: Callable) -> Callable:
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt() or {}
            user_roles: list[str] = claims.get("roles", [])
            if not set(role_codes).intersection(user_roles):
                abort(403, description="Usuario sin permisos suficientes")
            return fn(*args, **kwargs)

        return wrapper

    return decorator


def admin_required(fn: Callable) -> Callable:
    return roles_required("ADMIN")(fn)
