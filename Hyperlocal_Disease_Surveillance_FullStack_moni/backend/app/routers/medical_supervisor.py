from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
)
from sqlalchemy import func, text
from sqlalchemy.orm import Session

from .. import auth, models, schemas
from ..database import get_db
from ..utils import current_week_number


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(
    prefix="/medical",
    tags=["medical supervisor district scope"],
)

supervisor_only = auth.require_role("medical_supervisor")


# ============================================================
# DISTRICT HELPERS
# ============================================================

def supervisor_district(
    db: Session,
    user: models.User,
):
    """
    Return the district assigned to the logged-in Medical Supervisor.

    Older supervisor accounts that do not yet have a district assigned
    fall back to Kodagu for backward compatibility.
    """

    district_id = getattr(
        user,
        "supervisor_district_id",
        None,
    )

    if district_id:
        district = (
            db.query(models.District)
            .filter(models.District.id == district_id)
            .first()
        )

        if district:
            return district

    # Backward-compatible fallback
    district = (
        db.query(models.District)
        .filter(
            models.District.name.ilike("Kodagu")
        )
        .first()
    )

    if district:
        return district

    raise HTTPException(
        status_code=403,
        detail=(
            "No district is assigned to this "
            "Medical Supervisor."
        ),
    )


def district_taluk_ids(
    db: Session,
    user: models.User,
):
    district = supervisor_district(
        db,
        user,
    )

    taluk_ids = [
        taluk.id
        for taluk in district.taluks
    ]

    return district, taluk_ids


def report_query(
    db: Session,
    user: models.User,
):
    district, taluk_ids = district_taluk_ids(
        db,
        user,
    )

    query = (
        db.query(models.DiseaseReport)
        .filter(
            models.DiseaseReport.taluk_id.in_(
                taluk_ids or [-1]
            )
        )
    )

    return district, query


# ============================================================
# DISEASE REPORT REVIEW STORAGE
# ============================================================

def ensure_disease_report_review_columns(db: Session):
    """
    Ensure the existing SQLite disease_reports table has the fields
    required by the Medical Supervisor review workflow.

    This is intentionally backward-compatible with an existing
    surveillance.db so existing reports are preserved.
    """
    try:
        columns = {
            row[1]
            for row in db.execute(
                text("PRAGMA table_info(disease_reports)")
            ).fetchall()
        }

        if "review_status" not in columns:
            db.execute(
                text(
                    """
                    ALTER TABLE disease_reports
                    ADD COLUMN review_status VARCHAR(30)
                    DEFAULT 'PENDING_REVIEW'
                    """
                )
            )

        if "review_notes" not in columns:
            db.execute(
                text(
                    """
                    ALTER TABLE disease_reports
                    ADD COLUMN review_notes TEXT
                    """
                )
            )

        if "reviewed_by" not in columns:
            db.execute(
                text(
                    """
                    ALTER TABLE disease_reports
                    ADD COLUMN reviewed_by INTEGER
                    """
                )
            )

        if "reviewed_at" not in columns:
            db.execute(
                text(
                    """
                    ALTER TABLE disease_reports
                    ADD COLUMN reviewed_at DATETIME
                    """
                )
            )

        db.commit()
    except Exception:
        db.rollback()
        raise


# ============================================================
# OVERVIEW
# ============================================================

