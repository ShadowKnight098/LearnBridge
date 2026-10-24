from datetime import datetime, date, timezone
from typing import List, Optional
import uuid
from sqlalchemy import (
    String, Boolean, Integer, SmallInteger, Float, DateTime, Date,
    ForeignKey, Text, JSON, Enum as SQLEnum, CheckConstraint, Index, Uuid
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
import enum


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class UserRole(str, enum.Enum):
    admin = "admin"
    teacher = "teacher"
    student = "student"


class QuestionType(str, enum.Enum):
    mcq = "mcq"
    tf = "tf"
    fill = "fill"


class QuestionStatus(str, enum.Enum):
    draft = "draft"
    approved = "approved"
    rejected = "rejected"


class JobStatus(str, enum.Enum):
    queued = "queued"
    running = "running"
    done = "done"
    failed = "failed"


class RewardType(str, enum.Enum):
    xp = "xp"
    coin = "coin"
    badge = "badge"
    streak = "streak"
    purchase = "purchase"


class AlertKind(str, enum.Enum):
    falling_behind = "falling_behind"
    random_clicking = "random_clicking"
    inactive = "inactive"


class ChallengeScope(str, enum.Enum):
    student = "student"
    class_scope = "class"


class ReportScope(str, enum.Enum):
    class_scope = "class"
    student = "student"
    school = "school"


# ---------- Users and Classes ----------

class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(Uuid(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    role: Mapped[str] = mapped_column(SQLEnum(UserRole, name="user_role", native_enum=True, values_callable=lambda x: [e.value for e in x]), nullable=False)
    parent_id: Mapped[Optional[str]] = mapped_column(Uuid(as_uuid=False), ForeignKey("users.id"), nullable=True, index=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    username: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    language: Mapped[str] = mapped_column(String(10), default="te", nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)

    # Relationships
    children: Mapped[List["User"]] = relationship("User", backref="parent", remote_side=[id])
    taught_classes: Mapped[List["Class"]] = relationship("Class", back_populates="teacher", foreign_keys="Class.teacher_id")
    profile: Mapped[Optional["StudentProfile"]] = relationship("StudentProfile", back_populates="student", uselist=False, cascade="all, delete-orphan")


class Class(Base):
    __tablename__ = "classes"

    id: Mapped[str] = mapped_column(Uuid(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    grade: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    teacher_id: Mapped[str] = mapped_column(Uuid(as_uuid=False), ForeignKey("users.id"), nullable=False)
    class_code: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)
    created_by: Mapped[str] = mapped_column(Uuid(as_uuid=False), ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)

    teacher: Mapped["User"] = relationship("User", foreign_keys=[teacher_id], back_populates="taught_classes")
    students: Mapped[List["ClassStudent"]] = relationship("ClassStudent", back_populates="classroom", cascade="all, delete-orphan")


class ClassStudent(Base):
    __tablename__ = "class_students"

    class_id: Mapped[str] = mapped_column(Uuid(as_uuid=False), ForeignKey("classes.id", ondelete="CASCADE"), primary_key=True)
    student_id: Mapped[str] = mapped_column(Uuid(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)

    classroom: Mapped["Class"] = relationship("Class", back_populates="students")
    student: Mapped["User"] = relationship("User")


# ---------- Skills & Prerequisites ----------

class Skill(Base):
    __tablename__ = "skills"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    domain: Mapped[str] = mapped_column(String(50), nullable=False)
    name_en: Mapped[str] = mapped_column(String(150), nullable=False)
    name_hi: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    name_te: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    grade_min: Mapped[Optional[int]] = mapped_column(SmallInteger, nullable=True)
    grade_max: Mapped[Optional[int]] = mapped_column(SmallInteger, nullable=True)


class SkillPrerequisite(Base):
    __tablename__ = "skill_prerequisites"

    skill_id: Mapped[str] = mapped_column(String(50), ForeignKey("skills.id"), primary_key=True)
    requires: Mapped[str] = mapped_column(String(50), ForeignKey("skills.id"), primary_key=True)


# ---------- Documents, Chunks, Generation Jobs ----------

class Document(Base):
    __tablename__ = "documents"

    id: Mapped[str] = mapped_column(Uuid(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    teacher_id: Mapped[str] = mapped_column(Uuid(as_uuid=False), ForeignKey("users.id"), nullable=False)
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    subject: Mapped[str] = mapped_column(String(100), nullable=False)
    grade: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    language: Mapped[str] = mapped_column(String(10), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)

    chunks: Mapped[List["Chunk"]] = relationship("Chunk", back_populates="document", cascade="all, delete-orphan")


class Chunk(Base):
    __tablename__ = "chunks"

    id: Mapped[str] = mapped_column(Uuid(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id: Mapped[str] = mapped_column(Uuid(as_uuid=False), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    page_no: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    position: Mapped[int] = mapped_column(Integer, nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False)

    document: Mapped["Document"] = relationship("Document", back_populates="chunks")


class GenerationJob(Base):
    __tablename__ = "generation_jobs"

    id: Mapped[str] = mapped_column(Uuid(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id: Mapped[str] = mapped_column(Uuid(as_uuid=False), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    status: Mapped[str] = mapped_column(SQLEnum(JobStatus, name="job_status", native_enum=True, values_callable=lambda x: [e.value for e in x]), default="queued", nullable=False)
    total_chunks: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    done_chunks: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    error: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)


# ---------- Questions & Assignments ----------

class Question(Base):
    __tablename__ = "questions"

    id: Mapped[str] = mapped_column(Uuid(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    owner_id: Mapped[Optional[str]] = mapped_column(Uuid(as_uuid=False), ForeignKey("users.id"), nullable=True)
    chunk_id: Mapped[Optional[str]] = mapped_column(Uuid(as_uuid=False), ForeignKey("chunks.id", ondelete="SET NULL"), nullable=True)
    concept_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)
    skill_id: Mapped[str] = mapped_column(String(50), ForeignKey("skills.id"), nullable=False, index=True)
    language: Mapped[str] = mapped_column(String(10), nullable=False)
    grade: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    difficulty: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    type: Mapped[str] = mapped_column(SQLEnum(QuestionType, name="question_type", native_enum=True, values_callable=lambda x: [e.value for e in x]), default="mcq", nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    options: Mapped[list] = mapped_column(JSON, nullable=False)
    correct_index: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    explanation: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    hint: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    source_snippet: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(SQLEnum(QuestionStatus, name="question_status", native_enum=True, values_callable=lambda x: [e.value for e in x]), default="draft", nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)
    approved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        Index("idx_q_select", "status", "language", "skill_id", "difficulty"),
    )


class Assignment(Base):
    __tablename__ = "assignments"

    id: Mapped[str] = mapped_column(Uuid(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    teacher_id: Mapped[str] = mapped_column(Uuid(as_uuid=False), ForeignKey("users.id"), nullable=False)
    class_id: Mapped[Optional[str]] = mapped_column(Uuid(as_uuid=False), ForeignKey("classes.id"), nullable=True)
    student_id: Mapped[Optional[str]] = mapped_column(Uuid(as_uuid=False), ForeignKey("users.id"), nullable=True)
    document_id: Mapped[Optional[str]] = mapped_column(Uuid(as_uuid=False), ForeignKey("documents.id"), nullable=True)
    due_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)


# ---------- Practice Sessions, Attempts & Mastery ----------

class Session(Base):
    __tablename__ = "sessions"

    id: Mapped[str] = mapped_column(Uuid(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    student_id: Mapped[str] = mapped_column(Uuid(as_uuid=False), ForeignKey("users.id"), nullable=False, index=True)
    is_diagnostic: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)
    ended_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)


class Attempt(Base):
    __tablename__ = "attempts"

    id: Mapped[str] = mapped_column(Uuid(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id: Mapped[str] = mapped_column(Uuid(as_uuid=False), ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id: Mapped[str] = mapped_column(Uuid(as_uuid=False), ForeignKey("users.id"), nullable=False, index=True)
    question_id: Mapped[str] = mapped_column(Uuid(as_uuid=False), ForeignKey("questions.id"), nullable=False, index=True)
    chosen_index: Mapped[Optional[int]] = mapped_column(SmallInteger, nullable=True)
    is_correct: Mapped[bool] = mapped_column(Boolean, nullable=False)
    time_taken_ms: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    flagged: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    language: Mapped[str] = mapped_column(String(10), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)


class Mastery(Base):
    __tablename__ = "mastery"

    student_id: Mapped[str] = mapped_column(Uuid(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    skill_id: Mapped[str] = mapped_column(String(50), ForeignKey("skills.id"), primary_key=True)
    score: Mapped[float] = mapped_column(Float, default=0.3, nullable=False)
    attempts: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)


# ---------- Rewards & Gamification ----------

class StudentProfile(Base):
    __tablename__ = "student_profile"

    student_id: Mapped[str] = mapped_column(Uuid(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    xp: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    level: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    coins: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    current_streak: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    longest_streak: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    streak_freezes: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    last_active_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    avatar_config: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)

    student: Mapped["User"] = relationship("User", back_populates="profile")


class Badge(Base):
    __tablename__ = "badges"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    name_en: Mapped[str] = mapped_column(String(100), nullable=False)
    name_hi: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    name_te: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    criteria: Mapped[dict] = mapped_column(JSON, nullable=False)
    icon: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)


class StudentBadge(Base):
    __tablename__ = "student_badges"

    student_id: Mapped[str] = mapped_column(Uuid(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    badge_id: Mapped[str] = mapped_column(String(50), ForeignKey("badges.id"), primary_key=True)
    awarded_by: Mapped[Optional[str]] = mapped_column(Uuid(as_uuid=False), ForeignKey("users.id"), nullable=True)
    earned_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)


class RewardEvent(Base):
    __tablename__ = "reward_events"

    id: Mapped[str] = mapped_column(Uuid(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    student_id: Mapped[str] = mapped_column(Uuid(as_uuid=False), ForeignKey("users.id"), nullable=False, index=True)
    type: Mapped[str] = mapped_column(SQLEnum(RewardType, name="reward_type", native_enum=False, values_callable=lambda x: [e.value for e in x]), nullable=False)
    amount: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)


class ShopItem(Base):
    __tablename__ = "shop_items"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    name_en: Mapped[str] = mapped_column(String(100), nullable=False)
    name_hi: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    name_te: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    cost: Mapped[int] = mapped_column(Integer, nullable=False)
    icon: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)


class StudentItem(Base):
    __tablename__ = "student_items"

    student_id: Mapped[str] = mapped_column(Uuid(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    item_id: Mapped[str] = mapped_column(String(50), ForeignKey("shop_items.id"), primary_key=True)
    equipped: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)


class Challenge(Base):
    __tablename__ = "challenges"

    id: Mapped[str] = mapped_column(Uuid(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    scope: Mapped[str] = mapped_column(SQLEnum(ChallengeScope, name="challenge_scope", native_enum=False, values_callable=lambda x: [e.value for e in x]), default="student", nullable=False)
    class_id: Mapped[Optional[str]] = mapped_column(Uuid(as_uuid=False), ForeignKey("classes.id"), nullable=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    target: Mapped[int] = mapped_column(Integer, nullable=False)
    reward_coins: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)


# ---------- Reports & Alerts ----------

class ReportSnapshot(Base):
    __tablename__ = "report_snapshots"

    id: Mapped[str] = mapped_column(Uuid(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    scope: Mapped[str] = mapped_column(SQLEnum(ReportScope, name="report_scope", native_enum=False, values_callable=lambda x: [e.value for e in x]), nullable=False)
    scope_id: Mapped[Optional[str]] = mapped_column(Uuid(as_uuid=False), nullable=True)
    payload: Mapped[dict] = mapped_column(JSON, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)


class Alert(Base):
    __tablename__ = "alerts"

    id: Mapped[str] = mapped_column(Uuid(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    teacher_id: Mapped[str] = mapped_column(Uuid(as_uuid=False), ForeignKey("users.id"), nullable=False, index=True)
    student_id: Mapped[str] = mapped_column(Uuid(as_uuid=False), ForeignKey("users.id"), nullable=False, index=True)
    kind: Mapped[str] = mapped_column(SQLEnum(AlertKind, name="alert_kind", native_enum=False, values_callable=lambda x: [e.value for e in x]), nullable=False)
    detail: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    resolved: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)
