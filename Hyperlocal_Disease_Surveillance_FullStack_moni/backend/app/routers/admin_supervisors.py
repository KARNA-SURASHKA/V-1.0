from typing import Optional

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)
from pydantic import BaseModel, Field
from sqlalchemy import func, inspect, text
from sqlalchemy.orm import Session

from .. import auth, models
from ..database import get_db
from ..utils import current_week_number


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(
    prefix="/admin/supervisors",
    tags=["admin medical supervisors"],
)

admin_only = auth.require_role("admin")


# ============================================================
# REQUEST MODELS
# ============================================================

class SupervisorCreate(BaseModel):

    username: str = Field(
        min_length=2,
        max_length=150,
    )

    password: str = Field(
        min_length=6,
        max_length=200,
    )

    full_name: str = Field(
        min_length=2,
        max_length=200,
    )

    district_id: Optional[int] = None


class SupervisorUpdate(BaseModel):

    username: Optional[str] = Field(
        default=None,
        min_length=2,
        max_length=150,
    )

    password: Optional[str] = Field(
        default=None,
        min_length=6,
        max_length=200,
    )

    full_name: Optional[str] = Field(
        default=None,
        min_length=2,
        max_length=200,
    )

    district_id: Optional[int] = None


class SupervisorStatus(BaseModel):

    is_active: bool


# ============================================================
# HELPERS
# ============================================================

def get_report_columns():

    try:

        return {
            column["name"]
            for column in inspect(
                models.DiseaseReport
            ).columns
        }

    except Exception:

        return set()


def get_district_taluk_ids(
    db: Session,
    district_id: Optional[int],
):

    if not district_id:
        return []

    rows = (
        db.query(models.Taluk.id)
        .filter(
            models.Taluk.district_id
            == district_id
        )
        .all()
    )

    return [
        row[0]
        for row in rows
    ]


def get_report_metrics(
    db: Session,
    district_id: Optional[int],
):

    if not district_id:

        return {
            "reviewed": 0,
            "pending": 0,
        }

    taluk_ids = get_district_taluk_ids(
        db,
        district_id,
    )

    if not taluk_ids:

        return {
            "reviewed": 0,
            "pending": 0,
        }

    week = current_week_number()

    base_query = (
        db.query(models.DiseaseReport)
        .filter(
            models.DiseaseReport.taluk_id.in_(
                taluk_ids
            ),
            models.DiseaseReport.week_number
            == week,
        )
    )

    columns = get_report_columns()

    reviewed = 0
    pending = 0

    # Newer database versions have review fields.
    if "review_status" in columns:

        pending = (
            base_query
            .filter(
                text(
                    "disease_reports.review_status"
                )
                == "PENDING_REVIEW"
            )
            .count()
        )

        if "reviewed_at" in columns:

            reviewed = (
                base_query
                .filter(
                    text(
                        "disease_reports.reviewed_at "
                        "IS NOT NULL"
                    )
                )
                .count()
            )

        else:

            reviewed = (
                base_query
                .filter(
                    text(
                        "disease_reports.review_status "
                        "IN ('APPROVED','REJECTED')"
                    )
                )
                .count()
            )

    else:

        # Backward compatibility for old databases.
        reviewed = base_query.count()

    return {
        "reviewed": reviewed,
        "pending": pending,
    }


def get_last_activity(
    db: Session,
    user_id: int,
):

    return (
        db.query(
            func.max(
                models.ActivityLog.created_at
            )
        )
        .filter(
            models.ActivityLog.user_id
            == user_id
        )
        .scalar()
    )


