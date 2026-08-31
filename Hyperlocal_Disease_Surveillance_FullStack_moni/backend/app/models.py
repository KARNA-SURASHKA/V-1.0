from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

from .database import Base


# ============================================================
# DISEASE MASTER LIST
# ============================================================

DISEASES = [
    "Dengue",
    "Malaria",
    "Typhoid",
    "Influenza",
    "Chikungunya",
]


# ============================================================
# USER
# ============================================================

class User(Base):
    __tablename__ = "users"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    username = Column(
        String,
        unique=True,
        index=True,
        nullable=False,
    )

    password_hash = Column(
        String,
        nullable=False,
    )

    full_name = Column(
        String,
        nullable=False,
    )

    role = Column(
        String,
        nullable=False,
    )

    is_active = Column(
        Boolean,
        nullable=False,
        default=True,
    )

    # District assigned to a Medical Supervisor.
    supervisor_district_id = Column(
        Integer,
        ForeignKey("districts.id"),
        nullable=True,
        index=True,
    )

    # --------------------------------------------------------
    # Relationships
    # --------------------------------------------------------

    agent = relationship(
        "Agent",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )


# ============================================================
# STATE
# ============================================================

class State(Base):
    __tablename__ = "states"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    name = Column(
        String,
        unique=True,
        nullable=False,
    )

    # --------------------------------------------------------
    # Relationships
    # --------------------------------------------------------

    districts = relationship(
        "District",
        back_populates="state",
        cascade="all, delete-orphan",
    )


# ============================================================
# DISTRICT
# ============================================================

class District(Base):
    __tablename__ = "districts"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    name = Column(
        String,
        nullable=False,
    )

    state_id = Column(
        Integer,
        ForeignKey("states.id"),
        nullable=False,
    )

    # --------------------------------------------------------
    # Relationships
    # --------------------------------------------------------

    state = relationship(
        "State",
        back_populates="districts",
    )

    taluks = relationship(
        "Taluk",
        back_populates="district",
        cascade="all, delete-orphan",
    )

    # --------------------------------------------------------
    # Constraints
    # --------------------------------------------------------

    __table_args__ = (
        UniqueConstraint(
            "name",
            "state_id",
            name="uq_district_state",
        ),
    )


# ============================================================
# TALUK
# ============================================================

class Taluk(Base):
    __tablename__ = "taluks"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    name = Column(
        String,
        nullable=False,
    )

    district_id = Column(
        Integer,
        ForeignKey("districts.id"),
        nullable=False,
    )

    # --------------------------------------------------------
    # Relationships
    # --------------------------------------------------------

    district = relationship(
        "District",
        back_populates="taluks",
    )

    agent = relationship(
        "Agent",
        back_populates="taluk",
        uselist=False,
    )

    reports = relationship(
        "DiseaseReport",
        back_populates="taluk",
    )

    emerging_reports = relationship(
        "EmergingDiseaseReport",
        back_populates="taluk",
        cascade="all, delete-orphan",
    )

    # --------------------------------------------------------
    # Adjacency relationships
    # --------------------------------------------------------

    adjacent_to = relationship(
        "TalukAdjacency",
        foreign_keys="TalukAdjacency.taluk_id",
        back_populates="taluk",
        cascade="all, delete-orphan",
    )

    adjacent_from = relationship(
        "TalukAdjacency",
        foreign_keys="TalukAdjacency.adjacent_taluk_id",
        back_populates="adjacent_taluk",
        cascade="all, delete-orphan",
    )

    # --------------------------------------------------------
    # Constraints
    # --------------------------------------------------------

    __table_args__ = (
        UniqueConstraint(
            "name",
            "district_id",
            name="uq_taluk_district",
        ),
    )


# ============================================================
# AGENT
# ============================================================

class Agent(Base):
    __tablename__ = "agents"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        unique=True,
    )

    taluk_id = Column(
        Integer,
        ForeignKey("taluks.id"),
        nullable=False,
        unique=True,
    )

    # --------------------------------------------------------
    # Relationships
    # --------------------------------------------------------

    user = relationship(
        "User",
        back_populates="agent",
    )

    taluk = relationship(
        "Taluk",
        back_populates="agent",
    )

    # ========================================================
    # IMPORTANT:
    # Disease reports submitted by this agent
    # ========================================================

    reports = relationship(
        "DiseaseReport",
        back_populates="agent",
    )

    emerging_reports = relationship(
        "EmergingDiseaseReport",
        back_populates="agent",
        cascade="all, delete-orphan",
    )

    issue_reports = relationship(
        "AgentIssueReport",
        back_populates="agent",
        cascade="all, delete-orphan",
    )


# ============================================================
# DISEASE REPORT
# ============================================================

