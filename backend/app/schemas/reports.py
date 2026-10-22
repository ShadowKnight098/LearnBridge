from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel


class HeatmapCell(BaseModel):
    student_id: str
    student_name: str
    skill_id: str
    mastery_score: float
    band: int  # 1: <0.4, 2: 0.4-0.69, 3: >=0.7


class MostMissedQuestion(BaseModel):
    question_id: str
    text: str
    skill_id: str
    total_attempts: int
    wrong_attempts: int
    miss_rate_percent: float


class ClassReportResponse(BaseModel):
    class_id: str
    class_name: str
    total_students: int
    class_accuracy_percent: float
    skill_averages: Dict[str, float]
    heatmap: List[HeatmapCell]
    most_missed_questions: List[MostMissedQuestion]
    at_risk_student_ids: List[str]


class StudentReportResponse(BaseModel):
    student_id: str
    student_name: str
    language: str
    xp: int
    level: int
    current_streak: int
    mastery: Dict[str, float]
    accuracy_percent: float
    total_attempts: int
    flagged_attempts: int
    weak_skills: List[str]
    strong_skills: List[str]


class AlertResponse(BaseModel):
    id: str
    teacher_id: str
    student_id: str
    student_name: Optional[str] = None
    kind: str  # falling_behind | random_clicking | inactive
    detail: Optional[str] = None
    resolved: bool
    created_at: datetime


class SchoolReportResponse(BaseModel):
    total_classes: int
    total_teachers: int
    total_students: int
    total_sessions_completed: int
    average_school_accuracy: float
    class_summaries: List[Dict[str, Any]]