def supervisor_to_dict(
    db: Session,
    supervisor: models.User,
):

    district = None

    if supervisor.supervisor_district_id:

        district = (
            db.query(models.District)
            .filter(
                models.District.id
                == supervisor.supervisor_district_id
            )
            .first()
        )

    taluks = []

    if supervisor.supervisor_district_id:

        taluks = (
            db.query(models.Taluk)
            .filter(
                models.Taluk.district_id
                == supervisor.supervisor_district_id
            )
            .order_by(
                models.Taluk.name
            )
            .all()
        )

    agents = 0

    if supervisor.supervisor_district_id:

        agents = (
            db.query(models.Agent)
            .join(
                models.Taluk,
                models.Agent.taluk_id
                == models.Taluk.id,
            )
            .filter(
                models.Taluk.district_id
                == supervisor.supervisor_district_id
            )
            .count()
        )

    metrics = get_report_metrics(
        db,
        supervisor.supervisor_district_id,
    )

    last_active = get_last_activity(
        db,
        supervisor.id,
    )

    total_reviewable = (
        metrics["reviewed"]
        + metrics["pending"]
    )

    if total_reviewable > 0:

        compliance = round(
            (
                metrics["reviewed"]
                / total_reviewable
            )
            * 100
        )

    else:

        compliance = 100

    return {

        "id": supervisor.id,

        "username":
            supervisor.username,

        "full_name":
            supervisor.full_name,

        "role":
            supervisor.role,

        "is_active":
            bool(supervisor.is_active),

        "district_id":
            supervisor.supervisor_district_id,

        "district_name":
            district.name
            if district
            else None,

        "state_name":
            (
                district.state.name
                if district
                and district.state
                else None
            ),

        "assigned_areas":
            len(taluks),

        "taluks_managed":
            [
                taluk.name
                for taluk in taluks
            ],

        "reports_responsible":
            agents,

        "supervising_agents":
            agents,

        "reports_reviewed_this_week":
            metrics["reviewed"],

        "pending_reviews":
            metrics["pending"],

        "compliance":
            compliance,

        "last_active":
            last_active,

        "joined_on":
            None,
    }


# ============================================================
# LIST SUPERVISORS
# ============================================================

@router.get("")
def list_supervisors(

    district_id: Optional[str] = None,

    status: Optional[str] = None,

    assignment: Optional[str] = None,

    search: Optional[str] = None,

    db: Session = Depends(get_db),

    user: models.User = Depends(
        admin_only
    ),
):

    # --------------------------------------------------------
    # SAFE DISTRICT FILTER
    # --------------------------------------------------------
    #
    # "all", "", None and "All Districts"
    # mean no district filter.
    #
    # This prevents the HTTP 422 error from:
    #
    # district_id=all
    #
    # --------------------------------------------------------

    parsed_district_id = None

    if district_id not in (
        None,
        "",
        "all",
        "All",
        "All Districts",
    ):

        try:

            parsed_district_id = int(
                district_id
            )

        except (
            TypeError,
            ValueError,
        ):

            raise HTTPException(
                status_code=422,
                detail=(
                    "district_id must be "
                    "an integer or omitted."
                ),
            )

    query = (
        db.query(models.User)
        .filter(
            models.User.role
            == "medical_supervisor"
        )
    )

    if parsed_district_id is not None:

        query = query.filter(
            models.User.supervisor_district_id
            == parsed_district_id
        )

    supervisors = (
        query
        .order_by(
            models.User.full_name.asc()
        )
        .all()
    )

    rows = []

    for supervisor in supervisors:

        row = supervisor_to_dict(
            db,
            supervisor,
        )

        # ----------------------------------------------------
        # STATUS FILTER
        # ----------------------------------------------------

        if status in (
            "active",
            "Active",
        ):

            if not row["is_active"]:
                continue

        if status in (
            "inactive",
            "Inactive",
        ):

            if row["is_active"]:
                continue

        # ----------------------------------------------------
        # ASSIGNMENT FILTER
        # ----------------------------------------------------

        if assignment in (
            "assigned",
            "Assigned",
        ):

            if not row["district_id"]:
                continue

        if assignment in (
            "unassigned",
            "Unassigned",
        ):

            if row["district_id"]:
                continue

        # ----------------------------------------------------
        # SEARCH
        # ----------------------------------------------------

        if search:

            needle = (
                search
                .strip()
                .lower()
            )

            searchable = (
                f'{row["full_name"]} '
                f'{row["username"]} '
                f'{row["id"]}'
            ).lower()

            if needle not in searchable:
                continue

        rows.append(row)

    return rows