@router.get("/overview")
def overview(
    db: Session = Depends(get_db),
    user: models.User = Depends(supervisor_only),
):
    district, taluk_ids = district_taluk_ids(
        db,
        user,
    )

    now = datetime.utcnow()

    week = current_week_number(now)
    previous_week = current_week_number(
        now - timedelta(days=7)
    )

    # --------------------------------------------------------
    # ACTIVE AGENTS
    # --------------------------------------------------------

    agents = (
        db.query(models.Agent)
        .join(
            models.User,
            models.Agent.user_id == models.User.id,
        )
        .filter(
            models.Agent.taluk_id.in_(
                taluk_ids or [-1]
            ),
            models.User.is_active.is_(True),
        )
        .all()
    )

    # --------------------------------------------------------
    # CURRENT / PREVIOUS WEEK REPORTS
    # --------------------------------------------------------

    current = (
        db.query(models.DiseaseReport)
        .filter(
            models.DiseaseReport.taluk_id.in_(
                taluk_ids or [-1]
            ),
            models.DiseaseReport.week_number == week,
        )
        .all()
    )

    previous = (
        db.query(models.DiseaseReport)
        .filter(
            models.DiseaseReport.taluk_id.in_(
                taluk_ids or [-1]
            ),
            models.DiseaseReport.week_number
            == previous_week,
        )
        .all()
    )

    submitted_ids = {
        report.agent_id
        for report in current
    }

    active_agents = len(agents)

    submitted_agents = sum(
        1
        for agent in agents
        if agent.id in submitted_ids
    )

    pending = max(
        0,
        active_agents - submitted_agents,
    )

    coverage = (
        round(
            submitted_agents
            / active_agents
            * 100
        )
        if active_agents
        else 0
    )

    # --------------------------------------------------------
    # DISEASE CASE TOTALS
    # --------------------------------------------------------

    current_by_disease = {}
    previous_by_disease = {}

    for report in current:
        current_by_disease[report.disease] = (
            current_by_disease.get(
                report.disease,
                0,
            )
            + (report.cases or 0)
        )

    for report in previous:
        previous_by_disease[report.disease] = (
            previous_by_disease.get(
                report.disease,
                0,
            )
            + (report.cases or 0)
        )

    # --------------------------------------------------------
    # PREDICTIONS
    # --------------------------------------------------------

    predictions = (
        db.query(models.Prediction)
        .filter(
            models.Prediction.taluk_id.in_(
                taluk_ids or [-1]
            ),
            models.Prediction.week_number == week,
        )
        .all()
    )

    risk_rank = {
        "Low": 1,
        "Moderate": 2,
        "High": 3,
        "Critical": 4,
    }

    risk_by_disease = {}

    for prediction in predictions:
        current_risk = risk_by_disease.get(
            prediction.disease
        )

        if (
            risk_rank.get(
                prediction.risk_level,
                0,
            )
            > risk_rank.get(
                current_risk,
                0,
            )
        ):
            risk_by_disease[
                prediction.disease
            ] = prediction.risk_level

    # --------------------------------------------------------
    # DISEASE OVERVIEW
    # --------------------------------------------------------

    diseases = sorted(
        set(current_by_disease)
        | set(previous_by_disease)
    )

    disease_overview = []

    for disease in diseases:
        current_cases = current_by_disease.get(
            disease,
            0,
        )

        previous_cases = previous_by_disease.get(
            disease,
            0,
        )

        if previous_cases:
            change = round(
                (
                    current_cases
                    - previous_cases
                )
                / previous_cases
                * 100
            )
        else:
            change = (
                100
                if current_cases
                else 0
            )

        risk = risk_by_disease.get(
            disease,
            "Low",
        )

        if risk in ("High", "Critical"):
            status = "Watch"
        elif risk == "Moderate":
            status = "Monitor"
        else:
            status = "Stable"

        disease_overview.append(
            {
                "disease": disease,
                "cases_this_week": current_cases,
                "previous_cases": previous_cases,
                "change_percent": change,
                "risk_level": risk,
                "status": status,
            }
        )

    disease_overview.sort(
        key=lambda item: item[
            "cases_this_week"
        ],
        reverse=True,
    )

    # --------------------------------------------------------
    # HIGH RISK ALERTS
    # --------------------------------------------------------

    high_risk = [
        prediction
        for prediction in predictions
        if prediction.risk_level
        in ("High", "Critical")
    ]

    high_risk.sort(
        key=lambda prediction: (
            risk_rank.get(
                prediction.risk_level,
                0,
            ),
            prediction.predicted_cases or 0,
        ),
        reverse=True,
    )

    recent_alerts = []

    for prediction in high_risk[:4]:
        taluk = (
            db.query(models.Taluk)
            .filter(
                models.Taluk.id
                == prediction.taluk_id
            )
            .first()
        )

        place = (
            taluk.name
            if taluk
            else "Unknown Taluk"
        )

        recent_alerts.append(
            {
                "type": "risk",
                "severity": prediction.risk_level,
                "title": (
                    f"{prediction.risk_level} "
                    f"{prediction.disease} activity "
                    f"in {place}"
                ),
                "message": (
                    f"Current cases: "
                    f"{prediction.current_cases or 0}; "
                    f"predicted: "
                    f"{prediction.predicted_cases or 0}. "
                    f"Trend: "
                    f"{(
                        prediction.trend
                        or 'stable'
                    ).lower()}."
                ),
                "created_at": prediction.created_at,
                "taluk_name": place,
                "disease": prediction.disease,
            }
        )

    # --------------------------------------------------------
    # EMERGING DISEASE REVIEWS
    # --------------------------------------------------------

    emerging_count = (
        db.query(
            models.EmergingDiseaseReport
        )
        .filter(
            models.EmergingDiseaseReport.taluk_id.in_(
                taluk_ids or [-1]
            ),
            models.EmergingDiseaseReport.status
            == "PENDING",
        )
        .count()
    )

    if pending:
        recent_alerts.append(
            {
                "type": "reporting",
                "severity": "Medium",
                "title": (
                    f"{pending} agent"
                    f"{'s' if pending != 1 else ''} "
                    f"missed weekly report"
                    f"{'s' if pending != 1 else ''}"
                ),
                "message": (
                    "Follow-up is required "
                    "for timely reporting."
                ),
                "created_at": now,
                "taluk_name": district.name,
                "disease": None,
            }
        )

    if emerging_count:
        recent_alerts.append(
            {
                "type": "emerging",
                "severity": "High",
                "title": (
                    f"{emerging_count} emerging "
                    f"disease review"
                    f"{'s' if emerging_count != 1 else ''}"
                ),
                "message": (
                    "Suspected disease reports "
                    "are awaiting Medical "
                    "Supervisor review."
                ),
                "created_at": now,
                "taluk_name": district.name,
                "disease": None,
            }
        )

    # --------------------------------------------------------
    # SURVEILLANCE PULSE
    # --------------------------------------------------------

    latest_report = None

    if current:
        latest_report = max(
            current,
            key=lambda report: (
                report.created_at
                or datetime.min
            ),
        )

    latest_risk = (
        high_risk[0]
        if high_risk
        else None
    )

    pulse = []

    if latest_report:
        agent_name = (
            latest_report.agent.user.full_name
            if latest_report.agent
            and latest_report.agent.user
            else "Agent"
        )

        taluk_name = (
            latest_report.taluk.name
            if latest_report.taluk
            else "Unknown Taluk"
        )

        pulse.append(
            {
                "time": latest_report.created_at,
                "title": "Disease report submitted",
                "detail": (
                    f"{agent_name} submitted "
                    f"{latest_report.disease} "
                    "surveillance data."
                ),
                "meta": (
                    f"{latest_report.cases or 0} "
                    f"cases · {taluk_name}"
                ),
                "kind": "report",
            }
        )

    if latest_risk:
        taluk = (
            db.query(models.Taluk)
            .filter(
                models.Taluk.id
                == latest_risk.taluk_id
            )
            .first()
        )

        pulse.append(
            {
                "time": latest_risk.created_at,
                "title": "Risk level updated",
                "detail": (
                    f"{latest_risk.disease} "
                    f"classified as "
                    f"{latest_risk.risk_level} risk."
                ),
                "meta": (
                    f"Predicted "
                    f"{latest_risk.predicted_cases or 0} "
                    f"cases · "
                    f"{taluk.name if taluk else 'Unknown Taluk'}"
                ),
                "kind": "risk",
            }
        )

    pulse.append(
        {
            "time": (
                latest_report.created_at
                if latest_report
                else now
            ),
            "title": "Weekly reporting coverage",
            "detail": (
                f"{submitted_agents} of "
                f"{active_agents} active monitored "
                "agents have submitted this week."
            ),
            "meta": f"{coverage}% coverage",
            "kind": "coverage",
        }
    )

    if emerging_count:
        pulse.append(
            {
                "time": now,
                "title": (
                    "Emerging disease report received"
                ),
                "detail": (
                    f"{emerging_count} suspected "
                    "report(s) require medical review."
                ),
                "meta": "Pending review",
                "kind": "emerging",
            }
        )

    # --------------------------------------------------------
    # OVERVIEW RESPONSE
    # --------------------------------------------------------

    all_district_reports = (
        db.query(models.DiseaseReport)
        .filter(
            models.DiseaseReport.taluk_id.in_(
                taluk_ids or [-1]
            )
        )
        .all()
    )

    return {
        "current_week": week,
        "current_week_label": (
            f"Week {week % 100}"
        ),
        "previous_week": previous_week,

        "supervisor_name": user.full_name,

        "supervisor_district": {
            "id": district.id,
            "name": district.name,
        },

        "district": {
            "id": district.id,
            "name": district.name,
        },

        "total_agents": active_agents,
        "active_agents": active_agents,
        "total_taluks": len(taluk_ids),
        "total_reports": len(
            all_district_reports
        ),

        "reports_this_week": len(current),
        "submitted_agents_this_week": (
            submitted_agents
        ),
        "pending_agent_submissions": pending,
        "pending_emerging_reviews": (
            emerging_count
        ),

        "pending_agent_issue_reports": (
            db.query(
                models.AgentIssueReport
            )
            .join(
                models.Agent,
                models.AgentIssueReport.agent_id
                == models.Agent.id,
            )
            .filter(
                models.Agent.taluk_id.in_(
                    taluk_ids or [-1]
                ),
                models.AgentIssueReport.status
                == "PENDING_ADMIN_REVIEW",
            )
            .count()
        ),

        "diseases_tracked": len(
            models.DISEASES
        ),

        "total_cases_this_week": sum(
            current_by_disease.values()
        ),

        "total_cases_previous_week": sum(
            previous_by_disease.values()
        ),

        "high_risk_alerts": len(
            high_risk
        ),

        "reporting_coverage_percent": coverage,

        "coverage_received": submitted_agents,
        "coverage_pending": pending,
        "coverage_no_report": 0,

        "locations": [
            {
                "taluk_id": taluk.id,
                "taluk_name": taluk.name,
                "district_name": district.name,
                "label": (
                    f"{taluk.name}, "
                    f"{district.name}"
                ),
            }
            for taluk in district.taluks
        ],

        "selected_location": None,

        "disease_overview": disease_overview,

        "recent_alerts": recent_alerts[:5],

        "surveillance_pulse": pulse[:4],

        "updated_at": now,
    }


# ============================================================
# DISEASE REPORTS
# ============================================================

@router.get("/reports")
def reports(
    taluk_id: Optional[int] = None,
    disease: Optional[str] = None,
    status: Optional[str] = None,
    week_number: Optional[int] = None,
    year: Optional[int] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    limit: int = 500,
    db: Session = Depends(get_db),
    user: models.User = Depends(supervisor_only),
):
    ensure_disease_report_review_columns(db)

    district, taluk_ids = district_taluk_ids(
        db,
        user,
    )

    allowed_taluks = set(taluk_ids)

    if (
        taluk_id is not None
        and taluk_id not in allowed_taluks
    ):
        raise HTTPException(
            status_code=403,
            detail=(
                "This taluk is outside your "
                "assigned district."
            ),
        )

    query = (
        db.query(models.DiseaseReport)
        .filter(
            models.DiseaseReport.taluk_id.in_(
                taluk_ids or [-1]
            )
        )
    )

    if taluk_id is not None:
        query = query.filter(
            models.DiseaseReport.taluk_id
            == taluk_id
        )

    if disease:
        query = query.filter(
            models.DiseaseReport.disease
            == disease
        )

    if week_number is not None:
        if week_number <= 53:
            query = query.filter(
                models.DiseaseReport.week_number
                % 100
                == week_number
            )
        else:
            query = query.filter(
                models.DiseaseReport.week_number
                == week_number
            )

    if year is not None:
        query = query.filter(
            models.DiseaseReport.year
            == year
        )

    # --------------------------------------------------------
    # START DATE
    # --------------------------------------------------------

    if start_date:
        try:
            start_dt = datetime.fromisoformat(
                start_date
            )
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=(
                    "start_date must use "
                    "YYYY-MM-DD format."
                ),
            )

        query = query.filter(
            models.DiseaseReport.created_at
            >= start_dt
        )

    # --------------------------------------------------------
    # END DATE
    # --------------------------------------------------------

    if end_date:
        try:
            end_dt = (
                datetime.fromisoformat(
                    end_date
                )
                + timedelta(days=1)
            )
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=(
                    "end_date must use "
                    "YYYY-MM-DD format."
                ),
            )

        query = query.filter(
            models.DiseaseReport.created_at
            < end_dt
        )

    safe_limit = min(
        max(limit, 1),
        1000,
    )

    rows = (
        query
        .order_by(
            models.DiseaseReport.created_at.desc()
        )
        .limit(safe_limit)
        .all()
    )

    result = []

    for report in rows:
        agent_name = (
            report.agent.user.full_name
            if report.agent
            and report.agent.user
            else "Unknown Agent"
        )

        taluk_name = (
            report.taluk.name
            if report.taluk
            else "Unknown Taluk"
        )

        cases = int(
            report.cases or 0
        )

        severity = (
            report.severity or ""
        ).strip()

        if severity:
            priority = severity.title()
        elif cases >= 25:
            priority = "High"
        elif cases >= 10:
            priority = "Medium"
        else:
            priority = "Low"

        review_row = db.execute(
            text(
                """
                SELECT
                    review_status,
                    review_notes,
                    reviewed_by,
                    reviewed_at
                FROM disease_reports
                WHERE id = :report_id
                """
            ),
            {"report_id": report.id},
        ).fetchone()

        raw_status = (
            review_row[0]
            if review_row and review_row[0]
            else "PENDING_REVIEW"
        )

        status_labels = {
            "PENDING_REVIEW": "Pending Review",
            "APPROVED": "Approved",
            "REJECTED": "Rejected",
        }

        report_status = status_labels.get(
            raw_status,
            "Pending Review",
        )

        if (
            status
            and status.lower()
            != report_status.lower()
        ):
            continue

        result.append(
            {
                "id": report.id,
                "report_id": (
                    f"RPT-{report.id:04d}"
                ),

                "agent_id": report.agent_id,
                "agent_name": agent_name,

                "taluk_id": report.taluk_id,
                "taluk_name": taluk_name,

                "district_id": district.id,
                "district_name": district.name,

                "disease": report.disease,
                "cases": cases,

                "severity": (
                    severity or None
                ),

                "priority": priority,

                "remarks": report.remarks,

                "preventive_measures": (
                    report.preventive_measures
                ),

                "week_number": (
                    report.week_number
                ),

                "year": report.year,

                "created_at": (
                    report.created_at
                ),

                "updated_at": (
                    report.updated_at
                ),

                "status": report_status,
                "review_status": raw_status,
                "review_notes": (
                    review_row[1]
                    if review_row
                    else None
                ),
                "reviewed_by": (
                    review_row[2]
                    if review_row
                    else None
                ),
                "reviewed_at": (
                    review_row[3]
                    if review_row
                    else None
                ),
            }
        )

    return result


