"""
Run with:

    cd backend
    python -m app.seed

This recreates the SQLite database with:

- Karnataka
- 31 districts
- Complete district -> taluk hierarchy
- Demo agents for selected taluks
- Demo disease reports
- Predictions
- Notifications

The location hierarchy is available for the entire state even when
a taluk has no surveillance reports yet.
"""

import os
import random
from datetime import datetime, timedelta

from .database import Base, engine, SessionLocal
from . import models
from .auth import get_password_hash
from .ml.predict import predict_next_value, classify_risk
from .utils import current_week_number


# ============================================================
# CONFIGURATION
# ============================================================

random.seed(42)

DB_PATH = "surveillance.db"


# ============================================================
# KARNATAKA LOCATION MASTER DATA
# ============================================================

KARNATAKA_LOCATIONS = {

    "Bagalkot": [
        "Bagalkot",
        "Jamkhandi",
        "Mudhol",
        "Badami",
        "Bilagi",
        "Hungund",
        "Ilkal",
        "Rabkavi Banhatti",
        "Guledgudda",
    ],

    "Ballari": [
        "Ballari",
        "Kurugodu",
        "Kampli",
        "Sanduru",
        "Siruguppa",
    ],

    "Belagavi": [
        "Belagavi",
        "Athani",
        "Bailhongal",
        "Chikkodi",
        "Gokak",
        "Khanapur",
        "Mudalgi",
        "Nippani",
        "Raybag",
        "Saundatti",
        "Ramdurg",
        "Kagawad",
        "Hukkeri",
        "Kittur",
    ],

    "Bengaluru Urban": [
        "Bengaluru",
        "Kengeri",
        "Krishnarajapura",
        "Anekal",
        "Yelahanka",
    ],

    "Bengaluru Rural": [
        "Nelamangala",
        "Doddaballapura",
        "Devanahalli",
        "Hosakote",
    ],

    "Bidar": [
        "Aurad",
        "Basavakalyan",
        "Bhalki",
        "Bidar",
        "Chitgoppa",
        "Hulsuru",
        "Humnabad",
        "Kamalanagara",
    ],

    "Chamarajanagar": [
        "Chamarajanagar",
        "Gundlupet",
        "Kollegal",
        "Yelandur",
        "Hanur",
    ],

    "Chikkaballapur": [
        "Chikkaballapur",
        "Bagepalli",
        "Chintamani",
        "Gauribidanur",
        "Gudibanda",
        "Sidlaghatta",
        "Chelur",
    ],

    "Chikkamagaluru": [
        "Chikkamagaluru",
        "Kadur",
        "Koppa",
        "Mudigere",
        "Narasimharajapura",
        "Sringeri",
        "Tarikere",
        "Ajjampura",
        "Kalasa",
    ],

    "Chitradurga": [
        "Chitradurga",
        "Challakere",
        "Hiriyur",
        "Holalkere",
        "Hosadurga",
        "Molakalmuru",
    ],

    "Dakshina Kannada": [
        "Mangaluru",
        "Ullal",
        "Mulki",
        "Moodbidri",
        "Bantwal",
        "Belthangady",
        "Puttur",
        "Sullia",
        "Kadaba",
    ],

    "Davanagere": [
        "Davanagere",
        "Harihar",
        "Channagiri",
        "Honnali",
        "Nyamathi",
        "Jagalur",
    ],

    "Dharwad": [
        "Kalghatgi",
        "Dharwad",
        "Hubballi Rural",
        "Hubballi Urban",
        "Kundgol",
        "Navalgund",
        "Alnavar",
        "Annigeri",
    ],

    "Gadag": [
        "Gadag",
        "Nargund",
        "Mundargi",
        "Ron",
        "Gajendragad",
        "Lakshmeshwar",
        "Shirahatti",
    ],

    "Hassan": [
        "Hassan",
        "Arasikere",
        "Channarayapatna",
        "Holenarasipura",
        "Sakleshpur",
        "Alur",
        "Arkalgud",
        "Belur",
    ],

    "Haveri": [
        "Ranebennur",
        "Byadgi",
        "Hangal",
        "Haveri",
        "Savanur",
        "Hirekerur",
        "Shiggaon",
        "Rattihalli",
    ],

    "Kalaburagi": [
        "Kalaburagi",
        "Afzalpur",
        "Aland",
        "Chincholi",
        "Chittapur",
        "Jevargi",
        "Sedam",
        "Kamalapur",
        "Shahabad",
        "Kalgi",
        "Yedrami",
    ],

    "Kodagu": [
        "Madikeri",
        "Somwarpet",
        "Virajpet",
        "Ponnampet",
        "Kushalnagar",
    ],

    "Kolar": [
        "Kolar",
        "Bangarapet",
        "Malur",
        "Mulbagal",
        "Srinivaspur",
        "Kolar Gold Fields",
    ],

    "Koppal": [
        "Koppal",
        "Gangavathi",
        "Kushtagi",
        "Yelburga",
        "Kanakagiri",
        "Karatagi",
        "Kuknoor",
    ],

    "Mandya": [
        "Mandya",
        "Maddur",
        "Malavalli",
        "Srirangapatna",
        "Krishnarajapete",
        "Nagamangala",
        "Pandavapura",
    ],

    "Mysuru": [
        "Mysuru",
        "Hunsur",
        "Krishnarajanagara",
        "Nanjangud",
        "Heggadadevankote",
        "Periyapatna",
        "Tirumakudalu Narasipura",
        "Saraguru",
        "Saligrama",
    ],

    "Raichur": [
        "Raichur",
        "Sindhanur",
        "Manvi",
        "Devadurga",
        "Lingasugur",
        "Mudgal",
        "Maski",
        "Sirwar",
    ],

    "Ramanagara": [
        "Ramanagara",
        "Magadi",
        "Kanakapura",
        "Channapatna",
        "Harohalli",
    ],

    "Shivamogga": [
        "Shivamogga",
        "Sagara",
        "Bhadravati",
        "Hosanagara",
        "Shikaripura",
        "Soraba",
        "Thirthahalli",
    ],

    "Tumakuru": [
        "Tumakuru",
        "Chikkanayakanahalli",
        "Kunigal",
        "Madhugiri",
        "Sira",
        "Tiptur",
        "Gubbi",
        "Koratagere",
        "Pavagada",
        "Turuvekere",
    ],

    "Udupi": [
        "Udupi",
        "Kapu",
        "Byndoor",
        "Karkala",
        "Kundapura",
        "Hebri",
        "Brahmavara",
    ],

    "Uttara Kannada": [
        "Karwar",
        "Sirsi",
        "Joida",
        "Dandeli",
        "Bhatkal",
        "Kumta",
        "Ankola",
        "Haliyal",
        "Honnavar",
        "Mundgod",
        "Siddapur",
        "Yellapur",
    ],

    "Vijayapura": [
        "Vijayapura",
        "Indi",
        "Basavana Bagewadi",
        "Sindagi",
        "Muddebihal",
        "Talikote",
        "Devara Hipparagi",
        "Chadchan",
        "Tikota",
        "Babaleshwar",
        "Kolhar",
        "Nidagundi",
        "Almel",
    ],

    "Yadgir": [
        "Yadgir",
        "Shahapur",
        "Shorapur",
        "Gurmitkal",
        "Vadagera",
        "Hunsagi",
    ],

    "Vijayanagara": [
        "Hosapete",
        "Hagaribommanahalli",
        "Harapanahalli",
        "Hoovina Hadagali",
        "Kudligi",
        "Kottur",
    ],
}