# ============================================================
# STATISTICS
# ============================================================

@router.get("/stats")
def supervisor_stats(

    db: Session = Depends(get_db),

    user: models.User = Depends(
        admin_only
    ),
):

    supervisors = (
        db.query(models.User)
        .filter(
            models.User.role
            == "medical_supervisor"
        )
        .all()
    )

    rows = [
        supervisor_to_dict(
            db,
            supervisor,
        )
        for supervisor in supervisors
    ]

    districts_covered = len(
        {
            row["district_id"]
            for row in rows
            if row["district_id"]
        }
    )

    pending_actions = sum(
        1
        for row in rows
        if row["pending_reviews"] > 0
    )

    return {

        "total_supervisors":
            len(rows),

        "active_supervisors":
            sum(
                1
                for row in rows
                if row["is_active"]
            ),

        "districts_covered":
            districts_covered,

        "pending_actions":
            pending_actions,
    }


# ============================================================
# SUPERVISOR DETAILS
# ============================================================

@router.get("/{supervisor_id}")
def supervisor_details(

    supervisor_id: int,

    db: Session = Depends(get_db),

    user: models.User = Depends(
        admin_only
    ),
):

    supervisor = (
        db.query(models.User)
        .filter(
            models.User.id
            == supervisor_id,
            models.User.role
            == "medical_supervisor",
        )
        .first()
    )

    if not supervisor:

        raise HTTPException(
            status_code=404,
            detail=(
                "Medical supervisor "
                "not found."
            ),
        )

    row = supervisor_to_dict(
        db,
        supervisor,
    )

    activities = (
        db.query(models.ActivityLog)
        .filter(
            models.ActivityLog.user_id
            == supervisor.id
        )
        .order_by(
            models.ActivityLog.created_at.desc()
        )
        .limit(8)
        .all()
    )

    row.update({

        "email":
            supervisor.username
            if "@"
            in supervisor.username
            else None,

        "phone":
            None,

        "qualification":
            "Medical Supervisor",

        "coverage":
            (
                f'{row["assigned_areas"]} '
                f'Taluks'
                if row["assigned_areas"]
                else "Unassigned"
            ),

        "recent_activity":
            [
                {
                    "id": activity.id,

                    "action":
                        activity.action,

                    "description":
                        activity.details
                        or activity.action,

                    "created_at":
                        activity.created_at,
                }

                for activity in activities
            ],
    })

    return row


# ============================================================
# CREATE SUPERVISOR
# ============================================================

@router.post("")
def create_supervisor(

    payload: SupervisorCreate,

    db: Session = Depends(get_db),

    user: models.User = Depends(
        admin_only
    ),
):

    username = (
        payload.username
        .strip()
    )

    full_name = (
        payload.full_name
        .strip()
    )

    existing = (
        db.query(models.User)
        .filter(
            models.User.username
            == username
        )
        .first()
    )

    if existing:

        raise HTTPException(
            status_code=409,
            detail=(
                "Username already exists."
            ),
        )

    if payload.district_id is not None:

        district = (
            db.query(models.District)
            .filter(
                models.District.id
                == payload.district_id
            )
            .first()
        )

        if not district:

            raise HTTPException(
                status_code=404,
                detail=(
                    "Selected district "
                    "was not found."
                ),
            )

    supervisor = models.User(

        username=username,

        password_hash=
            auth.get_password_hash(
                payload.password
            ),

        full_name=full_name,

        role="medical_supervisor",

        is_active=True,

        supervisor_district_id=
            payload.district_id,
    )

    db.add(supervisor)

    db.flush()

    db.add(
        models.ActivityLog(
            user_id=user.id,
            action=
                "CREATE_MEDICAL_SUPERVISOR",
            details=
                (
                    "Created medical "
                    f"supervisor '{username}'."
                ),
        )
    )

    db.commit()

    db.refresh(supervisor)

    return supervisor_to_dict(
        db,
        supervisor,
    )


# ============================================================
# UPDATE SUPERVISOR
# ============================================================