# ============================================================
# CREATE DISEASE REPORT
# ============================================================

@router.post("/reports")
def create_medical_report(
    payload: dict,
    db: Session = Depends(get_db),
    user: models.User = Depends(supervisor_only),
):
    """
    Create a disease report from the Medical Supervisor portal.

    The supervisor can only create reports for agents
    belonging to the assigned district.
    """

    ensure_disease_report_review_columns(db)

    _, allowed_taluk_ids = district_taluk_ids(
        db,
        user,
    )

    try:
        agent_id = int(
            payload.get("agent_id")
        )
    except (
        TypeError,
        ValueError,
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "A valid agent_id is required."
            ),
        )

    disease = str(
        payload.get("disease") or ""
    ).strip()

    if not disease:
        raise HTTPException(
            status_code=400,
            detail="Disease is required.",
        )

    try:
        cases = max(
            0,
            int(
                payload.get(
                    "cases",
                    0,
                )
            ),
        )
    except (
        TypeError,
        ValueError,
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Cases must be a "
                "non-negative integer."
            ),
        )

    agent = (
        db.query(models.Agent)
        .filter(
            models.Agent.id
            == agent_id
        )
        .first()
    )

    if not agent:
        raise HTTPException(
            status_code=404,
            detail="Agent not found.",
        )

    if (
        agent.taluk_id
        not in allowed_taluk_ids
    ):
        raise HTTPException(
            status_code=403,
            detail=(
                "This agent is outside "
                "your assigned district."
            ),
        )

    now = datetime.utcnow()

    week = payload.get(
        "week_number"
    )

    year = payload.get(
        "year"
    )

    try:
        week = (
            int(week)
            if week is not None
            else current_week_number(now)
        )
    except (
        TypeError,
        ValueError,
    ):
        week = current_week_number(now)

    try:
        year = (
            int(year)
            if year is not None
            else now.year
        )
    except (
        TypeError,
        ValueError,
    ):
        year = now.year

    report = models.DiseaseReport(
        agent_id=agent.id,
        taluk_id=agent.taluk_id,
        disease=disease,
        cases=cases,
        severity=(
            str(
                payload.get(
                    "severity"
                )
                or ""
            ).strip()
            or None
        ),
        remarks=(
            str(
                payload.get(
                    "remarks"
                )
                or ""
            ).strip()
            or None
        ),
        preventive_measures=(
            str(
                payload.get(
                    "preventive_measures"
                )
                or ""
            ).strip()
            or None
        ),
        week_number=week,
        year=year,
        created_at=now,
        updated_at=now,
    )

    db.add(report)
    db.commit()
    db.refresh(report)

    return {
        "id": report.id,
        "report_id": (
            f"RPT-{report.id:04d}"
        ),
        "message": (
            "Disease report created "
            "successfully."
        ),
        "status": "Pending Review",
    }


# ============================================================
# REVIEW NORMAL DISEASE REPORT
# ============================================================

@router.put("/reports/{report_id}/review")
def review_disease_report(
    report_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    user: models.User = Depends(supervisor_only),
):
    """
    Approve, reject, or keep a normal disease report pending.

    Review status is stored in the existing SQLite database so the
    decision survives page refreshes and backend restarts.
    """
    ensure_disease_report_review_columns(db)

    _, taluk_ids = district_taluk_ids(
        db,
        user,
    )

    report = (
        db.query(models.DiseaseReport)
        .filter(
            models.DiseaseReport.id == report_id
        )
        .first()
    )

    if not report:
        raise HTTPException(
            status_code=404,
            detail="Disease report not found.",
        )

    if report.taluk_id not in taluk_ids:
        raise HTTPException(
            status_code=403,
            detail=(
                "This report is outside your "
                "assigned district."
            ),
        )

    decision = str(
        payload.get("decision") or ""
    ).strip().upper()

    review_notes = str(
        payload.get("review_notes") or ""
    ).strip()

    decision_map = {
        "APPROVE": "APPROVED",
        "APPROVED": "APPROVED",
        "REJECT": "REJECTED",
        "REJECTED": "REJECTED",
        "KEEP_PENDING": "PENDING_REVIEW",
        "PENDING": "PENDING_REVIEW",
        "PENDING_REVIEW": "PENDING_REVIEW",
    }

    new_status = decision_map.get(decision)

    if not new_status:
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid review decision. Use "
                "APPROVE, REJECT or KEEP_PENDING."
            ),
        )

    now = datetime.utcnow()

    db.execute(
        text(
            """
            UPDATE disease_reports
            SET
                review_status = :review_status,
                review_notes = :review_notes,
                reviewed_by = :reviewed_by,
                reviewed_at = :reviewed_at,
                updated_at = :updated_at
            WHERE id = :report_id
            """
        ),
        {
            "review_status": new_status,
            "review_notes": review_notes or None,
            "reviewed_by": user.id,
            "reviewed_at": now,
            "updated_at": now,
            "report_id": report_id,
        },
    )

    db.commit()

    status_label = {
        "APPROVED": "Approved",
        "REJECTED": "Rejected",
        "PENDING_REVIEW": "Pending Review",
    }[new_status]

    return {
        "ok": True,
        "id": report.id,
        "report_id": f"RPT-{report.id:04d}",
        "status": status_label,
        "review_status": new_status,
        "review_notes": review_notes or None,
        "reviewed_by": user.id,
        "reviewed_at": now,
        "message": (
            f"Report marked as {status_label}."
        ),
    }


# ============================================================
# WEEKLY MONITORING
# ============================================================

