from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional

from .. import models, schemas, auth
from ..database import get_db
from ..utils import current_week_number
from ..ml.predict import predict_next_value, classify_risk
from ..models import DISEASES


router = APIRouter(
    prefix="/admin",
    tags=["admin"],
)

admin_only = auth.require_role("admin")


# ============================================================
# ACTIVITY LOGGER
# ============================================================

def create_activity_log(
    db: Session,
    user: models.User,
    action: str,
    details: Optional[str] = None,
):
    log = models.ActivityLog(
        user_id=user.id if user else None,
        action=action,
        details=details,
    )

    db.add(log)


# ============================================================
# STATS
# ============================================================

@router.get(
    "/stats",
    response_model=schemas.AdminStatsOut,
)
def get_stats(
    db: Session = Depends(get_db),
    user: models.User = Depends(admin_only),
):
    week = current_week_number()

    total_agents = (
        db.query(models.Agent)
        .count()
    )

    total_taluks = (
        db.query(models.Taluk)
        .count()
    )

    reported_taluks_this_week = (
        db.query(models.DiseaseReport.taluk_id)
        .filter(
            models.DiseaseReport.week_number == week
        )
        .distinct()
        .count()
    )

    last_pred = (
        db.query(
            func.max(
                models.Prediction.created_at
            )
        )
        .scalar()
    )

    return schemas.AdminStatsOut(
        total_agents=total_agents,
        reports_received_this_week=reported_taluks_this_week,
        pending_reports_this_week=max(
            0,
            total_taluks - reported_taluks_this_week,
        ),
        total_taluks=total_taluks,
        last_prediction_run=last_pred,
        diseases_tracked=len(DISEASES),
    )


# ============================================================
# AGENT MANAGEMENT
# ============================================================

@router.get(
    "/agents",
    response_model=List[schemas.AgentOut],
)
def list_agents(
    db: Session = Depends(get_db),
    user: models.User = Depends(admin_only),
):
    agents = (
        db.query(models.Agent)
        .all()
    )

    return [
        schemas.AgentOut(
            id=a.id,
            username=a.user.username,
            full_name=a.user.full_name,
            taluk_id=a.taluk_id,
            taluk_name=a.taluk.name,
            is_active=bool(a.user.is_active),
        )
        for a in agents
    ]


# ============================================================
# CREATE AGENT
# ============================================================

@router.post(
    "/agents",
    response_model=schemas.AgentOut,
)
def create_agent(
    payload: schemas.AgentCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(admin_only),
):
    existing_user = (
        db.query(models.User)
        .filter(
            models.User.username == payload.username
        )
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Username already taken",
        )

    taluk = (
        db.query(models.Taluk)
        .filter(
            models.Taluk.id == payload.taluk_id
        )
        .first()
    )

    if not taluk:
        raise HTTPException(
            status_code=404,
            detail="Taluk not found",
        )

    existing_agent = (
        db.query(models.Agent)
        .filter(
            models.Agent.taluk_id == payload.taluk_id
        )
        .first()
    )

    if existing_agent:
        raise HTTPException(
            status_code=400,
            detail="This taluk already has an assigned agent",
        )

    # --------------------------------------------------------
    # IMPORTANT:
    # User model uses password_hash
    # --------------------------------------------------------

    new_user = models.User(
        username=payload.username,
        password_hash=auth.get_password_hash(
            payload.password
        ),
        full_name=payload.full_name,
        role="agent",
        is_active=True,
    )

    db.add(new_user)
    db.flush()

    new_agent = models.Agent(
        user_id=new_user.id,
        taluk_id=payload.taluk_id,
    )

    db.add(new_agent)

    create_activity_log(
        db,
        user,
        "CREATE_AGENT",
        (
            f"Created agent '{new_user.username}' "
            f"for taluk '{taluk.name}'."
        ),
    )

    db.commit()
    db.refresh(new_agent)

    return schemas.AgentOut(
        id=new_agent.id,
        username=new_user.username,
        full_name=new_user.full_name,
        taluk_id=taluk.id,
        taluk_name=taluk.name,
        is_active=bool(new_user.is_active),
    )


# ============================================================
# UPDATE AGENT
# ============================================================

