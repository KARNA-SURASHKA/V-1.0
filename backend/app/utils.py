# backend/app/utils.py
"""Backend utilities.

Contains password hashing helpers and any other small helpers that the
app may use.
"""

from __future__ import annotations

from passlib.context import CryptContext

# Argon2 is secure; fall back to bcrypt if unavailable.
pwd_context = CryptContext(schemes=["argon2", "bcrypt"], deprecated="auto")


def get_password_hash(password: str) -> str:
    """Return a cryptographic hash of *password*.

    The hash can be stored in the database and later verified with
    ``pwd_context.verify(password, hashed)``.
    """
    return pwd_context.hash(password)