@router.get("/monitoring")
def monitoring(
    week_number: Optional[int] = None,
    db: Session = Depends(get_db),
    user: models.User = Depends(supervisor_only),
):
    """
    Return reporting status for every agent in the
    Medical Supervisor's assigned district.

    If week_number is not supplied, the current week
    is used.
    """

    _, taluk_ids = district_taluk_ids(
        db,
        user,
    )

    week = (
        week_number
        if week_number is not None
        else current_week_number()
    )

    agents = (
        db.query(models.Agent)
        .join(
            models.User,
            models.Agent.user_id
            == models.User.id,
        )
        .filter(
            models.Agent.taluk_id.in_(
                taluk_ids or [-1]
            )
        )
        .order_by(
            models.User.full_name.asc()
        )
        .all()
    )

    rows = []

    for agent in agents:

        # ----------------------------------------------------
        # CURRENT WEEK REPORT
        # ----------------------------------------------------

        current_report = (
            db.query(models.DiseaseReport)
            .filter(
                models.DiseaseReport.agent_id
                == agent.id,
                models.DiseaseReport.week_number
                == week,
            )
            .order_by(
                models.DiseaseReport.created_at.desc()
            )
            .first()
        )

        submitted = (
            current_report is not None
        )

        # ----------------------------------------------------
        # LAST SUBMISSION
        # ----------------------------------------------------

        last_submission = (
            db.query(
                models.DiseaseReport.created_at
            )
            .filter(
                models.DiseaseReport.agent_id
                == agent.id
            )
            .order_by(
                models.DiseaseReport.created_at.desc()
            )
            .first()
        )

        # ----------------------------------------------------
        # LAST 8 WEEKS
        # ----------------------------------------------------

        recent = []

        for offset in range(
            7,
            -1,
            -1,
        ):
            target_week = week - offset

            has_report = (
                db.query(
                    models.DiseaseReport.id
                )
                .filter(
                    models.DiseaseReport.agent_id
                    == agent.id,
                    models.DiseaseReport.week_number
                    == target_week,
                )
                .first()
                is not None
            )

            recent.append(
                has_report
            )

        # ----------------------------------------------------
        # MISSED STREAK
        # ----------------------------------------------------

        missed_streak = 0

        for has_report in reversed(
            recent
        ):
            if has_report:
                break

            missed_streak += 1

        # ----------------------------------------------------
        # REPORTING STATUS
        # ----------------------------------------------------

        if submitted:
            status = "Submitted"
        else:
            status = "Pending"

        rows.append(
            {
                "agent_id": agent.id,
                "agent_name": (
                    agent.user.full_name
                    if agent.user
                    else "Unknown Agent"
                ),
                "username": (
                    agent.user.username
                    if agent.user
                    else ""
                ),

                "taluk_id": agent.taluk_id,

                "taluk_name": (
                    agent.taluk.name
                    if agent.taluk
                    else "Unknown Taluk"
                ),

                "district_name": (
                    agent.taluk.district.name
                    if agent.taluk
                    and agent.taluk.district
                    else "Unknown District"
                ),

                "is_active": bool(
                    agent.user.is_active
                    if agent.user
                    else False
                ),

                "submitted": submitted,

                "status": status,

                "week_number": week,

                "last_submitted_at": (
                    last_submission[0]
                    if last_submission
                    else None
                ),

                "missed_streak": missed_streak,

                "last_8_weeks": recent,

                "current_report_id": (
                    current_report.id
                    if current_report
                    else None
                ),

                "current_report_date": (
                    current_report.created_at
                    if current_report
                    else None
                ),
            }
        )

    return rows


# ============================================================
# ANALYTICS
# ============================================================

@router.get("/analytics")
def analytics(
    weeks: int = 8,
    db: Session = Depends(get_db),
    user: models.User = Depends(supervisor_only),
):
    _, taluk_ids = district_taluk_ids(
        db,
        user,
    )

    weeks = min(
        max(weeks, 2),
        20,
    )

    pairs = (
        db.query(
            models.DiseaseReport.year,
            models.DiseaseReport.week_number,
        )
        .filter(
            models.DiseaseReport.taluk_id.in_(
                taluk_ids or [-1]
            )
        )
        .distinct()
        .order_by(
            models.DiseaseReport.year.desc(),
            models.DiseaseReport.week_number.desc(),
        )
        .limit(weeks)
        .all()
    )

    weekly = []

    for year, week in reversed(
        pairs
    ):
        total = (
            db.query(
                func.coalesce(
                    func.sum(
                        models.DiseaseReport.cases
                    ),
                    0,
                )
            )
            .filter(
                models.DiseaseReport.taluk_id.in_(
                    taluk_ids or [-1]
                ),
                models.DiseaseReport.year == year,
                models.DiseaseReport.week_number
                == week,
            )
            .scalar()
        )

        weekly.append(
            {
                "year": year,
                "week_number": week,
                "label": (
                    f"W{week % 100}"
                ),
                "total_cases": int(
                    total or 0
                ),
            }
        )

    totals = (
        db.query(
            models.DiseaseReport.disease,
            func.coalesce(
                func.sum(
                    models.DiseaseReport.cases
                ),
                0,
            ),
        )
        .filter(
            models.DiseaseReport.taluk_id.in_(
                taluk_ids or [-1]
            )
        )
        .group_by(
            models.DiseaseReport.disease
        )
        .order_by(
            func.sum(
                models.DiseaseReport.cases
            ).desc()
        )
        .all()
    )

    return {
        "weeks": weekly,
        "weekly": weekly,
        "disease_totals": [
            {
                "disease": disease,
                "cases": int(
                    cases or 0
                ),
            }
            for disease, cases in totals
        ],
    }


# ============================================================
# RISK MAP
# ============================================================

@router.get("/risk-map")
def risk_map(
    disease: Optional[str] = None,
    db: Session = Depends(get_db),
    user: models.User = Depends(supervisor_only),
):
    _, taluk_ids = district_taluk_ids(
        db,
        user,
    )

    week = current_week_number()

    query = (
        db.query(models.Prediction)
        .filter(
            models.Prediction.taluk_id.in_(
                taluk_ids or [-1]
            ),
            models.Prediction.week_number
            == week,
        )
    )

    if disease:
        query = query.filter(
            models.Prediction.disease
            == disease
        )

    rows = query.all()

    risk_rank = {
        "Low": 1,
        "Moderate": 2,
        "High": 3,
        "Critical": 4,
    }

    grouped = {}

    taluks = {
        taluk.id: taluk
        for taluk in (
            db.query(models.Taluk)
            .filter(
                models.Taluk.id.in_(
                    taluk_ids or [-1]
                )
            )
            .all()
        )
    }

    for prediction in rows:
        key = (
            prediction.taluk_id,
            prediction.disease,
        )

        if (
            key not in grouped
            or risk_rank.get(
                prediction.risk_level,
                0,
            )
            > risk_rank.get(
                grouped[key].risk_level,
                0,
            )
        ):
            grouped[key] = prediction

    return [
        {
            "id": prediction.id,

            "taluk_id": prediction.taluk_id,

            "taluk_name": (
                taluks[
                    prediction.taluk_id
                ].name
                if prediction.taluk_id
                in taluks
                else "Unknown Taluk"
            ),

            "district_id": (
                taluks[
                    prediction.taluk_id
                ].district_id
                if prediction.taluk_id
                in taluks
                else None
            ),

            "district_name": (
                taluks[
                    prediction.taluk_id
                ].district.name
                if (
                    prediction.taluk_id
                    in taluks
                    and taluks[
                        prediction.taluk_id
                    ].district
                )
                else "Kodagu"
            ),

            "disease": prediction.disease,

            "risk_level": (
                prediction.risk_level
                or "Low"
            ),

            "current_cases": (
                prediction.current_cases
                or 0
            ),

            "predicted_cases": (
                prediction.predicted_cases
                or 0
            ),

            "trend": (
                prediction.trend
                or "stable"
            ),

            "latitude": getattr(
                taluks.get(
                    prediction.taluk_id
                ),
                "latitude",
                None,
            ),

            "longitude": getattr(
                taluks.get(
                    prediction.taluk_id
                ),
                "longitude",
                None,
            ),

            "created_at": (
                prediction.created_at
            ),
        }
        for prediction in grouped.values()
    ]


# ============================================================
# SUPERVISOR AGENTS
# ============================================================

@router.get("/agents")
def agents(
    db: Session = Depends(get_db),
    user: models.User = Depends(supervisor_only),
):
    _, taluk_ids = district_taluk_ids(
        db,
        user,
    )

    week = current_week_number()

    rows = (
        db.query(models.Agent)
        .join(
            models.User,
            models.Agent.user_id
            == models.User.id,
        )
        .filter(
            models.Agent.taluk_id.in_(
                taluk_ids or [-1]
            )
        )
        .order_by(
            models.User.full_name.asc()
        )
        .all()
    )

    result = []

    for agent in rows:
        submitted = (
            db.query(
                models.DiseaseReport.id
            )
            .filter(
                models.DiseaseReport.agent_id
                == agent.id,
                models.DiseaseReport.week_number
                == week,
            )
            .first()
            is not None
        )

        result.append(
            {
                "id": agent.id,
                "agent_id": agent.id,
                "user_id": agent.user_id,

                "name": (
                    agent.user.full_name
                    if agent.user
                    else "Unknown Agent"
                ),

                "full_name": (
                    agent.user.full_name
                    if agent.user
                    else "Unknown Agent"
                ),

                "username": (
                    agent.user.username
                    if agent.user
                    else ""
                ),

                "taluk_id": agent.taluk_id,

                "taluk_name": (
                    agent.taluk.name
                    if agent.taluk
                    else "Unknown Taluk"
                ),

                "district_name": (
                    agent.taluk.district.name
                    if (
                        agent.taluk
                        and agent.taluk.district
                    )
                    else "Kodagu"
                ),

                "is_active": bool(
                    agent.user.is_active
                    if agent.user
                    else False
                ),

                "submitted": submitted,
            }
        )

    return result


