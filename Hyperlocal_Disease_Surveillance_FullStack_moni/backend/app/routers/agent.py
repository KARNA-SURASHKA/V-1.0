from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from .. import models, schemas, auth
from ..database import get_db
from ..utils import current_week_number


router = APIRouter(
    prefix="/agent",
    tags=["agent"],
)


# ============================================================================
# HELPERS
# ============================================================================

def _get_agent_profile(
    user: models.User,
    db: Session,
) -> models.Agent:
    """
    Get the Agent profile belonging to the authenticated User.
    """

    agent = (
        db.query(models.Agent)
        .filter(
            models.Agent.user_id == user.id
        )
        .first()
    )

    if not agent:
        raise HTTPException(
            status_code=400,
            detail="This account has no assigned taluk.",
        )

    # ------------------------------------------------------------
    # Make sure inactive agents cannot submit reports
    # ------------------------------------------------------------

    if not user.is_active:
        raise HTTPException(
            status_code=403,
            detail="This agent account is inactive.",
        )

    return agent


def _validate_report_items(items):
    """
    Validate weekly disease report entries.
    """

    if not items:
        raise HTTPException(
            status_code=400,
            detail="At least one disease entry is required.",
        )

    seen_diseases = set()

    for item in items:

        # --------------------------------------------------------
        # Disease
        # --------------------------------------------------------

        disease_name = (
            item.disease or ""
        ).strip()

        if not disease_name:
            raise HTTPException(
                status_code=400,
                detail="Disease name cannot be empty.",
            )

        # --------------------------------------------------------
        # Cases
        # --------------------------------------------------------

        if item.cases is None:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Cases for '{disease_name}' "
                    "must be provided."
                ),
            )

        if item.cases < 0:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Cases for '{disease_name}' "
                    "must be zero or a positive number."
                ),
            )

        # --------------------------------------------------------
        # Severity
        # --------------------------------------------------------

        if item.severity not in (
            "Low",
            "Moderate",
            "High",
        ):
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Invalid severity for "
                    f"'{disease_name}'. "
                    "Severity must be Low, Moderate, or High."
                ),
            )

        # --------------------------------------------------------
        # Official disease registry
        # --------------------------------------------------------

        if db is not None:
            official = (
                db.query(models.Disease)
                .filter(
                    models.Disease.name.ilike(disease_name),
                    models.Disease.is_active == True,
                    models.Disease.verification_status == "VERIFIED",
                )
                .first()
            )

            if not official:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"'{disease_name}' is not an approved disease. "
                        "Submit it through Emerging Disease Surveillance for medical verification."
                    ),
                )

        # --------------------------------------------------------
        # Duplicate disease
        # --------------------------------------------------------

        disease_key = disease_name.lower()

        if disease_key in seen_diseases:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Duplicate disease '{disease_name}' "
                    "is not allowed."
                ),
            )

        seen_diseases.add(disease_key)


# ============================================================================
# AGENT STATUS
# ============================================================================

@router.get(
    "/status",
    response_model=schemas.AgentStatusOut,
)
def get_status(
    db: Session = Depends(get_db),
    user: models.User = Depends(
        auth.require_role("agent")
    ),
):
    """
    Return the logged-in agent's profile and
    current weekly report status.
    """

    agent = _get_agent_profile(
        user,
        db,
    )

    week = current_week_number()

    # ------------------------------------------------------------
    # Latest submitted report
    # ------------------------------------------------------------

    latest_report = (
        db.query(models.DiseaseReport)
        .filter(
            models.DiseaseReport.agent_id == agent.id
        )
        .order_by(
            models.DiseaseReport.created_at.desc()
        )
        .first()
    )

    # ------------------------------------------------------------
    # Has this agent submitted anything this week?
    # ------------------------------------------------------------

    already_submitted = (
        db.query(models.DiseaseReport)
        .filter(
            models.DiseaseReport.agent_id == agent.id,
            models.DiseaseReport.taluk_id == agent.taluk_id,
            models.DiseaseReport.week_number == week,
        )
        .first()
        is not None
    )

    # ------------------------------------------------------------
    # Return complete AgentStatusOut
    # ------------------------------------------------------------

    return schemas.AgentStatusOut(
        id=agent.id,
        username=user.username,
        full_name=user.full_name,
        taluk_id=agent.taluk_id,
        taluk_name=(
            agent.taluk.name
            if agent.taluk
            else None
        ),
        is_active=bool(user.is_active),
        current_week=week,
        already_submitted=already_submitted,
        last_submitted_at=(
            latest_report.created_at
            if latest_report
            else None
        ),
    )


# ============================================================================
# CURRENT WEEK REPORT
# ============================================================================

@router.get(
    "/reports/current",
    response_model=List[schemas.ReportOut],
)
def get_current_week_report(
    db: Session = Depends(get_db),
    user: models.User = Depends(
        auth.require_role("agent")
    ),
):
    """
    Return the logged-in agent's disease entries
    for the current week.
    """

    agent = _get_agent_profile(
        user,
        db,
    )

    week = current_week_number()

    reports = (
        db.query(models.DiseaseReport)
        .filter(
            models.DiseaseReport.agent_id == agent.id,
            models.DiseaseReport.taluk_id == agent.taluk_id,
            models.DiseaseReport.week_number == week,
        )
        .order_by(
            models.DiseaseReport.id.asc()
        )
        .all()
    )

    return reports


# ============================================================================
# SUBMIT / UPDATE WEEKLY REPORT
# ============================================================================

