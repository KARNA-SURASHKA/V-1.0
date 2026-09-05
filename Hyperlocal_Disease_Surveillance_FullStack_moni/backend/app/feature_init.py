from datetime import datetime
from firebase_admin import auth as firebase_auth

from . import models
from .database import SessionLocal


SUPERVISOR_EMAIL = "medical_supervisor@yourdomain.com"  # use your real domain
SUPERVISOR_PASSWORD = "supervisor123"  # move to env var before production


def _ensure_firebase_supervisor() -> str:
    try:
        user = firebase_auth.get_user_by_email(SUPERVISOR_EMAIL)
    except firebase_auth.UserNotFoundError:
        user = firebase_auth.create_user(
            email=SUPERVISOR_EMAIL,
            password=SUPERVISOR_PASSWORD,
            display_name="Dr. Monish",
        )
    return user.uid


def initialize_feature():
    db = SessionLocal()
    try:
        for name in models.DISEASES:
            disease = db.query(models.Disease).filter(models.Disease.name.ilike(name)).first()
            if not disease:
                db.add(models.Disease(
                    name=name,
                    verification_status="VERIFIED",
                    is_active=True,
                    verified_at=datetime.utcnow(),
                ))

        firebase_uid = _ensure_firebase_supervisor()

        supervisor = db.query(models.User).filter(models.User.firebase_uid == firebase_uid).first()
        if not supervisor:
            existing_by_username = db.query(models.User).filter(models.User.username == "medical_supervisor").first()
            if existing_by_username:
                existing_by_username.firebase_uid = firebase_uid
                existing_by_username.role = "medical_supervisor"
                existing_by_username.is_active = True
            else:
                db.add(models.User(
                    firebase_uid=firebase_uid,
                    username="medical_supervisor",
                    full_name="Dr. Monish",
                    role="medical_supervisor",
                    is_active=True,
                ))
        else:
            supervisor.role = "medical_supervisor"
            supervisor.is_active = True
            if supervisor.full_name in {None, "", "Medical Supervisor"}:
                supervisor.full_name = "Dr. Monish"

        kodagu = db.query(models.District).filter(models.District.name.ilike("Kodagu")).first()
        supervisor = db.query(models.User).filter(models.User.firebase_uid == firebase_uid).first()
        if supervisor and kodagu:
            supervisor.supervisor_district_id = kodagu.id

        db.commit()
    finally:
        db.close()