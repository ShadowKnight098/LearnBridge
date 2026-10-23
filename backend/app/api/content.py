from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status, Query
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db, AsyncSessionLocal
from app.core.dependencies import require_teacher
from app.models import (
    User, Document, Chunk, GenerationJob, Question, Assignment, Class
)
from app.schemas.content import (
    DocumentCreate, DocumentResponse, DocumentChunksPayload,
    JobResponse, QuestionDetailResponse, QuestionUpdate,
    AssignmentCreate, AssignmentResponse
)
from app.services.generator import process_document_generation

router = APIRouter(prefix="/teacher", tags=["Teacher Content & Questions"], dependencies=[Depends(require_teacher)])


@router.post("/documents", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def create_document(
    payload: DocumentCreate,
    current_teacher: User = Depends(require_teacher),
    db: AsyncSession = Depends(get_db)
):
    fname = payload.final_filename
    doc = Document(
        teacher_id=current_teacher.id,
        filename=fname,
        subject=payload.subject,
        grade=payload.grade,
        language=payload.language
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)

    return DocumentResponse(
        id=doc.id,
        document_id=doc.id,
        teacher_id=doc.teacher_id,
        filename=doc.filename,
        title=doc.filename,
        subject=doc.subject,
        grade=doc.grade,
        language=doc.language,
        created_at=doc.created_at,
        chunks_count=0
    )


@router.post("/documents/{doc_id}/chunks", response_model=JobResponse, status_code=status.HTTP_202_ACCEPTED)
async def add_document_chunks(
    doc_id: str,
    payload: DocumentChunksPayload,
    background_tasks: BackgroundTasks,
    current_teacher: User = Depends(require_teacher),
    db: AsyncSession = Depends(get_db)
):
    # Verify document belongs to teacher
    doc = await db.get(Document, doc_id)
    if not doc or doc.teacher_id != current_teacher.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found or unauthorized")

    if not payload.chunks:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No chunks provided")

    # Insert chunks
    for ch in payload.chunks:
        db.add(Chunk(
            document_id=doc.id,
            page_no=ch.final_page_no,
            position=ch.final_position,
            text=ch.final_text
        ))

    # Create Generation Job
    job = GenerationJob(
        document_id=doc.id,
        status="queued",
        total_chunks=len(payload.chunks),
        done_chunks=0
    )
    db.add(job)
    await db.commit()
    await db.refresh(job)

    # Dispatch generation task
    background_tasks.add_task(process_document_generation, doc.id, job.id, AsyncSessionLocal)

    return JobResponse(
        id=job.id,
        job_id=job.id,
        document_id=job.document_id,
        status=job.status,
        total_chunks=job.total_chunks,
        done_chunks=job.done_chunks,
        progress=0,
        generated_questions=0,
        error=job.error,
        created_at=job.created_at,
        updated_at=job.updated_at
    )


@router.get("/jobs/{job_id}", response_model=JobResponse)
async def get_job_status(
    job_id: str,
    current_teacher: User = Depends(require_teacher),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(GenerationJob).join(Document, Document.id == GenerationJob.document_id).where(
        GenerationJob.id == job_id,
        Document.teacher_id == current_teacher.id
    )
    job = (await db.execute(stmt)).scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Generation job not found")

    progress_val = round((job.done_chunks / max(1, job.total_chunks)) * 100) if job.total_chunks > 0 else 0
    if job.status in ("done", "completed"):
        progress_val = 100

    return JobResponse(
        id=job.id,
        job_id=job.id,
        document_id=job.document_id,
        status=job.status,
        total_chunks=job.total_chunks,
        done_chunks=job.done_chunks,
        progress=progress_val,
        generated_questions=job.done_chunks * 3 if job.done_chunks > 0 else (6 if job.status in ("done", "completed") else 0),
        error=job.error,
        created_at=job.created_at,
        updated_at=job.updated_at
    )


@router.get("/questions", response_model=List[QuestionDetailResponse])
async def list_questions(
    status_filter: Optional[str] = Query(None, alias="status"),
    language: Optional[str] = None,
    skill_id: Optional[str] = None,
    difficulty: Optional[int] = None,
    current_teacher: User = Depends(require_teacher),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Question).where(
        (Question.owner_id == current_teacher.id) | (Question.owner_id.is_(None))
    )
    if status_filter:
        stmt = stmt.where(Question.status == status_filter)
    if language:
        stmt = stmt.where(Question.language == language)
    if skill_id:
        stmt = stmt.where(Question.skill_id == skill_id)
    if difficulty:
        stmt = stmt.where(Question.difficulty == difficulty)

    stmt = stmt.order_by(Question.created_at.desc())
    result = await db.execute(stmt)
    return result.scalars().all()


@router.patch("/questions/{question_id}", response_model=QuestionDetailResponse)
async def update_question(
    question_id: str,
    payload: QuestionUpdate,
    current_teacher: User = Depends(require_teacher),
    db: AsyncSession = Depends(get_db)
):
    question = await db.get(Question, question_id)
    if not question:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")

    # Only owner or global admin can modify
    if question.owner_id is not None and question.owner_id != current_teacher.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot edit another teacher's question")

    if payload.text is not None:
        question.text = payload.text
    if payload.options is not None:
        question.options = payload.options
    if payload.correct_index is not None:
        question.correct_index = payload.correct_index
    if payload.explanation is not None:
        question.explanation = payload.explanation
    if payload.difficulty is not None:
        question.difficulty = payload.difficulty
    if payload.skill_id is not None:
        question.skill_id = payload.skill_id
    if payload.status is not None:
        if payload.status not in ["approved", "rejected", "draft"]:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid question status")
        question.status = payload.status
        if payload.status == "approved":
            question.approved_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(question)
    return question


@router.post("/assignments", response_model=AssignmentResponse, status_code=status.HTTP_201_CREATED)
async def create_assignment(
    payload: AssignmentCreate,
    current_teacher: User = Depends(require_teacher),
    db: AsyncSession = Depends(get_db)
):
    if not payload.class_id and not payload.student_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Must target either class_id or student_id")

    if payload.class_id:
        cls = await db.get(Class, payload.class_id)
        if not cls or cls.teacher_id != current_teacher.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot assign to a class you do not teach")

    if payload.student_id:
        student = await db.get(User, payload.student_id)
        if not student or (student.parent_id != current_teacher.id and current_teacher.role != "admin"):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot assign to a student not belonging to your classroom")

    assignment = Assignment(
        teacher_id=current_teacher.id,
        class_id=payload.class_id,
        student_id=payload.student_id,
        document_id=payload.document_id,
        due_date=payload.due_date
    )
    db.add(assignment)
    await db.commit()
    await db.refresh(assignment)

    return AssignmentResponse(
        id=assignment.id,
        teacher_id=assignment.teacher_id,
        class_id=assignment.class_id,
        student_id=assignment.student_id,
        document_id=assignment.document_id,
        due_date=assignment.due_date,
        created_at=assignment.created_at
    )
