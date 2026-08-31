from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy import func
from sqlalchemy.orm import Session

from .. import auth, models, schemas
from ..database import get_db
from ..utils import current_week_number

router = APIRouter(prefix="/medical", tags=["medical supervisor district scope"])
supervisor_only = auth.require_role("medical_supervisor")


def supervisor_district(db: Session, user: models.User):
    district_id = getattr(user, "supervisor_district_id", None)
    if district_id:
        district = db.query(models.District).filter(models.District.id == district_id).first()
        if district:
            return district
    # Backward-compatible fallback for an older supervisor account.
    district = db.query(models.District).filter(models.District.name.ilike("Kodagu")).first()
    if district:
        return district
    raise HTTPException(status_code=403, detail="No district is assigned to this Medical Supervisor.")


def district_taluk_ids(db: Session, user: models.User):
    district = supervisor_district(db, user)
    return district, [t.id for t in district.taluks]


def report_query(db: Session, user: models.User):
    district, taluk_ids = district_taluk_ids(db, user)
    q = db.query(models.DiseaseReport).filter(models.DiseaseReport.taluk_id.in_(taluk_ids or [-1]))
    return district, q


@router.get("/overview")
def overview(db: Session = Depends(get_db), user: models.User = Depends(supervisor_only)):
    district, taluk_ids = district_taluk_ids(db, user)
    now = datetime.utcnow()
    week = current_week_number(now)
    previous_week = current_week_number(now - timedelta(days=7))

    agents = (db.query(models.Agent).join(models.User, models.Agent.user_id == models.User.id)
              .filter(models.Agent.taluk_id.in_(taluk_ids or [-1]), models.User.is_active.is_(True)).all())
    current = (db.query(models.DiseaseReport).filter(models.DiseaseReport.taluk_id.in_(taluk_ids or [-1]), models.DiseaseReport.week_number == week).all())
    previous = (db.query(models.DiseaseReport).filter(models.DiseaseReport.taluk_id.in_(taluk_ids or [-1]), models.DiseaseReport.week_number == previous_week).all())

    submitted_ids = {r.agent_id for r in current}
    active_agents = len(agents)
    submitted_agents = sum(1 for a in agents if a.id in submitted_ids)
    pending = max(0, active_agents - submitted_agents)
    coverage = round(submitted_agents / active_agents * 100) if active_agents else 0

    cur_by, prev_by = {}, {}
    for r in current: cur_by[r.disease] = cur_by.get(r.disease, 0) + (r.cases or 0)
    for r in previous: prev_by[r.disease] = prev_by.get(r.disease, 0) + (r.cases or 0)

    predictions = (db.query(models.Prediction).filter(models.Prediction.taluk_id.in_(taluk_ids or [-1]), models.Prediction.week_number == week).all())
    rank = {"Low": 1, "Moderate": 2, "High": 3, "Critical": 4}
    risk_by = {}
    for p in predictions:
        if rank.get(p.risk_level, 0) > rank.get(risk_by.get(p.disease), 0): risk_by[p.disease] = p.risk_level
    diseases = sorted(set(cur_by) | set(prev_by))
    disease_overview = []
    for d in diseases:
        c, p = cur_by.get(d, 0), prev_by.get(d, 0)
        change = round((c-p)/p*100) if p else (100 if c else 0)
        risk = risk_by.get(d, "Low")
        disease_overview.append({"disease":d,"cases_this_week":c,"previous_cases":p,"change_percent":change,"risk_level":risk,"status":"Watch" if risk in ("High","Critical") else "Monitor" if risk == "Moderate" else "Stable"})
    disease_overview.sort(key=lambda x:x["cases_this_week"], reverse=True)

    high_risk = [p for p in predictions if p.risk_level in ("High", "Critical")]
    high_risk.sort(key=lambda p:(rank.get(p.risk_level,0),p.predicted_cases or 0), reverse=True)
    recent_alerts = []
    for p in high_risk[:4]:
        taluk = db.query(models.Taluk).filter(models.Taluk.id == p.taluk_id).first()
        place = taluk.name if taluk else "Unknown Taluk"
        recent_alerts.append({"type":"risk","severity":p.risk_level,"title":f"{p.risk_level} {p.disease} activity in {place}","message":f"Current cases: {p.current_cases or 0}; predicted: {p.predicted_cases or 0}. Trend: {(p.trend or 'stable').lower()}.","created_at":p.created_at,"taluk_name":place,"disease":p.disease})

    emerging_count = db.query(models.EmergingDiseaseReport).filter(models.EmergingDiseaseReport.taluk_id.in_(taluk_ids or [-1]), models.EmergingDiseaseReport.status == "PENDING").count()
    if pending:
        recent_alerts.append({"type":"reporting","severity":"Medium","title":f"{pending} agent{'s' if pending != 1 else ''} missed weekly report{'s' if pending != 1 else ''}","message":"Follow-up is required for timely reporting.","created_at":now,"taluk_name":district.name,"disease":None})
    if emerging_count:
        recent_alerts.append({"type":"emerging","severity":"High","title":f"{emerging_count} emerging disease review{'s' if emerging_count != 1 else ''}","message":"Suspected disease reports are awaiting Medical Supervisor review.","created_at":now,"taluk_name":district.name,"disease":None})

    latest_report = current[0] if current else None
    if latest_report: latest_report = max(current, key=lambda r:r.created_at or datetime.min)
    latest_risk = high_risk[0] if high_risk else None
    pulse=[]
    if latest_report:
        pulse.append({"time":latest_report.created_at,"title":"Disease report submitted","detail":f"{latest_report.agent.user.full_name} submitted {latest_report.disease} surveillance data.","meta":f"{latest_report.cases or 0} cases · {latest_report.taluk.name}","kind":"report"})
    if latest_risk:
        taluk = db.query(models.Taluk).filter(models.Taluk.id == latest_risk.taluk_id).first()
        pulse.append({"time":latest_risk.created_at,"title":"Risk level updated","detail":f"{latest_risk.disease} classified as {latest_risk.risk_level} risk.","meta":f"Predicted {latest_risk.predicted_cases or 0} cases · {taluk.name if taluk else 'Unknown Taluk'}","kind":"risk"})
    pulse.append({"time":latest_report.created_at if latest_report else now,"title":"Weekly reporting coverage","detail":f"{submitted_agents} of {active_agents} active monitored agents have submitted this week.","meta":f"{coverage}% coverage","kind":"coverage"})
    if emerging_count: pulse.append({"time":now,"title":"Emerging disease report received","detail":f"{emerging_count} suspected report(s) require medical review.","meta":"Pending review","kind":"emerging"})

    return {
        "current_week":week,"current_week_label":f"Week {week % 100}","previous_week":previous_week,
        "supervisor_name":user.full_name,"supervisor_district":{"id":district.id,"name":district.name},"district":{"id":district.id,"name":district.name},
        "total_agents":active_agents,"active_agents":active_agents,"total_taluks":len(taluk_ids),"total_reports":len(db.query(models.DiseaseReport).filter(models.DiseaseReport.taluk_id.in_(taluk_ids or [-1])).all()),
        "reports_this_week":len(current),"submitted_agents_this_week":submitted_agents,"pending_agent_submissions":pending,"pending_emerging_reviews":emerging_count,
        "pending_agent_issue_reports":db.query(models.AgentIssueReport).join(models.Agent, models.AgentIssueReport.agent_id == models.Agent.id).filter(models.Agent.taluk_id.in_(taluk_ids or [-1]),models.AgentIssueReport.status=="PENDING_ADMIN_REVIEW").count(),
        "diseases_tracked":len(models.DISEASES),"total_cases_this_week":sum(cur_by.values()),"total_cases_previous_week":sum(prev_by.values()),"high_risk_alerts":len(high_risk),"reporting_coverage_percent":coverage,
        "coverage_received":submitted_agents,"coverage_pending":pending,"coverage_no_report":0,"locations":[{"taluk_id":t.id,"taluk_name":t.name,"district_name":district.name,"label":f"{t.name}, {district.name}"} for t in district.taluks],
        "selected_location":None,"disease_overview":disease_overview,"recent_alerts":recent_alerts[:5],"surveillance_pulse":pulse[:4],"updated_at":now,
    }


