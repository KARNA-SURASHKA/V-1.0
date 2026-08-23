from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List

from .. import models, schemas
from ..database import get_db
from ..ml.predict import classify_risk
from ..utils import week_label


router = APIRouter(
    tags=["dashboard"]
)


# ============================================================
# RISK ORDER
# ============================================================

RISK_ORDER = {
    "Low": 0,
    "Moderate": 1,
    "High": 2,
    "Critical": 3,
}


# ============================================================
# ADVICE LIBRARY
# ============================================================

ADVICE_LIBRARY = {
    "Dengue": [
        "Remove stagnant water around your home (buckets, coolers, plant trays).",
        "Use mosquito repellents and sleep under nets.",
        "Wear full-sleeved clothing, especially at dawn and dusk.",
        "Visit your nearest PHC immediately if fever persists beyond 2 days.",
    ],

    "Malaria": [
        "Sleep under insecticide-treated mosquito nets.",
        "Drain or cover any stagnant water sources nearby.",
        "Use indoor residual spraying if offered by local health workers.",
        "Seek testing promptly for fever with chills.",
    ],

    "Typhoid": [
        "Drink only boiled or purified water.",
        "Avoid street food and uncooked vegetables during outbreaks.",
        "Wash hands thoroughly before eating and after using the toilet.",
        "Get vaccinated if advised by your local PHC.",
    ],

    "Influenza": [
        "Cover your mouth and nose when coughing or sneezing.",
        "Avoid close contact with people showing flu symptoms.",
        "Wash hands frequently with soap.",
        "Rest and stay hydrated; seek care if breathing difficulty occurs.",
    ],

    "Chikungunya": [
        "Eliminate mosquito breeding spots near your house.",
        "Use mosquito repellent creams and coils.",
        "Wear protective clothing during peak mosquito hours.",
        "Consult a doctor for joint pain that persists beyond a few days.",
    ],
}


# ============================================================
# HELPERS
# ============================================================

def _latest_week_reports(
    db: Session,
    taluk_id: int,
):
    """
    Return all disease reports belonging to the
    latest reporting week for the selected taluk.
    """

    latest_week = (
        db.query(
            func.max(
                models.DiseaseReport.week_number
            )
        )
        .filter(
            models.DiseaseReport.taluk_id == taluk_id
        )
        .scalar()
    )

    if latest_week is None:
        return [], None

    reports = (
        db.query(
            models.DiseaseReport
        )
        .filter(
            models.DiseaseReport.taluk_id == taluk_id,
            models.DiseaseReport.week_number == latest_week,
        )
        .order_by(
            models.DiseaseReport.created_at.desc()
        )
        .all()
    )

    return reports, latest_week


def _aggregate_reports_by_disease(reports):
    """
    Combine multiple reports for the same disease
    within the latest reporting week.
    """

    aggregated = {}

    for report in reports:

        disease = report.disease

        if disease not in aggregated:

            aggregated[disease] = {
                "cases": 0,
                "severity": report.severity,
                "created_at": report.created_at,
            }

        aggregated[disease]["cases"] += (
            report.cases or 0
        )

        if report.created_at:

            current_created = (
                aggregated[disease]["created_at"]
            )

            if (
                current_created is None
                or report.created_at > current_created
            ):

                aggregated[disease]["created_at"] = (
                    report.created_at
                )

    return aggregated


def _calculate_trend_percentage(trend):
    """
    Calculate percentage change between the
    last two available weeks.
    """

    if len(trend) < 2:
        return None

    previous = (
        trend[-2].total_cases
    )

    current = (
        trend[-1].total_cases
    )

    if previous == 0:

        if current == 0:
            return "0%"

        return "+100%"

    percentage = (
        (current - previous)
        / previous
    ) * 100

    if percentage > 0:
        return f"+{round(percentage)}%"

    return f"{round(percentage)}%"


# ============================================================
# DASHBOARD
# ============================================================

