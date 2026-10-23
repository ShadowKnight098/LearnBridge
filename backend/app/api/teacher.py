import csv
import io
import re
import secrets
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Request, status
from pydantic import BaseModel, Field
from sqlalchemy import select, func, case
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import require_teacher
from app.core.security import hash_password
from app.models import User, Class, ClassStudent, StudentProfile, Mastery, Skill, UserRole, Attempt
from app.schemas.users import ClassResponse, StudentCreate, StudentResponse

router = APIRouter(prefix="/teacher", tags=["Teacher"], dependencies=[Depends(require_teacher)])


class TeacherClassCreate(BaseModel):
    name: str
    grade: int = Field(default=3, ge=1, le=12)
    class_code: Optional[str] = None


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

    if not rows:
        # Auto-create default class for teacher so teacher immediately has a classroom
        code = f"CLS{secrets.token_hex(2).upper()}"
        default_cls = Class(
            name="Class 3-A",
            grade=3,
            teacher_id=current_teacher.id,
            class_code=code,
            created_by=current_teacher.id
        )
        db.add(default_cls)
        await db.commit()
        await db.refresh(default_cls)
        return [
            {
                "id": default_cls.id,
                "name": default_cls.name,
                "grade": default_cls.grade,
                "teacher_id": default_cls.teacher_id,
                "class_code": default_cls.class_code,
                "created_by": default_cls.created_by,
                "created_at": default_cls.created_at,
                "student_count": 0
            }
        ]

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


@router.post("/classes", response_model=ClassResponse, status_code=status.HTTP_201_CREATED)
async def create_teacher_class(
    payload: TeacherClassCreate,
    current_teacher: User = Depends(require_teacher),
    db: AsyncSession = Depends(get_db)
):
    code = (payload.class_code or f"CLS{secrets.token_hex(2).upper()}").strip().upper()
    existing = (await db.execute(select(Class).where(Class.class_code == code))).scalar_one_or_none()
    if existing:
        code = f"CLS{secrets.token_hex(3).upper()}"

    new_cls = Class(
        name=payload.name,
        grade=payload.grade,
        teacher_id=current_teacher.id,
        class_code=code,
        created_by=current_teacher.id
    )
    db.add(new_cls)
    await db.commit()
    await db.refresh(new_cls)
    return {
        "id": new_cls.id,
        "name": new_cls.name,
        "grade": new_cls.grade,
        "teacher_id": new_cls.teacher_id,
        "class_code": new_cls.class_code,
        "created_by": new_cls.created_by,
        "created_at": new_cls.created_at,
        "student_count": 0
    }


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

    if class_id and class_id not in ("default", "cls-demo-1"):
        stmt = stmt.where(Class.id == class_id)

    stmt = stmt.order_by(User.name)
    result = await db.execute(stmt)
    rows = result.all()

    student_ids = [user.id for user, *_ in rows]
    stats_map = {}
    weak_map = {}

    if student_ids:
        attempts_stmt = select(
            Attempt.student_id,
            func.count(Attempt.id).label("total_attempts"),
            func.sum(case((Attempt.is_correct == True, 1), else_=0)).label("correct_attempts")
        ).where(
            Attempt.student_id.in_(student_ids)
        ).group_by(Attempt.student_id)
        attempt_stats = (await db.execute(attempts_stmt)).all()
        stats_map = {row[0]: (row[1], row[2] or 0) for row in attempt_stats}

        weak_stmt = select(
            Mastery.student_id,
            Mastery.skill_id,
            Mastery.score,
            Skill.name
        ).join(
            Skill, Skill.id == Mastery.skill_id
        ).where(
            Mastery.student_id.in_(student_ids),
            Mastery.attempts > 0,
            Mastery.score < 0.70
        ).order_by(Mastery.student_id, Mastery.score.asc())
        weak_rows = (await db.execute(weak_stmt)).all()
        for sid, skill_id, score, skill_name in weak_rows:
            if sid not in weak_map:
                weak_map[sid] = skill_name or skill_id

    return [
        {
            "id": user.id,
            "role": user.role,
            "name": user.name,
            "username": user.username,
            "roll_number": user.username,
            "pin": "1234",
            "language": user.language,
            "is_active": user.is_active,
            "class_id": cid,
            "class_name": cname,
            "xp": xp or 0,
            "level": lvl or 1,
            "coins": coins or 0,
            "current_streak": streak or 0,
            "accuracy": round((stats_map[user.id][1] / stats_map[user.id][0]) * 100) if (user.id in stats_map and stats_map[user.id][0] > 0) else None,
            "weak_skill": weak_map.get(user.id)
        }
        for user, cid, cname, xp, lvl, coins, streak in rows
    ]


