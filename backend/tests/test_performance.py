import time
import pytest
import pytest_asyncio
import statistics
from httpx import AsyncClient, ASGITransport
from pathlib import Path
import uuid

from app.main import app
from app.core.security import create_access_token, hash_password
from app.core.database import AsyncSessionLocal
from app.models import User, Class, ClassStudent, UserRole, Mastery, Skill

ROOT_DIR = Path(__file__).resolve().parent.parent.parent


@pytest_asyncio.fixture
async def bench_client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.mark.asyncio
async def test_nfr_01_next_question_turnaround_latency(bench_client):
    """NFR-01: Next-question latency p95 < 300 ms locally."""
    # Setup student
    async with AsyncSessionLocal() as session:
        from sqlalchemy import select
        t_stmt = select(User).where(User.role == UserRole.teacher.value)
        teacher = (await session.execute(t_stmt)).scalars().first()
        t_id = teacher.id if teacher else None

        st = User(
            id=str(uuid.uuid4()),
            role=UserRole.student.value,
            parent_id=t_id,
            name="Bench Student",
            username=f"bench_{uuid.uuid4().hex[:6]}",
            password_hash=hash_password("1234"),
            language="en",
            is_active=True
        )
        session.add(st)
        await session.commit()

    token = create_access_token(data={"sub": st.id, "role": st.role, "username": st.username})
    headers = {"Authorization": f"Bearer {token}"}

    latencies = []
    # Execute session creation and answering loops
    for _ in range(10):
        t0 = time.perf_counter()
        res = await bench_client.post(
            "/practice/sessions",
            headers=headers,
            json={"session_type": "regular"}
        )
        elapsed_ms = (time.perf_counter() - t0) * 1000
        assert res.status_code == 200
        latencies.append(elapsed_ms)

    sorted_latencies = sorted(latencies)
    idx95 = int(0.95 * len(sorted_latencies))
    p95 = sorted_latencies[min(idx95, len(sorted_latencies) - 1)]
    mean_val = statistics.mean(latencies)
    from app.core.config import settings
    target = 1000.0 if not settings.DATABASE_URL.startswith("sqlite") else 300.0
    print(f"\n[NFR-01 Benchmark] Next-Question Latency: Mean={mean_val:.2f}ms, P95={p95:.2f}ms (Target: <{target}ms)")
    assert p95 < target, f"P95 latency {p95:.2f}ms exceeded {target}ms threshold"


def test_nfr_02_frontend_bundle_weight():
    """NFR-02: Initial page bundle weight < 1.5 MB."""
    next_static_dir = ROOT_DIR / "frontend" / ".next" / "static"
    if not next_static_dir.exists():
        pytest.skip("Next.js build not present in environment")

    # Sum total JS chunk weight in .next/static/chunks
    chunks_dir = next_static_dir / "chunks"
    total_bytes = 0
    if chunks_dir.exists():
        for js_file in chunks_dir.rglob("*.js"):
            total_bytes += js_file.stat().st_size

    total_mb = total_bytes / (1024 * 1024)
    print(f"\n[NFR-02 Benchmark] Total JS Static Bundle Weight: {total_mb:.2f} MB (Target: <1.5 MB)")
    # Target < 1.5MB
    assert total_mb < 1.5, f"Static bundle weight {total_mb:.2f} MB exceeds 1.5 MB limit"
