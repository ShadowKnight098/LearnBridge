from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import jwt

from app.core.config import settings
from app.core.database import get_db
from app.core.security import verify_password, create_access_token, create_refresh_token, decode_token
from app.core.dependencies import get_current_user
from app.models import User, Class, ClassStudent, StudentProfile
from app.schemas.auth import Token, LoginRequest, StudentLoginRequest, RefreshTokenRequest
from app.schemas.users import UserResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=Token)
async def login(credentials: LoginRequest, db: AsyncSession = Depends(get_db)):
    identifier = (credentials.username or credentials.email or "").strip()
    if not identifier:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email is required"
        )

    # Match exact username or username from email prefix (e.g. teacher1@... -> teacher1)
    username_prefix = identifier.split("@")[0]
    stmt = select(User).where(
        (User.username == identifier) | (User.username == username_prefix)
    )
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated"
        )

    access_token = create_access_token(data={"sub": user.id, "role": user.role, "username": user.username})
    refresh_token = create_refresh_token(data={"sub": user.id, "role": user.role})

    return Token(access_token=access_token, refresh_token=refresh_token)


@router.post("/student-login", response_model=Token)
async def student_login(credentials: StudentLoginRequest, db: AsyncSession = Depends(get_db)):
    # 1. Locate class by class code (normalizing hyphens, case, and spaces)
    raw_code = credentials.class_code.strip().upper()
    clean_code = raw_code.replace("-", "").replace(" ", "")

    class_stmt = select(Class).where(
        (Class.class_code == raw_code) | (Class.class_code == clean_code)
    )
    class_res = await db.execute(class_stmt)
    classroom = class_res.scalar_one_or_none()

    # Friendly demo fallback: if legacy or demo code "CLS-001" / "CLS001" is passed, resolve to first active class (CLS3A)
    if not classroom and clean_code in ("CLS001", "CLS-001", "DEMO"):
        class_res = await db.execute(select(Class).where(Class.class_code == "CLS3A"))
        classroom = class_res.scalar_one_or_none()

    if not classroom:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Class code '{credentials.class_code}' not found. Please verify with your teacher."
        )

    # 2. Get students in this class and verify PIN
    stmt = select(User).join(ClassStudent, ClassStudent.student_id == User.id).where(
        ClassStudent.class_id == classroom.id,
        User.is_active == True
    )
    result = await db.execute(stmt)
    students = result.scalars().all()

    matched_student = None
    for s in students:
        if verify_password(credentials.pin, s.password_hash):
            matched_student = s
            break

    if not matched_student:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect student PIN for this class"
        )

    access_token = create_access_token(
        data={"sub": matched_student.id, "role": matched_student.role, "username": matched_student.username}
    )
    refresh_token = create_refresh_token(
        data={"sub": matched_student.id, "role": matched_student.role}
    )

    return Token(access_token=access_token, refresh_token=refresh_token)


@router.post("/refresh", response_model=Token)
async def refresh_token(req: RefreshTokenRequest, db: AsyncSession = Depends(get_db)):
    try:
        payload = decode_token(req.refresh_token)
        if payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type"
            )
        user_id = payload.get("sub")
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token"
        )

    stmt = select(User).where(User.id == user_id)
    user = (await db.execute(stmt)).scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )

    new_access = create_access_token(data={"sub": user.id, "role": user.role, "username": user.username})
    new_refresh = create_refresh_token(data={"sub": user.id, "role": user.role})

    return Token(access_token=new_access, refresh_token=new_refresh)


@router.get("/me", response_model=dict)
async def get_me(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    data = {
        "id": current_user.id,
        "name": current_user.name,
        "username": current_user.username,
        "role": current_user.role,
        "language": current_user.language,
        "is_active": current_user.is_active,
        "parent_id": current_user.parent_id
    }
    if current_user.role == "student":
        prof_stmt = select(StudentProfile).where(StudentProfile.student_id == current_user.id)
        profile = (await db.execute(prof_stmt)).scalar_one_or_none()
        if profile:
            data["xp"] = profile.xp
            data["level"] = profile.level
            data["coins"] = profile.coins
            data["current_streak"] = profile.current_streak
            data["longest_streak"] = profile.longest_streak
            data["streak_freezes"] = profile.streak_freezes
            data["avatar_config"] = profile.avatar_config
    return data
