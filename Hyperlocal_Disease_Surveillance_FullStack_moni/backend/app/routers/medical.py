from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from .. import models, schemas, auth
from ..database import get_db


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
    db: Session = Depends(get_db),
    user: models.User = Depends(supervisor_only),
):
    current_week = datetime.utcnow().isocalendar().week

    total_agents = (
        db.query(models.Agent)
        .count()
    )

    active_agents = (
        db.query(models.Agent)
        .join(
            models.User,
            models.Agent.user_id == models.User.id,
        )
        .filter(
            models.User.is_active.is_(True)
        )
        .count()
    )

    total_taluks = (
        db.query(models.Taluk)
        .count()
    )

    total_reports = (
        db.query(models.DiseaseReport)
        .count()
    )

    reports_this_week = (
        db.query(models.DiseaseReport)
        .filter(
            models.DiseaseReport.week_number
            == current_week
        )
        .count()
    )

    submitted_agents = (
        db.query(models.DiseaseReport.agent_id)
        .filter(
            models.DiseaseReport.week_number
            == current_week
        )
        .distinct()
        .count()
    )

    pending_emerging = (
        db.query(models.EmergingDiseaseReport)
        .filter(
            models.EmergingDiseaseReport.status
            == "PENDING"
        )
        .count()
    )

    pending_agent_issues = (
        db.query(models.AgentIssueReport)
        .filter(
            models.AgentIssueReport.status
            == "PENDING_ADMIN_REVIEW"
        )
        .count()
    )

    disease_count = (
        db.query(models.Disease)
        .filter(
            models.Disease.is_active.is_(True)
        )
        .count()
    )

    pending_home_reliefs = (
        db.query(models.HomeReliefRemedy)
        .filter(
            models.HomeReliefRemedy.status
            == "PENDING"
        )
        .count()
    )

    return {
        "current_week": current_week,
        "total_agents": total_agents,
        "active_agents": active_agents,
        "total_taluks": total_taluks,
        "total_reports": total_reports,
        "reports_this_week": reports_this_week,
        "submitted_agents_this_week": submitted_agents,
        "pending_agent_submissions": max(
            0,
            total_agents - submitted_agents,
        ),
        "pending_emerging_reviews": pending_emerging,
        "pending_agent_issue_reports": pending_agent_issues,
        "diseases_tracked": disease_count,
        "pending_home_reliefs": pending_home_reliefs,
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
        db.query(models.DiseaseReport)
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
            "id": r.id,
            "agent_id": r.agent_id,
            "agent_name": (
                r.agent.user.full_name
                if r.agent and r.agent.user
                else "Unknown Agent"
            ),
            "taluk_id": r.taluk_id,
            "taluk_name": (
                r.taluk.name
                if r.taluk
                else "Unknown Taluk"
            ),
            "district_id": (
                r.taluk.district_id
                if r.taluk
                else None
            ),
            "district_name": (
                r.taluk.district.name
                if r.taluk and r.taluk.district
                else "Unknown District"
            ),
            "disease": r.disease,
            "cases": r.cases or 0,
            "severity": r.severity,
            "remarks": r.remarks,
            "preventive_measures": r.preventive_measures,
            "week_number": r.week_number,
            "year": r.year,
            "created_at": r.created_at,
            "updated_at": r.updated_at,
        }
        for r in reports
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
        or datetime.utcnow().isocalendar().week
    )

    agents = (
        db.query(models.Agent)
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
            db.query(models.DiseaseReport.id)
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
                "agent_name": agent.user.full_name,
                "username": agent.user.username,
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

    taluk_totals = (
        db.query(
            models.DiseaseReport.taluk_id,
            func.coalesce(
                func.sum(
                    models.DiseaseReport.cases
                ),
                0,
            ),
        )
        .group_by(
            models.DiseaseReport.taluk_id
        )
        .order_by(
            func.sum(
                models.DiseaseReport.cases
            ).desc()
        )
        .all()
    )

    taluk_lookup = {
        t.id: t
        for t in db.query(
            models.Taluk
        ).all()
    }

    return {
        "weekly": weekly,

        "disease_totals": [
            {
                "disease": name,
                "cases": int(
                    cases or 0
                ),
            }
            for name, cases in disease_totals
        ],

        "taluk_totals": [
            {
                "taluk_id": taluk_id,
                "taluk_name": (
                    taluk_lookup[taluk_id].name
                    if taluk_id in taluk_lookup
                    else "Unknown Taluk"
                ),
                "cases": int(
                    cases or 0
                ),
            }
            for taluk_id, cases in taluk_totals
        ],
    }


# ============================================================
# RISK MAP
# ============================================================

@router.get("/risk-map")
def medical_risk_map(
    disease: Optional[str] = None,
    db: Session = Depends(get_db),
    user: models.User = Depends(supervisor_only),
):
    latest_week = (
        db.query(
            func.max(
                models.Prediction.week_number
            )
        )
        .scalar()
    )

    if latest_week is None:
        return []

    query = (
        db.query(models.Prediction)
        .filter(
            models.Prediction.week_number
            == latest_week
        )
    )

    if disease:
        query = query.filter(
            models.Prediction.disease
            == disease
        )

    predictions = (
        query
        .order_by(
            models.Prediction.predicted_cases.desc()
        )
        .all()
    )

    taluks = {
        t.id: t
        for t in db.query(
            models.Taluk
        ).all()
    }

    return [
        {
            "taluk_id": p.taluk_id,
            "taluk_name": (
                taluks[p.taluk_id].name
                if p.taluk_id in taluks
                else "Unknown Taluk"
            ),
            "district_name": (
                taluks[p.taluk_id].district.name
                if p.taluk_id in taluks
                and taluks[p.taluk_id].district
                else "Unknown District"
            ),
            "disease": p.disease,
            "current_cases": p.current_cases or 0,
            "predicted_cases": p.predicted_cases or 0,
            "risk_level": p.risk_level,
            "trend": p.trend,
            "confidence": p.confidence,
            "week_number": p.week_number,
            "year": p.year,
        }
        for p in predictions
    ]


# ============================================================
# EMERGING DISEASE
# ============================================================

@router.get(
    "/emerging",
    response_model=list[
        schemas.EmergingDiseaseOut
    ],
)
def pending_emerging(
    db: Session = Depends(get_db),
    user: models.User = Depends(supervisor_only),
):
    reports = (
        db.query(
            models.EmergingDiseaseReport
        )
        .order_by(
            models.EmergingDiseaseReport.created_at.desc()
        )
        .all()
    )

    return [
        _serialize_emerging(r)
        for r in reports
    ]


@router.get(
    "/diseases",
    response_model=list[
        schemas.DiseaseRegistryOut
    ],
)
def disease_registry(
    db: Session = Depends(get_db),
    user: models.User = Depends(supervisor_only),
):
    return (
        db.query(models.Disease)
        .filter(
            models.Disease.is_active.is_(True)
        )
        .order_by(
            models.Disease.name.asc()
        )
        .all()
    )


@router.post(
    "/emerging/{report_id}/review",
    response_model=schemas.EmergingDiseaseOut,
)
def review_emerging_disease(
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
            detail="Emerging disease report not found.",
        )

    if report.status != "PENDING":
        raise HTTPException(
            status_code=400,
            detail="This report has already been reviewed.",
        )

    decision = (
        payload.decision
        .upper()
        .strip()
    )

    if decision not in {
        "VERIFY_EXISTING",
        "VERIFY_NEW",
        "REJECT",
    }:
        raise HTTPException(
            status_code=400,
            detail="Invalid review decision.",
        )

    # --------------------------------------------------------
    # REJECT
    # --------------------------------------------------------

    if decision == "REJECT":

        report.status = "REJECTED"

    # --------------------------------------------------------
    # VERIFY
    # --------------------------------------------------------

    else:

        if decision == "VERIFY_EXISTING":

            if not payload.mapped_disease_id:
                raise HTTPException(
                    status_code=400,
                    detail="Select an existing disease.",
                )

            disease = (
                db.query(models.Disease)
                .filter(
                    models.Disease.id
                    == payload.mapped_disease_id,
                    models.Disease.is_active.is_(True),
                )
                .first()
            )

            if not disease:
                raise HTTPException(
                    status_code=404,
                    detail="Disease not found in official registry.",
                )

        else:

            name = (
                payload.new_disease_name
                or ""
            ).strip()

            if len(name) < 2:
                raise HTTPException(
                    status_code=400,
                    detail="New disease name is required.",
                )

            disease = (
                db.query(models.Disease)
                .filter(
                    models.Disease.name.ilike(
                        name
                    )
                )
                .first()
            )

            if disease:
                raise HTTPException(
                    status_code=409,
                    detail=(
                        "A disease with this name "
                        "already exists. Map the report "
                        "to the existing disease."
                    ),
                )

            disease = models.Disease(
                name=name,
                description=(
                    payload.new_disease_description
                ),
                verification_status="VERIFIED",
                is_active=True,
                created_by_user_id=user.id,
                verified_by_user_id=user.id,
                verified_at=datetime.utcnow(),
            )

            db.add(disease)
            db.flush()

        report.mapped_disease_id = disease.id
        report.status = "VERIFIED"

        current = datetime.utcnow()

        existing = (
            db.query(models.DiseaseReport)
            .filter(
                models.DiseaseReport.agent_id
                == report.agent_id,
                models.DiseaseReport.taluk_id
                == report.taluk_id,
                models.DiseaseReport.disease
                == disease.name,
                models.DiseaseReport.week_number
                == current.isocalendar().week,
                models.DiseaseReport.year
                == current.year,
            )
            .first()
        )

        if existing:

            existing.cases = (
                (existing.cases or 0)
                + (report.suspected_cases or 0)
            )

            existing.updated_at = current

        else:

            db.add(
                models.DiseaseReport(
                    agent_id=report.agent_id,
                    taluk_id=report.taluk_id,
                    disease=disease.name,
                    cases=(
                        report.suspected_cases
                        or 0
                    ),
                    severity="Moderate",
                    remarks=(
                        "Verified through Medical "
                        "Supervisor emerging-disease review."
                    ),
                    preventive_measures=(
                        "Follow official local health guidance."
                    ),
                    week_number=current.isocalendar().week,
                    year=current.year,
                )
            )

    report.reviewed_by_user_id = user.id
    report.review_notes = payload.review_notes
    report.reviewed_at = datetime.utcnow()

    db.commit()
    db.refresh(report)

    return _serialize_emerging(report)


# ============================================================
# AGENTS
# ============================================================

@router.get(
    "/agents",
    response_model=list[schemas.AgentOut],
)
def list_agents_for_supervisor(
    db: Session = Depends(get_db),
    user: models.User = Depends(supervisor_only),
):
    agents = (
        db.query(models.Agent)
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
        schemas.AgentOut(
            id=a.id,
            username=a.user.username,
            full_name=a.user.full_name,
            taluk_id=a.taluk_id,
            taluk_name=(
                a.taluk.name
                if a.taluk
                else None
            ),
            is_active=bool(
                a.user.is_active
            ),
        )
        for a in agents
    ]


# ============================================================
# AGENT ISSUES
# ============================================================

@router.get("/agent-issues")
def supervisor_agent_issues(
    db: Session = Depends(get_db),
    user: models.User = Depends(supervisor_only),
):
    issues = (
        db.query(
            models.AgentIssueReport
        )
        .filter(
            models.AgentIssueReport.supervisor_id
            == user.id
        )
        .order_by(
            models.AgentIssueReport.created_at.desc()
        )
        .all()
    )

    return [
        {
            "id": i.id,
            "agent_id": i.agent_id,
            "agent_name": (
                i.agent.user.full_name
                if i.agent
                and i.agent.user
                else "Unknown Agent"
            ),
            "issue_type": i.issue_type,
            "severity": i.severity,
            "description": i.description,
            "evidence": i.evidence,
            "status": i.status,
            "admin_notes": i.admin_notes,
            "created_at": i.created_at,
            "reviewed_at": i.reviewed_at,
        }
        for i in issues
    ]


@router.post(
    "/agent-issues",
    response_model=schemas.AgentIssueOut,
)
def report_agent_issue(
    payload: schemas.AgentIssueCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(supervisor_only),
):
    agent = (
        db.query(models.Agent)
        .filter(
            models.Agent.id
            == payload.agent_id
        )
        .first()
    )

    if not agent:
        raise HTTPException(
            status_code=404,
            detail="Agent not found.",
        )

    issue = models.AgentIssueReport(
        agent_id=payload.agent_id,
        supervisor_id=user.id,
        issue_type=payload.issue_type,
        severity=payload.severity,
        description=payload.description,
        evidence=payload.evidence,
    )

    db.add(issue)
    db.commit()
    db.refresh(issue)

    return schemas.AgentIssueOut(
        id=issue.id,
        agent_id=issue.agent_id,
        agent_name=(
            agent.user.full_name
            if agent.user
            else "Unknown Agent"
        ),
        supervisor_id=issue.supervisor_id,
        issue_type=issue.issue_type,
        severity=issue.severity,
        description=issue.description,
        evidence=issue.evidence,
        status=issue.status,
        admin_notes=issue.admin_notes,
        created_at=issue.created_at,
        reviewed_at=issue.reviewed_at,
    )


# ============================================================
# HOME RELIEF & SUPPORTIVE CARE
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
        disease=remedy.disease,
        symptom=remedy.symptom,
        aliases=remedy.aliases,
        category=remedy.category,

        description=remedy.description,
        instructions=remedy.instructions,

        expected_benefit=remedy.expected_benefit,
        medical_rationale=remedy.medical_rationale,

        possible_side_effects=(
            remedy.possible_side_effects
        ),
        general_safety_notes=(
            remedy.general_safety_notes
        ),

        red_flags=remedy.red_flags,
        when_to_seek_care=(
            remedy.when_to_seek_care
        ),

        status=remedy.status,

        created_by=remedy.created_by,
        approved_by=remedy.approved_by,

        created_at=remedy.created_at,
        approved_at=remedy.approved_at,
        last_reviewed_at=(
            remedy.last_reviewed_at
        ),
        updated_at=remedy.updated_at,

        safety_rules=[
            schemas.HomeReliefSafetyRuleOut
            .model_validate(rule)
            for rule in rules
        ],
    )