# ============================================================
# DEMO SURVEILLANCE TALUKS
# ============================================================

DEMO_TALUKS = {
    "Madikeri",
    "Somwarpet",
    "Virajpet",
    "Kushalnagar",
    "Mysuru",
    "Hunsur",
    "Nanjangud",
    "Tirumakudalu Narasipura",
}


# ============================================================
# DATABASE RESET
# ============================================================

def reset_db():
    """
    Delete the existing SQLite database and recreate all tables.
    """

    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)

    Base.metadata.create_all(bind=engine)


# ============================================================
# TALUK ADJACENCY HELPER
# ============================================================

def add_adjacency(db, taluk_a, taluk_b):
    """
    Creates a bidirectional adjacency relationship.

    Example:

        Madikeri -> Virajpet
        Virajpet -> Madikeri

    Adjacency is stored in the TalukAdjacency table.
    """

    existing_ab = (
        db.query(models.TalukAdjacency)
        .filter(
            models.TalukAdjacency.taluk_id == taluk_a.id,
            models.TalukAdjacency.adjacent_taluk_id
            == taluk_b.id,
        )
        .first()
    )

    if existing_ab is None:

        db.add(
            models.TalukAdjacency(
                taluk_id=taluk_a.id,
                adjacent_taluk_id=taluk_b.id,
            )
        )

    existing_ba = (
        db.query(models.TalukAdjacency)
        .filter(
            models.TalukAdjacency.taluk_id == taluk_b.id,
            models.TalukAdjacency.adjacent_taluk_id
            == taluk_a.id,
        )
        .first()
    )

    if existing_ba is None:

        db.add(
            models.TalukAdjacency(
                taluk_id=taluk_b.id,
                adjacent_taluk_id=taluk_a.id,
            )
        )