class DiseaseReport(Base):
    __tablename__ = "disease_reports"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    agent_id = Column(
        Integer,
        ForeignKey("agents.id"),
        nullable=False,
        index=True,
    )

    taluk_id = Column(
        Integer,
        ForeignKey("taluks.id"),
        nullable=False,
        index=True,
    )

    disease = Column(
        String,
        nullable=False,
    )

    cases = Column(
        Integer,
        nullable=False,
        default=0,
    )

    # --------------------------------------------------------
    # Report metadata
    # --------------------------------------------------------

    severity = Column(
        String,
        nullable=True,
    )

    remarks = Column(
        Text,
        nullable=True,
    )

    preventive_measures = Column(
        Text,
        nullable=True,
    )

    week_number = Column(
        Integer,
        nullable=False,
    )

    year = Column(
        Integer,
        nullable=False,
        default=lambda: datetime.utcnow().year,
    )

    created_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
    )

    updated_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    # --------------------------------------------------------
    # Relationships
    # --------------------------------------------------------

    # IMPORTANT:
    # This fixes:
    #
    # AttributeError:
    # 'DiseaseReport' object has no attribute 'agent'
    #
    agent = relationship(
        "Agent",
        back_populates="reports",
    )

    taluk = relationship(
        "Taluk",
        back_populates="reports",
    )


# ============================================================
# OFFICIAL DISEASE REGISTRY
# ============================================================

class Disease(Base):
    __tablename__ = "diseases"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    name = Column(
        String,
        unique=True,
        nullable=False,
        index=True,
    )

    description = Column(
        Text,
        nullable=True,
    )

    is_active = Column(
        Boolean,
        nullable=False,
        default=True,
    )

    verification_status = Column(
        String,
        nullable=False,
        default="VERIFIED",
    )

    created_by_user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True,
    )

    verified_by_user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True,
    )

    created_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
    )

    verified_at = Column(
        DateTime,
        nullable=True,
    )

    # --------------------------------------------------------
    # Relationships
    # --------------------------------------------------------

    emerging_reports = relationship(
        "EmergingDiseaseReport",
        back_populates="mapped_disease",
        foreign_keys="EmergingDiseaseReport.mapped_disease_id",
    )


# ============================================================
# EMERGING / SUSPECTED DISEASE REPORT
# ============================================================

class EmergingDiseaseReport(Base):
    __tablename__ = "emerging_disease_reports"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    agent_id = Column(
        Integer,
        ForeignKey("agents.id"),
        nullable=False,
        index=True,
    )

    taluk_id = Column(
        Integer,
        ForeignKey("taluks.id"),
        nullable=False,
        index=True,
    )

    reported_name = Column(
        String,
        nullable=False,
    )

    suspected_cases = Column(
        Integer,
        nullable=False,
        default=0,
    )

    symptoms = Column(
        Text,
        nullable=True,
    )

    description = Column(
        Text,
        nullable=True,
    )

    observed_date = Column(
        DateTime,
        nullable=True,
    )

    status = Column(
        String,
        nullable=False,
        default="PENDING",
        index=True,
    )

    mapped_disease_id = Column(
        Integer,
        ForeignKey("diseases.id"),
        nullable=True,
        index=True,
    )

    reviewed_by_user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True,
    )

    review_notes = Column(
        Text,
        nullable=True,
    )

    reviewed_at = Column(
        DateTime,
        nullable=True,
    )

    created_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
    )

    # --------------------------------------------------------
    # Relationships
    # --------------------------------------------------------

    agent = relationship(
        "Agent",
        back_populates="emerging_reports",
    )

    taluk = relationship(
        "Taluk",
        back_populates="emerging_reports",
    )

    mapped_disease = relationship(
        "Disease",
        back_populates="emerging_reports",
        foreign_keys=[mapped_disease_id],
    )


# ============================================================
# MEDICAL SUPERVISOR -> ADMIN AGENT ISSUE REPORT
# ============================================================

class AgentIssueReport(Base):
    __tablename__ = "agent_issue_reports"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    agent_id = Column(
        Integer,
        ForeignKey("agents.id"),
        nullable=False,
        index=True,
    )

    supervisor_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    issue_type = Column(
        String,
        nullable=False,
    )

    severity = Column(
        String,
        nullable=False,
        default="Medium",
    )

    description = Column(
        Text,
        nullable=False,
    )

    evidence = Column(
        Text,
        nullable=True,
    )

    status = Column(
        String,
        nullable=False,
        default="PENDING_ADMIN_REVIEW",
        index=True,
    )

    admin_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True,
    )

    admin_notes = Column(
        Text,
        nullable=True,
    )

    created_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
    )

    reviewed_at = Column(
        DateTime,
        nullable=True,
    )

    # --------------------------------------------------------
    # Relationships
    # --------------------------------------------------------

    agent = relationship(
        "Agent",
        back_populates="issue_reports",
    )


# ============================================================
# PREDICTION
# ============================================================

