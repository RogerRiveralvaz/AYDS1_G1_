from __future__ import annotations

from typing import Iterable, Sequence, Tuple

from flask import abort, request


def get_pagination(default_per_page: int = 20, max_per_page: int = 100) -> Tuple[int, int]:
    try:
        page = int(request.args.get("page", 1))
        per_page = int(request.args.get("per_page", default_per_page))
    except ValueError:
        abort(400, description="Parámetros de paginación inválidos")
    if page < 1 or per_page < 1 or per_page > max_per_page:
        abort(400, description="Parámetros de paginación inválidos")
    return page, per_page


def paginate_sequence(seq: Sequence, page: int, per_page: int) -> Tuple[Sequence, dict]:
    total = len(seq)
    start = (page - 1) * per_page
    end = start + per_page
    return seq[start:end], {"page": page, "per_page": per_page, "total": total}