@router.get("/reports")
def reports(taluk_id: Optional[int]=None,disease:Optional[str]=None,week_number:Optional[int]=None,year:Optional[int]=None,limit:int=500,db:Session=Depends(get_db),user:models.User=Depends(supervisor_only)):
    district, taluk_ids = district_taluk_ids(db,user)
    allowed = set(taluk_ids)
    if taluk_id is not None and taluk_id not in allowed: raise HTTPException(status_code=403,detail="This taluk is outside your assigned district.")
    q=db.query(models.DiseaseReport).filter(models.DiseaseReport.taluk_id.in_(taluk_ids or [-1]))
    if taluk_id is not None:q=q.filter(models.DiseaseReport.taluk_id==taluk_id)
    if disease:q=q.filter(models.DiseaseReport.disease==disease)
    if week_number is not None:q=q.filter(models.DiseaseReport.week_number % 100 == week_number if week_number <= 53 else models.DiseaseReport.week_number==week_number)
    if year is not None:q=q.filter(models.DiseaseReport.year==year)
    rows=q.order_by(models.DiseaseReport.created_at.desc()).limit(min(max(limit,1),1000)).all()
    return [{"id":r.id,"agent_id":r.agent_id,"agent_name":r.agent.user.full_name if r.agent and r.agent.user else "Unknown Agent","taluk_id":r.taluk_id,"taluk_name":r.taluk.name if r.taluk else "Unknown Taluk","district_id":district.id,"district_name":district.name,"disease":r.disease,"cases":r.cases or 0,"severity":r.severity,"remarks":r.remarks,"preventive_measures":r.preventive_measures,"week_number":r.week_number,"year":r.year,"created_at":r.created_at,"updated_at":r.updated_at,"status":"Pending Review"} for r in rows]


