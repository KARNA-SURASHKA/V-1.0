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
)


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
#
# Supports BOTH:
#
#   /home-relief/search?q=Sore%20Throat
#
# and:
#
#   /home-relief/search?query=Sore%20Throat
#
# This prevents frontend/backend parameter mismatch.
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
    # --------------------------------------------------------
    # USE EITHER q OR query
    # --------------------------------------------------------

    search_text = (
        q
        or query
        or ""
    ).strip()

    # --------------------------------------------------------
    # VALIDATION
    # --------------------------------------------------------

    if len(search_text) < 2:
        raise HTTPException(
            status_code=400,
            detail=(
                "Please enter at least 2 characters "
                "to search Home Relief."
            ),
        )

    # --------------------------------------------------------
    # DEBUG
    # --------------------------------------------------------

    print(
        "\n=================================================="
    )

    print(
        "HOME RELIEF SEARCH"
    )

    print(
        "q:",
        repr(q),
    )

    print(
        "query:",
        repr(query),
    )

    print(
        "search_text:",
        repr(search_text),
    )

    # --------------------------------------------------------
    # DATABASE SEARCH
    # --------------------------------------------------------

    try:

        result = search_home_relief(
            db,
            search_text,
        )

        # ----------------------------------------------------
        # DEBUG RESULT
        # ----------------------------------------------------

        print(
            "total_found:",
            result.get(
                "total_found",
                0,
            ),
        )

        print(
            "recommended:",
            len(
                result.get(
                    "recommended",
                    [],
                )
            ),
        )

        print(
            "use_with_caution:",
            len(
                result.get(
                    "use_with_caution",
                    [],
                )
            ),
        )

        print(
            "restricted:",
            len(
                result.get(
                    "restricted",
                    [],
                )
            ),
        )

        print(
            "alternatives:",
            len(
                result.get(
                    "alternatives",
                    [],
                )
            ),
        )

        print(
            "==================================================\n"
        )

        return result

    except Exception as exc:

        print(
            "\n=================================================="
        )

        print(
            "HOME RELIEF SEARCH ERROR:"
        )

        print(
            repr(exc)
        )

        print(
            "==================================================\n"
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to search approved "
                "home-relief information."
            ),
        )


# ============================================================
# HEALTH CHECK
# ============================================================
#
# Test:
#
# http://localhost:8000/home-relief/health
#
# Expected:
#
# {
#     "status": "ok",
#     "service": "home-relief"
# }
#
# ============================================================

@router.get("/health")
def home_relief_health():

    return {
        "status": "ok",
        "service": "home-relief",
    }