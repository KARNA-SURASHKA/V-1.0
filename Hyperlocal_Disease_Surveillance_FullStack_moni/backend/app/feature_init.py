from datetime import datetime
from . import models
from .database import SessionLocal
from .auth import get_password_hash


def initialize_feature():
    """Ensure the official disease registry and Medical Supervisor account exist.

    This is intentionally additive: it does not reseed or replace surveillance
    reports, agents, predictions, or other existing project data.
    """
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

        supervisor = db.query(models.User).filter(models.User.username == "medical_supervisor").first()
        if not supervisor:
            db.add(models.User(
                username="medical_supervisor",
                password_hash=get_password_hash("supervisor123"),
                full_name="Medical Supervisor",
                role="medical_supervisor",
                is_active=True,
            ))
        elif supervisor.role != "medical_supervisor":
            supervisor.role = "medical_supervisor"
            supervisor.is_active = True

        db.commit()
    finally:
        db.close()
