from typing import Any, Dict, List, Optional

from sqlalchemy import or_
from sqlalchemy.orm import Session

from .. import models


# ============================================================
# SAFETY STATUS
# ============================================================

SAFE = "SUITABLE"
CAUTION = "CAUTION"
NOT_RECOMMENDED = "NOT_RECOMMENDED"
CONTRAINDICATED = "CONTRAINDICATED"
UNKNOWN = "UNKNOWN"


# ============================================================
# CONTEXT KEYWORDS
# ============================================================

CONDITION_KEYWORDS = {

    "diabetes": [
        "diabetic",
        "diabetes",
        "diabetes patient",
        "diabetic patient",
    ],

    "hypertension": [
        "hypertension",
        "high blood pressure",
        "bp patient",
    ],

    "kidney_disease": [
        "kidney disease",
        "kidney problem",
        "renal disease",
        "kidney patient",
    ],

    "liver_disease": [
        "liver disease",
        "liver problem",
        "hepatic disease",
        "liver patient",
    ],

    "heart_disease": [
        "heart disease",
        "heart problem",
        "cardiac patient",
        "heart patient",
    ],

    "asthma": [
        "asthma",
        "asthmatic",
        "asthma patient",
    ],

    "immunocompromised": [
        "immunocompromised",
        "weak immune system",
        "immunosuppressed",
        "low immunity",
    ],

    "older_adult": [
        "elderly",
        "older adult",
        "senior",
        "old person",
        "old patient",
    ],

    "child": [
        "child",
        "children",
        "kid",
        "for my child",
        "child patient",
    ],

    "infant": [
        "infant",
        "baby",
        "newborn",
        "under 1 year",
        "under one year",
    ],

    "allergy": [
        "allergy",
        "allergic",
        "allergic patient",
    ],

    "medication_interaction": [
        "taking medication",
        "taking medicines",
        "on medication",
        "on medicines",
        "medicine interaction",
        "drug interaction",
    ],
}


# ============================================================
# NORMALIZATION
# ============================================================

def normalize_text(
    value: Optional[str],
) -> str:

    return " ".join(
        (value or "")
        .lower()
        .strip()
        .split()
    )


# ============================================================
# CONTEXT DETECTION
# ============================================================

def parse_context(
    query: str,
) -> Dict[str, Any]:

    text = normalize_text(query)

    conditions: List[str] = []

    for condition, keywords in CONDITION_KEYWORDS.items():

        if any(
            keyword in text
            for keyword in keywords
        ):
            conditions.append(condition)

    pregnancy = any(
        keyword in text
        for keyword in [
            "pregnant",
            "pregnancy",
            "during pregnancy",
            "pregnant woman",
            "pregnant patient",
            "expecting mother",
        ]
    )

    breastfeeding = any(
        keyword in text
        for keyword in [
            "breastfeeding",
            "breast feeding",
            "lactating",
            "nursing mother",
            "breastfeeding mother",
        ]
    )

    if pregnancy:
        conditions.append("pregnancy")

    if breastfeeding:
        conditions.append("breastfeeding")

    conditions = list(
        dict.fromkeys(conditions)
    )

    return {
        "conditions": conditions,

        "pregnancy": pregnancy,

        "breastfeeding": breastfeeding,

        "age": (
            "infant"
            if "infant" in conditions
            else (
                "child"
                if "child" in conditions
                else (
                    "older_adult"
                    if "older_adult"
                    in conditions
                    else None
                )
            )
        ),
    }


# ============================================================
# GET SAFETY RULES
# ============================================================

def get_rules(
    db: Session,
    remedy_id: int,
):

    return (
        db.query(
            models.HomeReliefSafetyRule
        )
        .filter(
            models.HomeReliefSafetyRule.remedy_id
            == remedy_id
        )
        .order_by(
            models.HomeReliefSafetyRule.id.asc()
        )
        .all()
    )


# ============================================================
# GET ALTERNATIVES
# ============================================================

def get_alternatives(
    db: Session,
    remedy_id: int,
):

    rows = (
        db.query(
            models.HomeReliefAlternative
        )
        .filter(
            models.HomeReliefAlternative.remedy_id
            == remedy_id
        )
        .order_by(
            models.HomeReliefAlternative.priority.asc()
        )
        .all()
    )

    alternatives = []

    for row in rows:

        alternative = (
            db.query(
                models.HomeReliefRemedy
            )
            .filter(
                models.HomeReliefRemedy.id
                == row.alternative_remedy_id,

                models.HomeReliefRemedy.status
                == "ACTIVE",
            )
            .first()
        )

        if alternative:
            alternatives.append(
                (
                    row,
                    alternative,
                )
            )

    return alternatives


