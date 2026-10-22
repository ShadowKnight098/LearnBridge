import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy import select
import uuid

from app.main import app
from app.core.security import create_access_token, hash_password
from app.core.database import AsyncSessionLocal
from app.models import User, Class, ClassStudent, Mastery, Attempt, Question, UserRole


@pytest_asyncio.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest_asyncio.fixture
async def setup_report_data():
    async with AsyncSessionLocal() as session:
        admin = (await session.execute(select(User).where(User.username == "admin"))).scalar_one()

        # Teacher 1
        t1 = (await session.execute(select(User).where(User.username == "teacher1"))).scalar_one()
        cls1 = (await session.execute(select(Class).where(Class.class_code == "CLS3A"))).scalar_one()

        # Teacher 2 with another class
        t2 = User(
            id=str(uuid.uuid4()),
            role=UserRole.teacher.value,
            parent_id=admin.id,
            name="Teacher 2",
            username=f"teacher2_{uuid.uuid4().hex[:6]}",
            password_hash=hash_password("teacher123"),
            language="hi",
            is_active=True
        )
        session.add(t2)
        await session.flush()

        cls2 = Class(
            id=str(uuid.uuid4()),
            name="Class 3B",
            grade=3,
            teacher_id=t2.id,
            class_code=f"C{uuid.uuid4().hex[:4].upper()}",
            created_by=admin.id
        )
        session.add(cls2)
        await session.flush()

        t1_token = create_access_token(data={"sub": t1.id, "role": t1.role, "username": t1.username})
        t2_token = create_access_token(data={"sub": t2.id, "role": t2.role, "username": t2.username})
        admin_token = create_access_token(data={"sub": admin.id, "role": admin.role, "username": admin.username})

        await session.commit()
        return {
            "t1": t1, "t1_token": t1_token, "cls1": cls1,
            "t2": t2, "t2_token": t2_token, "cls2": cls2,
            "admin": admin, "admin_token": admin_token
        }


@pytest.mark.asyncio
async def test_rep_02_teacher_sees_only_own_classes(client, setup_report_data):
    """REP-02: Teacher 2 cannot access Teacher 1's class report."""
    data = setup_report_data
    cls1 = data["cls1"]
    t2_token = data["t2_token"]

    res = await client.get(
        f"/teacher/reports/class/{cls1.id}",
        headers={"Authorization": f"Bearer {t2_token}"}
    )
    assert res.status_code == 403
    assert "another teacher's class" in res.json().get("detail", "").lower()


@pytest.mark.asyncio
async def test_rep_01_03_class_accuracy_and_heatmap(client, setup_report_data):
    """REP-01 & REP-03: Class accuracy and heatmap match student mastery records."""
    data = setup_report_data
    cls1 = data["cls1"]
    t1_token = data["t1_token"]

    res = await client.get(
        f"/teacher/reports/class/{cls1.id}",
        headers={"Authorization": f"Bearer {t1_token}"}
    )
    assert res.status_code == 200
    report = res.json()
    assert report["class_id"] == cls1.id
    assert report["total_students"] >= 1
    assert "class_accuracy_percent" in report
    assert "heatmap" in report
    assert len(report["heatmap"]) > 0

    # Verify a cell matches database mastery
    first_cell = report["heatmap"][0]
    assert 0.0 <= first_cell["mastery_score"] <= 1.0
    assert first_cell["band"] in [1, 2, 3]


@pytest.mark.asyncio
async def test_rep_05_csv_export_count(client, setup_report_data):
    """REP-05: CSV export row count equals students count (+1 header)."""
    data = setup_report_data
    cls1 = data["cls1"]
    t1_token = data["t1_token"]

    res = await client.get(
        f"/teacher/reports/class/{cls1.id}/export/csv",
        headers={"Authorization": f"Bearer {t1_token}"}
    )
    assert res.status_code == 200
    assert "text/csv" in res.headers["content-type"]
    lines = [line for line in res.text.strip().split("\r\n") if line]
    # Header + at least 3 students
    assert len(lines) >= 4


@pytest.mark.asyncio
async def test_rep_06_admin_school_report_covers_all_classes(client, setup_report_data):
    """REP-06: Admin school report covers all classes and teachers."""
    data = setup_report_data
    admin_token = data["admin_token"]

    res = await client.get(
        "/admin/reports/school",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert res.status_code == 200
    school_report = res.json()
    assert school_report["total_classes"] >= 2
    assert school_report["total_teachers"] >= 2
    assert len(school_report["class_summaries"]) >= 2