@router.put(
    "/agents/{agent_id}",
    response_model=schemas.AgentOut,
)
def update_agent(
    agent_id: int,
    payload: schemas.AgentUpdate,
    db: Session = Depends(get_db),
    user: models.User = Depends(admin_only),
):
    agent = (
        db.query(models.Agent)
        .filter(
            models.Agent.id == agent_id
        )
        .first()
    )

    if not agent:
        raise HTTPException(
            status_code=404,
            detail="Agent not found",
        )

    changes = []

    # --------------------------------------------------------
    # FULL NAME
    # --------------------------------------------------------

    if (
        payload.full_name is not None
        and payload.full_name.strip()
    ):
        new_full_name = payload.full_name.strip()

        if new_full_name != agent.user.full_name:
            agent.user.full_name = new_full_name
            changes.append("full name")


    # --------------------------------------------------------
    # USERNAME
    # --------------------------------------------------------

    if (
        payload.username is not None
        and payload.username.strip()
    ):
        new_username = payload.username.strip()

        if new_username != agent.user.username:

            existing_user = (
                db.query(models.User)
                .filter(
                    models.User.username == new_username,
                    models.User.id != agent.user.id,
                )
                .first()
            )

            if existing_user:
                raise HTTPException(
                    status_code=400,
                    detail="Username already taken",
                )

            agent.user.username = new_username
            changes.append("username")


    # --------------------------------------------------------
    # PASSWORD
    # --------------------------------------------------------
    #
    # IMPORTANT:
    #
    # The User model has:
    #
    #     password_hash
    #
    # NOT:
    #
    #     hashed_password
    #
    # Therefore the new password MUST be stored in
    # agent.user.password_hash.
    # --------------------------------------------------------

    if (
        payload.password is not None
        and payload.password.strip()
    ):
        new_password = payload.password.strip()

        if len(new_password) < 6:
            raise HTTPException(
                status_code=400,
                detail="Password must contain at least 6 characters",
            )

        agent.user.password_hash = (
            auth.get_password_hash(
                new_password
            )
        )

        changes.append("password")


    # --------------------------------------------------------
    # TALUK
    # --------------------------------------------------------

    if (
        payload.taluk_id is not None
        and payload.taluk_id != agent.taluk_id
    ):

        target_taluk = (
            db.query(models.Taluk)
            .filter(
                models.Taluk.id == payload.taluk_id
            )
            .first()
        )

        if not target_taluk:
            raise HTTPException(
                status_code=404,
                detail="Target taluk not found",
            )

        clash = (
            db.query(models.Agent)
            .filter(
                models.Agent.taluk_id == payload.taluk_id,
                models.Agent.id != agent_id,
            )
            .first()
        )

        if clash:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Target taluk already has "
                    "an assigned agent"
                ),
            )

        agent.taluk_id = payload.taluk_id

        changes.append(
            f"taluk changed to '{target_taluk.name}'"
        )


    # --------------------------------------------------------
    # ACTIVITY LOG
    # --------------------------------------------------------

    create_activity_log(
        db,
        user,
        "UPDATE_AGENT",
        (
            f"Updated agent '{agent.user.username}'. "
            f"Changes: "
            f"{', '.join(changes) if changes else 'none'}."
        ),
    )

    db.commit()
    db.refresh(agent)

    return schemas.AgentOut(
        id=agent.id,
        username=agent.user.username,
        full_name=agent.user.full_name,
        taluk_id=agent.taluk_id,
        taluk_name=agent.taluk.name,
        is_active=bool(agent.user.is_active),
    )


# ============================================================
# ACTIVATE / DEACTIVATE AGENT
# ============================================================

@router.patch(
    "/agents/{agent_id}/status",
)
def update_agent_status(
    agent_id: int,
    is_active: bool,
    db: Session = Depends(get_db),
    user: models.User = Depends(admin_only),
):
    agent = (
        db.query(models.Agent)
        .filter(
            models.Agent.id == agent_id
        )
        .first()
    )

    if not agent:
        raise HTTPException(
            status_code=404,
            detail="Agent not found",
        )

    current_status = bool(
        agent.user.is_active
    )

    if current_status == is_active:

        status_text = (
            "active"
            if is_active
            else "inactive"
        )

        raise HTTPException(
            status_code=400,
            detail=(
                f"Agent '{agent.user.username}' "
                f"is already {status_text}."
            ),
        )

    agent.user.is_active = (
        True if is_active else False
    )

    action = (
        "ACTIVATE_AGENT"
        if is_active
        else "DEACTIVATE_AGENT"
    )

    state_label = (
        "activated"
        if is_active
        else "deactivated"
    )

    create_activity_log(
        db,
        user,
        action,
        (
            f"Agent '{agent.user.username}' "
            f"was {state_label} by admin "
            f"'{user.username}'."
        ),
    )

    db.commit()
    db.refresh(agent.user)

    return {
        "detail": f"Agent {state_label}",
        "is_active": bool(
            agent.user.is_active
        ),
    }


