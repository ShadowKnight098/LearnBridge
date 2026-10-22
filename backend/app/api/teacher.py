import csv
import io
import secrets
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import require_teacher
from app.core.security import hash_password
from app.models import User, Class, ClassStudent, StudentProfile, Mastery, Skill, UserRole
from app.schemas.users import ClassResponse, StudentCreate, StudentResponse

router = APIRouter(prefix="/teacher", tags=["Teacher"], dependencies=[Depends(require_teacher)])


@router.get("/classes", response_model=List[ClassResponse])
async def get_teacher_classes(
    current_teacher: User = Depends(require_teacher),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(
        Class,
        func.count(ClassStudent.student_id).label("student_count")
    ).outerjoin(
        ClassStudent, ClassStudent.class_id == Class.id
    ).where(
        Class.teacher_id == current_teacher.id
    ).group_by(Class.id)

    result = await db.execute(stmt)
    rows = result.all()

    return [
        {
            "id": cls.id,
            "name": cls.name,
            "grade": cls.grade,
            "teacher_id": cls.teacher_id,
            "class_code": cls.class_code,
            "created_by": cls.created_by,
            "created_at": cls.created_at,
            "student_count": count
        }
        for cls, count in rows
    ]


@router.get("/students", response_model=List[StudentResponse])
async def get_teacher_students(
    class_id: Optional[str] = None,
    current_teacher: User = Depends(require_teacher),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(
        User,
        Class.id.label("class_id"),
        Class.name.label("class_name"),
        StudentProfile.xp,
        StudentProfile.level,
        StudentProfile.coins,
        StudentProfile.current_streak
    ).join(
        ClassStudent, ClassStudent.student_id == User.id
    ).join(
        Class, Class.id == ClassStudent.class_id
    ).outerjoin(
        StudentProfile, StudentProfile.student_id == User.id
    ).where(
        Class.teacher_id == current_teacher.id
    )

    if class_id:
        stmt = stmt.where(Class.id == class_id)

    stmt = stmt.order_by(User.name)
    result = await db.execute(stmt)
    rows = result.all()

    return [
        {
            "id": user.id,
            "role": user.role,
            "name": user.name,
            "username": user.username,
            "language": user.language,
            "is_active": user.is_active,
            "class_id": cid,
            "class_name": cname,
            "xp": xp or 0,
            "level": lvl or 1,
            "coins": coins or 0,
            "current_streak": streak or 0
        }
        for user, cid, cname, xp, lvl, coins, streak in rows
    ]


@router.post("/students", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
async def create_student(
    payload: StudentCreate,
    current_teacher: User = Depends(require_teacher),
    db: AsyncSession = Depends(get_db)
):
    # Verify class belongs to this teacher
    c_stmt = select(Class).where(Class.id == payload.class_id, Class.teacher_id == current_teacher.id)
    classroom = (await db.execute(c_stmt)).scalar_one_or_none()
    if not classroom:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Class not found or does not belong to you"
        )

    # Check duplicate username
    u_stmt = select(User).where(User.username == payload.username)
    if (await db.execute(u_stmt)).scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already taken")

    # Create student user
    student = User(
        role=UserRole.student.value,
        parent_id=current_teacher.id,
        name=payload.name,
        username=payload.username,
        password_hash=hash_password(payload.pin),
        language=payload.language,
        is_active=True
    )
    db.add(student)
    await db.flush()

    # Link to class
    db.add(ClassStudent(class_id=classroom.id, student_id=student.id))

    # Initialize/update profile (handling trigger-created row in PostgreSQL)
    prof_stmt = select(StudentProfile).where(StudentProfile.student_id == student.id)
    profile = (await db.execute(prof_stmt)).scalar_one_or_none()
    if not profile:
        profile = StudentProfile(student_id=student.id)
        db.add(profile)
    profile.xp = 0
    profile.level = 1
    profile.coins = 20
    profile.current_streak = 0
    profile.longest_streak = 0
    profile.streak_freezes = 1
    profile.avatar_config = {"color": "#6C4DF6", "hat": None, "theme": "default"}

    # Initialize default mastery
    skills_stmt = select(Skill.id).limit(8)
    skill_ids = (await db.execute(skills_stmt)).scalars().all()
    for sid in skill_ids:
        db.add(Mastery(student_id=student.id, skill_id=sid, score=0.3, attempts=0))

    await db.commit()
    await db.refresh(student)

    return {
        "id": student.id,
        "role": student.role,
        "name": student.name,
        "username": student.username,
        "language": student.language,
        "is_active": student.is_active,
        "class_id": classroom.id,
        "class_name": classroom.name,
        "xp": 0,
        "level": 1,
        "coins": 20,
        "current_streak": 0
    }


@router.post("/students/import")
async def import_students_csv(
    class_id: str,
    file: UploadFile = File(...),
    current_teacher: User = Depends(require_teacher),
    db: AsyncSession = Depends(get_db)
):
    # Verify class
    c_stmt = select(Class).where(Class.id == class_id, Class.teacher_id == current_teacher.id)
    classroom = (await db.execute(c_stmt)).scalar_one_or_none()
    if not classroom:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Class not found or unauthorized")

    content = await file.read()
    try:
        decoded = content.decode("utf-8-sig")
    except UnicodeDecodeError:
        decoded = content.decode("latin-1")

    reader = csv.DictReader(io.StringIO(decoded))
    imported = []
    errors = []

    skills_stmt = select(Skill.id).limit(8)
    skill_ids = (await db.execute(skills_stmt)).scalars().all()

    for row_idx, row in enumerate(reader, start=1):
        name = row.get("name", "").strip()
        username = row.get("username", "").strip()
        pin = row.get("pin", "").strip()
        language = row.get("language", "te").strip().lower()

        if not name or not username or not pin:
            errors.append(f"Row {row_idx}: Missing required fields (name, username, pin)")
            continue

        # Check duplicate
        exists = (await db.execute(select(User).where(User.username == username))).scalar_one_or_none()
        if exists:
            errors.append(f"Row {row_idx}: Username '{username}' already exists")
            continue

        student = User(
            role=UserRole.student.value,
            parent_id=current_teacher.id,
            name=name,
            username=username,
            password_hash=hash_password(pin),
            language=language or "te",
            is_active=True
        )
        db.add(student)
        await db.flush()

        db.add(ClassStudent(class_id=classroom.id, student_id=student.id))
        
        prof_stmt = select(StudentProfile).where(StudentProfile.student_id == student.id)
        profile = (await db.execute(prof_stmt)).scalar_one_or_none()
        if not profile:
            profile = StudentProfile(student_id=student.id)
            db.add(profile)
        profile.xp = 0
        profile.level = 1
        profile.coins = 20
        profile.current_streak = 0
        profile.longest_streak = 0
        profile.streak_freezes = 1
        profile.avatar_config = {"color": "#6C4DF6", "hat": None, "theme": "default"}
        for sid in skill_ids:
            db.add(Mastery(student_id=student.id, skill_id=sid, score=0.3, attempts=0))

        imported.append(username)

    await db.commit()
    return {
        "success": True,
        "imported_count": len(imported),
        "imported_students": imported,
        "errors": errors
    }
