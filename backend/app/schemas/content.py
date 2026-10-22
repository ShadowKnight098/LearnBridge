from datetime import datetime, date
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class DocumentCreate(BaseModel):
    filename: str
    subject: str
    grade: int = Field(ge=1, le=12)
    language: str  # te | hi | en


class ChunkInput(BaseModel):
    page_no: Optional[int] = None
    position: int
    text: str


class DocumentChunksPayload(BaseModel):
    chunks: List[ChunkInput]


class DocumentResponse(BaseModel):
    id: str
    teacher_id: str
    filename: str
    subject: str
    grade: int
    language: str
    created_at: datetime
    chunks_count: Optional[int] = 0


class JobResponse(BaseModel):
    id: str
    document_id: str
    status: str
    total_chunks: int
    done_chunks: int
    error: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class QuestionCreate(BaseModel):
    skill_id: str
    difficulty: int = Field(ge=1, le=3)
    grade: int = Field(ge=1, le=12)
    language: str
    type: str = "mcq"
    text: str
    options: List[str] = Field(min_length=2, max_length=4)
    correct_index: int = Field(ge=0, le=3)
    explanation: Optional[str] = None
    source_snippet: Optional[str] = None
    concept_id: Optional[str] = None


class QuestionUpdate(BaseModel):
    text: Optional[str] = None
    options: Optional[List[str]] = None
    correct_index: Optional[int] = None
    explanation: Optional[str] = None
    difficulty: Optional[int] = None
    skill_id: Optional[str] = None
    status: Optional[str] = None  # approved | rejected | draft


class QuestionDetailResponse(BaseModel):
    id: str
    owner_id: Optional[str] = None
    chunk_id: Optional[str] = None
    concept_id: Optional[str] = None
    skill_id: str
    language: str
    grade: int
    difficulty: int
    type: str
    text: str
    options: List[str]
    correct_index: int
    explanation: Optional[str] = None
    source_snippet: Optional[str] = None
    status: str
    created_at: datetime
    approved_at: Optional[datetime] = None


class AssignmentCreate(BaseModel):
    class_id: Optional[str] = None
    student_id: Optional[str] = None
    document_id: Optional[str] = None
    due_date: Optional[date] = None


class AssignmentResponse(BaseModel):
    id: str
    teacher_id: str
    class_id: Optional[str] = None
    student_id: Optional[str] = None
    document_id: Optional[str] = None
    due_date: Optional[date] = None
    created_at: datetime
