import pytest
import pytest_asyncio
import json
from httpx import AsyncClient, ASGITransport
from sqlalchemy import select

from app.main import app
from app.core.security import create_access_token
from app.core.database import AsyncSessionLocal
from app.models import User, Question, Document, GenerationJob
from app.services.generator import (
    build_generation_prompt, validate_generated_questions, process_document_generation
)


@pytest_asyncio.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest_asyncio.fixture
async def teacher_auth():
    async with AsyncSessionLocal() as session:
        stmt = select(User).where(User.username == "teacher1")
        teacher = (await session.execute(stmt)).scalar_one()
        token = create_access_token(data={"sub": teacher.id, "role": teacher.role, "username": teacher.username})
        return teacher, token


def test_gen_10_prompt_builder_no_student_id():
    """GEN-10: Student identifiers must never be included in LLM prompts."""
    prompt = build_generation_prompt(grade=3, subject="Math", language="te", chunk_text="Two halves make a whole.")
    assert "student_id" not in prompt.lower()


def test_gen_01_valid_json_parsed():
    """GEN-01: LLM valid JSON parsed and converted to questions."""
    raw_json = json.dumps([
        {
            "skill_id": "NUM-02",
            "difficulty": 2,
            "grade": 3,
            "type": "mcq",
            "language": "te",
            "text": "10 + 15 ఎంత?",
            "options": ["20", "25", "30", "35"],
            "correct_index": 1,
            "explanation": "10 కి 15 కలిపితే 25 అవుతుంది."
        }
    ])
    questions = validate_generated_questions(raw_json, expected_language="te")
    assert len(questions) == 1
    assert questions[0]["text"] == "10 + 15 ఎంత?"
    assert questions[0]["correct_index"] == 1


def test_gen_02_malformed_json_rejected():
    """GEN-02: Malformed JSON handled/rejected."""
    with pytest.raises(ValueError):
        validate_generated_questions("This is not JSON at all!", expected_language="te")


def test_gen_03_invalid_correct_index_rejected():
    """GEN-03: Correct answer index outside bounds of options rejected."""
    raw_json = json.dumps([
        {
            "skill_id": "NUM-02",
            "difficulty": 1,
            "text": "Sample Question?",
            "options": ["A", "B"],
            "correct_index": 5  # Out of range!
        }
    ])
    questions = validate_generated_questions(raw_json, expected_language="en")
    assert len(questions) == 0  # Invalid question discarded


def test_gen_04_duplicates_deduplicated():
    """GEN-04: Duplicate questions in a chunk are de-duplicated."""
    raw_json = json.dumps([
        {"skill_id": "NUM-01", "difficulty": 1, "text": "What is 2+2?", "options": ["3", "4", "5", "6"], "correct_index": 1},
        {"skill_id": "NUM-01", "difficulty": 1, "text": "What is 2+2?", "options": ["3", "4", "5", "6"], "correct_index": 1}
    ])
    questions = validate_generated_questions(raw_json, expected_language="en")
    assert len(questions) == 1


@pytest.mark.asyncio
async def test_document_and_review_workflow(client, teacher_auth):
    """End-to-end document creation, chunking, draft generation, and teacher review."""
    teacher, token = teacher_auth
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Register Document
    doc_res = await client.post(
        "/teacher/documents",
        json={"filename": "math_grade3_ch1.pdf", "subject": "Math", "grade": 3, "language": "te"},
        headers=headers
    )
    assert doc_res.status_code == 201
    doc_id = doc_res.json()["id"]

    # 2. Upload Chunks
    chunk_res = await client.post(
        f"/teacher/documents/{doc_id}/chunks",
        json={"chunks": [{"page_no": 1, "position": 0, "text": "కూడిక మరియు తీసివేత లెక్కలు అధ్యాయం."}]},
        headers=headers
    )
    assert chunk_res.status_code == 202
    job_id = chunk_res.json()["id"]

    # 3. Process generation synchronously for the test
    await process_document_generation(doc_id, job_id, AsyncSessionLocal)

    # Verify job status
    job_res = await client.get(f"/teacher/jobs/{job_id}", headers=headers)
    assert job_res.status_code == 200
    assert job_res.json()["status"] == "done"

    # 4. Teacher reviews drafts (GEN-06: draft questions not served to students)
    drafts_res = await client.get("/teacher/questions?status=draft", headers=headers)
    assert drafts_res.status_code == 200
    drafts = drafts_res.json()
    assert len(drafts) >= 1
    draft_q = drafts[0]
    assert draft_q["status"] == "draft"

    # 5. Teacher approves question (GEN-07: teacher approves question)
    approve_res = await client.patch(
        f"/teacher/questions/{draft_q['id']}",
        json={"status": "approved"},
        headers=headers
    )
    assert approve_res.status_code == 200
    assert approve_res.json()["status"] == "approved"
    assert approve_res.json()["approved_at"] is not None