# ============================================================
# DELETE AGENT
# ============================================================

@router.delete(
    "/agents/{agent_id}"
)
def delete_agent(
    agent_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(admin_only),
):
    agent = (
        db.query(models.Agent)
        .filter(
            models.Agent.id == agent_id
        )
        .first()
    )

    if not agent:
        raise HTTPException(
            status_code=404,
            detail="Agent not found",
        )

    username = agent.user.username

    report_count = (
        db.query(models.DiseaseReport)
        .filter(
            models.DiseaseReport.agent_id == agent.id
        )
        .count()
    )

    if report_count > 0:
        raise HTTPException(
            status_code=409,
            detail=(
                f"Agent '{username}' has "
                f"{report_count} historical disease report(s). "
                "Deactivate the agent instead of deleting it "
                "so surveillance history is preserved."
            ),
        )

    linked_user = agent.user

    create_activity_log(
        db,
        user,
        "DELETE_AGENT",
        (
            f"Deleted agent '{username}' "
            f"by admin '{user.username}'."
        ),
    )

    db.delete(agent)
    db.delete(linked_user)

    db.commit()

    return {
        "detail": "Agent deleted"
    }


# ============================================================
# WEEKLY MONITORING
# ============================================================

@router.get(
    "/monitoring",
    response_model=List[schemas.MonitoringRow],
)
def weekly_monitoring(
    db: Session = Depends(get_db),
    user: models.User = Depends(admin_only),
):
    week = current_week_number()

    agents = (
        db.query(models.Agent)
        .all()
    )

    rows = []

    for agent in agents:

        submitted = (
            db.query(models.DiseaseReport)
            .filter(
                models.DiseaseReport.agent_id == agent.id,
                models.DiseaseReport.week_number == week,
            )
            .first()
            is not None
        )

        rows.append(
            schemas.MonitoringRow(
                taluk_id=agent.taluk_id,
                taluk_name=agent.taluk.name,
                agent_name=agent.user.full_name,
                submitted=submitted,
            )
        )

    return rows


# ============================================================
# ALL DISEASE REPORTS
# ============================================================

@router.get(
    "/reports",
    response_model=List[schemas.AdminReportOut],
)
def all_reports(
    taluk_id: Optional[int] = None,
    disease: Optional[str] = None,
    db: Session = Depends(get_db),
    user: models.User = Depends(admin_only),
):
    query = db.query(
        models.DiseaseReport
    )

    if taluk_id:
        query = query.filter(
            models.DiseaseReport.taluk_id == taluk_id
        )

    if disease:
        query = query.filter(
            models.DiseaseReport.disease == disease
        )

    reports = (
        query
        .order_by(
            models.DiseaseReport.week_number.desc()
        )
        .limit(300)
        .all()
    )

    return [
        schemas.AdminReportOut(
            id=report.id,
            taluk_name=report.taluk.name,
            disease=report.disease,
            cases=report.cases,
            severity=report.severity,
            week_number=report.week_number,
            agent_name=report.agent.user.full_name,
            created_at=report.created_at,
        )
        for report in reports
    ]


# ============================================================
# PREDICTION MANAGEMENT
# ============================================================

