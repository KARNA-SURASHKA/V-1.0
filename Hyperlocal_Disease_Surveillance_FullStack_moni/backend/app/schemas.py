from typing import Optional, List
from datetime import datetime

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    model_validator,
)


# ============================================================================
# AUTHENTICATION
# ============================================================================

class LoginRequest(BaseModel):
    username: str
    password: str
    role: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

    role: Optional[str] = None
    username: Optional[str] = None
    full_name: Optional[str] = None
    taluk_id: Optional[int] = None
    taluk_name: Optional[str] = None


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

    role: Optional[str] = None
    username: Optional[str] = None
    full_name: Optional[str] = None
    taluk_id: Optional[int] = None
    taluk_name: Optional[str] = None


# ============================================================================
# AGENT
# ============================================================================

class AgentCreate(BaseModel):
    username: str
    password: str
    full_name: str
    taluk_id: int


class AgentUpdate(BaseModel):
    username: Optional[str] = None
    full_name: Optional[str] = None
    password: Optional[str] = None
    taluk_id: Optional[int] = None


class AgentOut(BaseModel):
    id: int
    username: str
    full_name: str
    taluk_id: int
    taluk_name: Optional[str] = None
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# AGENT STATUS
# ============================================================================

class AgentStatusOut(BaseModel):
    id: int
    username: str
    full_name: str

    taluk_id: int
    taluk_name: Optional[str] = None

    is_active: bool

    current_week: int
    already_submitted: bool
    last_submitted_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


AgentStatusResponse = AgentStatusOut


# ============================================================================
# DISEASE REPORTS
# ============================================================================

class DiseaseReportItem(BaseModel):
    disease: str

    # Existing database field
    cases: int = 0

    # Frontend field
    confirmed_cases: Optional[int] = None

    # Surveillance field
    suspected_cases: Optional[int] = None

    severity: Optional[str] = None
    remarks: Optional[str] = None
    preventive_measures: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def normalize_cases(cls, values):

        if isinstance(values, dict):

            # Frontend sends confirmed_cases.
            # Database uses cases.
            if (
                values.get("cases") is None
                and values.get("confirmed_cases") is not None
            ):
                values["cases"] = values["confirmed_cases"]

            # Backward compatibility:
            # old frontend sends cases.
            if (
                values.get("confirmed_cases") is None
                and values.get("cases") is not None
            ):
                values["confirmed_cases"] = values["cases"]

            if values.get("cases") is None:
                values["cases"] = 0

        return values


class DiseaseReportCreate(BaseModel):
    week_number: int
    year: int
    reports: List[DiseaseReportItem]


class DiseaseReportResponse(BaseModel):
    id: int
    agent_id: int
    taluk_id: int
    disease: str
    cases: int
    week_number: int
    year: int

    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# GENERIC REPORT RESPONSE
# ============================================================================

class ReportOut(BaseModel):
    id: int
    agent_id: int
    taluk_id: int
    disease: str
    cases: int
    week_number: int
    year: int

    severity: Optional[str] = None
    remarks: Optional[str] = None
    preventive_measures: Optional[str] = None

    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# WEEKLY REPORT SUBMISSION
# ============================================================================

class WeeklyReportItem(BaseModel):
    """
    Disease entry submitted by an Agent.

    Frontend fields:
        disease
        confirmed_cases
        suspected_cases
        severity
        remarks
        preventive_measures

    Existing database field:
        cases

    confirmed_cases is normalized into cases.
    """

    disease: str

    # Existing database-compatible field
    cases: int = 0

    # Frontend field
    confirmed_cases: Optional[int] = None

    # Surveillance field
    suspected_cases: Optional[int] = None

    severity: Optional[str] = None
    remarks: Optional[str] = None
    preventive_measures: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def normalize_cases(cls, values):

        if isinstance(values, dict):

            confirmed = values.get("confirmed_cases")
            cases = values.get("cases")

            # confirmed_cases -> cases
            if cases is None and confirmed is not None:
                values["cases"] = confirmed

            # cases -> confirmed_cases
            if confirmed is None and cases is not None:
                values["confirmed_cases"] = cases

            # Never allow cases to remain None
            if values.get("cases") is None:
                values["cases"] = 0

        return values