@router.get("/monitoring")
def monitoring(week_number:Optional[int]=None,db:Session=Depends(get_db),user:models.User=Depends(supervisor_only)):
    _, taluk_ids=district_taluk_ids(db,user); week=week_number or current_week_number()
    agents=(db.query(models.Agent).join(models.User,models.Agent.user_id==models.User.id).filter(models.Agent.taluk_id.in_(taluk_ids or [-1])).order_by(models.User.full_name.asc()).all())
    rows=[]
    for a in agents:
        submitted=db.query(models.DiseaseReport.id).filter(models.DiseaseReport.agent_id==a.id,models.DiseaseReport.week_number==week).first() is not None
        recent=[]
        missed_streak=0
        for offset in range(7,-1,-1):
            target_week=week-offset
            has_report=db.query(models.DiseaseReport.id).filter(models.DiseaseReport.agent_id==a.id,models.DiseaseReport.week_number==target_week).first() is not None
            recent.append(has_report)
        for has_report in reversed(recent):
            if has_report: break
            missed_streak += 1
        last_submission=db.query(models.DiseaseReport.created_at).filter(models.DiseaseReport.agent_id==a.id).order_by(models.DiseaseReport.created_at.desc()).first()
        rows.append({"agent_id":a.id,"agent_name":a.user.full_name,"username":a.user.username,"taluk_id":a.taluk_id,"taluk_name":a.taluk.name if a.taluk else "Unknown Taluk","district_name":a.taluk.district.name if a.taluk and a.taluk.district else "Unknown District","is_active":bool(a.user.is_active),"submitted":submitted,"week_number":week,"last_submitted_at":last_submission[0] if last_submission else None,"missed_streak":missed_streak,"last_8_weeks":recent})
    return rows


@router.get("/analytics")
def analytics(weeks:int=8,db:Session=Depends(get_db),user:models.User=Depends(supervisor_only)):
    _, taluk_ids=district_taluk_ids(db,user); weeks=min(max(weeks,2),20)
    pairs=(db.query(models.DiseaseReport.year,models.DiseaseReport.week_number).filter(models.DiseaseReport.taluk_id.in_(taluk_ids or [-1])).distinct().order_by(models.DiseaseReport.year.desc(),models.DiseaseReport.week_number.desc()).limit(weeks).all())
    weekly=[]
    for year,week in reversed(pairs):
        total=db.query(func.coalesce(func.sum(models.DiseaseReport.cases),0)).filter(models.DiseaseReport.taluk_id.in_(taluk_ids or [-1]),models.DiseaseReport.year==year,models.DiseaseReport.week_number==week).scalar()
        weekly.append({"year":year,"week_number":week,"label":f"W{week % 100}","total_cases":int(total or 0)})
    totals=db.query(models.DiseaseReport.disease,func.coalesce(func.sum(models.DiseaseReport.cases),0)).filter(models.DiseaseReport.taluk_id.in_(taluk_ids or [-1])).group_by(models.DiseaseReport.disease).order_by(func.sum(models.DiseaseReport.cases).desc()).all()
    return {"weeks":weekly,"weekly":weekly,"disease_totals":[{"disease":d,"cases":int(c or 0)} for d,c in totals]}


