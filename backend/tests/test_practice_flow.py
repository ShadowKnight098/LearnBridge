import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy import select

from app.main import app
from app.core.security import create_access_token
from app.core.database import AsyncSessionLocal
from app.models import User, Question, StudentProfile


@pytest_asyncio.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest_asyncio.fixture
async def student_auth():
    async with AsyncSessionLocal() as session:
        stmt = select(User).where(User.username == "student1")
        student = (await session.execute(stmt)).scalar_one()
        token = create_access_token(data={"sub": student.id, "role": student.role, "username": student.username})
        return student, token


@pytest.mark.asyncio
async def test_complete_practice_session_flow(client, student_auth):
    student, token = student_auth
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Start Session
    start_res = await client.post("/practice/sessions", json={"is_diagnostic": False, "language": "te"}, headers=headers)
    assert start_res.status_code == 200
    data = start_res.json()
    assert not data["daily_cap_reached"]
    assert "session_id" in data
    assert data["first_question"] is not None
    q = data["first_question"]
    assert len(q["options"]) == 4

    # Assert correct_index is NOT leaked
    assert "correct_index" not in q

    session_id = data["session_id"]
    first_q_id = q["id"]

    # 2. Submit fast answer (<1.5s) -> Anti-gaming triggers
    fast_res = await client.post(
        f"/practice/sessions/{session_id}/answer",
        json={"question_id": first_q_id, "chosen_index": 2, "time_taken_ms": 1100},
        headers=headers
    )
    assert fast_res.status_code == 200
    fast_data = fast_res.json()
    assert fast_data["flagged"] is True
    assert fast_data["xp_gained"] == 0

    # 3. Check student progress endpoint
    prog_res = await client.get("/student/me/progress", headers=headers)
    assert prog_res.status_code == 200
    prog_data = prog_res.json()
    assert "mastery_scores" in prog_data
    assert prog_data["total_attempts"] >= 1

    # 4. Check student rewards endpoint
    rew_res = await client.get("/student/me/rewards", headers=headers)
    assert rew_res.status_code == 200
    rew_data = rew_res.json()
    assert "xp" in rew_data
    assert "coins" in rew_data
    assert "badges" in rew_data

    # 5. Check shop and buy item
    shop_res = await client.get("/student/me/shop", headers=headers)
    assert shop_res.status_code == 200
    items = shop_res.json()
    assert len(items) > 0

    # Try buying 'theme_jungle' (costs 50) or 'hat_cap' (costs 30)
    # Student has 25 coins -> buying 30 should fail with 400
    fail_buy = await client.post("/student/me/shop/hat_cap/buy", headers=headers)
    assert fail_buy.status_code == 400
    assert "insufficient" in fail_buy.json()["detail"].lower()

    # 6. Customize avatar
    avatar_res = await client.patch("/student/me/avatar", json={"color": "#FFB020"}, headers=headers)
    assert avatar_res.status_code == 200
    assert avatar_res.json()["avatar_config"]["color"] == "#FFB020"