class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    taluk_id = Column(
        Integer,
        ForeignKey("taluks.id"),
        nullable=False,
    )

    disease = Column(
        String,
        nullable=False,
    )

    # --------------------------------------------------------
    # Current value
    # --------------------------------------------------------

    current_cases = Column(
        Integer,
        nullable=True,
        default=0,
    )

    # --------------------------------------------------------
    # Prediction
    # --------------------------------------------------------

    predicted_cases = Column(
        Integer,
        nullable=False,
        default=0,
    )

    risk_level = Column(
        String,
        nullable=False,
    )

    # --------------------------------------------------------
    # ML metadata
    # --------------------------------------------------------

    trend = Column(
        String,
        nullable=True,
    )

    confidence = Column(
        Float,
        nullable=True,
    )

    week_number = Column(
        Integer,
        nullable=False,
    )

    year = Column(
        Integer,
        nullable=False,
        default=lambda: datetime.utcnow().year,
    )

    created_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
    )


# ============================================================
# TALUK ADJACENCY
# ============================================================

class TalukAdjacency(Base):
    __tablename__ = "taluk_adjacency"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    taluk_id = Column(
        Integer,
        ForeignKey("taluks.id"),
        nullable=False,
    )

    adjacent_taluk_id = Column(
        Integer,
        ForeignKey("taluks.id"),
        nullable=False,
    )

    # --------------------------------------------------------
    # Relationships
    # --------------------------------------------------------

    taluk = relationship(
        "Taluk",
        foreign_keys=[taluk_id],
        back_populates="adjacent_to",
    )

    adjacent_taluk = relationship(
        "Taluk",
        foreign_keys=[adjacent_taluk_id],
        back_populates="adjacent_from",
    )

    # --------------------------------------------------------
    # Constraints
    # --------------------------------------------------------

    __table_args__ = (
        UniqueConstraint(
            "taluk_id",
            "adjacent_taluk_id",
            name="uq_taluk_adjacency",
        ),
    )


# ============================================================
# ACTIVITY LOG
# ============================================================

class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True,
    )

    action = Column(
        String,
        nullable=False,
    )

    description = Column(
        Text,
        nullable=True,
    )

    # --------------------------------------------------------
    # Additional activity details
    # --------------------------------------------------------

    details = Column(
        Text,
        nullable=True,
    )

    created_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
    )


# ============================================================
# NOTIFICATION
# ============================================================

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    title = Column(
        String,
        nullable=False,
    )

    message = Column(
        Text,
        nullable=False,
    )

    # --------------------------------------------------------
    # Notification type
    # --------------------------------------------------------

    type = Column(
        String,
        nullable=False,
        default="info",
    )

    taluk_id = Column(
        Integer,
        ForeignKey("taluks.id"),
        nullable=True,
    )

    created_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
    )

    is_read = Column(
        Boolean,
        nullable=False,
        default=False,
    )

# ============================================================
# HOME RELIEF & SUPPORTIVE CARE
# ============================================================

class HomeReliefRemedy(Base):
    __tablename__ = "home_relief_remedies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, index=True)
    disease = Column(String(150), nullable=True, index=True)
    symptom = Column(String(200), nullable=True, index=True)
    aliases = Column(Text, nullable=True)
    category = Column(String(100), nullable=False, default="supportive_care")
    description = Column(Text, nullable=False)
    instructions = Column(Text, nullable=False)
    expected_benefit = Column(Text, nullable=True)
    medical_rationale = Column(Text, nullable=True)
    possible_side_effects = Column(Text, nullable=True)
    general_safety_notes = Column(Text, nullable=True)
    red_flags = Column(Text, nullable=True)
    when_to_seek_care = Column(Text, nullable=True)
    status = Column(String(30), nullable=False, default="PENDING", index=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    approved_at = Column(DateTime, nullable=True)
    last_reviewed_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)


class HomeReliefSafetyRule(Base):
    __tablename__ = "home_relief_safety_rules"

    id = Column(Integer, primary_key=True, index=True)
    remedy_id = Column(Integer, ForeignKey("home_relief_remedies.id", ondelete="CASCADE"), nullable=False, index=True)
    condition_type = Column(String(100), nullable=False, index=True)
    condition_value = Column(String(200), nullable=False)
    suitability = Column(String(40), nullable=False, default="UNKNOWN")
    severity = Column(String(30), nullable=True)
    reason = Column(Text, nullable=True)
    alternative_remedy_id = Column(Integer, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)


class HomeReliefAlternative(Base):
    __tablename__ = "home_relief_alternatives"

    id = Column(Integer, primary_key=True, index=True)
    remedy_id = Column(Integer, ForeignKey("home_relief_remedies.id", ondelete="CASCADE"), nullable=False, index=True)
    alternative_remedy_id = Column(Integer, ForeignKey("home_relief_remedies.id", ondelete="CASCADE"), nullable=False, index=True)
    priority = Column(Integer, nullable=False, default=1)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)


class HomeReliefAuditLog(Base):
    __tablename__ = "home_relief_audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    remedy_id = Column(Integer, ForeignKey("home_relief_remedies.id", ondelete="CASCADE"), nullable=False, index=True)
    action = Column(String(60), nullable=False)
    performed_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    old_value = Column(Text, nullable=True)
    new_value = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