# ============================================================
# SEED
# ============================================================

def seed():

    reset_db()

    db = SessionLocal()

    try:

        # ====================================================
        # STATE
        # ====================================================

        karnataka = models.State(
            name="Karnataka"
        )

        db.add(karnataka)
        db.flush()

        # ====================================================
        # DISTRICTS + TALUKS
        # ====================================================

        districts_by_name = {}
        taluks_by_name = {}

        for district_name, taluk_names in KARNATAKA_LOCATIONS.items():

            district = models.District(
                name=district_name,
                state_id=karnataka.id,
            )

            db.add(district)
            db.flush()

            districts_by_name[district_name] = district

            for taluk_name in taluk_names:

                taluk = models.Taluk(
                    name=taluk_name,
                    district_id=district.id,
                )

                db.add(taluk)
                db.flush()

                taluks_by_name[taluk_name] = taluk

        # ====================================================
        # TALUK ADJACENCY
        # ====================================================

        add_adjacency(
            db,
            taluks_by_name["Virajpet"],
            taluks_by_name["Madikeri"],
        )

        add_adjacency(
            db,
            taluks_by_name["Madikeri"],
            taluks_by_name["Somwarpet"],
        )

        add_adjacency(
            db,
            taluks_by_name["Madikeri"],
            taluks_by_name["Hunsur"],
        )

        # Kushalnagar is connected to the Kodagu surveillance
        # network so neighbouring disease activity can influence
        # its predictions.
        add_adjacency(
            db,
            taluks_by_name["Madikeri"],
            taluks_by_name["Kushalnagar"],
        )

        add_adjacency(
            db,
            taluks_by_name["Somwarpet"],
            taluks_by_name["Kushalnagar"],
        )

        add_adjacency(
            db,
            taluks_by_name["Hunsur"],
            taluks_by_name["Mysuru"],
        )

        add_adjacency(
            db,
            taluks_by_name["Mysuru"],
            taluks_by_name["Tirumakudalu Narasipura"],
        )

        add_adjacency(
            db,
            taluks_by_name["Hunsur"],
            taluks_by_name["Somwarpet"],
        )

        add_adjacency(
            db,
            taluks_by_name["Mysuru"],
            taluks_by_name["Nanjangud"],
        )

        db.flush()

        # ====================================================
        # USERS
        # ====================================================

        admin_user = models.User(
            username="admin",
            password_hash=get_password_hash(
                "admin123"
            ),
            full_name="State Health Administrator",
            role="admin",
            is_active=True,
        )

        citizen_user = models.User(
            username="citizen",
            password_hash=get_password_hash(
                "citizen123"
            ),
            full_name="Demo Citizen",
            role="user",
            is_active=True,
        )

        db.add_all(
            [
                admin_user,
                citizen_user,
            ]
        )

        db.flush()

        # ====================================================
        # DEMO AGENTS
        # ====================================================

        agent_seed_names = {

            "Virajpet":
                "Ravi Kumar",

            "Madikeri":
                "Anitha Poovaiah",

            "Somwarpet":
                "Suresh Nanjappa",

            "Kushalnagar":
                "Kushalnagar Health Officer",

            "Mysuru":
                "Lakshmi Devaraj",

            "Hunsur":
                "Manjunath Gowda",

            "Nanjangud":
                "Prakash Gowda",

            "Tirumakudalu Narasipura":
                "Deepa Shivanna",
        }

        agents_by_taluk = {}

        for taluk_name in sorted(DEMO_TALUKS):

            taluk = taluks_by_name[taluk_name]

            agent_name = agent_seed_names[taluk_name]

            username = (
                "agent_"
                + taluk_name.lower()
                .replace(" ", "")
                .replace("-", "")
            )

            user = models.User(
                username=username,
                password_hash=get_password_hash(
                    "agent123"
                ),
                full_name=agent_name,
                role="agent",
                is_active=True,
            )

            db.add(user)
            db.flush()

            agent = models.Agent(
                user_id=user.id,
                taluk_id=taluk.id,
            )

            db.add(agent)
            db.flush()

            agents_by_taluk[taluk.id] = agent

        # ====================================================
        # DISEASE REPORT PROFILES
        # ====================================================

        base_profile = {

            "Virajpet": {
                "Dengue": (18, +6),
                "Malaria": (6, +1),
                "Typhoid": (3, 0),
                "Influenza": (10, -1),
                "Chikungunya": (2, 0),
            },

            "Madikeri": {
                "Dengue": (24, +8),
                "Malaria": (9, +2),
                "Typhoid": (4, +1),
                "Influenza": (14, -2),
                "Chikungunya": (3, +1),
            },

            "Somwarpet": {
                "Dengue": (8, +2),
                "Malaria": (4, 0),
                "Typhoid": (2, 0),
                "Influenza": (7, -1),
                "Chikungunya": (1, 0),
            },

            # ------------------------------------------------
            # KUSHALNAGAR
            #
            # Dengue is intentionally the dominant disease
            # for the precautionary-measures demonstration.
            # ------------------------------------------------
            "Kushalnagar": {
                "Dengue": (32, +8),
                "Malaria": (14, +3),
                "Typhoid": (5, +1),
                "Influenza": (9, -1),
                "Chikungunya": (4, +1),
            },

            "Mysuru": {
                "Dengue": (40, +10),
                "Malaria": (12, -1),
                "Typhoid": (9, +2),
                "Influenza": (22, -3),
                "Chikungunya": (5, +2),
            },

            "Hunsur": {
                "Dengue": (15, +4),
                "Malaria": (7, +1),
                "Typhoid": (3, 0),
                "Influenza": (9, -1),
                "Chikungunya": (2, 0),
            },

            "Nanjangud": {
                "Dengue": (22, +5),
                "Malaria": (6, +1),
                "Typhoid": (4, 0),
                "Influenza": (10, -1),
                "Chikungunya": (3, +1),
            },

            "Tirumakudalu Narasipura": {
                "Dengue": (10, +1),
                "Malaria": (5, 0),
                "Typhoid": (2, 0),
                "Influenza": (6, 0),
                "Chikungunya": (1, 0),
            },
        }

        # ====================================================
        # HISTORICAL REPORTS
        # ====================================================

        week = current_week_number()

        week_numbers = [
            week - 3,
            week - 2,
            week - 1,
            week,
        ]

        current_year = datetime.utcnow().year

        for taluk_name, disease_profiles in base_profile.items():

            taluk = taluks_by_name[taluk_name]

            agent = agents_by_taluk[taluk.id]

            for disease, (
                base,
                weekly_delta,
            ) in disease_profiles.items():

                for i, wk in enumerate(week_numbers):

                    noise = random.randint(
                        -2,
                        2,
                    )

                    cases = max(
                        0,
                        base
                        + weekly_delta * i
                        + noise,
                    )

                    severity = (
                        "Low"
                        if cases < 10
                        else
                        "Moderate"
                        if cases < 30
                        else
                        "High"
                    )

                    # Disease-specific preventive guidance.
                    if disease == "Dengue":

                        preventive_measures = (
                            "Remove standing water; "
                            "clean water containers regularly; "
                            "use screens and mosquito nets; "
                            "use mosquito repellents; "
                            "wear protective clothing; "
                            "keep surroundings clean."
                        )

                    elif disease == "Malaria":

                        preventive_measures = (
                            "Use mosquito nets; "
                            "use mosquito repellents; "
                            "wear protective clothing; "
                            "use window and door screens; "
                            "remove standing water; "
                            "keep surroundings clean."
                        )

                    elif disease == "Chikungunya":

                        preventive_measures = (
                            "Remove standing water; "
                            "use screens and mosquito nets; "
                            "use mosquito repellents; "
                            "wear protective clothing; "
                            "rest during the daytime when unwell; "
                            "keep surroundings clean."
                        )

                    elif disease == "COVID-19":

                        preventive_measures = (
                            "Wear a mask when appropriate; "
                            "maintain hand hygiene; "
                            "maintain physical distance; "
                            "avoid touching your face; "
                            "stay home when unwell; "
                            "keep vaccinations up to date."
                        )

                    elif disease == "Influenza":

                        preventive_measures = (
                            "Practice respiratory hygiene; "
                            "maintain hand hygiene; "
                            "wear a mask when appropriate; "
                            "keep indoor spaces well ventilated; "
                            "avoid touching your face; "
                            "stay home when unwell; "
                            "maintain a healthy lifestyle; "
                            "keep vaccinations up to date."
                        )

                    elif disease == "Typhoid":

                        preventive_measures = (
                            "Wash hands regularly; "
                            "drink safe water; "
                            "eat properly prepared food; "
                            "maintain food hygiene; "
                            "keep surroundings clean; "
                            "follow local health guidance."
                        )

                    else:

                        preventive_measures = (
                            "Follow verified local health "
                            "guidance and recommended "
                            "preventive measures."
                        )

                    report = models.DiseaseReport(

                        taluk_id=taluk.id,

                        agent_id=agent.id,

                        disease=disease,

                        cases=cases,

                        severity=severity,

                        remarks=(
                            "Auto-generated seed data "
                            "for demo purposes."
                            if i < 3
                            else
                            "Latest field verification complete."
                        ),

                        preventive_measures=(
                            preventive_measures
                        ),

                        week_number=wk,

                        year=current_year,

                        created_at=(
                            datetime.utcnow()
                            - timedelta(
                                weeks=(
                                    len(week_numbers)
                                    - 1
                                    - i
                                )
                            )
                        ),

                        updated_at=datetime.utcnow(),
                    )

                    db.add(report)

        db.commit()

        # ====================================================
        # NOTIFICATIONS
        # ====================================================

        notifications = [

            models.Notification(
                title=(
                    "Statewide Dengue Awareness Drive"
                ),

                message=(
                    "Health department launches a "
                    "state-wide dengue awareness and "
                    "source-reduction campaign this week."
                ),

                type="Awareness Campaign",

                taluk_id=None,
            ),

            models.Notification(
                title=(
                    "Free Health Camp - Madikeri"
                ),

                message=(
                    "A free health camp with fever screening "
                    "will be held at Madikeri Government "
                    "Hospital this Saturday."
                ),

                type="Health Camp",

                taluk_id=(
                    taluks_by_name["Madikeri"].id
                ),
            ),

            models.Notification(
                title=(
                    "Emergency Alert - Mysuru Dengue Spike"
                ),

                message=(
                    "Cases have risen sharply in Mysuru "
                    "taluk. Residents are urged to eliminate "
                    "standing water immediately."
                ),

                type="Emergency Alert",

                taluk_id=(
                    taluks_by_name["Mysuru"].id
                ),
            ),

            models.Notification(
                title=(
                    "Kushalnagar Dengue Precaution Advisory"
                ),

                message=(
                    "Dengue activity is currently elevated "
                    "in Kushalnagar. Residents are advised "
                    "to remove standing water and follow "
                    "mosquito-bite prevention measures."
                ),

                type="Awareness Campaign",

                taluk_id=(
                    taluks_by_name["Kushalnagar"].id
                ),
            ),
        ]

        db.add_all(notifications)

        db.commit()

        # ====================================================
        # INITIAL PREDICTIONS
        # ====================================================

        for taluk_name in sorted(DEMO_TALUKS):

            taluk = taluks_by_name[taluk_name]

            for disease in models.DISEASES:

                history_rows = (
                    db.query(
                        models.DiseaseReport
                    )
                    .filter(
                        models.DiseaseReport.taluk_id
                        == taluk.id,

                        models.DiseaseReport.disease
                        == disease,
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

                # --------------------------------------------
                # Find adjacent taluks using adjacency table
                # --------------------------------------------

                adjacency_rows = (
                    db.query(
                        models.TalukAdjacency
                    )
                    .filter(
                        models.TalukAdjacency.taluk_id
                        == taluk.id
                    )
                    .all()
                )

                neighbour_cases = []

                for adjacency in adjacency_rows:

                    neighbour_id = (
                        adjacency.adjacent_taluk_id
                    )

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

                        neighbour_cases.append(
                            latest.cases
                        )

                # --------------------------------------------
                # Calculate neighbouring average
                # --------------------------------------------

                neighbour_avg = (
                    sum(neighbour_cases)
                    / len(neighbour_cases)
                    if neighbour_cases
                    else None
                )

                # --------------------------------------------
                # ML prediction
                # --------------------------------------------

                predicted, confidence, trend = (
                    predict_next_value(
                        history,
                        neighbour_avg,
                    )
                )

                risk = classify_risk(
                    predicted
                )

                prediction = models.Prediction(

                    taluk_id=taluk.id,

                    disease=disease,

                    current_cases=current_cases,

                    predicted_cases=predicted,

                    risk_level=risk,

                    trend=trend,

                    confidence=confidence,

                    week_number=week,

                    year=current_year,

                    created_at=datetime.utcnow(),
                )

                db.add(prediction)

        db.commit()

        # ====================================================
        # SUMMARY
        # ====================================================

        total_districts = len(
            KARNATAKA_LOCATIONS
        )

        total_taluks = sum(
            len(taluks)
            for taluks in KARNATAKA_LOCATIONS.values()
        )

        total_reports = (
            db.query(
                models.DiseaseReport
            ).count()
        )

        total_predictions = (
            db.query(
                models.Prediction
            ).count()
        )

        total_adjacencies = (
            db.query(
                models.TalukAdjacency
            ).count()
        )

        taluk_names = sorted(
            DEMO_TALUKS
        )

        # ====================================================
        # SUCCESS OUTPUT
        # ====================================================

        print()
        print("=" * 60)
        print("SEED COMPLETE")
        print("=" * 60)

        print(
            f"State          : Karnataka"
        )

        print(
            f"Districts      : {total_districts}"
        )

        print(
            f"Taluks         : {total_taluks}"
        )

        print(
            f"Demo Taluks    : {len(DEMO_TALUKS)}"
        )

        print(
            f"Disease Reports: {total_reports}"
        )

        print(
            f"Predictions    : {total_predictions}"
        )

        print(
            f"Adjacency Links: {total_adjacencies}"
        )

        print()

        print("LOGIN CREDENTIALS")
        print("-" * 60)

        print(
            "Admin   -> admin / admin123"
        )

        print(
            "Citizen -> citizen / citizen123"
        )

        print()

        print("DEMO AGENTS")
        print("-" * 60)

        for taluk_name in taluk_names:

            username = (
                "agent_"
                + taluk_name.lower()
                .replace(" ", "")
                .replace("-", "")
            )

            print(
                f"Agent -> {username:<35}"
                f" / agent123"
                f" ({taluk_name})"
            )

        print("=" * 60)
        print()

    except Exception:

        db.rollback()

        raise

    finally:

        db.close()


# ============================================================
# ENTRY POINT
# ============================================================

if __name__ == "__main__":
    seed()