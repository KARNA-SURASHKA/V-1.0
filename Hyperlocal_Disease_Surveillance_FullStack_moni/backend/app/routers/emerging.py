from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from .. import models, schemas, auth
from ..database import get_db

router = APIRouter(prefix="/agent/emerging", tags=["emerging disease surveillance"])


def get_agent(user, db):
    agent = db.query(models.Agent).filter(models.Agent.user_id == user.id).first()
    if not agent:
        raise HTTPException(status_code=400, detail="This account has no assigned taluk.")
    return agent


def serialize(report):
    return schemas.EmergingDiseaseOut(
        id=report.id, agent_id=report.agent_id, taluk_id=report.taluk_id,
        taluk_name=report.taluk.name if report.taluk else None,
        reported_name=report.reported_name, suspected_cases=report.suspected_cases,
        symptoms=report.symptoms, description=report.description,
        observed_date=report.observed_date, status=report.status,
        mapped_disease_id=report.mapped_disease_id,
        mapped_disease_name=report.mapped_disease.name if report.mapped_disease else None,
        review_notes=report.review_notes, created_at=report.created_at, reviewed_at=report.reviewed_at,
    )


@router.post("", response_model=schemas.EmergingDiseaseOut)
def submit_emerging(payload: schemas.EmergingDiseaseCreate, db: Session = Depends(get_db), user: models.User = Depends(auth.require_role("agent"))):
    agent = get_agent(user, db)
    report = models.EmergingDiseaseReport(
        agent_id=agent.id, taluk_id=agent.taluk_id,
        reported_name=payload.reported_name.strip(),
        suspected_cases=payload.suspected_cases, symptoms=payload.symptoms,
        description=payload.description,
        observed_date=payload.observed_date if payload.observed_date else datetime.utcnow(),
        status="PENDING",
    )
    db.add(report); db.commit(); db.refresh(report)
    return serialize(report)


@router.get("/mine", response_model=List[schemas.EmergingDiseaseOut])
def my_emerging_reports(db: Session = Depends(get_db), user: models.User = Depends(auth.require_role("agent"))):
    agent = get_agent(user, db)
    reports = db.query(models.EmergingDiseaseReport).filter(models.EmergingDiseaseReport.agent_id == agent.id).order_by(models.EmergingDiseaseReport.created_at.desc()).all()
    return [serialize(r) for r in reports]