# ============================================================
# AGENT ISSUES
# ============================================================

@router.get("/agent-issues")
def agent_issues(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    user: models.User = Depends(supervisor_only),
):
    _, taluk_ids = district_taluk_ids(
        db,
        user,
    )

    query = (
        db.query(
            models.AgentIssueReport
        )
        .join(
            models.Agent,
            models.AgentIssueReport.agent_id
            == models.Agent.id,
        )
        .filter(
            models.Agent.taluk_id.in_(
                taluk_ids or [-1]
            )
        )
    )

    if status:
        query = query.filter(
            models.AgentIssueReport.status
            == status
        )

    issues = (
        query
        .order_by(
            models.AgentIssueReport.created_at.desc()
        )
        .all()
    )

    return [
        {
            "id": issue.id,

            "agent_id": issue.agent_id,

            "agent_name": (
                issue.agent.user.full_name
                if issue.agent
                and issue.agent.user
                else "Unknown Agent"
            ),

            "taluk_id": (
                issue.agent.taluk_id
                if issue.agent
                else None
            ),

            "taluk_name": (
                issue.agent.taluk.name
                if issue.agent
                and issue.agent.taluk
                else "Unknown Taluk"
            ),

            "issue_type": issue.issue_type,

            "severity": issue.severity,

            "description": (
                issue.description
            ),

            "evidence": issue.evidence,

            "status": issue.status,

            "created_at": issue.created_at,

            "resolved_at": issue.reviewed_at,
        }
        for issue in issues
    ]


# ============================================================
# CREATE AGENT ISSUE
# ============================================================

@router.post("/agent-issues")
async def create_agent_issue(
    agent_id: int = Form(...),
    issue_type: str = Form(...),
    severity: str = Form("Medium"),
    description: str = Form(...),
    evidence: str = Form(""),
    proof: Optional[
        list[UploadFile]
    ] = File(None),
    db: Session = Depends(get_db),
    user: models.User = Depends(supervisor_only),
):
    _, taluk_ids = district_taluk_ids(
        db,
        user,
    )

    agent = (
        db.query(models.Agent)
        .filter(
            models.Agent.id
            == agent_id
        )
        .first()
    )

    if (
        not agent
        or agent.taluk_id
        not in taluk_ids
    ):
        raise HTTPException(
            status_code=403,
            detail=(
                "You can only report agents "
                "in your assigned district."
            ),
        )

    proof_names = []

    if proof:
        upload_dir = (
            Path(__file__)
            .resolve()
            .parents[2]
            / "uploads"
            / "agent_issues"
        )

        upload_dir.mkdir(
            parents=True,
            exist_ok=True,
        )

        for file in proof:
            if (
                not file
                or not file.filename
            ):
                continue

            safe_name = (
                f"{datetime.utcnow().strftime('%Y%m%d%H%M%S%f')}_"
                f"{Path(file.filename).name}"
            )

            target = (
                upload_dir
                / safe_name
            )

            target.write_bytes(
                await file.read()
            )

            proof_names.append(
                safe_name
            )

    evidence_text = (
        evidence or ""
    ).strip()

    if proof_names:
        evidence_text = (
            evidence_text
            + "\nProof files: "
            + ", ".join(proof_names)
        ).strip()

    issue = (
        models.AgentIssueReport(
            agent_id=agent.id,
            supervisor_id=user.id,
            issue_type=(
                issue_type.strip()
            ),
            severity=(
                severity.strip()
            ),
            description=(
                description.strip()
            ),
            evidence=(
                evidence_text
                or None
            ),
            status=(
                "PENDING_ADMIN_REVIEW"
            ),
            created_at=datetime.utcnow(),
        )
    )

    db.add(issue)
    db.commit()
    db.refresh(issue)

    return {
        "id": issue.id,
        "status": issue.status,
        "message": (
            "Complaint and proof submitted "
            "to System Admin."
        ),
    }


# ============================================================
# REMIND AGENT
# ============================================================

@router.post("/agents/{agent_id}/remind")
def remind_agent(
    agent_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(supervisor_only),
):
    _, taluk_ids = district_taluk_ids(
        db,
        user,
    )

    agent = (
        db.query(models.Agent)
        .filter(
            models.Agent.id
            == agent_id
        )
        .first()
    )

    if (
        not agent
        or agent.taluk_id
        not in taluk_ids
    ):
        raise HTTPException(
            status_code=403,
            detail=(
                "Agent is outside "
                "your district."
            ),
        )

    notification = models.Notification(
        title="Weekly report reminder",
        message=(
            "Your Medical Supervisor has "
            "reminded you to submit your "
            "weekly surveillance report."
        ),
        type="reporting",
        taluk_id=agent.taluk_id,
        created_at=datetime.utcnow(),
        is_read=False,
    )

    db.add(notification)
    db.commit()

    return {
        "ok": True,
        "agent_id": agent_id,
        "message": "Reminder sent.",
    }


# ============================================================
# EMERGING DISEASES
# ============================================================

@router.get("/emerging")
def emerging(
    status: Optional[str] = None,
    taluk_id: Optional[int] = None,
    db: Session = Depends(get_db),
    user: models.User = Depends(supervisor_only),
):
    _, taluk_ids = district_taluk_ids(
        db,
        user,
    )

    query = (
        db.query(
            models.EmergingDiseaseReport
        )
        .filter(
            models.EmergingDiseaseReport.taluk_id.in_(
                taluk_ids or [-1]
            )
        )
    )

    if taluk_id is not None:
        if taluk_id not in set(
            taluk_ids
        ):
            raise HTTPException(
                status_code=403,
                detail=(
                    "This taluk is outside "
                    "your assigned district."
                ),
            )

        query = query.filter(
            models.EmergingDiseaseReport.taluk_id
            == taluk_id
        )

    if status:
        query = query.filter(
            models.EmergingDiseaseReport.status
            == status
        )

    rows = (
        query
        .order_by(
            models.EmergingDiseaseReport.created_at.desc()
        )
        .all()
    )

    return [
        {
            "id": report.id,

            "agent_id": report.agent_id,

            "taluk_id": report.taluk_id,

            "taluk_name": (
                report.taluk.name
                if report.taluk
                else None
            ),

            "reported_name": (
                report.reported_name
            ),

            "suspected_cases": (
                report.suspected_cases
            ),

            "symptoms": report.symptoms,

            "description": (
                report.description
            ),

            "observed_date": (
                report.observed_date
            ),

            "status": report.status,

            "mapped_disease_id": (
                report.mapped_disease_id
            ),

            "mapped_disease_name": (
                report.mapped_disease.name
                if report.mapped_disease
                else None
            ),

            "review_notes": (
                report.review_notes
            ),

            "created_at": (
                report.created_at
            ),

            "reviewed_at": (
                report.reviewed_at
            ),
        }
        for report in rows
    ]


# ============================================================
# REVIEW EMERGING DISEASE
# ============================================================

@router.put(
    "/emerging/{report_id}/review"
)
def review_emerging(
    report_id: int,
    payload: schemas.EmergingDiseaseReview,
    db: Session = Depends(get_db),
    user: models.User = Depends(supervisor_only),
):
    _, taluk_ids = district_taluk_ids(
        db,
        user,
    )

    report = (
        db.query(
            models.EmergingDiseaseReport
        )
        .filter(
            models.EmergingDiseaseReport.id
            == report_id
        )
        .first()
    )

    if (
        not report
        or report.taluk_id
        not in taluk_ids
    ):
        raise HTTPException(
            status_code=404,
            detail=(
                "Emerging disease report "
                "not found in your district."
            ),
        )

    decision = (
        payload.decision
        or ""
    ).upper()

    # --------------------------------------------------------
    # VERIFY EXISTING DISEASE
    # --------------------------------------------------------

    if decision == "VERIFY_EXISTING":

        if not payload.mapped_disease_id:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Select an existing disease "
                    "before verification."
                ),
            )

        disease = (
            db.query(models.Disease)
            .filter(
                models.Disease.id
                == payload.mapped_disease_id
            )
            .first()
        )

        if not disease:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Selected disease is not "
                    "in the registry."
                ),
            )

        report.mapped_disease_id = (
            payload.mapped_disease_id
        )

        report.status = "APPROVED"

    # --------------------------------------------------------
    # VERIFY NEW DISEASE
    # --------------------------------------------------------

    elif decision == "VERIFY_NEW":

        name = (
            payload.new_disease_name
            or ""
        ).strip()

        if not name:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Enter the new disease name."
                ),
            )

        disease = (
            db.query(models.Disease)
            .filter(
                func.lower(
                    models.Disease.name
                )
                == name.lower()
            )
            .first()
        )

        if not disease:
            disease = models.Disease(
                name=name,
                description=(
                    payload.new_disease_description
                ),
                verification_status=(
                    "VERIFIED"
                ),
                is_active=True,
                verified_by_user_id=user.id,
                verified_at=datetime.utcnow(),
            )

            db.add(disease)
            db.flush()

        report.mapped_disease_id = (
            disease.id
        )

        report.status = "APPROVED"

    # --------------------------------------------------------
    # REJECT
    # --------------------------------------------------------

    elif decision == "REJECT":

        report.status = "REJECTED"

    else:
        raise HTTPException(
            status_code=400,
            detail=(
                "Unsupported review decision."
            ),
        )

    report.review_notes = (
        payload.review_notes
    )

    report.reviewed_at = (
        datetime.utcnow()
    )

    db.commit()
    db.refresh(report)

    return {
        "id": report.id,
        "status": report.status,
        "mapped_disease_id": (
            report.mapped_disease_id
        ),
        "review_notes": (
            report.review_notes
        ),
    }