@router.get("/risk-map")
def risk_map(disease:Optional[str]=None,db:Session=Depends(get_db),user:models.User=Depends(supervisor_only)):
    _, taluk_ids=district_taluk_ids(db,user); week=current_week_number()
    q=db.query(models.Prediction).filter(models.Prediction.taluk_id.in_(taluk_ids or [-1]),models.Prediction.week_number==week)
    if disease:q=q.filter(models.Prediction.disease==disease)
    rows=q.all(); rank={"Low":1,"Moderate":2,"High":3,"Critical":4}; grouped={}
    taluks={t.id:t for t in db.query(models.Taluk).filter(models.Taluk.id.in_(taluk_ids or [-1])).all()}
    for p in rows:
        k=(p.taluk_id,p.disease)
        if k not in grouped or rank.get(p.risk_level,0)>rank.get(grouped[k].risk_level,0):grouped[k]=p
    return [{"id":p.id,"taluk_id":p.taluk_id,"taluk_name":taluks.get(p.taluk_id).name if taluks.get(p.taluk_id) else "Unknown Taluk","district_id":taluks.get(p.taluk_id).district_id if taluks.get(p.taluk_id) else None,"district_name":taluks.get(p.taluk_id).district.name if taluks.get(p.taluk_id) and taluks.get(p.taluk_id).district else "Kodagu","disease":p.disease,"risk_level":p.risk_level or "Low","current_cases":p.current_cases or 0,"predicted_cases":p.predicted_cases or 0,"trend":p.trend or "stable","latitude":getattr(taluks.get(p.taluk_id),"latitude",None),"longitude":getattr(taluks.get(p.taluk_id),"longitude",None),"created_at":p.created_at} for p in grouped.values()]


@router.get("/agents")
def agents(db:Session=Depends(get_db),user:models.User=Depends(supervisor_only)):
    _,taluk_ids=district_taluk_ids(db,user); week=current_week_number()
    rows=(db.query(models.Agent).join(models.User,models.Agent.user_id==models.User.id).filter(models.Agent.taluk_id.in_(taluk_ids or [-1])).order_by(models.User.full_name.asc()).all())
    return [{"id":a.id,"agent_id":a.id,"user_id":a.user_id,"name":a.user.full_name,"full_name":a.user.full_name,"username":a.user.username,"taluk_id":a.taluk_id,"taluk_name":a.taluk.name if a.taluk else "Unknown Taluk","district_name":a.taluk.district.name if a.taluk and a.taluk.district else "Kodagu","is_active":bool(a.user.is_active),"submitted":db.query(models.DiseaseReport.id).filter(models.DiseaseReport.agent_id==a.id,models.DiseaseReport.week_number==week).first() is not None} for a in rows]


@router.get("/agent-issues")
def agent_issues(status:Optional[str]=None,db:Session=Depends(get_db),user:models.User=Depends(supervisor_only)):
    _,taluk_ids=district_taluk_ids(db,user); q=db.query(models.AgentIssueReport).join(models.Agent, models.AgentIssueReport.agent_id == models.Agent.id).filter(models.Agent.taluk_id.in_(taluk_ids or [-1]))
    if status:q=q.filter(models.AgentIssueReport.status==status)
    return [{"id":i.id,"agent_id":i.agent_id,"agent_name":i.agent.user.full_name if i.agent and i.agent.user else "Unknown Agent","taluk_id":i.agent.taluk_id if i.agent else None,"taluk_name":i.agent.taluk.name if i.agent and i.agent.taluk else "Unknown Taluk","issue_type":i.issue_type,"severity":i.severity,"description":i.description,"evidence":i.evidence,"status":i.status,"created_at":i.created_at,"resolved_at":i.reviewed_at} for i in q.order_by(models.AgentIssueReport.created_at.desc()).all()]


@router.post("/agent-issues")
async def create_agent_issue(agent_id:int=Form(...),issue_type:str=Form(...),severity:str=Form("Medium"),description:str=Form(...),evidence:str=Form(""),proof:Optional[list[UploadFile]]=File(None),db:Session=Depends(get_db),user:models.User=Depends(supervisor_only)):
    district,taluk_ids=district_taluk_ids(db,user)
    agent=db.query(models.Agent).filter(models.Agent.id==agent_id).first()
    if not agent or agent.taluk_id not in taluk_ids:raise HTTPException(status_code=403,detail="You can only report agents in your assigned district.")
    proof_names=[]
    if proof:
        upload_dir=Path(__file__).resolve().parents[2]/"uploads"/"agent_issues"; upload_dir.mkdir(parents=True,exist_ok=True)
        for f in proof:
            if not f or not f.filename:continue
            safe_name=f"{datetime.utcnow().strftime('%Y%m%d%H%M%S%f')}_{Path(f.filename).name}"
            target=upload_dir/safe_name
            target.write_bytes(await f.read()); proof_names.append(safe_name)
    evidence_text=(evidence or "").strip()
    if proof_names:evidence_text=(evidence_text+"\nProof files: "+", ".join(proof_names)).strip()
    issue=models.AgentIssueReport(agent_id=agent.id,supervisor_id=user.id,issue_type=issue_type.strip(),severity=severity.strip(),description=description.strip(),evidence=evidence_text or None,status="PENDING_ADMIN_REVIEW",created_at=datetime.utcnow())
    db.add(issue);db.commit();db.refresh(issue)
    return {"id":issue.id,"status":issue.status,"message":"Complaint and proof submitted to System Admin."}