class WeeklyReportIn(BaseModel):
    week_number: int
    year: int

    reports: List[WeeklyReportItem]

    @model_validator(mode="after")
    def validate_reports(self):

        if not self.reports:
            raise ValueError(
                "At least one disease report is required."
            )

        return self


# Compatibility aliases
WeeklyReportCreate = WeeklyReportIn
DiseaseReportIn = WeeklyReportIn


# ============================================================================
# LOCATION
# ============================================================================

class StateOut(BaseModel):
    id: int
    name: str

    model_config = ConfigDict(from_attributes=True)


class DistrictOut(BaseModel):
    id: int
    name: str
    state_id: int

    model_config = ConfigDict(from_attributes=True)


class TalukOut(BaseModel):
    id: int
    name: str
    district_id: int

    model_config = ConfigDict(from_attributes=True)


StateResponse = StateOut
DistrictResponse = DistrictOut
TalukResponse = TalukOut


# ============================================================================
# ADMIN DASHBOARD STATS
# ============================================================================

class AdminStatsOut(BaseModel):
    total_agents: int
    reports_received_this_week: int
    pending_reports_this_week: int
    total_taluks: int
    last_prediction_run: Optional[datetime] = None
    diseases_tracked: int


# ============================================================================
# WEEKLY MONITORING
# ============================================================================

class MonitoringRow(BaseModel):
    taluk_id: int
    taluk_name: str
    agent_name: str
    submitted: bool


# ============================================================================
# ADMIN DISEASE REPORTS
# ============================================================================

class AdminReportOut(BaseModel):
    id: int
    taluk_name: str
    disease: str
    cases: int
    severity: Optional[str] = None
    week_number: int
    agent_name: str
    created_at: Optional[datetime] = None


# ============================================================================
# PREDICTIONS
# ============================================================================

class PredictionResponse(BaseModel):
    id: int
    taluk_id: int
    disease: str
    predicted_cases: int
    risk_level: str
    week_number: int
    year: int

    model_config = ConfigDict(from_attributes=True)


class PredictionOut(BaseModel):
    taluk_name: str
    disease: str
    current_cases: int
    predicted_cases: int
    risk_level: str
    trend: Optional[str] = None
    confidence: Optional[float] = None


class PredictionRunResult(BaseModel):
    taluks_processed: int
    predictions_created: int
    week_number: int


# ============================================================================
# USER DASHBOARD
# ============================================================================

class DiseaseCard(BaseModel):
    disease: str
    cases: int
    risk_level: str


class TrendPoint(BaseModel):
    week_label: str
    total_cases: int


class SpreadMapEntry(BaseModel):
    taluk_id: int
    taluk_name: str
    is_selected: bool

    current_cases: int
    predicted_cases: int

    risk_level: str
    trend: str

    confidence: float
    top_disease: Optional[str] = None


class DashboardOut(BaseModel):

    taluk_id: int
    taluk_name: str

    active_cases: Optional[int] = None

    overall_risk: str = "Low"

    top_disease: Optional[str] = None

    trend_percentage: Optional[str] = None

    cards: List[DiseaseCard] = Field(
        default_factory=list
    )

    distribution: List[DiseaseCard] = Field(
        default_factory=list
    )

    trend: List[TrendPoint] = Field(
        default_factory=list
    )

    total_cases: Optional[int] = None

    dominant_disease: Optional[str] = None

    last_updated_at: Optional[datetime] = None

    @model_validator(mode="after")
    def normalize_case_count(self):

        if (
            self.active_cases is None
            and self.total_cases is not None
        ):
            self.active_cases = self.total_cases

        if (
            self.total_cases is None
            and self.active_cases is not None
        ):
            self.total_cases = self.active_cases

        return self