# ============================================================
# HOME RELIEF VALIDATION
# ============================================================

def _validate_home_relief_for_approval(
    remedy,
    rules,
):
    """
    A remedy can only become ACTIVE when the
    Medical Supervisor has supplied complete
    safety information.
    """

    required_fields = {
        "description": remedy.description,
        "instructions": remedy.instructions,
        "general_safety_notes": (
            remedy.general_safety_notes
        ),
        "when_to_seek_care": (
            remedy.when_to_seek_care
        ),
        "possible_side_effects": (
            remedy.possible_side_effects
        ),
    }

    missing = [
        field_name
        for field_name, value
        in required_fields.items()
        if not value
        or not str(value).strip()
    ]

    if missing:
        raise HTTPException(
            status_code=400,
            detail=(
                "Complete medical safety information "
                "before approval: "
                + ", ".join(missing)
            ),
        )

    # --------------------------------------------------------
    # Validate every safety rule
    # --------------------------------------------------------

    for index, rule in enumerate(rules, start=1):

        condition_type = (
            rule.condition_type
            or ""
        ).strip()

        condition_value = (
            rule.condition_value
            or ""
        ).strip()

        suitability = (
            rule.suitability
            or ""
        ).upper().strip()

        severity = (
            rule.severity
            or ""
        ).strip()

        reason = (
            rule.reason
            or ""
        ).strip()

        if not condition_type:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Safety restriction #{index} "
                    "must specify a safety context."
                ),
            )

        if not condition_value:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Safety restriction #{index} "
                    "must specify who or what the "
                    "restriction applies to."
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
                    f"Safety restriction #{index} "
                    "must have a valid suitability status."
                ),
            )

        if not severity:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Safety restriction #{index} "
                    "must specify severity."
                ),
            )

        if not reason:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Safety restriction #{index} "
                    "must include a medical safety reason."
                ),
            )

        # ----------------------------------------------------
        # Alternative validation
        # ----------------------------------------------------

        if rule.alternative_remedy_id:

            if (
                rule.alternative_remedy_id
                == remedy.id
            ):
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"Safety restriction #{index} "
                        "cannot reference itself as an alternative."
                    ),
                )

            alternative = (
                db.query(
                    models.HomeReliefRemedy
                )
                .filter(
                    models.HomeReliefRemedy.id
                    == rule.alternative_remedy_id,
                    models.HomeReliefRemedy.status
                    == "ACTIVE",
                )
                .first()
            )

            if not alternative:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"Safety restriction #{index} "
                        "references an unavailable alternative remedy."
                    ),
                )


