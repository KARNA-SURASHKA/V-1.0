from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import models, schemas, auth
from ..database import get_db


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(
    prefix="/auth",
    tags=["auth"],
)


# ============================================================
# LOGIN
# ============================================================

@router.post(
    "/login",
    response_model=schemas.LoginResponse,
)
def login(
    payload: schemas.LoginRequest,
    db: Session = Depends(get_db),
):
    """
    Authenticate a user and return the complete frontend session.

    The response includes:
        - access_token
        - token_type
        - role
        - username
        - full_name
        - taluk_id
        - taluk_name
    """

    # --------------------------------------------------------
    # FIND USER
    # --------------------------------------------------------

    user = (
        db.query(models.User)
        .filter(
            models.User.username == payload.username
        )
        .first()
    )

    # --------------------------------------------------------
    # VALIDATE CREDENTIALS
    # --------------------------------------------------------

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )

    if not auth.verify_password(
        payload.password,
        user.password_hash,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )

    # --------------------------------------------------------
    # CHECK ACTIVE ACCOUNT
    # --------------------------------------------------------

    if not bool(user.is_active):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "This account is inactive. "
                "Please contact an administrator."
            ),
        )

    # --------------------------------------------------------
    # VALIDATE ROLE
    # --------------------------------------------------------

    if user.role != payload.role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                f"This account is registered as "
                f"'{user.role}', not '{payload.role}'."
            ),
        )

    # --------------------------------------------------------
    # CREATE JWT
    # --------------------------------------------------------

    token = auth.create_access_token(
        {
            "sub": user.username,
            "role": user.role,
        }
    )

    # --------------------------------------------------------
    # DEFAULT LOCATION VALUES
    # --------------------------------------------------------

    taluk_id = None
    taluk_name = None

    # --------------------------------------------------------
    # AGENT-SPECIFIC LOCATION
    # --------------------------------------------------------

    if user.role == "agent":

        agent = (
            db.query(models.Agent)
            .filter(
                models.Agent.user_id == user.id
            )
            .first()
        )

        if agent:

            taluk_id = agent.taluk_id

            if agent.taluk:
                taluk_name = agent.taluk.name

    # --------------------------------------------------------
    # MEDICAL SUPERVISOR
    #
    # Medical supervisors do not use Agent.taluk.
    # Their district assignment is handled separately.
    # --------------------------------------------------------

    # No agent lookup is performed for:
    #     medical_supervisor
    #     admin

    # --------------------------------------------------------
    # RETURN COMPLETE LOGIN SESSION
    # --------------------------------------------------------

    return schemas.LoginResponse(

        # Authentication
        access_token=token,

        # IMPORTANT:
        # This is the field required by the User Portal
        # Medical Assistant header.
        token_type="bearer",

        # User identity
        username=user.username,
        role=user.role,
        full_name=user.full_name,

        # Location information
        taluk_id=taluk_id,
        taluk_name=taluk_name,
    )