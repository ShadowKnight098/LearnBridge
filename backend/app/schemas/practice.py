from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime


class PracticeSessionStart(BaseModel):
    is_diagnostic: bool = False
    session_type: Optional[str] = None
    skill_id: Optional[str] = None
    language: Optional[str] = None

    @property
    def final_is_diagnostic(self) -> bool:
        return self.is_diagnostic or (self.session_type == "diagnostic")


class QuestionItemResponse(BaseModel):
    id: str
    skill_id: str
    difficulty: int
    language: str
    type: str
    text: str
    options: List[str]
    hint: Optional[str] = None
    # correct_index and explanation are NOT leaked during question display!


class SessionStartResponse(BaseModel):
    session_id: str
    is_diagnostic: bool
    language: str
    current_question_number: int
    total_questions: int
    first_question: Optional[QuestionItemResponse] = None
    question: Optional[QuestionItemResponse] = None
    daily_cap_reached: bool = False
    message: Optional[str] = None


class AnswerSubmission(BaseModel):
    question_id: str
    chosen_index: Optional[int] = None
    selected_index: Optional[int] = None
    time_taken_ms: Optional[int] = None
    time_spent_ms: Optional[int] = None
    language: Optional[str] = None

    @property
    def final_chosen_index(self) -> int:
        if self.chosen_index is not None:
            return self.chosen_index
        if self.selected_index is not None:
            return self.selected_index
        return 0

    @property
    def final_time_taken_ms(self) -> int:
        if self.time_taken_ms is not None:
            return self.time_taken_ms
        if self.time_spent_ms is not None:
            return self.time_spent_ms
        return 2000


class SessionSummary(BaseModel):
    session_id: str
    total_questions: int
    correct_count: int
    accuracy_percent: float
    xp_earned: int
    coins_earned: int
    streak: int
    new_badges: List[str]
    level: int


class AnswerResponse(BaseModel):
    is_correct: bool
    correct_index: int
    correct_answer_index: Optional[int] = None
    explanation: Optional[str] = None
    xp_gained: int
    xp_earned: Optional[int] = None
    flagged: bool = False
    current_question_number: int
    total_questions: int
    next_question: Optional[QuestionItemResponse] = None
    is_completed: bool = False
    summary: Optional[SessionSummary] = None


class StudentProgressResponse(BaseModel):
    mastery_scores: Dict[str, float]
    total_attempts: int
    overall_accuracy: float
    weak_skills: List[str]
    secure_skills: List[str]


class BadgeInfo(BaseModel):
    id: str
    name_en: str
    name_hi: Optional[str] = None
    name_te: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    earned: bool
    earned_at: Optional[datetime] = None


class StudentRewardsResponse(BaseModel):
    xp: int
    level: int
    coins: int
    current_streak: int
    longest_streak: int
    streak_freezes: int
    badges: List[BadgeInfo]
    avatar_config: Dict[str, Any]


class ShopItemResponse(BaseModel):
    id: str
    name_en: str
    name_hi: Optional[str] = None
    name_te: Optional[str] = None
    category: str
    cost: int
    icon: Optional[str] = None
    purchased: bool
    equipped: bool


class AvatarUpdate(BaseModel):
    color: Optional[str] = None
    hat: Optional[str] = None
    theme: Optional[str] = None
    pet: Optional[str] = None
