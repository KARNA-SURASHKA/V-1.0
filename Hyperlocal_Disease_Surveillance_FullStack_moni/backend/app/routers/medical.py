from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from .. import models, schemas, auth
from ..database import get_db
from ..utils import current_week_number


router = APIRouter(
    prefix="/medical",
    tags=["medical supervisor"],
)

supervisor_only = auth.require_role("medical_supervisor")


# ============================================================
# EMERGING DISEASE SERIALIZATION
# ============================================================

def _serialize_emerging(report):
    return schemas.EmergingDiseaseOut(
        id=report.id,
        agent_id=report.agent_id,
        taluk_id=report.taluk_id,
        taluk_name=report.taluk.name if report.taluk else None,
        reported_name=report.reported_name,
        suspected_cases=report.suspected_cases,
        symptoms=report.symptoms,
        description=report.description,
        observed_date=report.observed_date,
        status=report.status,
        mapped_disease_id=report.mapped_disease_id,
        mapped_disease_name=(
            report.mapped_disease.name
            if report.mapped_disease
            else None
        ),
        review_notes=report.review_notes,
        created_at=report.created_at,
        reviewed_at=report.reviewed_at,
    )


# ============================================================
# MEDICAL SUPERVISOR OVERVIEW
# ============================================================

@router.get("/overview")
def medical_overview(
    taluk_id: Optional[int] = None,
    db: Session = Depends(get_db),
    user: models.User = Depends(supervisor_only),
):
    """Return the dashboard data used by the Medical Supervisor home screen.

    All headline values are calculated from the surveillance database rather
    than being presentation/demo constants. The optional taluk_id scopes the
    dashboard to one monitored taluk; when omitted, the dashboard covers all
    monitored agent assignments.
    """

    now = datetime.utcnow()
    current_week = current_week_number(now)
    previous_week = current_week_number(
        now - timedelta(days=7)
    )

    # --------------------------------------------------------
    # Monitored locations
    # --------------------------------------------------------

    agents_query = (
        db.query(models.Agent)
        .join(
            models.User,
            models.Agent.user_id == models.User.id,
        )
        .join(
            models.Taluk,
            models.Agent.taluk_id == models.Taluk.id,
        )
        .filter(
            models.User.is_active.is_(True)
        )
        .order_by(
            models.Taluk.name.asc()
        )
    )

    agents = agents_query.all()

    locations = []

    for agent in agents:

        if not agent.taluk:
            continue

        district = (
            agent.taluk.district.name
            if agent.taluk.district
            else "Unknown District"
        )

        locations.append(
            {
                "taluk_id": agent.taluk_id,
                "taluk_name": agent.taluk.name,
                "district_name": district,
                "label": (
                    f"{agent.taluk.name}, "
                    f"{district}"
                ),
            }
        )

    # Avoid duplicate locations.
    locations = list(
        {
            item["taluk_id"]: item
            for item in locations
        }.values()
    )

    locations.sort(
        key=lambda item: item["label"].lower()
    )

    selected_location = None

    if taluk_id is not None:

        selected_location = next(
            (
                item
                for item in locations
                if item["taluk_id"] == taluk_id
            ),
            None,
        )

        if selected_location is None:
            raise HTTPException(
                status_code=404,
                detail="Monitored taluk not found.",
            )

    # --------------------------------------------------------
    # Base filters
    # --------------------------------------------------------

    def scoped_query(query):

        if taluk_id is not None:
            return query.filter(
                models.DiseaseReport.taluk_id
                == taluk_id
            )

        return query

    current_reports_query = scoped_query(
        db.query(
            models.DiseaseReport
        ).filter(
            models.DiseaseReport.week_number
            == current_week
        )
    )

    previous_reports_query = scoped_query(
        db.query(
            models.DiseaseReport
        ).filter(
            models.DiseaseReport.week_number
            == previous_week
        )
    )

    current_reports = (
        current_reports_query.all()
    )

    previous_reports = (
        previous_reports_query.all()
    )

    # --------------------------------------------------------
    # Agents / reporting coverage
    # --------------------------------------------------------

    if taluk_id is not None:

        scoped_agents = [
            agent
            for agent in agents
            if agent.taluk_id == taluk_id
        ]

    else:

        scoped_agents = agents

    active_agents = len(
        scoped_agents
    )

    submitted_agent_ids = {
        report.agent_id
        for report in current_reports
        if report.agent_id is not None
    }

    submitted_agents = sum(
        1
        for agent in scoped_agents
        if agent.id in submitted_agent_ids
    )

    pending_submissions = max(
        0,
        active_agents - submitted_agents,
    )

    coverage_percent = (
        round(
            (
                submitted_agents
                / active_agents
            )
            * 100
        )
        if active_agents
        else 0
    )

    # --------------------------------------------------------
    # Disease overview
    # --------------------------------------------------------

    current_by_disease = {}
    previous_by_disease = {}

    for report in current_reports:

        current_by_disease[
            report.disease
        ] = (
            current_by_disease.get(
                report.disease,
                0,
            )
            + (
                report.cases
                or 0
            )
        )

    for report in previous_reports:

        previous_by_disease[
            report.disease
        ] = (
            previous_by_disease.get(
                report.disease,
                0,
            )
            + (
                report.cases
                or 0
            )
        )

    # --------------------------------------------------------
    # Predictions / risk
    # --------------------------------------------------------

    prediction_query = (
        db.query(
            models.Prediction
        ).filter(
            models.Prediction.week_number
            == current_week
        )
    )

    if taluk_id is not None:

        prediction_query = (
            prediction_query.filter(
                models.Prediction.taluk_id
                == taluk_id
            )
        )

    predictions = (
        prediction_query.all()
    )

    # IMPORTANT:
    #
    # Prediction has taluk_id but does NOT have
    # a .taluk relationship.
    #
    # Therefore we explicitly load the related
    # Taluk records here.
    #
    # This fixes:
    #
    # AttributeError:
    # 'Prediction' object has no attribute 'taluk'
    #

    prediction_taluk_ids = {
        prediction.taluk_id
        for prediction in predictions
        if prediction.taluk_id is not None
    }

    prediction_taluks = {}

    if prediction_taluk_ids:

        prediction_taluks = {
            taluk.id: taluk
            for taluk in (
                db.query(
                    models.Taluk
                )
                .filter(
                    models.Taluk.id.in_(
                        prediction_taluk_ids
                    )
                )
                .all()
            )
        }

    risk_rank = {
        "Low": 1,
        "Moderate": 2,
        "High": 3,
        "Critical": 4,
    }

    risk_by_disease = {}

    prediction_by_disease = {}

    for prediction in predictions:

        current = (
            risk_by_disease.get(
                prediction.disease
            )
        )

        if (
            current is None
            or
            risk_rank.get(
                prediction.risk_level,
                0,
            )
            >
            risk_rank.get(
                current,
                0,
            )
        ):

            risk_by_disease[
                prediction.disease
            ] = (
                prediction.risk_level
                or "Low"
            )

        prediction_by_disease.setdefault(
            prediction.disease,
            [],
        ).append(
            prediction
        )

    disease_names = sorted(
        set(current_by_disease)
        |
        set(previous_by_disease)
    )

    disease_overview = []

    for disease in disease_names:

        current_cases = (
            current_by_disease.get(
                disease,
                0,
            )
        )

        previous_cases = (
            previous_by_disease.get(
                disease,
                0,
            )
        )

        if previous_cases:

            change_percent = round(
                (
                    (
                        current_cases
                        - previous_cases
                    )
                    / previous_cases
                )
                * 100
            )

        elif current_cases:

            change_percent = 100

        else:

            change_percent = 0

        risk_level = (
            risk_by_disease.get(
                disease,
                "Low",
            )
        )

        if risk_level in {
            "Critical",
            "High",
        }:

            status = "Watch"

        elif risk_level == "Moderate":

            status = "Monitor"

        else:

            status = "Stable"

        disease_overview.append(
            {
                "disease": disease,
                "cases_this_week": current_cases,
                "previous_cases": previous_cases,
                "change_percent": change_percent,
                "risk_level": risk_level,
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
    # Risk alerts
    # --------------------------------------------------------

    high_risk_predictions = [
        prediction
        for prediction in predictions
        if prediction.risk_level
        in {
            "Critical",
            "High",
        }
    ]

    high_risk_predictions.sort(
        key=lambda prediction: (
            risk_rank.get(
                prediction.risk_level,
                0,
            ),
            prediction.predicted_cases
            or 0,
        ),
        reverse=True,
    )

    recent_alerts = []

    seen_alerts = set()

    for prediction in high_risk_predictions:

        key = (
            prediction.taluk_id,
            prediction.disease,
        )

        if key in seen_alerts:
            continue

        seen_alerts.add(key)

        # IMPORTANT:
        #
        # Do NOT use:
        #
        # prediction.taluk
        #
        # because Prediction has no taluk relationship.
        #
        # Use the explicitly loaded lookup map.

        taluk = prediction_taluks.get(
            prediction.taluk_id
        )

        place = (
            taluk.name
            if taluk
            else "Unknown Taluk"
        )

        if (
            taluk_id is not None
            and selected_location
        ):

            place = (
                selected_location[
                    "taluk_name"
                ]
            )

        current_cases = (
            prediction.current_cases
            or 0
        )

        predicted_cases = (
            prediction.predicted_cases
            or 0
        )

        trend_text = (
            prediction.trend
            or "stable"
        ).lower()

        message = (
            f"{prediction.disease} is "
            f"{prediction.risk_level.lower()} "
            f"risk in {place}. "
            f"Current cases: "
            f"{current_cases}; "
            f"predicted: "
            f"{predicted_cases}. "
            f"Trend: "
            f"{trend_text}."
        )

        recent_alerts.append(
            {
                "type": "risk",
                "severity": (
                    prediction.risk_level
                ),
                "title": (
                    f"{prediction.risk_level} "
                    f"{prediction.disease} "
                    f"activity in {place}"
                ),
                "message": message,
                "created_at": (
                    prediction.created_at
                ),
                "taluk_name": place,
                "disease": (
                    prediction.disease
                ),
            }
        )

        if len(recent_alerts) >= 3:
            break

    # --------------------------------------------------------
    # Missed weekly submissions
    # --------------------------------------------------------

    if pending_submissions:

        missing_names = [
            agent.user.full_name
            for agent in scoped_agents
            if agent.id
            not in submitted_agent_ids
        ]

        label = (
            (
                f"{len(missing_names)} "
                f"agent missed the weekly report"
            )
            if len(missing_names) == 1
            else
            (
                f"{len(missing_names)} "
                f"agents missed weekly reports"
            )
        )

        recent_alerts.append(
            {
                "type": "reporting",
                "severity": "Medium",
                "title": label,
                "message": (
                    "Follow-up is required "
                    "for timely surveillance "
                    "reporting."
                ),
                "created_at": now,
                "taluk_name": (
                    selected_location[
                        "taluk_name"
                    ]
                    if selected_location
                    else None
                ),
                "disease": None,
            }
        )

    # --------------------------------------------------------
    # Emerging disease reviews
    # --------------------------------------------------------

    pending_emerging = (
        db.query(
            models.EmergingDiseaseReport
        ).filter(
            models.EmergingDiseaseReport.status
            == "PENDING"
        )
    )

    if taluk_id is not None:

        pending_emerging = (
            pending_emerging.filter(
                models.EmergingDiseaseReport.taluk_id
                == taluk_id
            )
        )

    pending_emerging_count = (
        pending_emerging.count()
    )

    if pending_emerging_count:

        recent_alerts.append(
            {
                "type": "emerging",
                "severity": "High",
                "title": (
                    f"{pending_emerging_count} "
                    f"emerging disease review"
                    +
                    (
                        "s"
                        if pending_emerging_count
                        != 1
                        else ""
                    )
                ),
                "message": (
                    "Suspected disease reports "
                    "are awaiting Medical "
                    "Supervisor review."
                ),
                "created_at": now,
                "taluk_name": (
                    selected_location[
                        "taluk_name"
                    ]
                    if selected_location
                    else None
                ),
                "disease": None,
            }
        )

    # --------------------------------------------------------
    # Surveillance pulse
    # --------------------------------------------------------

    pulse = []

    latest_report = (
        current_reports_query
        .order_by(
            models.DiseaseReport.created_at.desc()
        )
        .first()
    )

    if latest_report:

        agent_name = (
            latest_report.agent.user.full_name
            if (
                latest_report.agent
                and latest_report.agent.user
            )
            else "Agent"
        )

        pulse.append(
            {
                "time": (
                    latest_report.created_at
                ),
                "title": (
                    "Disease report submitted"
                ),
                "detail": (
                    f"{agent_name} submitted "
                    f"{latest_report.disease} "
                    "surveillance data."
                ),
                "meta": (
                    f"{latest_report.cases or 0} "
                    f"cases · "
                    f"{
                        latest_report.taluk.name
                        if latest_report.taluk
                        else 'Unknown Taluk'
                    }"
                ),
                "kind": "report",
            }
        )

    latest_risk = (
        high_risk_predictions[0]
        if high_risk_predictions
        else None
    )

    if latest_risk:

        # IMPORTANT:
        #
        # Prediction does not have .taluk.
        # Resolve the Taluk using taluk_id.

        latest_risk_taluk = (
            prediction_taluks.get(
                latest_risk.taluk_id
            )
        )

        latest_risk_taluk_name = (
            latest_risk_taluk.name
            if latest_risk_taluk
            else "Unknown Taluk"
        )

        pulse.append(
            {
                "time": (
                    latest_risk.created_at
                ),
                "title": (
                    "Risk level updated"
                ),
                "detail": (
                    f"{latest_risk.disease} "
                    f"classified as "
                    f"{latest_risk.risk_level} "
                    "risk."
                ),
                "meta": (
                    f"Predicted "
                    f"{latest_risk.predicted_cases or 0} "
                    f"cases · "
                    f"{latest_risk_taluk_name}"
                ),
                "kind": "risk",
            }
        )

    if active_agents:

        pulse.append(
            {
                "time": (
                    latest_report.created_at
                    if latest_report
                    else now
                ),
                "title": (
                    "Weekly reporting coverage"
                ),
                "detail": (
                    f"{submitted_agents} of "
                    f"{active_agents} active "
                    "monitored agents have "
                    "submitted this week."
                ),
                "meta": (
                    f"{coverage_percent}% coverage"
                ),
                "kind": "coverage",
            }
        )

    if pending_emerging_count:

        pulse.append(
            {
                "time": now,
                "title": (
                    "Emerging disease report received"
                ),
                "detail": (
                    f"{pending_emerging_count} "
                    "suspected report(s) require "
                    "medical review."
                ),
                "meta": "Pending review",
                "kind": "emerging",
            }
        )

    # --------------------------------------------------------
    # Deduplicate pulse
    # --------------------------------------------------------

    unique_pulse = []

    seen = set()

    for item in pulse:

        if item["title"] in seen:
            continue

        seen.add(
            item["title"]
        )

        unique_pulse.append(
            item
        )

    pulse = unique_pulse[:4]

    # --------------------------------------------------------
    # Headline metrics
    # --------------------------------------------------------

    total_cases_this_week = sum(
        current_by_disease.values()
    )

    total_cases_previous_week = sum(
        previous_by_disease.values()
    )

    high_risk_alerts = len(
        high_risk_predictions
    )

    reports_this_week = len(
        current_reports
    )

    return {
        "current_week": current_week,
        "current_week_label": (
            f"Week {current_week % 100}"
        ),
        "previous_week": previous_week,

        "active_agents": active_agents,
        "total_agents": active_agents,

        "total_taluks": (
            len(locations)
            if taluk_id is None
            else (
                1
                if selected_location
                else 0
            )
        ),

        "total_reports": (
            db.query(
                models.DiseaseReport
            ).count()
        ),

        "reports_this_week": (
            reports_this_week
        ),

        "submitted_agents_this_week": (
            submitted_agents
        ),

        "pending_agent_submissions": (
            pending_submissions
        ),

        "pending_emerging_reviews": (
            pending_emerging_count
        ),

        "pending_agent_issue_reports": (
            db.query(
                models.AgentIssueReport
            )
            .filter(
                models.AgentIssueReport.status
                == "PENDING_ADMIN_REVIEW"
            )
            .count()
        ),

        "diseases_tracked": len(
            disease_names
        ),

        "total_cases_this_week": (
            total_cases_this_week
        ),

        "total_cases_previous_week": (
            total_cases_previous_week
        ),

        "high_risk_alerts": (
            high_risk_alerts
        ),

        "reporting_coverage_percent": (
            coverage_percent
        ),

        "coverage_received": (
            submitted_agents
        ),

        "coverage_pending": (
            pending_submissions
        ),

        "coverage_no_report": max(
            0,
            active_agents
            - submitted_agents
            - pending_submissions,
        ),

        "locations": locations,

        "selected_location": (
            selected_location
        ),

        "disease_overview": (
            disease_overview
        ),

        "recent_alerts": (
            recent_alerts[:5]
        ),

        "surveillance_pulse": (
            pulse
        ),
    }


# ============================================================
# MEDICAL REPORTS
# ============================================================

@router.get("/reports")
def medical_reports(
    taluk_id: Optional[int] = None,
    disease: Optional[str] = None,
    week_number: Optional[int] = None,
    year: Optional[int] = None,
    limit: int = 500,
    db: Session = Depends(get_db),
    user: models.User = Depends(supervisor_only),
):
    limit = min(
        max(limit, 1),
        1000,
    )

    query = (
        db.query(
            models.DiseaseReport
        )
        .join(
            models.Taluk,
            models.DiseaseReport.taluk_id
            == models.Taluk.id,
        )
        .join(
            models.Agent,
            models.DiseaseReport.agent_id
            == models.Agent.id,
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

        if 1 <= week_number <= 53:

            query = query.filter(
                (
                    models.DiseaseReport.week_number
                    % 100
                )
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

    reports = (
        query
        .order_by(
            models.DiseaseReport.year.desc(),
            models.DiseaseReport.week_number.desc(),
            models.DiseaseReport.created_at.desc(),
        )
        .limit(limit)
        .all()
    )

    return [
        {
            "id": report.id,
            "agent_id": report.agent_id,
            "agent_name": (
                report.agent.user.full_name
                if (
                    report.agent
                    and report.agent.user
                )
                else "Unknown Agent"
            ),
            "taluk_id": report.taluk_id,
            "taluk_name": (
                report.taluk.name
                if report.taluk
                else "Unknown Taluk"
            ),
            "district_id": (
                report.taluk.district_id
                if report.taluk
                else None
            ),
            "district_name": (
                report.taluk.district.name
                if (
                    report.taluk
                    and report.taluk.district
                )
                else "Unknown District"
            ),
            "disease": report.disease,
            "cases": report.cases or 0,
            "severity": report.severity,
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
        }
        for report in reports
    ]


# ============================================================
# AGENT MONITORING
# ============================================================

@router.get("/monitoring")
def medical_monitoring(
    week_number: Optional[int] = None,
    db: Session = Depends(get_db),
    user: models.User = Depends(supervisor_only),
):
    week = (
        week_number
        or current_week_number()
    )

    agents = (
        db.query(
            models.Agent
        )
        .join(
            models.User,
            models.Agent.user_id
            == models.User.id,
        )
        .order_by(
            models.User.full_name.asc()
        )
        .all()
    )

    rows = []

    for agent in agents:

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

        rows.append(
            {
                "agent_id": agent.id,
                "agent_name": (
                    agent.user.full_name
                ),
                "username": (
                    agent.user.username
                ),
                "taluk_id": (
                    agent.taluk_id
                ),
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
                    else "Unknown District"
                ),
                "is_active": bool(
                    agent.user.is_active
                ),
                "submitted": submitted,
                "week_number": week,
            }
        )

    return rows


# ============================================================
# ANALYTICS
# ============================================================

@router.get("/analytics")
def medical_analytics(
    weeks: int = 8,
    db: Session = Depends(get_db),
    user: models.User = Depends(supervisor_only),
):
    weeks = min(
        max(weeks, 2),
        20,
    )

    pairs = (
        db.query(
            models.DiseaseReport.year,
            models.DiseaseReport.week_number,
        )
        .distinct()
        .order_by(
            models.DiseaseReport.year.desc(),
            models.DiseaseReport.week_number.desc(),
        )
        .limit(weeks)
        .all()
    )

    pairs = list(
        reversed(pairs)
    )

    weekly = []

    for year, week in pairs:

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
                models.DiseaseReport.year
                == year,
                models.DiseaseReport.week_number
                == week,
            )
            .scalar()
        )

        diseases = (
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
                models.DiseaseReport.year
                == year,
                models.DiseaseReport.week_number
                == week,
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

        weekly.append(
            {
                "year": year,
                "week_number": week,
                "label": f"W{week}",
                "total_cases": int(
                    total or 0
                ),
                "diseases": [
                    {
                        "disease": name,
                        "cases": int(
                            cases or 0
                        ),
                    }
                    for name, cases in diseases
                ],
            }
        )

    disease_totals = (
        db.query(
            models.DiseaseReport.disease,
            func.coalesce(
                func.sum(
                    models.DiseaseReport.cases
                ),
                0,
            ),
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
        "disease_totals": [
            {
                "disease": disease,
                "cases": int(
                    cases or 0
                ),
            }
            for disease, cases
            in disease_totals
        ],
    }


# ============================================================
# RISK MAP
# ============================================================

@router.get("/risk-map")
def medical_risk_map(
    db: Session = Depends(get_db),
    user: models.User = Depends(supervisor_only),
):
    current_week = current_week_number()

    predictions = (
        db.query(
            models.Prediction
        )
        .filter(
            models.Prediction.week_number
            == current_week
        )
        .all()
    )

    taluk_ids = {
        prediction.taluk_id
        for prediction in predictions
        if prediction.taluk_id is not None
    }

    taluks = {}

    if taluk_ids:

        taluks = {
            taluk.id: taluk
            for taluk in (
                db.query(
                    models.Taluk
                )
                .filter(
                    models.Taluk.id.in_(
                        taluk_ids
                    )
                )
                .all()
            )
        }

    rows = []

    risk_rank = {
        "Low": 1,
        "Moderate": 2,
        "High": 3,
        "Critical": 4,
    }

    grouped = {}

    for prediction in predictions:

        key = (
            prediction.taluk_id,
            prediction.disease,
        )

        existing = grouped.get(key)

        if (
            existing is None
            or
            risk_rank.get(
                prediction.risk_level,
                0,
            )
            >
            risk_rank.get(
                existing.risk_level,
                0,
            )
        ):

            grouped[key] = prediction

    for prediction in grouped.values():

        taluk = taluks.get(
            prediction.taluk_id
        )

        district = (
            taluk.district
            if taluk
            else None
        )

        rows.append(
            {
                "id": prediction.id,
                "taluk_id": (
                    prediction.taluk_id
                ),
                "taluk_name": (
                    taluk.name
                    if taluk
                    else "Unknown Taluk"
                ),
                "district_id": (
                    district.id
                    if district
                    else None
                ),
                "district_name": (
                    district.name
                    if district
                    else "Unknown District"
                ),
                "disease": (
                    prediction.disease
                ),
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
                "latitude": (
                    getattr(
                        taluk,
                        "latitude",
                        None,
                    )
                    if taluk
                    else None
                ),
                "longitude": (
                    getattr(
                        taluk,
                        "longitude",
                        None,
                    )
                    if taluk
                    else None
                ),
                "created_at": (
                    prediction.created_at
                ),
            }
        )

    return rows


# ============================================================
# DISEASE LIST
# ============================================================

@router.get("/diseases")
def medical_diseases(
    db: Session = Depends(get_db),
    user: models.User = Depends(supervisor_only),
):
    diseases = (
        db.query(
            models.Disease
        )
        .order_by(
            models.Disease.name.asc()
        )
        .all()
    )

    return [
        {
            "id": disease.id,
            "name": disease.name,
            "description": getattr(
                disease,
                "description",
                None,
            ),
            "is_active": getattr(
                disease,
                "is_active",
                True,
            ),
        }
        for disease in diseases
    ]


# ============================================================
# AGENTS
# ============================================================

@router.get("/agents")
def medical_agents(
    db: Session = Depends(get_db),
    user: models.User = Depends(supervisor_only),
):
    agents = (
        db.query(
            models.Agent
        )
        .join(
            models.User,
            models.Agent.user_id
            == models.User.id,
        )
        .order_by(
            models.User.full_name.asc()
        )
        .all()
    )

    return [
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
                else None
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
                else "Unknown District"
            ),
            "is_active": (
                bool(agent.user.is_active)
                if agent.user
                else False
            ),
        }
        for agent in agents
    ]


# ============================================================
# AGENT ISSUES
# ============================================================

@router.get("/agent-issues")
def medical_agent_issues(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    user: models.User = Depends(supervisor_only),
):
    district_id = getattr(user, "supervisor_district_id", None)
    district = (
        db.query(models.District).filter(models.District.id == district_id).first()
        if district_id else None
    )
    if district is None:
        district = db.query(models.District).filter(models.District.name.ilike("Kodagu")).first()
    taluk_ids = [t.id for t in district.taluks] if district else []

    query = (
        db.query(models.AgentIssueReport)
        .join(models.Agent, models.AgentIssueReport.agent_id == models.Agent.id)
        .filter(models.Agent.taluk_id.in_(taluk_ids or [-1]))
        .order_by(models.AgentIssueReport.created_at.desc())
    )

    if status:

        query = query.filter(
            models.AgentIssueReport.status
            == status
        )

    issues = query.all()

    return [
        {
            "id": issue.id,
            "agent_id": issue.agent_id,
            "agent_name": (
                issue.agent.user.full_name
                if (
                    issue.agent
                    and issue.agent.user
                )
                else "Unknown Agent"
            ),
            "taluk_id": issue.agent.taluk_id if issue.agent else None,
            "taluk_name": (
                issue.agent.taluk.name
                if issue.agent and issue.agent.taluk
                else "Unknown Taluk"
            ),
            "issue_type": (
                issue.issue_type
            ),
            "description": (
                issue.description
            ),
            "status": issue.status,
            "created_at": (
                issue.created_at
            ),
            "resolved_at": (
                issue.reviewed_at
            ),
        }
        for issue in issues
    ]


# ============================================================
# EMERGING DISEASES
# ============================================================

@router.get(
    "/emerging",
    response_model=list[
        schemas.EmergingDiseaseOut
    ],
)
def medical_emerging(
    status: Optional[str] = None,
    taluk_id: Optional[int] = None,
    db: Session = Depends(get_db),
    user: models.User = Depends(supervisor_only),
):
    query = (
        db.query(
            models.EmergingDiseaseReport
        )
        .order_by(
            models.EmergingDiseaseReport.created_at.desc()
        )
    )

    if status:

        query = query.filter(
            models.EmergingDiseaseReport.status
            == status
        )

    if taluk_id is not None:

        query = query.filter(
            models.EmergingDiseaseReport.taluk_id
            == taluk_id
        )

    reports = query.all()

    return [
        _serialize_emerging(
            report
        )
        for report in reports
    ]


# ============================================================
# APPROVE EMERGING DISEASE
# ============================================================

@router.post(
    "/emerging/{report_id}/approve",
)
def approve_emerging(
    report_id: int,
    payload: schemas.EmergingDiseaseReview,
    db: Session = Depends(get_db),
    user: models.User = Depends(supervisor_only),
):
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

    if not report:

        raise HTTPException(
            status_code=404,
            detail=(
                "Emerging disease report "
                "not found."
            ),
        )

    if report.status == "APPROVED":

        raise HTTPException(
            status_code=400,
            detail=(
                "This report has already "
                "been approved."
            ),
        )

    report.status = "APPROVED"

    report.review_notes = (
        payload.review_notes
        if payload
        else None
    )

    report.reviewed_at = (
        datetime.utcnow()
    )

    db.commit()

    db.refresh(report)

    return _serialize_emerging(
        report
    )


# ============================================================
# REJECT EMERGING DISEASE
# ============================================================

@router.post(
    "/emerging/{report_id}/reject",
)
def reject_emerging(
    report_id: int,
    payload: schemas.EmergingDiseaseReview,
    db: Session = Depends(get_db),
    user: models.User = Depends(supervisor_only),
):
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

    if not report:

        raise HTTPException(
            status_code=404,
            detail=(
                "Emerging disease report "
                "not found."
            ),
        )

    report.status = "REJECTED"

    report.review_notes = (
        payload.review_notes
        if payload
        else None
    )

    report.reviewed_at = (
        datetime.utcnow()
    )

    db.commit()

    db.refresh(report)

    return _serialize_emerging(
        report
    )


# ============================================================
# HOME RELIEF HELPERS
# ============================================================

def _get_home_relief_rules(
    db: Session,
    remedy_id: int,
):
    return (
        db.query(
            models.HomeReliefSafetyRule
        )
        .filter(
            models.HomeReliefSafetyRule.remedy_id
            == remedy_id
        )
        .order_by(
            models.HomeReliefSafetyRule.id.asc()
        )
        .all()
    )


def _serialize_home_relief(
    db: Session,
    remedy,
):
    rules = _get_home_relief_rules(
        db,
        remedy.id,
    )

    return schemas.HomeReliefOut(
        id=remedy.id,
        name=remedy.name,
        description=remedy.description,
        category=remedy.category,
        instructions=remedy.instructions,
        disease=remedy.disease,
        symptom=remedy.symptom,
        aliases=remedy.aliases,
        expected_benefit=remedy.expected_benefit,
        medical_rationale=remedy.medical_rationale,
        possible_side_effects=remedy.possible_side_effects,
        general_safety_notes=remedy.general_safety_notes,
        red_flags=remedy.red_flags,
        when_to_seek_care=remedy.when_to_seek_care,
        status=remedy.status,
        created_by=remedy.created_by,
        approved_by=remedy.approved_by,
        approved_at=remedy.approved_at,
        last_reviewed_at=(
            remedy.last_reviewed_at
        ),
        created_at=remedy.created_at,
        updated_at=remedy.updated_at,
        safety_rules=[
            schemas.HomeReliefSafetyRuleOut(
                id=rule.id,
                remedy_id=rule.remedy_id,
                condition_type=(
                    rule.condition_type
                ),
                condition_value=(
                    rule.condition_value
                ),
                suitability=(
                    rule.suitability
                ),
                severity=rule.severity,
                reason=rule.reason,
                alternative_remedy_id=(
                    rule.alternative_remedy_id
                ),
                created_by=rule.created_by,
            )
            for rule in rules
        ],
    )


def _validate_home_relief_for_approval(
    remedy,
    rules,
):
    if not remedy.name or not remedy.name.strip():

        raise HTTPException(
            status_code=400,
            detail=(
                "Remedy name is required "
                "before approval."
            ),
        )

    if not remedy.description or not remedy.description.strip():

        raise HTTPException(
            status_code=400,
            detail=(
                "Remedy description is required "
                "before approval."
            ),
        )

    for rule in rules:

        if not rule.condition_type:

            raise HTTPException(
                status_code=400,
                detail=(
                    "Every safety restriction "
                    "must have a condition type."
                ),
            )

        if not rule.condition_value:

            raise HTTPException(
                status_code=400,
                detail=(
                    "Every safety restriction "
                    "must have a condition value."
                ),
            )

        if not rule.reason:

            raise HTTPException(
                status_code=400,
                detail=(
                    "Every safety restriction "
                    "must include a medical "
                    "safety reason."
                ),
            )


# ============================================================
# HOME RELIEF LIST
# ============================================================

@router.get(
    "/home-relief",
    response_model=list[
        schemas.HomeReliefOut
    ],
)
def list_home_relief(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    user: models.User = Depends(supervisor_only),
):
    query = (
        db.query(
            models.HomeReliefRemedy
        )
        .order_by(
            models.HomeReliefRemedy.created_at.desc()
        )
    )

    if status:

        query = query.filter(
            models.HomeReliefRemedy.status
            == status
        )

    remedies = query.all()

    return [
        _serialize_home_relief(
            db,
            remedy,
        )
        for remedy in remedies
    ]


# ============================================================
# CREATE HOME RELIEF
# ============================================================

@router.post(
    "/home-relief",
    response_model=schemas.HomeReliefOut,
)
def create_home_relief(
    payload: schemas.HomeReliefCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(supervisor_only),
):
    now = datetime.utcnow()

    remedy = models.HomeReliefRemedy(
        name=(payload.name or "").strip(),
        disease=(payload.disease or "").strip() or None,
        symptom=(payload.symptom or "").strip() or None,
        aliases=(payload.aliases or "").strip() or None,
        category=(payload.category or "supportive_care").strip(),
        description=(payload.description or "").strip(),
        instructions=(payload.instructions or "").strip(),
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

    safety_rules = (
        payload.safety_rules
        or []
    )

    for item in safety_rules:

        condition_type = (
            item.condition_type
            or ""
        ).strip()

        condition_value = (
            item.condition_value
            or ""
        ).strip()

        suitability = (
            item.suitability
            or "NOT_RECOMMENDED"
        ).upper().strip()

        severity = (
            item.severity
            or "MODERATE"
        ).strip()

        reason = (
            item.reason
            or ""
        ).strip()

        if not condition_type:

            raise HTTPException(
                status_code=400,
                detail=(
                    "Every safety restriction "
                    "must have a safety context."
                ),
            )

        if not condition_value:

            raise HTTPException(
                status_code=400,
                detail=(
                    "Every safety restriction "
                    "must specify the affected "
                    "context."
                ),
            )

        if suitability not in {
            "SUITABLE",
            "CAUTION",
            "NOT_RECOMMENDED",
            "CONTRAINDICATED",
        }:

            raise HTTPException(
                status_code=400,
                detail=(
                    "Invalid safety suitability: "
                    f"{suitability}"
                ),
            )

        if not reason:

            raise HTTPException(
                status_code=400,
                detail=(
                    "Every safety restriction "
                    "must include a medical "
                    "safety reason."
                ),
            )

        db.add(
            models.HomeReliefSafetyRule(
                remedy_id=remedy.id,
                condition_type=(
                    condition_type
                ),
                condition_value=(
                    condition_value
                ),
                suitability=(
                    suitability
                ),
                severity=severity,
                reason=reason,
                alternative_remedy_id=(
                    item.alternative_remedy_id
                ),
                created_by=user.id,
            )
        )

    db.add(
        models.HomeReliefAuditLog(
            remedy_id=remedy.id,
            action="CREATED",
            performed_by=user.id,
            old_value=None,
            new_value=payload.model_dump_json(),
        )
    )

    db.commit()

    db.refresh(remedy)

    return _serialize_home_relief(
        db,
        remedy,
    )


# ============================================================
# APPROVE HOME RELIEF
# ============================================================

@router.post(
    "/home-relief/{remedy_id}/approve",
    response_model=schemas.HomeReliefOut,
)
def approve_home_relief(
    remedy_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(supervisor_only),
):
    remedy = (
        db.query(
            models.HomeReliefRemedy
        )
        .filter(
            models.HomeReliefRemedy.id
            == remedy_id
        )
        .first()
    )

    if not remedy:

        raise HTTPException(
            status_code=404,
            detail=(
                "Home relief remedy "
                "not found."
            ),
        )

    if remedy.status not in {
        "PENDING",
        "REJECTED",
    }:

        raise HTTPException(
            status_code=400,
            detail=(
                "Only pending or previously "
                "rejected remedies can be "
                "approved."
            ),
        )

    rules = _get_home_relief_rules(
        db,
        remedy.id,
    )

    _validate_home_relief_for_approval(
        remedy,
        rules,
    )

    now = datetime.utcnow()

    previous_status = (
        remedy.status
    )

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
        )
    )

    db.commit()

    db.refresh(remedy)

    return _serialize_home_relief(
        db,
        remedy,
    )


