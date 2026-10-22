from typing import Optional
from pydantic import BaseModel, Field


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: Optional[str] = None
    role: Optional[str] = None
    username: Optional[str] = None


class LoginRequest(BaseModel):
    username: str
    password: str


class StudentLoginRequest(BaseModel):
    class_code: str
    pin: str


class RefreshTokenRequest(BaseModel):
    refresh_token: str