# ============================================================================
# ADVICE
# ============================================================================

class AdviceOut(BaseModel):
    taluk_id: int
    top_disease: Optional[str] = None
    tips: List[str]
    agent_notes: Optional[str] = None


# ============================================================================
# NOTIFICATIONS
# ============================================================================

class NotificationCreate(BaseModel):
    title: str
    message: str

    type: str = "info"

    taluk_id: Optional[int] = None

    notification_type: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def normalize_notification_type(cls, values):

        if isinstance(values, dict):

            notification_type = values.get(
                "notification_type"
            )

            notification_type_value = values.get(
                "type"
            )

            if notification_type and (
                not notification_type_value
                or notification_type_value == "info"
            ):
                values["type"] = notification_type

        return values


class NotificationOut(BaseModel):
    id: int
    title: str
    message: str
    type: str
    taluk_name: str
    created_at: Optional[datetime] = None


class NotificationResponse(BaseModel):
    id: int
    title: str
    message: str
    notification_type: str
    taluk_id: Optional[int] = None
    is_read: bool

    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# ACTIVITY LOGS
# ============================================================================

class ActivityLogOut(BaseModel):
    id: int
    user_id: Optional[int] = None
    action: str
    details: Optional[str] = None
    created_at: Optional[datetime] = None


class ActivityLogResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    action: str
    description: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# DISEASE REGISTRY / EMERGING SURVEILLANCE
# ============================================================================

class EmergingDiseaseCreate(BaseModel):
    reported_name: str = Field(
        min_length=2,
        max_length=200
    )

    suspected_cases: int = Field(
        default=0,
        ge=0
    )

    symptoms: Optional[str] = None
    description: Optional[str] = None
    observed_date: Optional[datetime] = None


class EmergingDiseaseOut(BaseModel):
    id: int
    agent_id: int
    taluk_id: int

    taluk_name: Optional[str] = None

    reported_name: str
    suspected_cases: int

    symptoms: Optional[str] = None
    description: Optional[str] = None

    observed_date: Optional[datetime] = None

    status: str

    mapped_disease_id: Optional[int] = None
    mapped_disease_name: Optional[str] = None

    review_notes: Optional[str] = None

    created_at: Optional[datetime] = None
    reviewed_at: Optional[datetime] = None

    model_config = ConfigDict(
        from_attributes=True
    )


class DiseaseRegistryOut(BaseModel):
    id: int
    name: str

    description: Optional[str] = None

    is_active: bool
    verification_status: str

    created_at: Optional[datetime] = None
    verified_at: Optional[datetime] = None

    model_config = ConfigDict(
        from_attributes=True
    )


class EmergingDiseaseReview(BaseModel):
    decision: str

    mapped_disease_id: Optional[int] = None

    new_disease_name: Optional[str] = None
    new_disease_description: Optional[str] = None

    review_notes: Optional[str] = None


# ============================================================================
# AGENT ISSUES
# ============================================================================

class AgentIssueCreate(BaseModel):
    agent_id: int

    issue_type: str = Field(
        min_length=2,
        max_length=100
    )

    severity: str = "Medium"

    description: str = Field(
        min_length=5
    )

    evidence: Optional[str] = None


class AgentIssueOut(BaseModel):
    id: int
    agent_id: int

    agent_name: Optional[str] = None

    supervisor_id: int

    issue_type: str
    severity: str
    description: str

    evidence: Optional[str] = None

    status: str

    admin_notes: Optional[str] = None

    created_at: Optional[datetime] = None
    reviewed_at: Optional[datetime] = None

    model_config = ConfigDict(
        from_attributes=True
    )


class AgentIssueReview(BaseModel):
    decision: str
    admin_notes: Optional[str] = None


# ============================================================================
# AI MEDICAL CHATBOT
# ============================================================================

class MedicalChatLocation(BaseModel):

    stateId: Optional[int] = None
    stateName: Optional[str] = None

    districtId: Optional[int] = None
    districtName: Optional[str] = None

    talukId: Optional[int] = None
    talukName: Optional[str] = None


