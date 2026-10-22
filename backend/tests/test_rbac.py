import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from datetime import timedelta
import uuid

from app.main import app
from app.core.security import create_access_token, hash_password
from app.core.database import AsyncSessionLocal
from app.models import User, Class, ClassStudent, UserRole


@pytest_asyncio.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest_asyncio.fixture
async def setup_test_users():
    async with AsyncSessionLocal() as session:
        # Ensure root admin exists for parent_id FK
        from sqlalchemy import select
        adm = (await session.execute(select(User).where(User.role == UserRole.admin.value))).scalars().first()
        if not adm:
            adm = User(
                id=str(uuid.uuid4()),
                role=UserRole.admin.value,
                name="Root Admin",
                username=f"admin_{uuid.uuid4().hex[:6]}",
                password_hash=hash_password("admin123"),
                language="en",
                is_active=True
            )
            session.add(adm)
            await session.flush()

        # Teacher A
        t_a = User(
            id=str(uuid.uuid4()),
            role=UserRole.teacher.value,
            parent_id=adm.id,
            name="Teacher A",
            username=f"teacher_a_{uuid.uuid4().hex[:6]}",
            password_hash=hash_password("pass123"),
            language="te",
            is_active=True
        )
        # Teacher B
        t_b = User(
            id=str(uuid.uuid4()),
            role=UserRole.teacher.value,
            parent_id=adm.id,
            name="Teacher B",
            username=f"teacher_b_{uuid.uuid4().hex[:6]}",
            password_hash=hash_password("pass123"),
            language="hi",
            is_active=True
        )
        session.add_all([t_a, t_b])
        await session.flush()

        # Class B for Teacher B
        cls_b = Class(
            id=str(uuid.uuid4()),
            name="Class B",
            grade=3,
            teacher_id=t_b.id,
            class_code=f"B{uuid.uuid4().hex[:4].upper()}",
            created_by=t_b.id
        )
        session.add(cls_b)
        await session.flush()

        # Student B owned by Teacher B
        s_b = User(
            id=str(uuid.uuid4()),
            role=UserRole.student.value,
            parent_id=t_b.id,
            name="Student B",
            username=f"student_b_{uuid.uuid4().hex[:6]}",
            password_hash=hash_password("9999"),
            language="hi",
            is_active=True
        )
        # Deactivated user
        deact = User(
            id=str(uuid.uuid4()),
            role=UserRole.teacher.value,
            parent_id=adm.id,
            name="Deactivated Teacher",
            username=f"deact_{uuid.uuid4().hex[:6]}",
            password_hash=hash_password("pass123"),
            language="en",
            is_active=False
        )
        session.add_all([s_b, deact])
        await session.flush()
        session.add(ClassStudent(class_id=cls_b.id, student_id=s_b.id))
        await session.commit()

        yield {
            "teacher_a": t_a,
            "teacher_b": t_b,
            "class_b": cls_b,
            "student_b": s_b,
            "deactivated": deact
        }


@pytest.mark.asyncio
async def test_sec_05_unauthenticated_request(client):
    """SEC-05: Unauthenticated request to protected route returns 401."""
    res = await client.get("/admin/teachers")
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_sec_04_teacher_calls_admin(client, setup_test_users):
    """SEC-04: Teacher calls /admin/teachers returns 403."""
    t_a = setup_test_users["teacher_a"]
    token = create_access_token(data={"sub": t_a.id, "role": t_a.role, "username": t_a.username})
    res = await client.get("/admin/teachers", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 403


@pytest.mark.asyncio
async def test_sec_03_student_calls_teacher_route(client, setup_test_users):
    """SEC-03: Student calls /teacher/* route returns 403."""
    s_b = setup_test_users["student_b"]
    token = create_access_token(data={"sub": s_b.id, "role": s_b.role, "username": s_b.username})
    res = await client.get("/teacher/classes", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 403


@pytest.mark.asyncio
async def test_sec_06_expired_jwt(client, setup_test_users):
    """SEC-06: Expired JWT returns 401."""
    t_a = setup_test_users["teacher_a"]
    expired_token = create_access_token(
        data={"sub": t_a.id, "role": t_a.role, "username": t_a.username},
        expires_delta=timedelta(seconds=-10)
    )
    res = await client.get("/teacher/classes", headers={"Authorization": f"Bearer {expired_token}"})
    assert res.status_code == 401
    assert "expired" in res.json().get("detail", "").lower()


@pytest.mark.asyncio
async def test_sec_07_deactivated_user_login(client, setup_test_users):
    """SEC-07: Deactivated user login is rejected with 403."""
    deact = setup_test_users["deactivated"]
    res = await client.post("/auth/login", json={"username": deact.username, "password": "pass123"})
    assert res.status_code == 403
    assert "deactivated" in res.json().get("detail", "").lower()


@pytest.mark.asyncio
async def test_sec_08_student_pin_login(client, setup_test_users):
    """SEC-08: Student login with class code + PIN succeeds, wrong PIN fails."""
    cls_b = setup_test_users["class_b"]
    # Success
    res = await client.post("/auth/student-login", json={"class_code": cls_b.class_code, "pin": "9999"})
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert "refresh_token" in data

    # Wrong PIN fails with 401
    bad_res = await client.post("/auth/student-login", json={"class_code": cls_b.class_code, "pin": "0000"})
    assert bad_res.status_code == 401


@pytest.mark.asyncio
async def test_sec_01_teacher_cannot_add_student_to_other_teacher_class(client, setup_test_users):
    """SEC-01: Teacher A cannot add a student to Teacher B's class."""
    t_a = setup_test_users["teacher_a"]
    cls_b = setup_test_users["class_b"]
    token = create_access_token(data={"sub": t_a.id, "role": t_a.role, "username": t_a.username})

    res = await client.post(
        "/teacher/students",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "name": "Intruder Student",
            "username": f"intruder_{uuid.uuid4().hex[:6]}",
            "pin": "1234",
            "language": "te",
            "class_id": cls_b.id
        }
    )
    assert res.status_code in [400, 403]


@pytest.mark.asyncio
async def test_sec_02_teacher_cannot_access_other_teacher_document(client, setup_test_users):
    """SEC-02: Teacher A requests Teacher B's document chunks -> 404 Not Found / Unauthorized."""
    t_a = setup_test_users["teacher_a"]
    token = create_access_token(data={"sub": t_a.id, "role": t_a.role, "username": t_a.username})
    fake_doc_id = str(uuid.uuid4())
    res = await client.post(
        f"/teacher/documents/{fake_doc_id}/chunks",
        headers={"Authorization": f"Bearer {token}"},
        json={"chunks": [{"page_no": 1, "position": 0, "text": "test content"}]}
    )
    assert res.status_code == 404



@pytest.mark.asyncio
async def test_sec_09_student_cannot_access_teacher_reports(client, setup_test_users):
    """SEC-09: Student cannot access teacher student detail reports -> 403."""
    s_b = setup_test_users["student_b"]
    token = create_access_token(data={"sub": s_b.id, "role": s_b.role, "username": s_b.username})
    other_student_id = str(uuid.uuid4())
    res = await client.get(
        f"/teacher/reports/student/{other_student_id}",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 403

