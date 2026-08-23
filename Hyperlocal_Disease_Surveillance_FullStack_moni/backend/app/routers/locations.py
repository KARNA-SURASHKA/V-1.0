from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/locations", tags=["locations"])


@router.get("/states", response_model=List[schemas.StateOut])
def list_states(db: Session = Depends(get_db)):
    return db.query(models.State).order_by(models.State.name).all()


@router.get("/districts/{state_id}", response_model=List[schemas.DistrictOut])
def list_districts(state_id: int, db: Session = Depends(get_db)):
    return (
        db.query(models.District)
        .filter(models.District.state_id == state_id)
        .order_by(models.District.name)
        .all()
    )


@router.get("/taluks/{district_id}", response_model=List[schemas.TalukOut])
def list_taluks(district_id: int, db: Session = Depends(get_db)):
    return (
        db.query(models.Taluk)
        .filter(models.Taluk.district_id == district_id)
        .order_by(models.Taluk.name)
        .all()
    )
