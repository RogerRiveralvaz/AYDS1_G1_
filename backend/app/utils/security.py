from __future__ import annotations

import secrets
import string
from typing import Iterable

from werkzeug.security import check_password_hash, generate_password_hash

PASSWORD_ALPHABET = string.ascii_letters + string.digits + "!@#$%^&*()_+-="


def hash_password(password: str) -> str:
    return generate_password_hash(password, method="pbkdf2:sha256", salt_length=16)


def verify_password(password: str, password_hash: str) -> bool:
    return check_password_hash(password_hash, password)


def generate_verification_code(length: int = 6) -> str:
    if length <= 0:
        raise ValueError("length must be greater than zero")
    return "".join(secrets.choice(string.digits) for _ in range(length))


def password_is_strong(password: str, min_length: int = 10) -> bool:
    if len(password) < min_length:
        return False
    categories: Iterable[bool] = (
        any(c.islower() for c in password),
        any(c.isupper() for c in password),
        any(c.isdigit() for c in password),
        any(c in string.punctuation for c in password),
    )
    return sum(1 for ok in categories if ok) >= 3
