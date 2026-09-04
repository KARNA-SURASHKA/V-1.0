# backend/app/feature_init.py
"""Feature initialization helper.

This module seeds the database with the official disease list and creates a
default Medical Supervisor account.

It is imported in *main.py* and executed at startup.
"""

from __future__ import annotations

from datetime import datetime

from . import database
from . import models
from .utils import get_password_hash


def initialize_feature() -> None:
    """Populate the database with default data.

    The call is idempotent – it will not overwrite existing rows.
    """
    db = database.SessionLocal()
    try:
        # Seed diseases if missing
        for name in models.DISEASES:
            disease = db.query(models.Disease).filter(models.Disease.name.ilike(name)).first()
            if not disease:
                db.add(models.Disease(
                    name=name,
                    verification_status="VERIFIED",
                    is_active=True,
                    verified_at=datetime.utcnow(),
                ))

        # Create medical supervisor account
        supervisor = db.query(models.User).filter(models.User.username == "medical_supervisor").first()
        if not supervisor:
            db.add(models.User(
                username="medical_supervisor",
                password_hash=get_password_hash("supervisor123"),
                full_name="Dr. Monish",
                role="medical_supervisor",
                is_active=True,
            ))
        else:
            supervisor.role = "medical_supervisor"
            supervisor.is_active = True
            if supervisor.full_name in {None, "", "Medical Supervisor"}:
                supervisor.full_name = "Dr. Monish"

        # Assign supervisor to district 'Kodagu' if present
        kodagu = db.query(models.District).filter(models.District.name.ilike("Kodagu")).first()
        supervisor = db.query(models.User).filter(models.User.username == "medical_supervisor").first()
        if supervisor and kodagu:
            supervisor.supervisor_district_id = kodagu.id

        db.commit()
    finally:
        db.close()