# ============================================================
# LIST ALL HOME RELIEFS
# ============================================================

@router.get(
    "/home-relief",
    response_model=list[
        schemas.HomeReliefOut
    ],
)
def list_home_reliefs(
    db: Session = Depends(get_db),
    user: models.User = Depends(supervisor_only),
):
    remedies = (
        db.query(
            models.HomeReliefRemedy
        )
        .order_by(
            models.HomeReliefRemedy.updated_at.desc()
        )
        .all()
    )

    return [
        _serialize_home_relief(
            db,
            remedy,
        )
        for remedy in remedies
    ]


# ============================================================
# LIST PENDING HOME RELIEFS
# ============================================================

@router.get(
    "/home-relief/pending",
    response_model=list[
        schemas.HomeReliefOut
    ],
)
def pending_home_reliefs(
    db: Session = Depends(get_db),
    user: models.User = Depends(supervisor_only),
):
    remedies = (
        db.query(
            models.HomeReliefRemedy
        )
        .filter(
            models.HomeReliefRemedy.status
            == "PENDING"
        )
        .order_by(
            models.HomeReliefRemedy.created_at.desc()
        )
        .all()
    )

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
    name = (
        payload.name
        or ""
    ).strip()

    if not name:
        raise HTTPException(
            status_code=400,
            detail="Remedy name is required.",
        )

    description = (
        payload.description
        or ""
    ).strip()

    instructions = (
        payload.instructions
        or ""
    ).strip()

    if not description:
        raise HTTPException(
            status_code=400,
            detail="Description is required.",
        )

    if not instructions:
        raise HTTPException(
            status_code=400,
            detail="Instructions are required.",
        )

    # --------------------------------------------------------
    # Create remedy
    # --------------------------------------------------------

    remedy = models.HomeReliefRemedy(
        name=name,

        disease=payload.disease,
        symptom=payload.symptom,
        aliases=payload.aliases,
        category=payload.category,

        description=description,
        instructions=instructions,

        expected_benefit=(
            payload.expected_benefit
        ),
        medical_rationale=(
            payload.medical_rationale
        ),

        possible_side_effects=(
            payload.possible_side_effects
        ),
        general_safety_notes=(
            payload.general_safety_notes
        ),

        red_flags=payload.red_flags,
        when_to_seek_care=(
            payload.when_to_seek_care
        ),

        status="PENDING",

        created_by=user.id,
    )

    db.add(remedy)
    db.flush()

    # --------------------------------------------------------
    # Create safety rules
    # --------------------------------------------------------

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
                    "must specify the affected context."
                ),
            )

        if not reason:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Every safety restriction "
                    "must include a safety reason."
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

        db.add(
            models.HomeReliefSafetyRule(
                remedy_id=remedy.id,

                condition_type=condition_type,
                condition_value=condition_value,

                suitability=suitability,
                severity=severity,

                reason=reason,

                alternative_remedy_id=(
                    item.alternative_remedy_id
                ),

                created_by=user.id,
            )
        )

    # --------------------------------------------------------
    # Audit
    # --------------------------------------------------------

    db.add(
        models.HomeReliefAuditLog(
            remedy_id=remedy.id,
            action="CREATED",
            performed_by=user.id,
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
            detail="Home relief remedy not found.",
        )

    if remedy.status not in {
        "PENDING",
        "REJECTED",
    }:
        raise HTTPException(
            status_code=400,
            detail=(
                "Only pending or previously rejected "
                "remedies can be approved."
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
            detail="Home relief remedy not found.",
        )

    if remedy.status == "ACTIVE":
        raise HTTPException(
            status_code=400,
            detail=(
                "Active remedies must be deactivated "
                "instead of rejected."
            ),
        )

    reason = (
        payload.reason
        or ""
    ).strip()

    if not reason:
        raise HTTPException(
            status_code=400,
            detail="A rejection reason is required.",
        )

    previous_status = remedy.status
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
            detail="Home relief remedy not found.",
        )

    if remedy.status != "ACTIVE":
        raise HTTPException(
            status_code=400,
            detail=(
                "Only active remedies can be deactivated."
            ),
        )

    previous_status = remedy.status
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
            detail="Home relief remedy not found.",
        )

    # --------------------------------------------------------
    # Capture old state for audit
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
                        "must specify the affected context."
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
                        "must include a medical safety reason."
                    ),
                )

            db.add(
                models.HomeReliefSafetyRule(
                    remedy_id=remedy.id,

                    condition_type=condition_type,
                    condition_value=condition_value,

                    suitability=suitability,
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

    remedy.last_reviewed_at = datetime.utcnow()
    remedy.updated_at = datetime.utcnow()

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