@router.post(
    "/predictions/run",
    response_model=schemas.PredictionRunResult,
)
def run_predictions(
    db: Session = Depends(get_db),
    user: models.User = Depends(admin_only),
):
    week = current_week_number()

    taluks = (
        db.query(models.Taluk)
        .all()
    )

    created = 0

    for taluk in taluks:

        for disease in DISEASES:

            history_rows = (
                db.query(models.DiseaseReport)
                .filter(
                    models.DiseaseReport.taluk_id == taluk.id,
                    models.DiseaseReport.disease == disease,
                )
                .order_by(
                    models.DiseaseReport.week_number.asc()
                )
                .all()
            )

            if not history_rows:
                continue

            history = [
                row.cases
                for row in history_rows
            ]

            current_cases = history[-1]

            neighbour_ids = [
                neighbour.id
                for neighbour in taluk.neighbours
            ]

            neighbour_avg = None

            if neighbour_ids:

                latest_neighbour_cases = []

                for neighbour_id in neighbour_ids:

                    latest = (
                        db.query(
                            models.DiseaseReport
                        )
                        .filter(
                            models.DiseaseReport.taluk_id
                            == neighbour_id,
                            models.DiseaseReport.disease
                            == disease,
                        )
                        .order_by(
                            models.DiseaseReport.week_number.desc()
                        )
                        .first()
                    )

                    if latest:
                        latest_neighbour_cases.append(
                            latest.cases
                        )

                if latest_neighbour_cases:

                    neighbour_avg = (
                        sum(
                            latest_neighbour_cases
                        )
                        / len(
                            latest_neighbour_cases
                        )
                    )

            predicted, confidence, trend = (
                predict_next_value(
                    history,
                    neighbour_avg,
                )
            )

            risk = classify_risk(
                predicted
            )

            existing = (
                db.query(models.Prediction)
                .filter(
                    models.Prediction.taluk_id == taluk.id,
                    models.Prediction.disease == disease,
                    models.Prediction.week_number == week,
                )
                .first()
            )

            if existing:

                existing.current_cases = current_cases
                existing.predicted_cases = predicted
                existing.risk_level = risk
                existing.trend = trend
                existing.confidence = confidence

            else:

                db.add(
                    models.Prediction(
                        taluk_id=taluk.id,
                        disease=disease,
                        week_number=week,
                        current_cases=current_cases,
                        predicted_cases=predicted,
                        risk_level=risk,
                        trend=trend,
                        confidence=confidence,
                    )
                )

            created += 1

    create_activity_log(
        db,
        user,
        "RUN_PREDICTIONS",
        (
            f"Generated or updated {created} "
            f"predictions across {len(taluks)} taluks "
            f"for week {week}."
        ),
    )

    db.commit()

    return schemas.PredictionRunResult(
        taluks_processed=len(taluks),
        predictions_created=created,
        week_number=week,
    )


# ============================================================
# LATEST PREDICTIONS
# ============================================================