# ============================================================
# HOME RELIEF & SUPPORTIVE CARE
# ============================================================
#
# These endpoints are intentionally kept under the Medical Supervisor
# router so the Home Relief management screen has one authenticated,
# supervisor-only API surface. Home Relief is global medical content,
# therefore it is not filtered by taluk/district like surveillance data.
#
# Supported workflow:
#   GET    /medical/home-relief
#   POST   /medical/home-relief
#   PATCH  /medical/home-relief/{remedy_id}
#   DELETE /medical/home-relief/{remedy_id}
#   POST   /medical/home-relief/{remedy_id}/approve
#   POST   /medical/home-relief/{remedy_id}/reject
#   POST   /medical/home-relief/{remedy_id}/deactivate
#   POST   /medical/home-relief/{remedy_id}/safety-rules
#   PUT    /medical/home-relief/{remedy_id}/safety-rules/{rule_id}
#   DELETE /medical/home-relief/{remedy_id}/safety-rules/{rule_id}
#
# ============================================================


def _get_home_relief_rules(
    db: Session,
    remedy_id: int,
):
    return (
        db.query(models.HomeReliefSafetyRule)
        .filter(
            models.HomeReliefSafetyRule.remedy_id == remedy_id
        )
        .order_by(models.HomeReliefSafetyRule.id.asc())
        .all()
    )


def _serialize_home_relief(
    db: Session,
    remedy,
):
    rules = _get_home_relief_rules(db, remedy.id)

    return {
        "id": remedy.id,
        "name": remedy.name,
        "disease": remedy.disease,
        "symptom": remedy.symptom,
        "aliases": remedy.aliases,
        "category": remedy.category,
        "description": remedy.description,
        "instructions": remedy.instructions,
        "expected_benefit": remedy.expected_benefit,
        "medical_rationale": remedy.medical_rationale,
        "possible_side_effects": remedy.possible_side_effects,
        "general_safety_notes": remedy.general_safety_notes,
        "red_flags": remedy.red_flags,
        "when_to_seek_care": remedy.when_to_seek_care,
        "status": remedy.status,
        "created_by": remedy.created_by,
        "approved_by": remedy.approved_by,
        "created_at": remedy.created_at,
        "approved_at": remedy.approved_at,
        "last_reviewed_at": remedy.last_reviewed_at,
        "updated_at": remedy.updated_at,
        "safety_rules": [
            {
                "id": rule.id,
                "remedy_id": rule.remedy_id,
                "condition_type": rule.condition_type,
                "condition_value": rule.condition_value,
                "suitability": rule.suitability,
                "severity": rule.severity,
                "reason": rule.reason,
                "alternative_remedy_id": rule.alternative_remedy_id,
                "created_by": rule.created_by,
                "created_at": rule.created_at,
                "updated_at": rule.updated_at,
            }
            for rule in rules
        ],
        "has_safety_restrictions": bool(rules),
    }


def _normalize_home_relief_safety_rule(
    item,
    user_id: int,
):
    condition_type = str(
        getattr(item, "condition_type", None) or ""
    ).strip().lower()

    condition_value = str(
        getattr(item, "condition_value", None) or ""
    ).strip()

    suitability = str(
        getattr(item, "suitability", None) or "UNKNOWN"
    ).strip().upper()

    severity = str(
        getattr(item, "severity", None) or "MODERATE"
    ).strip().upper()

    reason = str(
        getattr(item, "reason", None) or ""
    ).strip()

    alternative_remedy_id = getattr(
        item,
        "alternative_remedy_id",
        None,
    )

    if not condition_type:
        raise HTTPException(
            status_code=400,
            detail="Every safety rule must have a condition type.",
        )

    if not condition_value:
        raise HTTPException(
            status_code=400,
            detail="Every safety rule must have a condition value.",
        )

    allowed_suitability = {
        "SUITABLE",
        "CAUTION",
        "NOT_RECOMMENDED",
        "CONTRAINDICATED",
        "UNKNOWN",
    }

    if suitability not in allowed_suitability:
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid safety suitability. Use SUITABLE, CAUTION, "
                "NOT_RECOMMENDED, CONTRAINDICATED or UNKNOWN."
            ),
        )

    # A restriction must have an auditable medical reason.
    if suitability in {
        "CAUTION",
        "NOT_RECOMMENDED",
        "CONTRAINDICATED",
    } and not reason:
        raise HTTPException(
            status_code=400,
            detail=(
                "Every caution/restriction safety rule must include "
                "a medical safety reason."
            ),
        )

    if alternative_remedy_id is not None:
        try:
            alternative_remedy_id = int(alternative_remedy_id)
        except (TypeError, ValueError):
            raise HTTPException(
                status_code=400,
                detail="alternative_remedy_id must be a valid integer.",
            )

        if alternative_remedy_id <= 0:
            alternative_remedy_id = None

    return {
        "condition_type": condition_type,
        "condition_value": condition_value,
        "suitability": suitability,
        "severity": severity or "MODERATE",
        "reason": reason or None,
        "alternative_remedy_id": alternative_remedy_id,
        "created_by": user_id,
    }


def _validate_home_relief_for_approval(
    db: Session,
    remedy,
    rules,
):
    if not str(remedy.name or "").strip():
        raise HTTPException(
            status_code=400,
            detail="Remedy name is required before approval.",
        )

    if not str(remedy.description or "").strip():
        raise HTTPException(
            status_code=400,
            detail="Remedy description is required before approval.",
        )

    if not str(remedy.instructions or "").strip():
        raise HTTPException(
            status_code=400,
            detail="Instructions are required before approval.",
        )

    for rule in rules:
        if not rule.condition_type or not rule.condition_value:
            raise HTTPException(
                status_code=400,
                detail="Every safety rule must specify the affected population or condition.",
            )

        if rule.suitability in {
            "CAUTION",
            "NOT_RECOMMENDED",
            "CONTRAINDICATED",
        } and not rule.reason:
            raise HTTPException(
                status_code=400,
                detail="Every caution/restriction safety rule must include a medical safety reason.",
            )

        if rule.alternative_remedy_id:
            alternative = (
                db.query(models.HomeReliefRemedy)
                .filter(
                    models.HomeReliefRemedy.id
                    == rule.alternative_remedy_id
                )
                .first()
            )
            if not alternative:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        "A safety rule references an alternative remedy "
                        "that does not exist."
                    ),
                )


def _home_relief_fields_from_payload(payload):
    values = payload.model_dump(
        exclude_unset=True,
        exclude={"safety_rules"},
    )

    cleaned = {}
    for key, value in values.items():
        if isinstance(value, str):
            value = value.strip()
        cleaned[key] = value

    for key in {
        "disease",
        "symptom",
        "aliases",
        "expected_benefit",
        "medical_rationale",
        "possible_side_effects",
        "general_safety_notes",
        "red_flags",
        "when_to_seek_care",
    }:
        if key in cleaned and cleaned[key] == "":
            cleaned[key] = None

    return cleaned


# ============================================================
# HOME RELIEF LIST
# ============================================================

