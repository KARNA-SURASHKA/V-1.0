from typing import Any, Dict, List, Optional

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
        "kids",
    ],

    "infant": [
        "infant",
        "infants",
        "baby",
        "babies",
        "newborn",
        "newborns",
        "under 1 year",
        "under one year",
        "less than 1 year",
        "less than one year",
    ],

    "allergy": [
        "allergy",
        "allergic",
        "allergic patient",
    ],

    "medication_interaction": [
        "taking medication",
        "taking medications",
        "taking medicine",
        "taking medicines",
        "on medication",
        "on medications",
        "on medicine",
        "on medicines",
        "medicine interaction",
        "drug interaction",
    ],
}


# ============================================================
# GENERAL CONTEXT WORDS
# ============================================================

CONTEXT_WORDS = {
    "for",
    "my",
    "me",
    "patient",
    "patients",
    "person",
    "people",
    "someone",
    "someone's",
    "the",
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
# SPLIT STORED PHRASES
# ============================================================

def split_phrases(
    value: Optional[str],
) -> List[str]:

    if not value:
        return []

    normalized = (
        value
        .replace(";", ",")
        .replace("|", ",")
        .replace("\n", ",")
    )

    return [
        normalize_text(part)
        for part in normalized.split(",")
        if normalize_text(part)
    ]


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
            normalize_text(keyword) in text
            for keyword in keywords
        ):
            conditions.append(condition)

    pregnancy = any(
        normalize_text(keyword) in text
        for keyword in [
            "pregnant",
            "pregnancy",
            "during pregnancy",
            "pregnant woman",
            "pregnant patient",
            "expecting mother",
            "expecting woman",
        ]
    )

    breastfeeding = any(
        normalize_text(keyword) in text
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

    age = None

    if "infant" in conditions:
        age = "infant"
    elif "child" in conditions:
        age = "child"
    elif "older_adult" in conditions:
        age = "older_adult"

    return {
        "conditions": conditions,
        "pregnancy": pregnancy,
        "breastfeeding": breastfeeding,
        "age": age,
    }


# ============================================================
# REMOVE CONTEXT FROM SEARCH QUERY
# ============================================================
#
# Example:
#
# "Diarrhea for infants"
#
# becomes:
#
# "diarrhea"
#
# This allows the user to search for a disease/symptom while
# still supplying a safety context.
#
# ============================================================

def extract_base_search_text(
    query: str,
) -> str:

    text = normalize_text(query)

    if not text:
        return ""

    tokens = text.split()

    removable_tokens = set(
        CONTEXT_WORDS
    )

    for condition, keywords in CONDITION_KEYWORDS.items():

        for keyword in keywords:

            normalized_keyword = normalize_text(
                keyword
            )

            if not normalized_keyword:
                continue

            keyword_tokens = normalized_keyword.split()

            if len(keyword_tokens) == 1:
                removable_tokens.add(
                    keyword_tokens[0]
                )

    pregnancy_words = {
        "pregnant",
        "pregnancy",
        "woman",
        "women",
        "expecting",
        "mother",
    }

    breastfeeding_words = {
        "breastfeeding",
        "breast",
        "feeding",
        "lactating",
        "nursing",
        "mother",
    }

    removable_tokens.update(
        pregnancy_words
    )

    removable_tokens.update(
        breastfeeding_words
    )

    remaining = [
        token
        for token in tokens
        if token not in removable_tokens
    ]

    cleaned = normalize_text(
        " ".join(remaining)
    )

    return cleaned or text


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

    context_conditions = set(
        context.get(
            "conditions",
            [],
        )
    )

    for rule in get_rules(
        db,
        remedy.id,
    ):

        condition = normalize_text(
            rule.condition_type
        )

        condition_value = normalize_text(
            rule.condition_value
        )

        # ----------------------------------------------------
        # Determine whether this rule applies to current user
        # ----------------------------------------------------

        rule_matches = False

        if condition in context_conditions:
            rule_matches = True

        # ----------------------------------------------------
        # Age rules
        # ----------------------------------------------------

        if condition == "age":

            age = context.get(
                "age"
            )

            if age:

                age_aliases = {
                    "infant": [
                        "infant",
                        "infants",
                        "baby",
                        "babies",
                        "newborn",
                        "newborns",
                    ],
                    "child": [
                        "child",
                        "children",
                        "kid",
                        "kids",
                    ],
                    "older_adult": [
                        "older adult",
                        "elderly",
                        "senior",
                        "old adult",
                    ],
                }

                if any(
                    normalize_text(alias)
                    in condition_value
                    for alias in age_aliases.get(
                        age,
                        [],
                    )
                ):
                    rule_matches = True

        # ----------------------------------------------------
        # Pregnancy
        # ----------------------------------------------------

        if condition == "pregnancy":

            if context.get(
                "pregnancy",
                False,
            ):
                rule_matches = True

        # ----------------------------------------------------
        # Breastfeeding
        # ----------------------------------------------------

        if condition == "breastfeeding":

            if context.get(
                "breastfeeding",
                False,
            ):
                rule_matches = True

        if not rule_matches:
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

    if not text:
        return []

    base_text = extract_base_search_text(
        query
    )

    remedies = (
        db.query(
            models.HomeReliefRemedy
        )
        .filter(
            models.HomeReliefRemedy.status
            == "ACTIVE"
        )
        .order_by(
            models.HomeReliefRemedy.updated_at.desc()
        )
        .all()
    )

    matched = []

    for remedy in remedies:

        # ----------------------------------------------------
        # ALL SEARCH CANDIDATES
        # ----------------------------------------------------

        search_candidates = []

        search_candidates.extend(
            split_phrases(
                remedy.symptom
            )
        )

        search_candidates.extend(
            split_phrases(
                remedy.aliases
            )
        )

        if remedy.name:
            search_candidates.append(
                normalize_text(
                    remedy.name
                )
            )

        if remedy.disease:
            search_candidates.append(
                normalize_text(
                    remedy.disease
                )
            )

        search_candidates = [
            normalize_text(
                item
            )
            for item in search_candidates
            if normalize_text(item)
        ]

        # ----------------------------------------------------
        # EXACT FULL SEARCH
        # ----------------------------------------------------

        if text in search_candidates:
            matched.append(remedy)
            continue

        # ----------------------------------------------------
        # CONTEXT-AWARE SEARCH
        #
        # Example:
        # "diarrhea for infants"
        #
        # base_text:
        # "diarrhea"
        # ----------------------------------------------------

        if (
            base_text
            and base_text in search_candidates
        ):
            matched.append(remedy)
            continue

        # ----------------------------------------------------
        # MULTI-WORD STORED PHRASE MATCH
        # ----------------------------------------------------

        for candidate in search_candidates:

            if (
                text == candidate
                or base_text == candidate
            ):
                matched.append(remedy)
                break

    return matched


# ============================================================
# SERIALIZE REMEDY
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
            "age": None,
        }

    evaluation = evaluate_remedy(
        db,
        remedy,
        context,
    )

    # --------------------------------------------------------
    # IMPORTANT:
    #
    # ALWAYS return ALL safety rules.
    #
    # The citizen portal needs these rules even when the user
    # did not search with a specific population.
    #
    # Example:
    #
    # Diarrhea
    #
    # Safety Rules:
    # Age → CAUTION → Infants
    #
    # --------------------------------------------------------

    all_rules = get_rules(
        db,
        remedy.id,
    )

    alternatives = []

    # --------------------------------------------------------
    # Alternatives linked to matched safety rules
    # --------------------------------------------------------

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

        if alt_eval[
            "status"
        ] == SAFE:

            alternatives.append(
                {
                    "id":
                        alternative.id,

                    "name":
                        alternative.name,

                    "description":
                        alternative.description,

                    "instructions":
                        alternative.instructions,

                    "expected_benefit":
                        alternative.expected_benefit,
                }
            )

    # --------------------------------------------------------
    # General alternatives
    # --------------------------------------------------------

    for _, alternative in get_alternatives(
        db,
        remedy.id,
    ):

        alt_eval = evaluate_remedy(
            db,
            alternative,
            context,
        )

        if alt_eval[
            "status"
        ] == SAFE:

            alternatives.append(
                {
                    "id":
                        alternative.id,

                    "name":
                        alternative.name,

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

        "id":
            remedy.id,

        "name":
            remedy.name,

        "disease":
            remedy.disease,

        "symptom":
            remedy.symptom,

        "aliases":
            remedy.aliases,

        "category":
            remedy.category,

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

        # Current-user safety evaluation
        "safety":
            evaluation,

        # ALL recorded Medical Supervisor safety rules
        "safety_rules": [
            {
                "id":
                    rule.id,

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

        status = item[
            "safety"
        ][
            "status"
        ]

        if status == SAFE:

            recommended.append(
                item
            )

        elif status == CAUTION:

            caution.append(
                item
            )

        else:

            restricted.append(
                item
            )

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

        "query":
            query,

        "context":
            context,

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
                    + (
                        item["description"]
                        or ""
                    )
                ),

                (
                    "Instructions: "
                    + (
                        item["instructions"]
                        or ""
                    )
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
                    + (
                        item["description"]
                        or ""
                    )
                ),
            ]
        )

        for rule in item[
            "safety"
        ][
            "matched_rules"
        ]:

            if rule.get(
                "reason"
            ):

                lines.append(
                    "Caution reason: "
                    + rule[
                        "reason"
                    ]
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

            if rule.get(
                "reason"
            ):

                lines.append(
                    "Restriction reason: "
                    + rule[
                        "reason"
                    ]
                )

    lines.append(
        "\nIf no suitable approved option exists, "
        "clearly say that none is currently available "
        "rather than suggesting an unapproved remedy."
    )

    return "\n".join(
        lines
    )