# backend/app/routers/auth_router.py
"""FastAPI router for authentication.

This router contains the ``/login`` endpoint and all authentication
related utilities that the rest of the application imports via
``from .auth_router import router``.

All logic uses Firebase Admin SDK to verify the Firebase ID token
sent in the ``Authorization`` header.
"""

import os

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from firebase_admin import credentials, auth as firebase_auth, initialize_app

# Relative imports for database session and User model
from .database import get_db
from .models import User
from sqlalchemy.orm import Session

# ---------------------------------------------------------------------------
# Initialise Firebase Admin SDK once.  ``GOOGLE_APPLICATION_CREDENTIALS`` is
# provided in the backend ``.env`` file.
# ---------------------------------------------------------------------------
cred_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
if not cred_path:
    raise RuntimeError(
        "GOOGLE_APPLICATION_CREDENTIALS env var is required to initialize Firebase Admin SDK"
    )
initialize_app(credentials.Certificate(cred_path))

# FastAPI security dependency
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

router = APIRouter()

# ---------------------------------------------------------------------------
# Firebase token validation and user lookup
# ---------------------------------------------------------------------------

def get_firebase_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> User:
    """Return a local User from an ID token.

    The token is verified by Firebase Admin and the ``sub`` claim is used
    to locate the matching user in the ``users`` table via the
    ``firebase_uid`` column.
    """
    try:
        decoded = firebase_auth.verify_id_token(token)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Firebase token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    uid = decoded.get("sub")
    if not uid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token: no user id",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.query(User).filter(User.firebase_uid == uid).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found in local database",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated",
        )

    return user

# ---------------------------------------------------------------------------
# Role based dependency
# ---------------------------------------------------------------------------

def require_role(required_role: str):
    def role_dependency(current_user: User = Depends(get_firebase_user)):
        if current_user.role != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return current_user
    return role_dependency

# ---------------------------------------------------------------------------
# Login endpoint – the client performs the Firebase UI login; this endpoint
# merely exists to satisfy the OAuth2PasswordBearer tokenUrl.
# ---------------------------------------------------------------------------

@router.post("/login", summary="Login via Firebase Auth")
async def login():
    # The client will have already authenticated with Firebase and will
    # provide a valid ID token on subsequent requests.
    return {
        "message": "Login handled on the client; send ID token on subsequent requests"
    }

# Expose the router in ``__all__`` for easy import via ``from .auth_router
# import router``.
__all__ = ["router", "get_firebase_user", "require_role"]