@router.get("/home-relief")
def list_home_relief(
    q: Optional[str] = None,
    disease: Optional[str] = None,
    category: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    user: models.User = Depends(supervisor_only),
):
    query = (
        db.query(models.HomeReliefRemedy)
        .order_by(models.HomeReliefRemedy.updated_at.desc())
    )

    if status and status.strip().lower() not in {"all", "all status"}:
        query = query.filter(
            models.HomeReliefRemedy.status
            == status.strip().upper()
        )

    if disease and disease.strip().lower() not in {
        "all",
        "all diseases",
    }:
        query = query.filter(
            func.lower(models.HomeReliefRemedy.disease)
            == disease.strip().lower()
        )

    if category and category.strip().lower() not in {
        "all",
        "all categories",
    }:
        category_value = category.strip().lower()
        if category_value == "supportive care":
            category_value = "supportive_care"
        query = query.filter(
            func.lower(models.HomeReliefRemedy.category)
            == category_value
        )

    rows = query.all()

    search = str(q or "").strip().lower()
    if search:
        rows = [
            remedy
            for remedy in rows
            if search in " ".join(
                [
                    str(remedy.name or ""),
                    str(remedy.disease or ""),
                    str(remedy.symptom or ""),
                    str(remedy.aliases or ""),
                    str(remedy.category or ""),
                ]
            ).lower()
        ]

    return [
        _serialize_home_relief(db, remedy)
        for remedy in rows
    ]


# ============================================================
# CREATE HOME RELIEF
# ============================================================

@router.post("/home-relief")
def create_home_relief(
    payload: schemas.HomeReliefCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(supervisor_only),
):
    now = datetime.utcnow()

    name = str(payload.name or "").strip()
    description = str(payload.description or "").strip()
    instructions = str(payload.instructions or "").strip()

    if not name:
        raise HTTPException(status_code=400, detail="Remedy name is required.")
    if not description:
        raise HTTPException(status_code=400, detail="Description is required.")
    if not instructions:
        raise HTTPException(status_code=400, detail="Instructions are required.")

    remedy = models.HomeReliefRemedy(
        name=name,
        disease=(payload.disease or "").strip() or None,
        symptom=(payload.symptom or "").strip() or None,
        aliases=(payload.aliases or "").strip() or None,
        category=(payload.category or "supportive_care").strip().lower(),
        description=description,
        instructions=instructions,
        expected_benefit=(payload.expected_benefit or "").strip() or None,
        medical_rationale=(payload.medical_rationale or "").strip() or None,
        possible_side_effects=(payload.possible_side_effects or "").strip() or None,
        general_safety_notes=(payload.general_safety_notes or "").strip() or None,
        red_flags=(payload.red_flags or "").strip() or None,
        when_to_seek_care=(payload.when_to_seek_care or "").strip() or None,
        status="PENDING",
        created_by=user.id,
        created_at=now,
        updated_at=now,
    )

    db.add(remedy)
    db.flush()

    for item in payload.safety_rules or []:
        values = _normalize_home_relief_safety_rule(item, user.id)
        db.add(
            models.HomeReliefSafetyRule(
                remedy_id=remedy.id,
                **values,
            )
        )

    db.add(
        models.HomeReliefAuditLog(
            remedy_id=remedy.id,
            action="CREATED",
            performed_by=user.id,
            old_value=None,
            new_value=payload.model_dump_json(),
            created_at=now,
        )
    )

    db.commit()
    db.refresh(remedy)

    return _serialize_home_relief(db, remedy)


# ============================================================
# UPDATE HOME RELIEF
# ============================================================

@router.patch("/home-relief/{remedy_id}")
def update_home_relief(
    remedy_id: int,
    payload: schemas.HomeReliefUpdate,
    db: Session = Depends(get_db),
    user: models.User = Depends(supervisor_only),
):
    remedy = (
        db.query(models.HomeReliefRemedy)
        .filter(models.HomeReliefRemedy.id == remedy_id)
        .first()
    )

    if not remedy:
        raise HTTPException(status_code=404, detail="Home relief remedy not found.")

    before = _serialize_home_relief(db, remedy)
    data = _home_relief_fields_from_payload(payload)

    if "name" in data and not str(data["name"] or "").strip():
        raise HTTPException(status_code=400, detail="Remedy name cannot be empty.")
    if "description" in data and not str(data["description"] or "").strip():
        raise HTTPException(status_code=400, detail="Description cannot be empty.")
    if "instructions" in data and not str(data["instructions"] or "").strip():
        raise HTTPException(status_code=400, detail="Instructions cannot be empty.")

    for key, value in data.items():
        if key == "category" and isinstance(value, str):
            value = value.lower()
        setattr(remedy, key, value)

    if payload.safety_rules is not None:
        (
            db.query(models.HomeReliefSafetyRule)
            .filter(models.HomeReliefSafetyRule.remedy_id == remedy.id)
            .delete(synchronize_session=False)
        )

        for item in payload.safety_rules:
            values = _normalize_home_relief_safety_rule(item, user.id)
            db.add(
                models.HomeReliefSafetyRule(
                    remedy_id=remedy.id,
                    **values,
                )
            )

        # Editing safety information invalidates an old publication.
        if remedy.status == "ACTIVE":
            remedy.status = "PENDING"
            remedy.approved_by = None
            remedy.approved_at = None

    now = datetime.utcnow()
    remedy.updated_at = now

    db.add(
        models.HomeReliefAuditLog(
            remedy_id=remedy.id,
            action="EDITED",
            performed_by=user.id,
            old_value=str(before),
            new_value=payload.model_dump_json(),
            created_at=now,
        )
    )

    db.commit()
    db.refresh(remedy)

    return _serialize_home_relief(db, remedy)


# ============================================================
# DELETE HOME RELIEF
# ============================================================

@router.delete("/home-relief/{remedy_id}")
def delete_home_relief(
    remedy_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(supervisor_only),
):
    remedy = (
        db.query(models.HomeReliefRemedy)
        .filter(models.HomeReliefRemedy.id == remedy_id)
        .first()
    )

    if not remedy:
        raise HTTPException(status_code=404, detail="Home relief remedy not found.")

    if remedy.status == "ACTIVE":
        raise HTTPException(
            status_code=400,
            detail="Active remedies must be deactivated before deletion.",
        )

    db.delete(remedy)
    db.commit()

    return {
        "ok": True,
        "id": remedy_id,
        "message": "Home relief remedy deleted successfully.",
    }


# ============================================================
# APPROVE HOME RELIEF
# ============================================================

@router.post("/home-relief/{remedy_id}/approve")
def approve_home_relief(
    remedy_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(supervisor_only),
):
    remedy = (
        db.query(models.HomeReliefRemedy)
        .filter(models.HomeReliefRemedy.id == remedy_id)
        .first()
    )

    if not remedy:
        raise HTTPException(status_code=404, detail="Home relief remedy not found.")

    if remedy.status not in {"PENDING", "REJECTED"}:
        raise HTTPException(
            status_code=400,
            detail="Only pending or rejected remedies can be approved.",
        )

    rules = _get_home_relief_rules(db, remedy.id)
    _validate_home_relief_for_approval(db, remedy, rules)

    now = datetime.utcnow()
    previous_status = remedy.status

    remedy.status = "ACTIVE"
    remedy.approved_by = user.id
    remedy.approved_at = now
    remedy.last_reviewed_at = now
    remedy.updated_at = now

    db.add(
        models.HomeReliefAuditLog(
            remedy_id=remedy.id,
            action="APPROVED",
            performed_by=user.id,
            old_value=previous_status,
            new_value="ACTIVE",
            created_at=now,
        )
    )

    db.commit()
    db.refresh(remedy)

    return _serialize_home_relief(db, remedy)


# ============================================================
# REJECT HOME RELIEF
# ============================================================

@router.post("/home-relief/{remedy_id}/reject")
def reject_home_relief(
    remedy_id: int,
    payload: schemas.HomeReliefReject,
    db: Session = Depends(get_db),
    user: models.User = Depends(supervisor_only),
):
    remedy = (
        db.query(models.HomeReliefRemedy)
        .filter(models.HomeReliefRemedy.id == remedy_id)
        .first()
    )

    if not remedy:
        raise HTTPException(status_code=404, detail="Home relief remedy not found.")

    if remedy.status == "ACTIVE":
        raise HTTPException(
            status_code=400,
            detail="Active remedies must be deactivated instead of rejected.",
        )

    reason = str(payload.reason or "").strip()
    if not reason:
        raise HTTPException(status_code=400, detail="A rejection reason is required.")

    now = datetime.utcnow()
    previous_status = remedy.status

    remedy.status = "REJECTED"
    remedy.last_reviewed_at = now
    remedy.updated_at = now

    db.add(
        models.HomeReliefAuditLog(
            remedy_id=remedy.id,
            action="REJECTED",
            performed_by=user.id,
            old_value=previous_status,
            new_value=reason,
            created_at=now,
        )
    )

    db.commit()
    db.refresh(remedy)

    return _serialize_home_relief(db, remedy)


# ============================================================
# DEACTIVATE HOME RELIEF
# ============================================================