@router.post("/students", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
async def create_student(
    payload: StudentCreate,
    current_teacher: User = Depends(require_teacher),
    db: AsyncSession = Depends(get_db)
):
    # Verify class belongs to this teacher or auto-resolve
    target_class_id = (payload.class_id or "").strip()
    classroom = None
    if target_class_id and target_class_id not in ("default", "cls-demo-1"):
        cls_found = (await db.execute(select(Class).where(Class.id == target_class_id))).scalar_one_or_none()
        if not cls_found:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Class not found"
            )
        if cls_found.teacher_id != current_teacher.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Class does not belong to you"
            )
        classroom = cls_found
    else:
        # Look up current teacher's first class or auto-create one
        t_cls = (await db.execute(select(Class).where(Class.teacher_id == current_teacher.id))).scalars().first()
        if not t_cls:
            code = f"CLS{secrets.token_hex(2).upper()}"
            t_cls = Class(
                name="Class 3-A",
                grade=3,
                teacher_id=current_teacher.id,
                class_code=code,
                created_by=current_teacher.id
            )
            db.add(t_cls)
            await db.flush()
        classroom = t_cls

    # Determine unique username
    raw_username = (payload.username or "").strip()
    if not raw_username:
        if payload.roll_number and payload.roll_number.strip():
            raw_username = payload.roll_number.strip().lower().replace(" ", "_")
        else:
            base_name = re.sub(r'[^a-zA-Z0-9]', '', payload.name.lower()) or "student"
            raw_username = f"{base_name}_{secrets.token_hex(2)}"

    # Check duplicate username
    final_username = raw_username
    u_stmt = select(User).where(User.username == final_username)
    if (await db.execute(u_stmt)).scalar_one_or_none():
        final_username = f"{raw_username}_{secrets.token_hex(2)}"

    # Create student user
    student = User(
        role=UserRole.student.value,
        parent_id=current_teacher.id,
        name=payload.name,
        username=final_username,
        password_hash=hash_password(payload.pin or "1234"),
        language=payload.language or "te",
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
    profile.coins = 0
    profile.current_streak = 0
    profile.longest_streak = 0
    profile.streak_freezes = 0
    profile.avatar_config = {"color": "#6C4DF6", "hat": None, "theme": "default"}

    # No default score or mastery is set — students earn scores through actual diagnostic/practice assessments!

    await db.commit()
    await db.refresh(student)

    return {
        "id": student.id,
        "role": student.role,
        "name": student.name,
        "username": student.username,
        "roll_number": payload.roll_number or student.username,
        "pin": payload.pin or "1234",
        "language": student.language,
        "is_active": student.is_active,
        "class_id": classroom.id,
        "class_name": classroom.name,
        "xp": 0,
        "level": 1,
        "coins": 0,
        "current_streak": 0,
        "accuracy": None,
        "weak_skill": None
    }


@router.post("/students/import")
async def import_students_csv(
    request: Request,
    current_teacher: User = Depends(require_teacher),
    db: AsyncSession = Depends(get_db)
):
    content_type = request.headers.get("content-type", "")
    class_id = None
    decoded_text = ""

    if "multipart/form-data" in content_type:
        form = await request.form()
        class_id = form.get("class_id")
        file_obj = form.get("file")
        if file_obj and hasattr(file_obj, "read"):
            bytes_data = await file_obj.read()
            try:
                decoded_text = bytes_data.decode("utf-8-sig")
            except UnicodeDecodeError:
                decoded_text = bytes_data.decode("latin-1")
    else:
        try:
            body = await request.json()
            class_id = body.get("class_id")
            decoded_text = body.get("csv_data") or body.get("content") or ""
        except Exception:
            decoded_text = ""

    # Verify class
    target_class_id = (class_id or "").strip()
    classroom = None
    if target_class_id and target_class_id not in ("default", "cls-demo-1"):
        cls_found = (await db.execute(select(Class).where(Class.id == target_class_id))).scalar_one_or_none()
        if not cls_found:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Class not found")
        if cls_found.teacher_id != current_teacher.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized: Class belongs to another teacher")
        classroom = cls_found
    else:
        classroom = (await db.execute(select(Class).where(Class.teacher_id == current_teacher.id))).scalars().first()
        if not classroom:
            code = f"CLS{secrets.token_hex(2).upper()}"
            classroom = Class(
                name="Class 3-A",
                grade=3,
                teacher_id=current_teacher.id,
                class_code=code,
                created_by=current_teacher.id
            )
            db.add(classroom)
            await db.flush()

    reader = csv.DictReader(io.StringIO(decoded_text))
    imported = []
    errors = []

    for row_idx, row in enumerate(reader, start=1):
        name = (row.get("name") or row.get("Name") or row.get("student_name") or "").strip()
        roll_num = (row.get("roll_number") or row.get("roll_no") or row.get("roll") or row.get("Roll Number") or "").strip()
        username = (row.get("username") or row.get("Username") or roll_num).strip()
        pin = (row.get("pin") or row.get("PIN") or row.get("password") or "1234").strip()
        language = (row.get("language") or "te").strip().lower()

        if not name:
            errors.append(f"Row {row_idx}: Missing student name")
            continue

        if not username:
            base_name = re.sub(r'[^a-zA-Z0-9]', '', name.lower()) or "student"
            username = f"{base_name}_{secrets.token_hex(2)}"

        # Check duplicate username
        exists = (await db.execute(select(User).where(User.username == username))).scalar_one_or_none()
        if exists:
            username = f"{username}_{secrets.token_hex(2)}"

        student = User(
            role=UserRole.student.value,
            parent_id=current_teacher.id,
            name=name,
            username=username,
            password_hash=hash_password(pin or "1234"),
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
        profile.coins = 0
        profile.current_streak = 0
        profile.longest_streak = 0
        profile.streak_freezes = 0
        profile.avatar_config = {"color": "#6C4DF6", "hat": None, "theme": "default"}
        # No default mastery or score is set

        imported.append(username)

    await db.commit()
    return {
        "success": True,
        "imported_count": len(imported),
        "imported_students": imported,
        "errors": errors
    }