class MedicalChatMessage(BaseModel):
    role: str
    content: str


class MedicalChatRequest(BaseModel):

    message: str

    conversation: List[MedicalChatMessage] = Field(
        default_factory=list
    )

    location: Optional[MedicalChatLocation] = None


class MedicalChatResponse(BaseModel):
    answer: str


# ============================================================================
# HOME RELIEF & SUPPORTIVE CARE
# ============================================================================

class HomeReliefSafetyRuleCreate(BaseModel):

    condition_type: str = Field(
        min_length=2,
        max_length=100
    )

    condition_value: str = Field(
        min_length=1,
        max_length=200
    )

    suitability: str = "UNKNOWN"

    severity: Optional[str] = None

    reason: Optional[str] = None

    alternative_remedy_id: Optional[int] = None


class HomeReliefSafetyRuleUpdate(BaseModel):

    condition_type: Optional[str] = Field(
        default=None,
        min_length=2,
        max_length=100
    )

    condition_value: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=200
    )

    suitability: Optional[str] = None

    severity: Optional[str] = None

    reason: Optional[str] = None

    alternative_remedy_id: Optional[int] = None


class HomeReliefCreate(BaseModel):

    name: str = Field(
        min_length=2,
        max_length=200
    )

    disease: Optional[str] = None

    symptom: Optional[str] = None

    aliases: Optional[str] = None

    category: str = "supportive_care"

    description: str = Field(
        min_length=5
    )

    instructions: str = Field(
        min_length=5
    )

    expected_benefit: Optional[str] = None

    medical_rationale: Optional[str] = None

    possible_side_effects: Optional[str] = None

    general_safety_notes: Optional[str] = None

    red_flags: Optional[str] = None

    when_to_seek_care: Optional[str] = None

    safety_rules: List[
        HomeReliefSafetyRuleCreate
    ] = Field(
        default_factory=list
    )


class HomeReliefUpdate(BaseModel):

    name: Optional[str] = None

    disease: Optional[str] = None

    symptom: Optional[str] = None

    aliases: Optional[str] = None

    category: Optional[str] = None

    description: Optional[str] = None

    instructions: Optional[str] = None

    expected_benefit: Optional[str] = None

    medical_rationale: Optional[str] = None

    possible_side_effects: Optional[str] = None

    general_safety_notes: Optional[str] = None

    red_flags: Optional[str] = None

    when_to_seek_care: Optional[str] = None

    safety_rules: Optional[
        List[HomeReliefSafetyRuleCreate]
    ] = None


class HomeReliefReject(BaseModel):

    reason: str = Field(
        min_length=3,
        max_length=2000
    )


class HomeReliefSafetyRuleOut(BaseModel):

    id: int

    condition_type: str
    condition_value: str

    suitability: str

    severity: Optional[str] = None

    reason: Optional[str] = None

    alternative_remedy_id: Optional[int] = None

    model_config = ConfigDict(
        from_attributes=True
    )


class HomeReliefOut(BaseModel):

    id: int

    name: str

    disease: Optional[str] = None

    symptom: Optional[str] = None

    aliases: Optional[str] = None

    category: str

    description: str

    instructions: str

    expected_benefit: Optional[str] = None

    medical_rationale: Optional[str] = None

    possible_side_effects: Optional[str] = None

    general_safety_notes: Optional[str] = None

    red_flags: Optional[str] = None

    when_to_seek_care: Optional[str] = None

    status: str

    created_by: Optional[int] = None

    approved_by: Optional[int] = None

    created_at: Optional[datetime] = None

    approved_at: Optional[datetime] = None

    last_reviewed_at: Optional[datetime] = None

    updated_at: Optional[datetime] = None

    safety_rules: List[
        HomeReliefSafetyRuleOut
    ] = Field(
        default_factory=list
    )

    model_config = ConfigDict(
        from_attributes=True
    )