@router.put("/{supervisor_id}")
def update_supervisor(

    supervisor_id: int,

    payload: SupervisorUpdate,

    db: Session = Depends(get_db),

    user: models.User = Depends(
        admin_only
    ),
):

    supervisor = (
        db.query(models.User)
        .filter(
            models.User.id
            == supervisor_id,
            models.User.role
            == "medical_supervisor",
        )
        .first()
    )

    if not supervisor:

        raise HTTPException(
            status_code=404,
            detail=(
                "Medical supervisor "
                "not found."
            ),
        )

    if payload.username is not None:

        username = (
            payload.username
            .strip()
        )

        existing = (
            db.query(models.User)
            .filter(
                models.User.username
                == username,
                models.User.id
                != supervisor_id,
            )
            .first()
        )

        if existing:

            raise HTTPException(
                status_code=409,
                detail=(
                    "Username already exists."
                ),
            )

        supervisor.username = username

    if payload.full_name is not None:

        supervisor.full_name = (
            payload.full_name
            .strip()
        )

    if payload.password:

        supervisor.password_hash = (
            auth.get_password_hash(
                payload.password
            )
        )

    if payload.district_id is not None:

        district = (
            db.query(models.District)
            .filter(
                models.District.id
                == payload.district_id
            )
            .first()
        )

        if not district:

            raise HTTPException(
                status_code=404,
                detail=(
                    "Selected district "
                    "was not found."
                ),
            )

        supervisor.supervisor_district_id = (
            payload.district_id
        )

    db.add(
        models.ActivityLog(
            user_id=user.id,
            action=
                "UPDATE_MEDICAL_SUPERVISOR",
            details=
                (
                    "Updated medical "
                    f"supervisor "
                    f"'{supervisor.username}'."
                ),
        )
    )

    db.commit()

    db.refresh(supervisor)

    return supervisor_to_dict(
        db,
        supervisor,
    )


# ============================================================
# ACTIVATE / DEACTIVATE
# ============================================================

@router.patch(
    "/{supervisor_id}/status"
)
def update_status(

    supervisor_id: int,

    payload: SupervisorStatus,

    db: Session = Depends(get_db),

    user: models.User = Depends(
        admin_only
    ),
):

    supervisor = (
        db.query(models.User)
        .filter(
            models.User.id
            == supervisor_id,
            models.User.role
            == "medical_supervisor",
        )
        .first()
    )

    if not supervisor:

        raise HTTPException(
            status_code=404,
            detail=(
                "Medical supervisor "
                "not found."
            ),
        )

    supervisor.is_active = (
        payload.is_active
    )

    action = (
        "ACTIVATE_MEDICAL_SUPERVISOR"
        if payload.is_active
        else
        "DEACTIVATE_MEDICAL_SUPERVISOR"
    )

    db.add(
        models.ActivityLog(
            user_id=user.id,
            action=action,
            details=(
                f"Supervisor "
                f"'{supervisor.username}' "
                f"was "
                f"{'activated' if payload.is_active else 'deactivated'}."
            ),
        )
    )

    db.commit()

    db.refresh(supervisor)

    return supervisor_to_dict(
        db,
        supervisor,
    )


# ============================================================
# DELETE
# ============================================================

@router.delete(
    "/{supervisor_id}"
)
def delete_supervisor(

    supervisor_id: int,

    db: Session = Depends(get_db),

    user: models.User = Depends(
        admin_only
    ),
):

    supervisor = (
        db.query(models.User)
        .filter(
            models.User.id
            == supervisor_id,
            models.User.role
            == "medical_supervisor",
        )
        .first()
    )

    if not supervisor:

        raise HTTPException(
            status_code=404,
            detail=(
                "Medical supervisor "
                "not found."
            ),
        )

    username = supervisor.username

    db.add(
        models.ActivityLog(
            user_id=user.id,
            action=
                "DELETE_MEDICAL_SUPERVISOR",
            details=
                (
                    "Deleted medical "
                    f"supervisor '{username}'."
                ),
        )
    )

    db.delete(supervisor)

    db.commit()

    return {
        "ok": True,
        "message":
            "Medical supervisor "
            "deleted successfully.",
    }