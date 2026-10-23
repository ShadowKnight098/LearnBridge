from typing import Optional
from pydantic import BaseModel, Field


class UserBasic(BaseModel):
    id: str
    role: str
    username: str
    name: str
    language: str
    class_id: Optional[str] = None


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: Optional[UserBasic] = None


class TokenData(BaseModel):
    user_id: Optional[str] = None
    role: Optional[str] = None
    username: Optional[str] = None


class LoginRequest(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    password: str


class StudentLoginRequest(BaseModel):
    class_code: str
    pin: str
    identifier: Optional[str] = None


class RefreshTokenRequest(BaseModel):
    refresh_token: str