@router.post("/home-relief/{remedy_id}/deactivate")
def deactivate_home_relief(
    remedy_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(supervisor_only),
):
    remedy = (
        db.query(models.HomeReliefRemedy)
        .filter(models.HomeReliefRemedy.id == remedy_id)
        .first()
    )

    if not remedy:
        raise HTTPException(status_code=404, detail="Home relief remedy not found.")

    if remedy.status != "ACTIVE":
        raise HTTPException(
            status_code=400,
            detail="Only active remedies can be deactivated.",
        )

    now = datetime.utcnow()
    previous_status = remedy.status

    remedy.status = "INACTIVE"
    remedy.last_reviewed_at = now
    remedy.updated_at = now

    db.add(
        models.HomeReliefAuditLog(
            remedy_id=remedy.id,
            action="DEACTIVATED",
            performed_by=user.id,
            old_value=previous_status,
            new_value="INACTIVE",
            created_at=now,
        )
    )

    db.commit()
    db.refresh(remedy)

    return _serialize_home_relief(db, remedy)


# ============================================================
# CREATE SAFETY RULE
# ============================================================

@router.post("/home-relief/{remedy_id}/safety-rules")
def create_home_relief_safety_rule(
    remedy_id: int,
    payload: schemas.HomeReliefSafetyRuleCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(supervisor_only),
):
    remedy = (
        db.query(models.HomeReliefRemedy)
        .filter(models.HomeReliefRemedy.id == remedy_id)
        .first()
    )

    if not remedy:
        raise HTTPException(status_code=404, detail="Home relief remedy not found.")

    values = _normalize_home_relief_safety_rule(payload, user.id)

    if values["alternative_remedy_id"]:
        alternative = (
            db.query(models.HomeReliefRemedy)
            .filter(
                models.HomeReliefRemedy.id
                == values["alternative_remedy_id"]
            )
            .first()
        )
        if not alternative:
            raise HTTPException(
                status_code=400,
                detail="Alternative remedy not found.",
            )

    now = datetime.utcnow()
    rule = models.HomeReliefSafetyRule(
        remedy_id=remedy.id,
        **values,
        created_at=now,
        updated_at=now,
    )

    db.add(rule)

    if remedy.status == "ACTIVE":
        remedy.status = "PENDING"
        remedy.approved_by = None
        remedy.approved_at = None
        remedy.updated_at = now

    db.add(
        models.HomeReliefAuditLog(
            remedy_id=remedy.id,
            action="SAFETY_RULE_CREATED",
            performed_by=user.id,
            old_value=None,
            new_value=str(values),
            created_at=now,
        )
    )

    db.commit()
    db.refresh(rule)

    return {
        "id": rule.id,
        "remedy_id": rule.remedy_id,
        "condition_type": rule.condition_type,
        "condition_value": rule.condition_value,
        "suitability": rule.suitability,
        "severity": rule.severity,
        "reason": rule.reason,
        "alternative_remedy_id": rule.alternative_remedy_id,
    }


# ============================================================
# UPDATE SAFETY RULE
# ============================================================

@router.put("/home-relief/{remedy_id}/safety-rules/{rule_id}")
def update_home_relief_safety_rule(
    remedy_id: int,
    rule_id: int,
    payload: schemas.HomeReliefSafetyRuleUpdate,
    db: Session = Depends(get_db),
    user: models.User = Depends(supervisor_only),
):
    remedy = (
        db.query(models.HomeReliefRemedy)
        .filter(models.HomeReliefRemedy.id == remedy_id)
        .first()
    )

    if not remedy:
        raise HTTPException(status_code=404, detail="Home relief remedy not found.")

    rule = (
        db.query(models.HomeReliefSafetyRule)
        .filter(
            models.HomeReliefSafetyRule.id == rule_id,
            models.HomeReliefSafetyRule.remedy_id == remedy_id,
        )
        .first()
    )

    if not rule:
        raise HTTPException(status_code=404, detail="Safety rule not found.")

    data = payload.model_dump(exclude_unset=True)

    condition_type = str(
        data.get("condition_type", rule.condition_type) or ""
    ).strip().lower()
    condition_value = str(
        data.get("condition_value", rule.condition_value) or ""
    ).strip()
    suitability = str(
        data.get("suitability", rule.suitability) or "UNKNOWN"
    ).strip().upper()
    severity = str(
        data.get("severity", rule.severity or "MODERATE") or "MODERATE"
    ).strip().upper()
    reason = str(
        data.get("reason", rule.reason) or ""
    ).strip()
    alternative_id = data.get(
        "alternative_remedy_id",
        rule.alternative_remedy_id,
    )

    if not condition_type or not condition_value:
        raise HTTPException(
            status_code=400,
            detail="Condition type and condition value are required.",
        )

    if suitability not in {
        "SUITABLE",
        "CAUTION",
        "NOT_RECOMMENDED",
        "CONTRAINDICATED",
        "UNKNOWN",
    }:
        raise HTTPException(status_code=400, detail="Invalid safety suitability.")

    if suitability in {
        "CAUTION",
        "NOT_RECOMMENDED",
        "CONTRAINDICATED",
    } and not reason:
        raise HTTPException(
            status_code=400,
            detail="A medical safety reason is required for a restriction.",
        )

    if alternative_id is not None:
        try:
            alternative_id = int(alternative_id)
        except (TypeError, ValueError):
            raise HTTPException(status_code=400, detail="Invalid alternative remedy id.")

        if alternative_id <= 0:
            alternative_id = None

        if alternative_id:
            alternative = (
                db.query(models.HomeReliefRemedy)
                .filter(models.HomeReliefRemedy.id == alternative_id)
                .first()
            )
            if not alternative:
                raise HTTPException(status_code=400, detail="Alternative remedy not found.")

    rule.condition_type = condition_type
    rule.condition_value = condition_value
    rule.suitability = suitability
    rule.severity = severity
    rule.reason = reason or None
    rule.alternative_remedy_id = alternative_id
    rule.updated_at = datetime.utcnow()

    if remedy.status == "ACTIVE":
        remedy.status = "PENDING"
        remedy.approved_by = None
        remedy.approved_at = None
        remedy.updated_at = datetime.utcnow()

    db.add(
        models.HomeReliefAuditLog(
            remedy_id=remedy.id,
            action="SAFETY_RULE_UPDATED",
            performed_by=user.id,
            old_value=None,
            new_value=str({
                "rule_id": rule.id,
                "condition_type": rule.condition_type,
                "condition_value": rule.condition_value,
                "suitability": rule.suitability,
                "severity": rule.severity,
                "reason": rule.reason,
                "alternative_remedy_id": rule.alternative_remedy_id,
            }),
            created_at=datetime.utcnow(),
        )
    )

    db.commit()
    db.refresh(rule)

    return {
        "id": rule.id,
        "remedy_id": rule.remedy_id,
        "condition_type": rule.condition_type,
        "condition_value": rule.condition_value,
        "suitability": rule.suitability,
        "severity": rule.severity,
        "reason": rule.reason,
        "alternative_remedy_id": rule.alternative_remedy_id,
    }


# ============================================================
# DELETE SAFETY RULE
# ============================================================

@router.delete("/home-relief/{remedy_id}/safety-rules/{rule_id}")
def delete_home_relief_safety_rule(
    remedy_id: int,
    rule_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(supervisor_only),
):
    remedy = (
        db.query(models.HomeReliefRemedy)
        .filter(models.HomeReliefRemedy.id == remedy_id)
        .first()
    )

    if not remedy:
        raise HTTPException(status_code=404, detail="Home relief remedy not found.")

    rule = (
        db.query(models.HomeReliefSafetyRule)
        .filter(
            models.HomeReliefSafetyRule.id == rule_id,
            models.HomeReliefSafetyRule.remedy_id == remedy_id,
        )
        .first()
    )

    if not rule:
        raise HTTPException(status_code=404, detail="Safety rule not found.")

    old_value = str({
        "id": rule.id,
        "condition_type": rule.condition_type,
        "condition_value": rule.condition_value,
        "suitability": rule.suitability,
        "severity": rule.severity,
        "reason": rule.reason,
        "alternative_remedy_id": rule.alternative_remedy_id,
    })

    db.delete(rule)

    if remedy.status == "ACTIVE":
        remedy.status = "PENDING"
        remedy.approved_by = None
        remedy.approved_at = None
        remedy.updated_at = datetime.utcnow()

    db.add(
        models.HomeReliefAuditLog(
            remedy_id=remedy.id,
            action="SAFETY_RULE_DELETED",
            performed_by=user.id,
            old_value=old_value,
            new_value=None,
            created_at=datetime.utcnow(),
        )
    )

    db.commit()

    return {
        "ok": True,
        "id": rule_id,
        "message": "Safety rule deleted successfully.",
    }
