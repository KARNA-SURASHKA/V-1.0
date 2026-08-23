from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import models, schemas, auth
from ..database import get_db


router = APIRouter(
    prefix="/auth",
    tags=["auth"],
)


@router.post(
    "/login",
    response_model=schemas.LoginResponse,
)
def login(
    payload: schemas.LoginRequest,
    db: Session = Depends(get_db),
):
    # -----------------------------------------------------------------------
    # Find user
    # -----------------------------------------------------------------------

    user = (
        db.query(models.User)
        .filter(
            models.User.username == payload.username
        )
        .first()
    )

    # -----------------------------------------------------------------------
    # Validate credentials
    # -----------------------------------------------------------------------

    if not user or not auth.verify_password(
        payload.password,
        user.password_hash,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )

    # -----------------------------------------------------------------------
    # Do not allow inactive users/agents to log in
    # -----------------------------------------------------------------------

    if not bool(user.is_active):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "This account is inactive. "
                "Please contact an administrator."
            ),
        )

    # -----------------------------------------------------------------------
    # Validate requested role
    # -----------------------------------------------------------------------

    if user.role != payload.role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                f"This account is registered as "
                f"'{user.role}', not '{payload.role}'."
            ),
        )

    # -----------------------------------------------------------------------
    # Create JWT
    # -----------------------------------------------------------------------

    token = auth.create_access_token(
        {
            "sub": user.username,
            "role": user.role,
        }
    )

    # -----------------------------------------------------------------------
    # Agent-specific information
    #
    # User does not have an "agent_profile" attribute.
    # Agent is a separate model linked through user_id.
    # -----------------------------------------------------------------------

    taluk_id = None
    taluk_name = None

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

    # -----------------------------------------------------------------------
    # Return login response
    # -----------------------------------------------------------------------

    return schemas.LoginResponse(
        access_token=token,
        role=user.role,
        full_name=user.full_name,
        taluk_id=taluk_id,
        taluk_name=taluk_name,
    )