@router.post(
    "/reports",
    response_model=List[schemas.ReportOut],
)
def submit_weekly_report(
    payload: schemas.WeeklyReportIn,
    db: Session = Depends(get_db),
    user: models.User = Depends(
        auth.require_role("agent")
    ),
):
    """
    Create or update the logged-in agent's weekly report.

    Behaviour:

    - Creates new disease entries.
    - Updates existing disease entries.
    - Allows additional diseases to be submitted.
    - Prevents duplicate diseases in the same submission.
    - Removes diseases that were removed from the form.
    - Stores the correct year.
    - Stores the current surveillance week.
    """

    agent = _get_agent_profile(
        user,
        db,
    )

    # ------------------------------------------------------------
    # Current surveillance period
    # ------------------------------------------------------------

    current_week = current_week_number()
    current_year = datetime.utcnow().year

    # ------------------------------------------------------------
    # Validate incoming data
    # ------------------------------------------------------------

    _validate_report_items(
        payload.reports,
        db,
    )

    # ------------------------------------------------------------
    # Validate submitted week if frontend provided one
    #
    # We allow the frontend to send the current week.
    # We do not allow an old/future week to be submitted.
    # ------------------------------------------------------------

    if payload.week_number != current_week:
        raise HTTPException(
            status_code=400,
            detail=(
                "The submitted report belongs to an "
                "invalid surveillance week. Please refresh "
                "the Agent Portal and try again."
            ),
        )

    # ------------------------------------------------------------
    # Validate year
    # ------------------------------------------------------------

    submitted_year = payload.year

    if submitted_year != current_year:
        raise HTTPException(
            status_code=400,
            detail=(
                "The submitted report belongs to an "
                "invalid year. Please refresh the Agent Portal "
                "and try again."
            ),
        )

    # ------------------------------------------------------------
    # Get existing current-week reports
    # ------------------------------------------------------------

    existing_reports = (
        db.query(models.DiseaseReport)
        .filter(
            models.DiseaseReport.agent_id == agent.id,
            models.DiseaseReport.taluk_id == agent.taluk_id,
            models.DiseaseReport.week_number == current_week,
            models.DiseaseReport.year == current_year,
        )
        .order_by(
            models.DiseaseReport.id.asc()
        )
        .all()
    )

    # ------------------------------------------------------------
    # Map existing reports by disease
    # ------------------------------------------------------------

    existing_by_disease = {
        report.disease.strip().lower(): report
        for report in existing_reports
    }

    incoming_diseases = set()

    updated_reports = []

    # ------------------------------------------------------------
    # Process submitted diseases
    # ------------------------------------------------------------

    for item in payload.reports:

        disease_name = (
            item.disease or ""
        ).strip()

        disease_key = (
            disease_name.lower()
        )

        incoming_diseases.add(
            disease_key
        )

        existing_report = (
            existing_by_disease.get(
                disease_key
            )
        )

        # ========================================================
        # UPDATE EXISTING DISEASE
        # ========================================================

        if existing_report:

            existing_report.disease = (
                disease_name
            )

            existing_report.cases = (
                int(item.cases)
            )

            existing_report.severity = (
                item.severity
            )

            existing_report.remarks = (
                item.remarks or ""
            )

            existing_report.preventive_measures = (
                item.preventive_measures or ""
            )

            existing_report.year = (
                current_year
            )

            existing_report.week_number = (
                current_week
            )

            existing_report.updated_at = (
                datetime.utcnow()
            )

            updated_reports.append(
                existing_report
            )

        # ========================================================
        # CREATE NEW DISEASE
        # ========================================================

        else:

            new_report = models.DiseaseReport(
                agent_id=agent.id,

                taluk_id=agent.taluk_id,

                disease=disease_name,

                cases=int(
                    item.cases
                ),

                severity=item.severity,

                remarks=(
                    item.remarks or ""
                ),

                preventive_measures=(
                    item.preventive_measures or ""
                ),

                # ------------------------------------------------
                # IMPORTANT:
                # These fields were missing previously.
                # ------------------------------------------------

                week_number=current_week,

                year=current_year,

                created_at=datetime.utcnow(),

                updated_at=datetime.utcnow(),
            )

            db.add(
                new_report
            )

            updated_reports.append(
                new_report
            )

    # ------------------------------------------------------------
    # Delete diseases removed from the submitted form
    # ------------------------------------------------------------

    for existing_report in existing_reports:

        disease_key = (
            existing_report.disease
            .strip()
            .lower()
        )

        if disease_key not in incoming_diseases:

            db.delete(
                existing_report
            )

    # ------------------------------------------------------------
    # Commit everything
    # ------------------------------------------------------------

    try:

        db.commit()

    except Exception as exc:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to save the disease report. "
                f"Database error: {str(exc)}"
            ),
        )

    # ------------------------------------------------------------
    # Refresh created/updated objects
    # ------------------------------------------------------------

    for report in updated_reports:

        try:
            db.refresh(
                report
            )

        except Exception:
            pass

    return updated_reports


# ============================================================================
# REPORT HISTORY
# ============================================================================

@router.get(
    "/history",
    response_model=List[schemas.ReportOut],
)
def get_history(
    db: Session = Depends(get_db),
    user: models.User = Depends(
        auth.require_role("agent")
    ),
):
    """
    Return all disease reports belonging to
    the logged-in agent.
    """

    agent = _get_agent_profile(
        user,
        db,
    )

    return (
        db.query(models.DiseaseReport)
        .filter(
            models.DiseaseReport.agent_id == agent.id
        )
        .order_by(
            models.DiseaseReport.year.desc(),
            models.DiseaseReport.week_number.desc(),
            models.DiseaseReport.id.asc(),
        )
        .all()
    )