from typing import Optional

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
)

from sqlalchemy.orm import Session

from ..database import get_db
from ..services.home_relief_service import (
    search_home_relief,
    serialize_remedy,
)
from .. import models


# ============================================================
# HOME RELIEF ROUTER
# ============================================================

router = APIRouter(
    prefix="/home-relief",
    tags=["Home Relief"],
)


# ============================================================
# SEARCH HOME RELIEF
# ============================================================

@router.get("/search")
def search_home_relief_endpoint(
    q: Optional[str] = Query(
        default=None,
        min_length=2,
        max_length=300,
    ),

    query: Optional[str] = Query(
        default=None,
        min_length=2,
        max_length=300,
    ),

    db: Session = Depends(get_db),
):
    """
    Public Home Relief search.

    Supports:

        /home-relief/search?q=diarrhea

    and:

        /home-relief/search?q=diarrhea%20for%20infants

    The second form is interpreted as:

        symptom/disease = diarrhea
        context = infant
    """

    search_text = (
        q
        or query
        or ""
    ).strip()

    if len(search_text) < 2:
        raise HTTPException(
            status_code=400,
            detail=(
                "Please enter at least 2 characters "
                "to search Home Relief."
            ),
        )

    try:

        result = search_home_relief(
            db,
            search_text,
        )

        return result

    except HTTPException:
        raise

    except Exception as exc:

        print(
            "HOME RELIEF SEARCH ERROR:",
            repr(exc),
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to search approved "
                "home-relief information."
            ),
        )


# ============================================================
# GET SINGLE ACTIVE REMEDY
# ============================================================

@router.get("/{remedy_id}")
def get_home_relief_remedy(
    remedy_id: int,
    db: Session = Depends(get_db),
):
    """
    Return one active Medical Supervisor-approved remedy.

    The response includes ALL safety rules so the citizen portal
    can show who should avoid or use the remedy with caution.
    """

    remedy = (
        db.query(
            models.HomeReliefRemedy
        )
        .filter(
            models.HomeReliefRemedy.id
            == remedy_id,

            models.HomeReliefRemedy.status
            == "ACTIVE",
        )
        .first()
    )

    if not remedy:

        raise HTTPException(
            status_code=404,
            detail="Approved Home Relief remedy not found.",
        )

    return serialize_remedy(
        db,
        remedy,
        {
            "conditions": [],
            "pregnancy": False,
            "breastfeeding": False,
            "age": None,
        },
    )


# ============================================================
# GET REMEDY SAFETY
# ============================================================

@router.get("/{remedy_id}/safety")
def get_home_relief_safety(
    remedy_id: int,
    condition: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """
    Return all safety information for a remedy.

    If condition is supplied, the response also evaluates the
    remedy against that condition.
    """

    remedy = (
        db.query(
            models.HomeReliefRemedy
        )
        .filter(
            models.HomeReliefRemedy.id
            == remedy_id,

            models.HomeReliefRemedy.status
            == "ACTIVE",
        )
        .first()
    )

    if not remedy:

        raise HTTPException(
            status_code=404,
            detail="Approved Home Relief remedy not found.",
        )

    from ..services.home_relief_service import (
        parse_context,
    )

    context = parse_context(
        condition or ""
    )

    serialized = serialize_remedy(
        db,
        remedy,
        context,
    )

    return {
        "id": remedy.id,
        "name": remedy.name,
        "safety": serialized.get(
            "safety",
            {},
        ),
        "safety_rules": serialized.get(
            "safety_rules",
            [],
        ),
        "has_safety_restrictions":
            serialized.get(
                "has_safety_restrictions",
                False,
            ),
    }


# ============================================================
# GET ALTERNATIVES
# ============================================================

@router.get("/{remedy_id}/alternatives")
def get_home_relief_alternatives(
    remedy_id: int,
    condition: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """
    Return approved alternatives that are safe for the supplied
    context.
    """

    remedy = (
        db.query(
            models.HomeReliefRemedy
        )
        .filter(
            models.HomeReliefRemedy.id
            == remedy_id,

            models.HomeReliefRemedy.status
            == "ACTIVE",
        )
        .first()
    )

    if not remedy:

        raise HTTPException(
            status_code=404,
            detail="Approved Home Relief remedy not found.",
        )

    from ..services.home_relief_service import (
        parse_context,
    )

    context = parse_context(
        condition or ""
    )

    serialized = serialize_remedy(
        db,
        remedy,
        context,
    )

    return {
        "id": remedy.id,
        "name": remedy.name,
        "alternatives":
            serialized.get(
                "alternatives",
                [],
            ),
    }


# ============================================================
# HEALTH CHECK
# ============================================================

@router.get("/health")
def home_relief_health():

    return {
        "status": "ok",
        "service": "home-relief",
    }