# ============================================================
# REJECT HOME RELIEF
# ============================================================

@router.post(
    "/home-relief/{remedy_id}/reject",
    response_model=schemas.HomeReliefOut,
)
def reject_home_relief(
    remedy_id: int,
    payload: schemas.HomeReliefReject,
    db: Session = Depends(get_db),
    user: models.User = Depends(supervisor_only),
):
    remedy = (
        db.query(
            models.HomeReliefRemedy
        )
        .filter(
            models.HomeReliefRemedy.id
            == remedy_id
        )
        .first()
    )

    if not remedy:

        raise HTTPException(
            status_code=404,
            detail=(
                "Home relief remedy "
                "not found."
            ),
        )

    if remedy.status == "ACTIVE":

        raise HTTPException(
            status_code=400,
            detail=(
                "Active remedies must be "
                "deactivated instead of "
                "rejected."
            ),
        )

    reason = (
        payload.reason
        or ""
    ).strip()

    if not reason:

        raise HTTPException(
            status_code=400,
            detail=(
                "A rejection reason "
                "is required."
            ),
        )

    previous_status = (
        remedy.status
    )

    now = datetime.utcnow()

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
        )
    )

    db.commit()

    db.refresh(remedy)

    return _serialize_home_relief(
        db,
        remedy,
    )