@router.get(
    "/dashboard/{taluk_id}",
    response_model=schemas.DashboardOut,
)
def get_dashboard(
    taluk_id: int,
    db: Session = Depends(get_db),
):

    # --------------------------------------------------------
    # VALIDATE TALUK
    # --------------------------------------------------------

    taluk = (
        db.query(
            models.Taluk
        )
        .filter(
            models.Taluk.id == taluk_id
        )
        .first()
    )

    if not taluk:

        raise HTTPException(
            status_code=404,
            detail="Taluk not found",
        )


    # --------------------------------------------------------
    # LATEST WEEK
    # --------------------------------------------------------

    reports, latest_week = (
        _latest_week_reports(
            db,
            taluk_id,
        )
    )


    # --------------------------------------------------------
    # NO DATA
    # --------------------------------------------------------

    if not reports:

        return schemas.DashboardOut(

            # Selected location
            taluk_id=taluk.id,
            taluk_name=taluk.name,

            # Current surveillance information
            active_cases=0,
            overall_risk="Low",
            top_disease=None,
            trend_percentage=None,

            # Disease information
            cards=[],
            distribution=[],

            # Historical trend
            trend=[],

            # Compatibility fields for older frontend
            total_cases=0,
            dominant_disease=None,
            last_updated_at=None,
        )


    # --------------------------------------------------------
    # AGGREGATE LATEST-WEEK DISEASE DATA
    # --------------------------------------------------------

    aggregated = (
        _aggregate_reports_by_disease(
            reports
        )
    )


    # --------------------------------------------------------
    # DISEASE CARDS
    # --------------------------------------------------------

    cards = []

    for disease, info in aggregated.items():

        cases = int(
            info["cases"] or 0
        )

        cards.append(
            schemas.DiseaseCard(
                disease=disease,
                cases=cases,
                risk_level=classify_risk(
                    cases
                ),
            )
        )


    # Highest-case disease first
    cards.sort(
        key=lambda card: card.cases,
        reverse=True,
    )


    # --------------------------------------------------------
    # ACTIVE CASES
    # --------------------------------------------------------

    active_cases = sum(
        card.cases
        for card in cards
    )


    # --------------------------------------------------------
    # DISEASE DISTRIBUTION
    # --------------------------------------------------------

    distribution = []

    if active_cases > 0:

        for card in cards:

            percentage = round(
                (
                    card.cases * 100
                )
                / active_cases
            )

            distribution.append(
                schemas.DiseaseCard(
                    disease=card.disease,
                    cases=percentage,
                    risk_level=card.risk_level,
                )
            )


    # --------------------------------------------------------
    # LAST 4 WEEKS
    # --------------------------------------------------------

    weeks = (
        db.query(
            models.DiseaseReport.week_number
        )
        .filter(
            models.DiseaseReport.taluk_id
            == taluk_id
        )
        .distinct()
        .order_by(
            models.DiseaseReport.week_number.desc()
        )
        .limit(4)
        .all()
    )


    week_numbers = sorted(
        row[0]
        for row in weeks
    )


    trend = []

    for week in week_numbers:

        week_total = (
            db.query(
                func.sum(
                    models.DiseaseReport.cases
                )
            )
            .filter(
                models.DiseaseReport.taluk_id
                == taluk_id,

                models.DiseaseReport.week_number
                == week,
            )
            .scalar()
            or 0
        )

        trend.append(
            schemas.TrendPoint(
                week_label=week_label(
                    week
                ),
                total_cases=int(
                    week_total
                ),
            )
        )


    # --------------------------------------------------------
    # OVERALL RISK
    # --------------------------------------------------------

    overall_risk = "Low"

    if cards:

        overall_risk = max(
            cards,
            key=lambda card:
                RISK_ORDER.get(
                    card.risk_level,
                    0,
                ),
        ).risk_level


    # --------------------------------------------------------
    # TOP / DOMINANT DISEASE
    # --------------------------------------------------------

    dominant_disease = (
        cards[0].disease
        if cards
        else None
    )

    # IMPORTANT:
    # DashboardOut expects a string here,
    # NOT a DiseaseCard object.
    top_disease = dominant_disease


    # --------------------------------------------------------
    # TREND PERCENTAGE
    # --------------------------------------------------------

    trend_percentage = (
        _calculate_trend_percentage(
            trend
        )
    )


    # --------------------------------------------------------
    # LAST UPDATED
    # --------------------------------------------------------

    last_updated_at = max(
        (
            report.created_at
            for report in reports
            if report.created_at
        ),
        default=None,
    )


    # --------------------------------------------------------
    # FINAL RESPONSE
    # --------------------------------------------------------

    return schemas.DashboardOut(

        # Selected location
        taluk_id=taluk.id,
        taluk_name=taluk.name,

        # Current surveillance information
        active_cases=active_cases,
        overall_risk=overall_risk,
        top_disease=top_disease,
        trend_percentage=trend_percentage,

        # Disease information
        cards=cards,
        distribution=distribution,

        # Historical trend
        trend=trend,

        # Compatibility fields
        # Your current Dashboard.jsx uses total_cases
        # and dominant_disease.
        total_cases=active_cases,
        dominant_disease=dominant_disease,
        last_updated_at=last_updated_at,
    )


# ============================================================
# SPREAD MAP
# ============================================================

