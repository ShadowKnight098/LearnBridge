import uuid
import secrets
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import require_admin
from app.core.security import hash_password
from app.models import User, Class, ClassStudent, UserRole
from app.schemas.users import TeacherCreate, TeacherUpdate, UserResponse, ClassCreate, ClassResponse

router = APIRouter(prefix="/admin", tags=["Admin"], dependencies=[Depends(require_admin)])


@router.get("/teachers", response_model=List[UserResponse])
async def list_teachers(db: AsyncSession = Depends(get_db)):
    stmt = select(User).where(User.role == UserRole.teacher.value).order_by(User.name)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("/teachers", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_teacher(
    payload: TeacherCreate,
    current_admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    # Check duplicate username
    stmt = select(User).where(User.username == payload.username)
    existing = (await db.execute(stmt)).scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )

    teacher = User(
        role=UserRole.teacher.value,
        parent_id=current_admin.id,
        name=payload.name,
        username=payload.username,
        password_hash=hash_password(payload.password),
        language=payload.language,
        is_active=True
    )
    session = db
    session.add(teacher)
    await session.commit()
    await session.refresh(teacher)
    return teacher


@router.patch("/teachers/{teacher_id}", response_model=UserResponse)
async def update_teacher(
    teacher_id: str,
    payload: TeacherUpdate,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(User).where(User.id == teacher_id, User.role == UserRole.teacher.value)
    teacher = (await db.execute(stmt)).scalar_one_or_none()
    if not teacher:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Teacher not found")

    if payload.name is not None:
        teacher.name = payload.name
    if payload.language is not None:
        teacher.language = payload.language
    if payload.is_active is not None:
        teacher.is_active = payload.is_active
    if payload.password is not None and len(payload.password) >= 6:
        teacher.password_hash = hash_password(payload.password)

    await db.commit()
    await db.refresh(teacher)
    return teacher


@router.get("/classes", response_model=List[ClassResponse])
async def list_classes(db: AsyncSession = Depends(get_db)):
    stmt = select(
        Class,
        func.count(ClassStudent.student_id).label("student_count")
    ).outerjoin(
        ClassStudent, ClassStudent.class_id == Class.id
    ).group_by(Class.id).order_by(Class.grade, Class.name)

    result = await db.execute(stmt)
    rows = result.all()

    response = []
    for cls, count in rows:
        cls_dict = {
            "id": cls.id,
            "name": cls.name,
            "grade": cls.grade,
            "teacher_id": cls.teacher_id,
            "class_code": cls.class_code,
            "created_by": cls.created_by,
            "created_at": cls.created_at,
            "student_count": count
        }
        response.append(cls_dict)
    return response


@router.post("/classes", response_model=ClassResponse, status_code=status.HTTP_201_CREATED)
async def create_class(
    payload: ClassCreate,
    current_admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    # Verify teacher exists
    t_stmt = select(User).where(User.id == payload.teacher_id, User.role == UserRole.teacher.value)
    teacher = (await db.execute(t_stmt)).scalar_one_or_none()
    if not teacher:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Teacher not found")

    # Generate unique class code if not provided
    class_code = payload.class_code.upper() if payload.class_code else f"CLS{secrets.token_hex(2).upper()}"

    new_class = Class(
        name=payload.name,
        grade=payload.grade,
        teacher_id=payload.teacher_id,
        class_code=class_code,
        created_by=current_admin.id
    )
    db.add(new_class)
    await db.commit()
    await db.refresh(new_class)

    return {
        "id": new_class.id,
        "name": new_class.name,
        "grade": new_class.grade,
        "teacher_id": new_class.teacher_id,
        "class_code": new_class.class_code,
        "created_by": new_class.created_by,
        "created_at": new_class.created_at,
        "student_count": 0
    }