@router.post("/agents/{agent_id}/remind")
def remind_agent(agent_id:int,db:Session=Depends(get_db),user:models.User=Depends(supervisor_only)):
    _,taluk_ids=district_taluk_ids(db,user); agent=db.query(models.Agent).filter(models.Agent.id==agent_id).first()
    if not agent or agent.taluk_id not in taluk_ids:raise HTTPException(status_code=403,detail="Agent is outside your district.")
    notification=models.Notification(title="Weekly report reminder",message="Your Medical Supervisor has reminded you to submit your weekly surveillance report.",type="reporting",taluk_id=agent.taluk_id,created_at=datetime.utcnow(),is_read=False)
    db.add(notification);db.commit()
    return {"ok":True,"agent_id":agent_id,"message":"Reminder sent."}


@router.get("/emerging")
def emerging(status:Optional[str]=None,taluk_id:Optional[int]=None,db:Session=Depends(get_db),user:models.User=Depends(supervisor_only)):
    _,taluk_ids=district_taluk_ids(db,user); q=db.query(models.EmergingDiseaseReport).filter(models.EmergingDiseaseReport.taluk_id.in_(taluk_ids or [-1]))
    if taluk_id is not None:q=q.filter(models.EmergingDiseaseReport.taluk_id==taluk_id)
    if status:q=q.filter(models.EmergingDiseaseReport.status==status)
    rows=q.order_by(models.EmergingDiseaseReport.created_at.desc()).all()
    return [{"id":r.id,"agent_id":r.agent_id,"taluk_id":r.taluk_id,"taluk_name":r.taluk.name if r.taluk else None,"reported_name":r.reported_name,"suspected_cases":r.suspected_cases,"symptoms":r.symptoms,"description":r.description,"observed_date":r.observed_date,"status":r.status,"mapped_disease_id":r.mapped_disease_id,"mapped_disease_name":r.mapped_disease.name if r.mapped_disease else None,"review_notes":r.review_notes,"created_at":r.created_at,"reviewed_at":r.reviewed_at} for r in rows]


@router.put("/emerging/{report_id}/review")
def review_emerging(report_id:int,payload:schemas.EmergingDiseaseReview,db:Session=Depends(get_db),user:models.User=Depends(supervisor_only)):
    _,taluk_ids=district_taluk_ids(db,user); report=db.query(models.EmergingDiseaseReport).filter(models.EmergingDiseaseReport.id==report_id).first()
    if not report or report.taluk_id not in taluk_ids:raise HTTPException(status_code=404,detail="Emerging disease report not found in your district.")
    decision=(payload.decision or "").upper()
    if decision=="VERIFY_EXISTING":
        if not payload.mapped_disease_id:raise HTTPException(status_code=400,detail="Select an existing disease before verification.")
        if not db.query(models.Disease).filter(models.Disease.id==payload.mapped_disease_id).first():raise HTTPException(status_code=400,detail="Selected disease is not in the registry.")
        report.mapped_disease_id=payload.mapped_disease_id; report.status="APPROVED"
    elif decision=="VERIFY_NEW":
        name=(payload.new_disease_name or "").strip()
        if not name:raise HTTPException(status_code=400,detail="Enter the new disease name.")
        disease=db.query(models.Disease).filter(func.lower(models.Disease.name)==name.lower()).first()
        if not disease:
            disease=models.Disease(name=name,description=payload.new_disease_description,verification_status="VERIFIED",is_active=True,verified_by_user_id=user.id,verified_at=datetime.utcnow());db.add(disease);db.flush()
        report.mapped_disease_id=disease.id;report.status="APPROVED"
    elif decision=="REJECT": report.status="REJECTED"
    else: raise HTTPException(status_code=400,detail="Unsupported review decision.")
    report.review_notes=payload.review_notes;report.reviewed_at=datetime.utcnow();db.commit();db.refresh(report)
    return {"id":report.id,"status":report.status,"mapped_disease_id":report.mapped_disease_id,"review_notes":report.review_notes}
