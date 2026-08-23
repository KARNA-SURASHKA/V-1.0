# ============================================================
# AI MEDICAL CHATBOT ROUTER
# ============================================================

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Depends, Depends, Depends
from pydantic import BaseModel, Field

from ..services.medical_chat_service import (
    generate_medical_response,
)
from ..database import get_db
from ..services.home_relief_service import build_chat_home_relief_context
from ..database import get_db
from ..services.home_relief_service import build_chat_home_relief_context
from ..database import get_db
from ..services.home_relief_service import build_chat_home_relief_context


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(
    prefix="/medical-chat",
    tags=["Medical Chatbot"],
)


# ============================================================
# REQUEST SCHEMA
# ============================================================

class MedicalChatRequest(BaseModel):

    message: str = Field(
        ...,
        min_length=1,
        max_length=5000,
    )

    conversation: List[
        Dict[str, Any]
    ] = Field(
        default_factory=list
    )

    location: Optional[
        Dict[str, Any]
    ] = None


# ============================================================
# RESPONSE SCHEMA
# ============================================================

class MedicalChatResponse(BaseModel):

    response: str

    safety_notice: str

    source: str


# ============================================================
# CHAT ENDPOINT
# ============================================================

@router.post(
    "",
    response_model=MedicalChatResponse,
)
def medical_chat(
    payload: MedicalChatRequest,
    db = Depends(get_db),
):
    """
    Public citizen medical-information endpoint.

    This endpoint intentionally does NOT require JWT
    authentication.

    It provides general educational medical information
    and does not provide:

    - diagnosis
    - prescriptions
    - medication dosage
    - personalized treatment plans
    """

    # --------------------------------------------------------
    # Validate message
    # --------------------------------------------------------

    message = payload.message.strip()

    if not message:
        raise HTTPException(
            status_code=400,
            detail="Please enter a medical question.",
        )

    # --------------------------------------------------------
    # Generate AI response
    # --------------------------------------------------------

    try:

        home_relief_context = build_chat_home_relief_context(db, message)

        response = generate_medical_response(
            message=message,
            conversation=payload.conversation,
            location=payload.location,
            home_relief_context=home_relief_context,
        )

    except ValueError as exc:

        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )

    except Exception as exc:

        print(
            "Medical chatbot router error:",
            exc,
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "The medical chatbot could not "
                "process your request right now."
            ),
        )

    # --------------------------------------------------------
    # Return response
    # --------------------------------------------------------

    return MedicalChatResponse(
        response=response,

        safety_notice=(
            "This chatbot provides general medical "
            "information and does not provide diagnosis, "
            "prescriptions, dosage instructions or "
            "personalized treatment."
        ),

        source=(
            "AI Medical Information Assistant"
        ),
    )