@router.get(
    "/predictions",
    response_model=List[schemas.PredictionOut],
)
def latest_predictions(
    db: Session = Depends(get_db),
    user: models.User = Depends(admin_only),
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

    predictions = (
        db.query(models.Prediction)
        .filter(
            models.Prediction.week_number == latest_week
        )
        .order_by(
            models.Prediction.predicted_cases.desc()
        )
        .all()
    )

    results = []

    for prediction in predictions:

        taluk = (
            db.query(models.Taluk)
            .filter(
                models.Taluk.id == prediction.taluk_id
            )
            .first()
        )

        results.append(
            schemas.PredictionOut(
                taluk_name=(
                    taluk.name
                    if taluk
                    else "Unknown"
                ),
                disease=prediction.disease,
                current_cases=prediction.current_cases,
                predicted_cases=prediction.predicted_cases,
                risk_level=prediction.risk_level,
                trend=prediction.trend,
                confidence=prediction.confidence,
            )
        )

    return results


# ============================================================
# NOTIFICATIONS
# ============================================================

@router.get(
    "/notifications",
    response_model=List[schemas.NotificationOut],
)
def list_notifications(
    db: Session = Depends(get_db),
    user: models.User = Depends(admin_only),
):
    notes = (
        db.query(models.Notification)
        .order_by(
            models.Notification.created_at.desc()
        )
        .all()
    )

    results = []

    for note in notes:

        taluk_name = "Statewide"

        if note.taluk_id is not None:

            taluk = (
                db.query(models.Taluk)
                .filter(
                    models.Taluk.id == note.taluk_id
                )
                .first()
            )

            if taluk:
                taluk_name = taluk.name

        results.append(
            schemas.NotificationOut(
                id=note.id,
                title=note.title,
                message=note.message,
                type=note.type,
                taluk_name=taluk_name,
                created_at=note.created_at,
            )
        )

    return results


@router.post(
    "/notifications",
    response_model=schemas.NotificationOut,
)
def create_notification(
    payload: schemas.NotificationCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(admin_only),
):
    if payload.taluk_id:

        taluk = (
            db.query(models.Taluk)
            .filter(
                models.Taluk.id == payload.taluk_id
            )
            .first()
        )

        if not taluk:
            raise HTTPException(
                status_code=404,
                detail="Taluk not found",
            )

    note = models.Notification(
        title=payload.title,
        message=payload.message,
        type=payload.type,
        taluk_id=payload.taluk_id,
    )

    db.add(note)

    create_activity_log(
        db,
        user,
        "CREATE_NOTIFICATION",
        f"Created notification '{payload.title}'.",
    )

    db.commit()
    db.refresh(note)

    taluk_name = "Statewide"

    if note.taluk_id is not None:

        taluk = (
            db.query(models.Taluk)
            .filter(
                models.Taluk.id == note.taluk_id
            )
            .first()
        )

        if taluk:
            taluk_name = taluk.name

    return schemas.NotificationOut(
        id=note.id,
        title=note.title,
        message=note.message,
        type=note.type,
        taluk_name=taluk_name,
        created_at=note.created_at,
    )


# ============================================================
# ACTIVITY LOGS
# ============================================================

@router.get(
    "/activity-logs",
    response_model=List[schemas.ActivityLogOut],
)
def get_activity_logs(
    db: Session = Depends(get_db),
    user: models.User = Depends(admin_only),
):
    logs = (
        db.query(models.ActivityLog)
        .order_by(
            models.ActivityLog.created_at.desc()
        )
        .limit(200)
        .all()
    )

    return [
        schemas.ActivityLogOut(
            id=log.id,
            user_id=log.user_id,
            action=log.action,
            details=log.details,
            created_at=log.created_at,
        )
        for log in logs
    ]

# ============================================================
# MEDICAL SUPERVISOR AGENT ISSUE REVIEW
# ============================================================

from datetime import datetime as _dt

@router.get("/agent-issues", response_model=List[schemas.AgentIssueOut])
def list_agent_issues(db: Session = Depends(get_db), user: models.User = Depends(admin_only)):
    issues = db.query(models.AgentIssueReport).order_by(models.AgentIssueReport.created_at.desc()).all()
    return [schemas.AgentIssueOut(
        id=i.id, agent_id=i.agent_id, agent_name=i.agent.user.full_name if i.agent and i.agent.user else None,
        supervisor_id=i.supervisor_id, issue_type=i.issue_type, severity=i.severity,
        description=i.description, evidence=i.evidence, status=i.status,
        admin_notes=i.admin_notes, created_at=i.created_at, reviewed_at=i.reviewed_at
    ) for i in issues]

@router.post("/agent-issues/{issue_id}/review", response_model=schemas.AgentIssueOut)
def review_agent_issue(issue_id: int, payload: schemas.AgentIssueReview, db: Session = Depends(get_db), user: models.User = Depends(admin_only)):
    issue = db.query(models.AgentIssueReport).filter(models.AgentIssueReport.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Agent issue report not found.")
    if issue.status != "PENDING_ADMIN_REVIEW":
        raise HTTPException(status_code=400, detail="This issue has already been reviewed.")
    decision = payload.decision.upper().strip()
    if decision not in {"APPROVE", "DISMISS"}:
        raise HTTPException(status_code=400, detail="Decision must be APPROVE or DISMISS.")
    issue.status = "APPROVED" if decision == "APPROVE" else "DISMISSED"
    issue.admin_id = user.id
    issue.admin_notes = payload.admin_notes
    issue.reviewed_at = _dt.utcnow()
    if decision == "APPROVE":
        agent = issue.agent
        if agent and agent.user:
            agent.user.is_active = False
    db.commit(); db.refresh(issue)
    return schemas.AgentIssueOut(
        id=issue.id, agent_id=issue.agent_id, agent_name=issue.agent.user.full_name if issue.agent and issue.agent.user else None,
        supervisor_id=issue.supervisor_id, issue_type=issue.issue_type, severity=issue.severity,
        description=issue.description, evidence=issue.evidence, status=issue.status,
        admin_notes=issue.admin_notes, created_at=issue.created_at, reviewed_at=issue.reviewed_at
    )