# ============================================================
# SAFETY EVALUATION
# ============================================================

def evaluate_remedy(
    db: Session,
    remedy,
    context: Dict[str, Any],
) -> Dict[str, Any]:

    matched = []

    final_status = SAFE

    for rule in get_rules(
        db,
        remedy.id,
    ):

        condition = normalize_text(
            rule.condition_type
        )

        if (
            condition
            not in context.get(
                "conditions",
                [],
            )
        ):
            continue

        matched.append(rule)

        status = (
            rule.suitability
            or UNKNOWN
        ).upper().strip()

        if status == CONTRAINDICATED:

            final_status = CONTRAINDICATED

        elif (
            status == NOT_RECOMMENDED
            and final_status
            != CONTRAINDICATED
        ):

            final_status = NOT_RECOMMENDED

        elif (
            status == CAUTION
            and final_status == SAFE
        ):

            final_status = CAUTION

        elif (
            status == UNKNOWN
            and final_status == SAFE
        ):

            final_status = UNKNOWN

    return {
        "status": final_status,

        "matched_rules": [
            {
                "id": rule.id,

                "condition_type":
                    rule.condition_type,

                "condition_value":
                    rule.condition_value,

                "suitability":
                    rule.suitability,

                "severity":
                    rule.severity,

                "reason":
                    rule.reason,

                "alternative_remedy_id":
                    rule.alternative_remedy_id,
            }

            for rule in matched
        ],
    }


# ============================================================
# SEARCH DATABASE
# ============================================================

def search_remedies(
    db: Session,
    query: str,
):

    text = normalize_text(query)

    terms = [
        term
        for term in text.split()
        if len(term) > 2
    ]

    if not terms:
        return []

    clauses = []

    for term in terms:

        clauses.extend(
            [
                models.HomeReliefRemedy.name.ilike(
                    f"%{term}%"
                ),

                models.HomeReliefRemedy.disease.ilike(
                    f"%{term}%"
                ),

                models.HomeReliefRemedy.symptom.ilike(
                    f"%{term}%"
                ),

                models.HomeReliefRemedy.aliases.ilike(
                    f"%{term}%"
                ),
            ]
        )

    return (
        db.query(
            models.HomeReliefRemedy
        )
        .filter(
            models.HomeReliefRemedy.status
            == "ACTIVE"
        )
        .filter(
            or_(*clauses)
        )
        .order_by(
            models.HomeReliefRemedy.name.asc()
        )
        .distinct()
        .all()
    )


# ============================================================
# SERIALIZE
# ============================================================

def serialize_remedy(
    db: Session,
    remedy,
    context=None,
):

    if context is None:

        context = {
            "conditions": [],
            "pregnancy": False,
            "breastfeeding": False,
        }

    evaluation = evaluate_remedy(
        db,
        remedy,
        context,
    )

    all_rules = get_rules(
        db,
        remedy.id,
    )

    alternatives = []

    for rule in evaluation[
        "matched_rules"
    ]:

        alternative_id = (
            rule.get(
                "alternative_remedy_id"
            )
        )

        if not alternative_id:
            continue

        alternative = (
            db.query(
                models.HomeReliefRemedy
            )
            .filter(
                models.HomeReliefRemedy.id
                == alternative_id,

                models.HomeReliefRemedy.status
                == "ACTIVE",
            )
            .first()
        )

        if not alternative:
            continue

        alt_eval = evaluate_remedy(
            db,
            alternative,
            context,
        )

        if alt_eval["status"] == SAFE:

            alternatives.append(
                {
                    "id": alternative.id,
                    "name": alternative.name,
                    "description":
                        alternative.description,
                    "instructions":
                        alternative.instructions,
                    "expected_benefit":
                        alternative.expected_benefit,
                }
            )

    for _, alternative in get_alternatives(
        db,
        remedy.id,
    ):

        alt_eval = evaluate_remedy(
            db,
            alternative,
            context,
        )

        if alt_eval["status"] == SAFE:

            alternatives.append(
                {
                    "id": alternative.id,
                    "name": alternative.name,
                    "description":
                        alternative.description,
                    "instructions":
                        alternative.instructions,
                    "expected_benefit":
                        alternative.expected_benefit,
                }
            )

    unique_alternatives = {
        item["id"]: item
        for item in alternatives
    }

    return {

        "id": remedy.id,

        "name": remedy.name,

        "disease": remedy.disease,

        "symptom": remedy.symptom,

        "aliases": remedy.aliases,

        "category": remedy.category,

        "description":
            remedy.description,

        "instructions":
            remedy.instructions,

        "expected_benefit":
            remedy.expected_benefit,

        "medical_rationale":
            remedy.medical_rationale,

        "possible_side_effects":
            remedy.possible_side_effects,

        "general_safety_notes":
            remedy.general_safety_notes,

        "red_flags":
            remedy.red_flags,

        "when_to_seek_care":
            remedy.when_to_seek_care,

        "status":
            remedy.status,

        "created_at":
            remedy.created_at,

        "approved_at":
            remedy.approved_at,

        "last_reviewed_at":
            remedy.last_reviewed_at,

        "safety":
            evaluation,

        "safety_rules": [
            {
                "id": rule.id,

                "condition_type":
                    rule.condition_type,

                "condition_value":
                    rule.condition_value,

                "suitability":
                    rule.suitability,

                "severity":
                    rule.severity,

                "reason":
                    rule.reason,

                "alternative_remedy_id":
                    rule.alternative_remedy_id,
            }

            for rule in all_rules
        ],

        "has_safety_restrictions":
            bool(all_rules),

        "alternatives":
            list(
                unique_alternatives.values()
            ),
    }


