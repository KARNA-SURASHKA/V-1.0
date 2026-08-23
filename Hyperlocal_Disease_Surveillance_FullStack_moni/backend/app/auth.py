from datetime import datetime, timedelta
import os

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from .database import get_db
from .models import User


# ============================================================
# JWT CONFIGURATION
# ============================================================

SECRET_KEY = os.environ.get(
    "SECRET_KEY",
    "hyperlocal-disease-surveillance-secret-key",
)

ALGORITHM = "HS256"

ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 12


# ============================================================
# PASSWORD HASHING
# ============================================================

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
)


def verify_password(
    plain_password: str,
    hashed_password: str,
) -> bool:

    return pwd_context.verify(
        plain_password,
        hashed_password,
    )


def get_password_hash(
    password: str,
) -> str:

    return pwd_context.hash(password)


# Backward compatibility.
# If any older file still imports hash_password,
# it will continue to work.

def hash_password(
    password: str,
) -> str:

    return get_password_hash(password)


# ============================================================
# OAUTH2
# ============================================================

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="auth/login"
)


# ============================================================
# JWT
# ============================================================

def create_access_token(
    data: dict,
    expires_delta: timedelta | None = None,
):

    to_encode = data.copy()

    if expires_delta:

        expire = (
            datetime.utcnow()
            + expires_delta
        )

    else:

        expire = (
            datetime.utcnow()
            + timedelta(
                minutes=ACCESS_TOKEN_EXPIRE_MINUTES
            )
        )

    to_encode.update(
        {
            "exp": expire
        }
    )

    return jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM,
    )


# ============================================================
# CURRENT USER
# ============================================================

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={
            "WWW-Authenticate": "Bearer",
        },
    )

    try:

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM],
        )

        username = payload.get("sub")

        if username is None:
            raise credentials_exception

    except JWTError:

        raise credentials_exception

    user = (
        db.query(User)
        .filter(
            User.username == username
        )
        .first()
    )

    if user is None:
        raise credentials_exception

    # --------------------------------------------------------
    # Prevent deactivated users from accessing protected APIs
    # --------------------------------------------------------

    if not user.is_active:

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated",
        )

    return user


# ============================================================
# ROLE AUTHORIZATION
# ============================================================

def require_role(
    required_role: str,
):

    def role_dependency(
        current_user: User = Depends(
            get_current_user
        ),
    ):

        if current_user.role != required_role:

            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )

        return current_user

    return role_dependency