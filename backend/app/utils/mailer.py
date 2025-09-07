from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Iterable

logger = logging.getLogger(__name__)


@dataclass
class EmailMessage:
    to: Iterable[str]
    subject: str
    body: str
    cc: Iterable[str] | None = None
    bcc: Iterable[str] | None = None


def send_email(message: EmailMessage) -> None:  # pragma: no cover - side effect stub
    """Simple stub to log email intent. Replace with real provider integration."""
    logger.info(
        "Email queued",
        extra={
            "to": list(message.to),
            "subject": message.subject,
        },
    )
