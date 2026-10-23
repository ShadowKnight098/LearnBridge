from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict


class UserBase(BaseModel):
    name: str
    username: str
    language: str = "te"


class TeacherCreate(UserBase):
    password: str = Field(min_length=6)


class TeacherUpdate(BaseModel):
    name: Optional[str] = None
    language: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    role: str
    name: str
    username: str
    language: str
    is_active: bool
    parent_id: Optional[str] = None
    created_at: datetime


class ClassCreate(BaseModel):
    name: str
    grade: int = Field(ge=1, le=12)
    teacher_id: str
    class_code: Optional[str] = None  # auto-generated if omitted


class ClassResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    grade: int
    teacher_id: str
    class_code: str
    created_by: str
    created_at: datetime
    student_count: Optional[int] = 0


class StudentCreate(BaseModel):
    name: str
    username: Optional[str] = None
    roll_number: Optional[str] = None
    pin: str = Field(default="1234", min_length=4, max_length=6)
    language: str = "te"
    class_id: Optional[str] = None


class StudentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    role: str
    name: str
    username: str
    roll_number: Optional[str] = None
    pin: Optional[str] = None
    language: str
    is_active: bool
    class_id: Optional[str] = None
    class_name: Optional[str] = None
    xp: Optional[int] = 0
    level: Optional[int] = 1
    coins: Optional[int] = 0
    current_streak: Optional[int] = 0
    accuracy: Optional[int] = None
    weak_skill: Optional[str] = None