@router.get(
    "/spread-map/{taluk_id}",
    response_model=List[schemas.SpreadMapEntry],
)
def get_spread_map(
    taluk_id: int,
    db: Session = Depends(get_db),
):

    taluk = (
        db.query(
            models.Taluk
        )
        .filter(
            models.Taluk.id == taluk_id
        )
        .first()
    )

    if not taluk:

        raise HTTPException(
            status_code=404,
            detail="Taluk not found",
        )


    taluk_ids = (
        [taluk.id]
        + [
            neighbour.id
            for neighbour in taluk.neighbours
        ]
    )


    entries = []


    for tid in taluk_ids:

        target_taluk = (
            db.query(
                models.Taluk
            )
            .filter(
                models.Taluk.id == tid
            )
            .first()
        )

        if not target_taluk:
            continue


        # ----------------------------------------------------
        # LATEST PREDICTION WEEK
        # ----------------------------------------------------

        latest_week = (
            db.query(
                func.max(
                    models.Prediction.week_number
                )
            )
            .filter(
                models.Prediction.taluk_id == tid
            )
            .scalar()
        )


        predictions = []


        if latest_week is not None:

            predictions = (
                db.query(
                    models.Prediction
                )
                .filter(
                    models.Prediction.taluk_id
                    == tid,

                    models.Prediction.week_number
                    == latest_week,
                )
                .all()
            )


        # ----------------------------------------------------
        # NO PREDICTION DATA
        # ----------------------------------------------------

        if not predictions:

            entries.append(
                schemas.SpreadMapEntry(

                    taluk_id=tid,

                    taluk_name=(
                        target_taluk.name
                    ),

                    is_selected=(
                        tid == taluk_id
                    ),

                    current_cases=0,

                    predicted_cases=0,

                    risk_level="Low",

                    trend="Stable",

                    confidence=0.3,

                    top_disease=None,
                )
            )

            continue


        # ----------------------------------------------------
        # TOP PREDICTED DISEASE
        # ----------------------------------------------------

        top = max(
            predictions,
            key=lambda prediction:
                prediction.predicted_cases,
        )


        # ----------------------------------------------------
        # CURRENT CASES
        # ----------------------------------------------------

        current_cases = sum(
            prediction.current_cases
            for prediction in predictions
        )


        # ----------------------------------------------------
        # PREDICTED CASES
        # ----------------------------------------------------

        predicted_cases = sum(
            prediction.predicted_cases
            for prediction in predictions
        )


        # ----------------------------------------------------
        # OVERALL RISK
        # ----------------------------------------------------

        overall_prediction = max(
            predictions,
            key=lambda prediction:
                RISK_ORDER.get(
                    prediction.risk_level,
                    0,
                ),
        )


        # ----------------------------------------------------
        # CONFIDENCE
        # ----------------------------------------------------

        confidence_values = [
            prediction.confidence
            for prediction in predictions
            if prediction.confidence is not None
        ]


        if confidence_values:

            confidence = round(
                sum(
                    confidence_values
                )
                / len(
                    confidence_values
                ),
                2,
            )

        else:

            confidence = 0.3


        # ----------------------------------------------------
        # ADD ENTRY
        # ----------------------------------------------------

        entries.append(
            schemas.SpreadMapEntry(

                taluk_id=tid,

                taluk_name=(
                    target_taluk.name
                ),

                is_selected=(
                    tid == taluk_id
                ),

                current_cases=current_cases,

                predicted_cases=predicted_cases,

                risk_level=(
                    overall_prediction.risk_level
                ),

                trend=(
                    top.trend
                    if top.trend
                    else "Stable"
                ),

                confidence=confidence,

                top_disease=top.disease,
            )
        )


    return entries


# ============================================================
# ADVICE
# ============================================================

@router.get(
    "/advice/{taluk_id}",
    response_model=schemas.AdviceOut,
)
def get_advice(
    taluk_id: int,
    db: Session = Depends(get_db),
):

    taluk = (
        db.query(
            models.Taluk
        )
        .filter(
            models.Taluk.id == taluk_id
        )
        .first()
    )


    if not taluk:

        raise HTTPException(
            status_code=404,
            detail="Taluk not found",
        )


    reports, latest_week = (
        _latest_week_reports(
            db,
            taluk_id,
        )
    )


    if not reports:

        return schemas.AdviceOut(

            taluk_id=taluk_id,

            top_disease=None,

            tips=[
                "No reports submitted yet for this taluk. General hygiene and mosquito-control practices are always advisable."
            ],

            agent_notes=None,
        )


    aggregated = (
        _aggregate_reports_by_disease(
            reports
        )
    )


    top_disease = max(
        aggregated.items(),
        key=lambda item:
            item[1]["cases"],
    )[0]


    tips = ADVICE_LIBRARY.get(
        top_disease,
        [],
    )


    latest_report = max(
        reports,
        key=lambda report:
            report.created_at or 0,
    )


    return schemas.AdviceOut(

        taluk_id=taluk_id,

        top_disease=top_disease,

        tips=tips,

        agent_notes=(
            latest_report.preventive_measures
            or None
        ),
    )


# ============================================================
# NOTIFICATIONS
# ============================================================

@router.get(
    "/notifications/{taluk_id}",
    response_model=List[schemas.NotificationOut],
)
def get_notifications_for_taluk(
    taluk_id: int,
    db: Session = Depends(get_db),
):

    notes = (
        db.query(
            models.Notification
        )
        .filter(
            (
                models.Notification.taluk_id
                == taluk_id
            )
            |
            (
                models.Notification.taluk_id.is_(None)
            )
        )
        .order_by(
            models.Notification.created_at.desc()
        )
        .limit(20)
        .all()
    )


    return [
        schemas.NotificationOut(

            id=note.id,

            title=note.title,

            message=note.message,

            type=note.type,

            taluk_name="Statewide",

            created_at=note.created_at,
        )

        for note in notes
    ]