# ============================================================
# DEACTIVATE HOME RELIEF
# ============================================================

@router.post(
    "/home-relief/{remedy_id}/deactivate",
    response_model=schemas.HomeReliefOut,
)
def deactivate_home_relief(
    remedy_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(supervisor_only),
):
    remedy = (
        db.query(
            models.HomeReliefRemedy
        )
        .filter(
            models.HomeReliefRemedy.id
            == remedy_id
        )
        .first()
    )

    if not remedy:

        raise HTTPException(
            status_code=404,
            detail=(
                "Home relief remedy "
                "not found."
            ),
        )

    if remedy.status != "ACTIVE":

        raise HTTPException(
            status_code=400,
            detail=(
                "Only active remedies "
                "can be deactivated."
            ),
        )

    previous_status = (
        remedy.status
    )

    now = datetime.utcnow()

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
        )
    )

    db.commit()

    db.refresh(remedy)

    return _serialize_home_relief(
        db,
        remedy,
    )


# ============================================================
# UPDATE HOME RELIEF
# ============================================================

@router.patch(
    "/home-relief/{remedy_id}",
    response_model=schemas.HomeReliefOut,
)
def update_home_relief(
    remedy_id: int,
    payload: schemas.HomeReliefUpdate,
    db: Session = Depends(get_db),
    user: models.User = Depends(supervisor_only),
):
    remedy = (
        db.query(
            models.HomeReliefRemedy
        )
        .filter(
            models.HomeReliefRemedy.id
            == remedy_id
        )
        .first()
    )

    if not remedy:

        raise HTTPException(
            status_code=404,
            detail=(
                "Home relief remedy "
                "not found."
            ),
        )

    # --------------------------------------------------------
    # Capture old state
    # --------------------------------------------------------

    before = (
        _serialize_home_relief(
            db,
            remedy,
        )
        .model_dump_json()
    )

    # --------------------------------------------------------
    # Update normal fields
    # --------------------------------------------------------

    data = payload.model_dump(
        exclude_unset=True,
        exclude={
            "safety_rules"
        },
    )

    for key, value in data.items():

        if value is None:
            continue

        if isinstance(value, str):

            value = value.strip()

        setattr(
            remedy,
            key,
            value,
        )

    # --------------------------------------------------------
    # Update safety rules
    # --------------------------------------------------------

    if payload.safety_rules is not None:

        (
            db.query(
                models.HomeReliefSafetyRule
            )
            .filter(
                models.HomeReliefSafetyRule.remedy_id
                == remedy.id
            )
            .delete(
                synchronize_session=False
            )
        )

        for item in payload.safety_rules:

            condition_type = (
                item.condition_type
                or ""
            ).strip()

            condition_value = (
                item.condition_value
                or ""
            ).strip()

            suitability = (
                item.suitability
                or "NOT_RECOMMENDED"
            ).upper().strip()

            severity = (
                item.severity
                or "MODERATE"
            ).strip()

            reason = (
                item.reason
                or ""
            ).strip()

            if not condition_type:

                raise HTTPException(
                    status_code=400,
                    detail=(
                        "Every safety restriction "
                        "must have a safety context."
                    ),
                )

            if not condition_value:

                raise HTTPException(
                    status_code=400,
                    detail=(
                        "Every safety restriction "
                        "must specify the affected "
                        "context."
                    ),
                )

            if suitability not in {
                "SUITABLE",
                "CAUTION",
                "NOT_RECOMMENDED",
                "CONTRAINDICATED",
            }:

                raise HTTPException(
                    status_code=400,
                    detail=(
                        "Invalid safety suitability: "
                        f"{suitability}"
                    ),
                )

            if not reason:

                raise HTTPException(
                    status_code=400,
                    detail=(
                        "Every safety restriction "
                        "must include a medical "
                        "safety reason."
                    ),
                )

            db.add(
                models.HomeReliefSafetyRule(
                    remedy_id=remedy.id,
                    condition_type=(
                        condition_type
                    ),
                    condition_value=(
                        condition_value
                    ),
                    suitability=(
                        suitability
                    ),
                    severity=severity,
                    reason=reason,
                    alternative_remedy_id=(
                        item.alternative_remedy_id
                    ),
                    created_by=user.id,
                )
            )

        # ----------------------------------------------------
        # Any safety change invalidates previous approval.
        # ----------------------------------------------------

        if remedy.status == "ACTIVE":

            remedy.status = "PENDING"

            remedy.approved_by = None

            remedy.approved_at = None

    # --------------------------------------------------------
    # Any substantive edit requires another review.
    # --------------------------------------------------------

    remedy.last_reviewed_at = (
        datetime.utcnow()
    )

    remedy.updated_at = (
        datetime.utcnow()
    )

    db.add(
        models.HomeReliefAuditLog(
            remedy_id=remedy.id,
            action="EDITED",
            performed_by=user.id,
            old_value=before,
            new_value=payload.model_dump_json(),
        )
    )

    db.commit()

    db.refresh(remedy)

    return _serialize_home_relief(
        db,
        remedy,
    )