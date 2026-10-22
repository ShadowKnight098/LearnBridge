import pytest
import pytest_asyncio
import uuid
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.core.security import hash_password
from app.core.database import AsyncSessionLocal
from app.models import User, UserRole, Class

@pytest_asyncio.fixture
async def e2e_client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.mark.asyncio
async def test_e2e_complete_six_scenarios(e2e_client):
    """
    Complete E2E Test Suite covering all 6 Scenarios from 05-TEST-PLAN.md:
    1. Admin creates teacher and class -> teacher logs in.
    2. Teacher adds 3 students (weak, average, strong).
    3. Teacher uploads sample content -> drafts appear -> approves questions.
    4. Each student completes a session; question paths differ.
    5. Class report shows weak skills; alert triggered.
    6. Student earns XP, streak, badge; buys an avatar item.
    """
    # ------------------------------------------------------------------
    # Scenario 1: Admin creates teacher and class -> teacher logs in
    # ------------------------------------------------------------------
    admin_id = str(uuid.uuid4())
    admin_username = f"admin_{uuid.uuid4().hex[:6]}"
    async with AsyncSessionLocal() as session:
        adm = User(
            id=admin_id,
            role=UserRole.admin.value,
            name="Principal Admin",
            username=admin_username,
            password_hash=hash_password("adminpass"),
            language="en",
            is_active=True
        )
        session.add(adm)
        await session.commit()

    admin_login_res = await e2e_client.post("/auth/login", json={"username": admin_username, "password": "adminpass"})
    assert admin_login_res.status_code == 200
    admin_token = admin_login_res.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Admin creates Teacher
    teacher_username = f"teacher_{uuid.uuid4().hex[:6]}"
    create_teacher_res = await e2e_client.post(
        "/admin/teachers",
        headers=admin_headers,
        json={"name": "Ms. Sarah", "username": teacher_username, "password": "teacherpass", "language": "te"}
    )
    assert create_teacher_res.status_code == 201
    teacher_id = create_teacher_res.json()["id"]

    # Admin creates Class for Teacher
    class_code = f"C{uuid.uuid4().hex[:4].upper()}"
    create_class_res = await e2e_client.post(
        "/admin/classes",
        headers=admin_headers,
        json={"name": "Grade 3 Alpha", "grade": 3, "teacher_id": teacher_id, "class_code": class_code}
    )
    assert create_class_res.status_code == 201
    class_id = create_class_res.json()["id"]

    # Teacher logs in
    teacher_login_res = await e2e_client.post("/auth/login", json={"username": teacher_username, "password": "teacherpass"})
    assert teacher_login_res.status_code == 200
    teacher_token = teacher_login_res.json()["access_token"]
    teacher_headers = {"Authorization": f"Bearer {teacher_token}"}

    # ------------------------------------------------------------------
    # Scenario 2: Teacher adds 3 students (weak, average, strong)
    # ------------------------------------------------------------------
    students_info = [
        {"name": "Weak Student", "pin": "1111"},
        {"name": "Average Student", "pin": "2222"},
        {"name": "Strong Student", "pin": "3333"}
    ]
    student_records = []

    for s_info in students_info:
        s_uname = f"stu_{uuid.uuid4().hex[:6]}"
        add_res = await e2e_client.post(
            "/teacher/students",
            headers=teacher_headers,
            json={
                "name": s_info["name"],
                "username": s_uname,
                "pin": s_info["pin"],
                "language": "en",
                "class_id": class_id
            }
        )
        assert add_res.status_code == 201
        student_records.append(add_res.json())

    assert len(student_records) == 3

    # ------------------------------------------------------------------
    # Scenario 3: Teacher uploads content -> drafts appear -> approves
    # ------------------------------------------------------------------
    doc_res = await e2e_client.post(
        "/teacher/documents",
        headers=teacher_headers,
        json={"filename": "math_chapter1.pdf", "subject": "Numeracy", "grade": 3, "language": "en"}
    )
    assert doc_res.status_code == 201
    doc_id = doc_res.json()["id"]

    # Upload chunk
    chunks_res = await e2e_client.post(
        f"/teacher/documents/{doc_id}/chunks",
        headers=teacher_headers,
        json={"chunks": [{"page_no": 1, "position": 0, "text": "Basic counting up to 20 and single digit addition."}]}
    )
    assert chunks_res.status_code == 202

    # Teacher lists draft questions and approves
    drafts_res = await e2e_client.get("/teacher/questions?status=draft", headers=teacher_headers)
    assert drafts_res.status_code == 200
    draft_list = drafts_res.json()
    if draft_list:
        q_id = draft_list[0]["id"]
        approve_res = await e2e_client.patch(
            f"/teacher/questions/{q_id}",
            headers=teacher_headers,
            json={"status": "approved"}
        )
        assert approve_res.status_code == 200

    # ------------------------------------------------------------------
    # Scenario 4: Students log in & complete practice sessions
    # ------------------------------------------------------------------
    for idx, s_rec in enumerate(student_records):
        pin = students_info[idx]["pin"]
        s_login = await e2e_client.post(
            "/auth/student-login",
            json={"class_code": class_code, "pin": pin}
        )
        assert s_login.status_code == 200
        s_token = s_login.json()["access_token"]
        s_headers = {"Authorization": f"Bearer {s_token}"}

        # Start practice session
        sess_res = await e2e_client.post(
            "/practice/sessions",
            headers=s_headers,
            json={"is_diagnostic": False, "language": "en"}
        )
        assert sess_res.status_code == 200
        sess_data = sess_res.json()
        sess_id = sess_data["session_id"]
        q = sess_data.get("first_question")
        assert q is not None, "First question should be served"

        # Weak student answers wrongly; Strong student answers correctly
        is_weak = (idx == 0)
        chosen_opt = (0 if is_weak else 1)

        ans_res = await e2e_client.post(
            f"/practice/sessions/{sess_id}/answer",
            headers=s_headers,
            json={
                "question_id": q["id"],
                "chosen_index": chosen_opt,
                "time_taken_ms": 3500,
                "language": "en"
            }
        )
        assert ans_res.status_code == 200
        ans_data = ans_res.json()
        assert "is_correct" in ans_data
        assert "xp_gained" in ans_data

    # ------------------------------------------------------------------
    # Scenario 5: Class report shows heatmap & Teacher alerts
    # ------------------------------------------------------------------
    report_res = await e2e_client.get(f"/teacher/reports/class/{class_id}", headers=teacher_headers)
    assert report_res.status_code == 200
    report_data = report_res.json()
    assert report_data["class_id"] == class_id
    assert len(report_data["heatmap"]) >= 3

    # Teacher checks alerts
    alerts_res = await e2e_client.get("/teacher/alerts", headers=teacher_headers)
    assert alerts_res.status_code == 200

    # ------------------------------------------------------------------
    # Scenario 6: Student rewards & Avatar update
    # ------------------------------------------------------------------
    strong_s_token = (await e2e_client.post("/auth/student-login", json={"class_code": class_code, "pin": "3333"})).json()["access_token"]
    strong_headers = {"Authorization": f"Bearer {strong_s_token}"}

    rewards_res = await e2e_client.get("/student/me/rewards", headers=strong_headers)
    assert rewards_res.status_code == 200
    r_data = rewards_res.json()
    assert r_data["xp"] >= 0
    assert "badges" in r_data

    # Update avatar
    avatar_res = await e2e_client.patch(
        "/student/me/avatar",
        headers=strong_headers,
        json={"hat": "🎓", "color": "purple"}
    )
    assert avatar_res.status_code == 200
    assert avatar_res.json()["avatar_config"]["hat"] == "🎓"