# ============================================================
# PUBLIC SEARCH
# ============================================================

def search_home_relief(
    db: Session,
    query: str,
) -> Dict[str, Any]:

    context = parse_context(
        query
    )

    remedies = search_remedies(
        db,
        query,
    )

    recommended = []

    caution = []

    restricted = []

    alternatives = []

    for remedy in remedies:

        item = serialize_remedy(
            db,
            remedy,
            context,
        )

        status = (
            item["safety"]["status"]
        )

        if status == SAFE:

            recommended.append(item)

        elif status == CAUTION:

            caution.append(item)

        else:

            restricted.append(item)

            alternatives.extend(
                item.get(
                    "alternatives",
                    [],
                )
            )

    unique_alternatives = {
        item["id"]: item
        for item in alternatives
    }

    return {

        "query": query,

        "context": context,

        "recommended":
            recommended,

        "use_with_caution":
            caution,

        "restricted":
            restricted,

        "alternatives":
            list(
                unique_alternatives.values()
            ),

        "total_found":
            len(remedies),

        "safety_filter_applied":
            bool(
                context.get(
                    "conditions"
                )
            ),
    }


# ============================================================
# CHATBOT KNOWLEDGE CONTEXT
# ============================================================

def build_chat_home_relief_context(
    db: Session,
    message: str,
) -> str:

    result = search_home_relief(
        db,
        message,
    )

    if (
        not result["recommended"]
        and not result["use_with_caution"]
        and not result["alternatives"]
    ):
        return ""

    lines = [
        "APPROVED HOME RELIEF KNOWLEDGE BASE:",

        (
            "Use only Medical Supervisor-approved "
            "supportive-care information."
        ),

        (
            "Do not invent remedies and do not "
            "override safety restrictions."
        ),
    ]

    for item in result[
        "recommended"
    ]:

        lines.extend(
            [
                f"\nRemedy: {item['name']}",

                (
                    "Description: "
                    + item["description"]
                ),

                (
                    "Instructions: "
                    + item["instructions"]
                ),
            ]
        )

        if item.get(
            "expected_benefit"
        ):

            lines.append(
                "Expected benefit: "
                + item[
                    "expected_benefit"
                ]
            )

        if item.get(
            "general_safety_notes"
        ):

            lines.append(
                "Safety notes: "
                + item[
                    "general_safety_notes"
                ]
            )

        if item.get(
            "when_to_seek_care"
        ):

            lines.append(
                "When to seek care: "
                + item[
                    "when_to_seek_care"
                ]
            )

    for item in result[
        "use_with_caution"
    ]:

        lines.extend(
            [
                (
                    "\nCautionary remedy: "
                    + item["name"]
                ),

                (
                    "Information: "
                    + item["description"]
                ),
            ]
        )

        for rule in item[
            "safety"
        ][
            "matched_rules"
        ]:

            if rule.get("reason"):

                lines.append(
                    "Caution reason: "
                    + rule["reason"]
                )

    for item in result[
        "restricted"
    ]:

        lines.append(
            "\nRestricted remedy: "
            + item["name"]
        )

        for rule in item[
            "safety"
        ][
            "matched_rules"
        ]:

            if rule.get("reason"):

                lines.append(
                    "Restriction reason: "
                    + rule["reason"]
                )

    lines.append(
        "\nIf no suitable approved option exists, "
        "clearly say that none is currently available "
        "rather than suggesting an unapproved remedy."
    )

    return "\n".join(lines)