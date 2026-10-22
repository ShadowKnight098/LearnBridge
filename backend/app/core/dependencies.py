from typing import List, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import jwt

from app.core.config import settings
from app.core.database import get_db
from app.core.security import decode_token
from app.models import User, UserRole, Class, ClassStudent

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_token(token)
        token_type = payload.get("type")
        if token_type != "access":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type",
                headers={"WWW-Authenticate": "Bearer"},
            )
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.PyJWTError:
        raise credentials_exception

    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if user is None:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated"
        )
    return user


def require_role(*allowed_roles: str):
    """Dependency factory checking that the authenticated user has one of the allowed roles."""
    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation not permitted for role '{current_user.role}'"
            )
        return current_user
    return role_checker


# Convenient role dependencies
require_admin = require_role(UserRole.admin.value)
require_teacher = require_role(UserRole.teacher.value)
require_student = require_role(UserRole.student.value)
require_teacher_or_admin = require_role(UserRole.admin.value, UserRole.teacher.value)


async def verify_student_ownership(
    student_id: str,
    current_user: User,
    db: AsyncSession
) -> User:
    """
    Enforces ownership:
    - Admin can access any student.
    - Teacher can only access students where parent_id == teacher.id.
    - Student can only access their own record.
    """
    if current_user.role == UserRole.admin.value:
        pass
    elif current_user.role == UserRole.teacher.value:
        stmt = select(User).where(User.id == student_id, User.parent_id == current_user.id)
        student = (await db.execute(stmt)).scalar_one_or_none()
        if not student:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: Student does not belong to your classroom"
            )
        return student
    elif current_user.role == UserRole.student.value:
        if current_user.id != student_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: Cannot access another student's data"
            )
    else:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    stmt = select(User).where(User.id == student_id)
    student = (await db.execute(stmt)).scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
    return student
