from datetime import datetime, date, timedelta, timezone
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func, and_, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.dependencies import require_student
from app.models import (
    User, Session, Attempt, Mastery, Question, Skill,
    StudentProfile, StudentBadge, RewardEvent
)
from app.services.adaptive import (
    update_mastery, band_difficulty, select_target_skill, select_next_question
)
from app.services.rewards import (
    calculate_attempt_xp, calculate_level, calculate_streak, evaluate_badges,
    XP_SESSION_COMPLETION, COINS_SESSION_COMPLETION
)
from app.schemas.practice import (
    PracticeSessionStart, SessionStartResponse, QuestionItemResponse,
    AnswerSubmission, AnswerResponse, SessionSummary
)

router = APIRouter(prefix="/practice", tags=["Practice"])

DEFAULT_SESSION_LENGTH = 10
DIAGNOSTIC_SESSION_LENGTH = 8

STARTER_SKILLS = [
    {"id": "NUM-01", "domain": "numeracy", "name_en": "Counting 1-20", "name_te": "లెక్కింపు 1-20", "name_hi": "गिनती 1-20", "grade_min": 1, "grade_max": 3},
    {"id": "NUM-02", "domain": "numeracy", "name_en": "Single-Digit Addition", "name_te": "ఏక అంకెల కూడిక", "name_hi": "एक अंकीय जोड़", "grade_min": 1, "grade_max": 3},
    {"id": "NUM-03", "domain": "numeracy", "name_en": "Single-Digit Subtraction", "name_te": "ఏక అంకెల తీసివేత", "name_hi": "एक अंकीय घटाव", "grade_min": 1, "grade_max": 3},
    {"id": "LIT-01", "domain": "literacy", "name_en": "Letter Recognition", "name_te": "అక్షర గుర్తింపు", "name_hi": "वर्ण पहचान", "grade_min": 1, "grade_max": 3},
    {"id": "LIT-03", "domain": "literacy", "name_en": "CVC Word Blending", "name_te": "పదాల నిర్మాణం", "name_hi": "शब्द मिश्रण", "grade_min": 1, "grade_max": 3},
    {"id": "LANG-01", "domain": "language", "name_en": "Everyday Objects", "name_te": "రోజువారీ వస్తువులు", "name_hi": "दैनिक वस्तुएँ", "grade_min": 1, "grade_max": 3},
]

STARTER_QUESTIONS = [
    {
        "concept_id": "num01_count_stars",
        "skill_id": "NUM-01",
        "language": "en",
        "grade": 3,
        "difficulty": 1,
        "type": "mcq",
        "text": "How many stars are here: ⭐ ⭐ ⭐ ⭐ ⭐ ?",
        "options": ["3", "4", "5", "6"],
        "correct_index": 2,
        "explanation": "Counting the stars one by one gives 5 stars.",
        "status": "approved"
    },
    {
        "concept_id": "num01_count_stars_te",
        "skill_id": "NUM-01",
        "language": "te",
        "grade": 3,
        "difficulty": 1,
        "type": "mcq",
        "text": "ఇక్కడ ఎన్ని నక్షత్రాలు ఉన్నాయి: ⭐ ⭐ ⭐ ⭐ ⭐ ?",
        "options": ["3", "4", "5", "6"],
        "correct_index": 2,
        "explanation": "ఒక్కొక్కటిగా లెక్కిస్తే మొత్తం 5 నక్షత్రాలు ఉన్నాయి.",
        "status": "approved"
    },
    {
        "concept_id": "num01_count_stars_hi",
        "skill_id": "NUM-01",
        "language": "hi",
        "grade": 3,
        "difficulty": 1,
        "type": "mcq",
        "text": "यहाँ कितने तारे हैं: ⭐ ⭐ ⭐ ⭐ ⭐ ?",
        "options": ["3", "4", "5", "6"],
        "correct_index": 2,
        "explanation": "एक-एक करके गिनने पर कुल 5 तारे हैं।",
        "status": "approved"
    },
    {
        "concept_id": "num01_compare_numbers",
        "skill_id": "NUM-01",
        "language": "en",
        "grade": 3,
        "difficulty": 2,
        "type": "mcq",
        "text": "Which number is greater: 47 or 74?",
        "options": ["47", "74", "Both are equal", "Cannot be determined"],
        "correct_index": 1,
        "explanation": "74 has 7 tens, while 47 has only 4 tens. Therefore, 74 is greater.",
        "status": "approved"
    },
    {
        "concept_id": "num01_place_value",
        "skill_id": "NUM-01",
        "language": "en",
        "grade": 3,
        "difficulty": 3,
        "type": "mcq",
        "text": "In the number 85, what is the place value of 8?",
        "options": ["8", "80", "50", "85"],
        "correct_index": 1,
        "explanation": "8 is in the tens place, so its value is 8 x 10 = 80.",
        "status": "approved"
    },
    {
        "concept_id": "num02_add_single",
        "skill_id": "NUM-02",
        "language": "en",
        "grade": 3,
        "difficulty": 1,
        "type": "mcq",
        "text": "What is 4 + 3?",
        "options": ["6", "7", "8", "9"],
        "correct_index": 1,
        "explanation": "4 plus 3 equals 7.",
        "status": "approved"
    },
    {
        "concept_id": "num02_add_single_te",
        "skill_id": "NUM-02",
        "language": "te",
        "grade": 3,
        "difficulty": 1,
        "type": "mcq",
        "text": "4 + 3 ఎంత?",
        "options": ["6", "7", "8", "9"],
        "correct_index": 1,
        "explanation": "4 కు 3 కలిపితే 7 వస్తుంది.",
        "status": "approved"
    },
    {
        "concept_id": "num02_add_single_hi",
        "skill_id": "NUM-02",
        "language": "hi",
        "grade": 3,
        "difficulty": 1,
        "type": "mcq",
        "text": "4 + 3 कितना होता है?",
        "options": ["6", "7", "8", "9"],
        "correct_index": 1,
        "explanation": "4 में 3 जोड़ने पर 7 प्राप्त होता है।",
        "status": "approved"
    },
    {
        "concept_id": "lit01_vowel",
        "skill_id": "LIT-01",
        "language": "en",
        "grade": 3,
        "difficulty": 1,
        "type": "mcq",
        "text": "Which of these letters is a vowel?",
        "options": ["B", "E", "T", "M"],
        "correct_index": 1,
        "explanation": "E is a vowel (A, E, I, O, U are vowels).",
        "status": "approved"
    },
    {
        "concept_id": "lit03_antonym",
        "skill_id": "LIT-03",
        "language": "en",
        "grade": 3,
        "difficulty": 2,
        "type": "mcq",
        "text": "What is the opposite of the word 'Big'?",
        "options": ["Tall", "Small", "Heavy", "Wide"],
        "correct_index": 1,
        "explanation": "The opposite of 'Big' is 'Small'.",
        "status": "approved"
    }
]


_starter_content_checked = False


async def ensure_starter_content(db: AsyncSession):
    """Ensures at least starter skills and approved questions exist in the database."""
    global _starter_content_checked
    if _starter_content_checked:
        return

    try:
        q_count = (await db.execute(select(func.count(Question.id)))).scalar() or 0
        if q_count > 0:
            _starter_content_checked = True
            return

        # Ensure skills exist
        for s_data in STARTER_SKILLS:
            existing = (await db.execute(select(Skill).where(Skill.id == s_data["id"]))).scalar_one_or_none()
            if not existing:
                db.add(Skill(**s_data))
        await db.flush()

        # Add starter questions
        for q_data in STARTER_QUESTIONS:
            db.add(Question(**q_data))
        await db.commit()
        _starter_content_checked = True
    except Exception:
        await db.rollback()



def get_effective_hint(q: Any, lang: str = "en") -> str:
    """
    Returns an encouraging, pedagogical hint for the learner.
    If question has a custom hint, returns it.
    Otherwise produces an intuitive fallback hint based on skill, question content, and language.
    """
    if isinstance(q, dict):
        custom_hint = q.get("hint")
        q_text = q.get("text", "")
        skill_id = q.get("skill_id", "")
    else:
        custom_hint = getattr(q, "hint", None)
        q_text = getattr(q, "text", "")
        skill_id = getattr(q, "skill_id", "")

    if custom_hint and str(custom_hint).strip():
        return str(custom_hint).strip()

    is_num = "NUM" in str(skill_id) or any(char.isdigit() for char in q_text) or any(sym in q_text for sym in ["+", "-", "*", "/", "=", "⭐"])
    if lang == "te":
        if is_num:
            return "ఒక్కొక్కటిగా జాగ్రత్తగా లెక్కించండి లేదా సంఖ్యలను పదులు మరియు ఒకట్లుగా విభజించి చూడండి."
        return "సరైన సమాధానం కోసం ప్రశ్నలోని ముఖ్యమైన పదాలను పాఠ్యాంశంతో సరిపోల్చండి."
    elif lang == "hi":
        if is_num:
            return "एक-एक करके ध्यान से गिनें या संख्याओं को दहाई और इकाई में विभाजित करके देखें।"
        return "सही उत्तर खोजने के लिए प्रश्न के मुख्य शब्दों को पाठ के साथ मिलाकर देखें।"
    else:
        if is_num:
            return "Count carefully step-by-step or break down the numbers to find the answer."
        return "Look closely at the key words in the question and compare each choice."


@router.post("/sessions", response_model=SessionStartResponse)
async def start_practice_session(
    payload: PracticeSessionStart,
    current_student: User = Depends(require_student),
    db: AsyncSession = Depends(get_db)
):
    await ensure_starter_content(db)
    is_diag = payload.final_is_diagnostic
    today = date.today()
    start_of_day = datetime.combine(today, datetime.min.time(), tzinfo=timezone.utc)

    # 1. Enforce Daily Session Cap
    sessions_today_stmt = select(func.count(Session.id)).where(
        Session.student_id == current_student.id,
        Session.started_at >= start_of_day,
        Session.ended_at.is_not(None)
    )
    sessions_today = (await db.execute(sessions_today_stmt)).scalar() or 0

    if sessions_today >= settings.DAILY_SESSION_CAP:
        return SessionStartResponse(
            session_id="",
            is_diagnostic=is_diag,
            language=payload.language or current_student.language,
            current_question_number=0,
            total_questions=0,
            first_question=None,
            question=None,
            daily_cap_reached=True,
            message="Great work today! You have reached your daily practice limit. Time to rest and come back tomorrow!"
        )

    # 2. Create Session
    lang = payload.language or current_student.language
    session = Session(
        student_id=current_student.id,
        is_diagnostic=is_diag
    )
    db.add(session)
    await db.flush()

    # 3. Candidate approved questions
    q_stmt = select(Question).where(
        Question.language == lang,
        Question.status == "approved"
    )
    all_questions = (await db.execute(q_stmt)).scalars().all()
    if not all_questions:
        q_stmt = select(Question).where(Question.status == "approved")
        all_questions = (await db.execute(q_stmt)).scalars().all()

    # Candidate skills in content pool
    available_skills = list({q.skill_id for q in all_questions})

    # 4. Retrieve student's current mastery
    mastery_stmt = select(Mastery).where(Mastery.student_id == current_student.id)
    mastery_rows = (await db.execute(mastery_stmt)).scalars().all()
    mastery_map = {m.skill_id: m.score for m in mastery_rows}

    # Select target skill (honor payload.skill_id if requested)
    if payload.skill_id:
        target_skill = payload.skill_id
    else:
        target_skill = select_target_skill(mastery_map, available_skills) or "NUM-01"
    target_diff = band_difficulty(mastery_map.get(target_skill, 0.3))

    pool = [
        {
            "id": q.id,
            "skill_id": q.skill_id,
            "difficulty": q.difficulty,
            "language": q.language,
            "status": q.status,
            "text": q.text,
            "options": q.options,
            "type": q.type
        }
        for q in all_questions
    ]

    # Recency check: questions attempted in last 7 days
    seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
    recent_attempts_stmt = select(Attempt.question_id).where(
        Attempt.student_id == current_student.id,
        Attempt.created_at >= seven_days_ago
    )
    recently_seen = (await db.execute(recent_attempts_stmt)).scalars().all()

    first_q, reason = select_next_question(
        skill_id=target_skill,
        target_difficulty=target_diff,
        language=lang,
        candidate_questions=pool,
        recently_seen_ids=recently_seen
    )

    await db.commit()

    total_q = DIAGNOSTIC_SESSION_LENGTH if is_diag else DEFAULT_SESSION_LENGTH

    first_q_resp = None
    if first_q:
        first_q_resp = QuestionItemResponse(
            id=first_q["id"],
            skill_id=first_q["skill_id"],
            difficulty=first_q["difficulty"],
            language=first_q["language"],
            type=first_q["type"],
            text=first_q["text"],
            options=first_q["options"],
            hint=get_effective_hint(first_q, lang)
        )

    return SessionStartResponse(
        session_id=session.id,
        is_diagnostic=session.is_diagnostic,
        language=lang,
        current_question_number=1,
        total_questions=total_q,
        first_question=first_q_resp,
        question=first_q_resp,
        daily_cap_reached=False
    )


@router.post("/sessions/{session_id}/answer", response_model=AnswerResponse)
async def submit_answer(
    session_id: str,
    payload: AnswerSubmission,
    current_student: User = Depends(require_student),
    db: AsyncSession = Depends(get_db)
):
    # 1. Fetch Session
    session_stmt = select(Session).where(
        Session.id == session_id,
        Session.student_id == current_student.id
    )
    session = (await db.execute(session_stmt)).scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    if session.ended_at is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Session already completed")

    # 2. Fetch Question
    q_stmt = select(Question).where(Question.id == payload.question_id)
    question = (await db.execute(q_stmt)).scalar_one_or_none()
    if not question:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")

    chosen_idx = payload.final_chosen_index
    time_taken = payload.final_time_taken_ms
    is_correct = (chosen_idx == question.correct_index)
    lang = payload.language or question.language

    # 3. Calculate XP & Anti-gaming check
    xp_gained, flagged = calculate_attempt_xp(
        is_correct=is_correct,
        is_retry=False,
        time_taken_ms=time_taken
    )

    # 4. Record Attempt
    attempt = Attempt(
        session_id=session.id,
        student_id=current_student.id,
        question_id=question.id,
        chosen_index=chosen_idx,
        is_correct=is_correct,
        time_taken_ms=time_taken,
        flagged=flagged,
        language=lang
    )
    db.add(attempt)
    await db.flush()

    # 5. Update Mastery
    m_stmt = select(Mastery).where(
        Mastery.student_id == current_student.id,
        Mastery.skill_id == question.skill_id
    )
    mastery = (await db.execute(m_stmt)).scalar_one_or_none()
    if not mastery:
        mastery = Mastery(
            student_id=current_student.id,
            skill_id=question.skill_id,
            score=0.3,
            attempts=0
        )
        db.add(mastery)
        await db.flush()

    old_mastery = mastery.score
    new_mastery = update_mastery(mastery.score, is_correct, question.difficulty)
    mastery.score = new_mastery
    mastery.attempts += 1

    # 6. Update Profile XP & Coins
    prof_stmt = select(StudentProfile).where(StudentProfile.student_id == current_student.id)
    profile = (await db.execute(prof_stmt)).scalar_one()

    if xp_gained > 0:
        profile.xp += xp_gained
        profile.level = calculate_level(profile.xp)
        db.add(RewardEvent(
            student_id=current_student.id,
            type="xp",
            amount=xp_gained,
            reason=f"Attempt on {question.skill_id}"
        ))

    # 7. Check session progression
    total_allowed = DIAGNOSTIC_SESSION_LENGTH if session.is_diagnostic else DEFAULT_SESSION_LENGTH
    attempts_count_stmt = select(func.count(Attempt.id)).where(Attempt.session_id == session.id)
    attempts_done = (await db.execute(attempts_count_stmt)).scalar() or 0

    is_completed = (attempts_done >= total_allowed)
    summary = None
    next_q_resp = None

    if is_completed:
        # Finalize Session
        now = datetime.now(timezone.utc)
        session.ended_at = now

        # Compute session performance
        correct_stmt = select(func.count(Attempt.id)).where(
            Attempt.session_id == session.id,
            Attempt.is_correct == True
        )
        correct_count = (await db.execute(correct_stmt)).scalar() or 0

        # Session completion rewards
        profile.xp += XP_SESSION_COMPLETION
        profile.coins += COINS_SESSION_COMPLETION
        profile.level = calculate_level(profile.xp)

        db.add(RewardEvent(student_id=current_student.id, type="xp", amount=XP_SESSION_COMPLETION, reason="Session bonus"))
        db.add(RewardEvent(student_id=current_student.id, type="coin", amount=COINS_SESSION_COMPLETION, reason="Session bonus"))

        # Streak update
        today = date.today()
        new_streak, new_freezes, streak_status = calculate_streak(
            last_active_date=profile.last_active_date,
            current_streak=profile.current_streak,
            streak_freezes=profile.streak_freezes,
            today=today
        )
        profile.current_streak = new_streak
        profile.streak_freezes = new_freezes
        profile.longest_streak = max(profile.longest_streak, new_streak)
        profile.last_active_date = today

        # Evaluate Badges
        all_attempts_stmt = select(Attempt).where(Attempt.student_id == current_student.id).order_by(Attempt.created_at.desc())
        all_attempts = (await db.execute(all_attempts_stmt)).scalars().all()

        # calculate consecutive correct run
        run = 0
        for a in all_attempts:
            if a.is_correct:
                run += 1
            else:
                break

        distinct_langs_stmt = select(Attempt.language).where(Attempt.student_id == current_student.id).distinct()
        distinct_langs = (await db.execute(distinct_langs_stmt)).scalars().all()

        total_sessions_stmt = select(func.count(Session.id)).where(
            Session.student_id == current_student.id,
            Session.ended_at.is_not(None)
        )
        total_sessions = (await db.execute(total_sessions_stmt)).scalar() or 1

        already_badges_stmt = select(StudentBadge.badge_id).where(StudentBadge.student_id == current_student.id)
        already_badges = (await db.execute(already_badges_stmt)).scalars().all()

        stats = {
            "sessions_count": total_sessions,
            "streak": profile.current_streak,
            "correct_run": run,
            "languages_practised": distinct_langs,
            "max_mastery_gain_from_weak": round(new_mastery - old_mastery, 2) if old_mastery < 0.4 else 0.0
        }
        new_badge_ids = evaluate_badges(stats, already_badges)
        for b_id in new_badge_ids:
            db.add(StudentBadge(student_id=current_student.id, badge_id=b_id))
            db.add(RewardEvent(student_id=current_student.id, type="badge", amount=1, reason=f"Earned badge {b_id}"))

        summary = SessionSummary(
            session_id=session.id,
            total_questions=attempts_done,
            correct_count=correct_count,
            accuracy_percent=round((correct_count / max(1, attempts_done)) * 100, 1),
            xp_earned=xp_gained + XP_SESSION_COMPLETION,
            coins_earned=COINS_SESSION_COMPLETION,
            streak=profile.current_streak,
            new_badges=new_badge_ids,
            level=profile.level
        )
    else:
        # Select Next Question
        masteries = (await db.execute(select(Mastery).where(Mastery.student_id == current_student.id))).scalars().all()
        m_map = {m.skill_id: m.score for m in masteries}

        skills_stmt = select(Question.skill_id).where(
            Question.language == lang,
            Question.status == "approved"
        ).distinct()
        avail_skills = (await db.execute(skills_stmt)).scalars().all()
        next_skill = select_target_skill(m_map, avail_skills) or "NUM-01"
        target_diff = band_difficulty(m_map.get(next_skill, 0.3))

        # Recent attempts in session to count consecutive wrong
        recent_session_attempts = (await db.execute(
            select(Attempt).where(Attempt.session_id == session.id).order_by(Attempt.created_at.desc()).limit(3)
        )).scalars().all()
        consecutive_wrong = 0
        for a in recent_session_attempts:
            if not a.is_correct:
                consecutive_wrong += 1
            else:
                break

        # Pool of questions
        q_pool_stmt = select(Question).where(Question.language == lang, Question.status == "approved")
        all_q = (await db.execute(q_pool_stmt)).scalars().all()
        pool = [
            {
                "id": q.id,
                "skill_id": q.skill_id,
                "difficulty": q.difficulty,
                "language": q.language,
                "status": q.status,
                "text": q.text,
                "options": q.options,
                "type": q.type
            }
            for q in all_q
        ]

        seen_stmt = select(Attempt.question_id).where(Attempt.student_id == current_student.id)
        seen_ids = (await db.execute(seen_stmt)).scalars().all()

        next_q, _ = select_next_question(
            skill_id=next_skill,
            target_difficulty=target_diff,
            language=lang,
            candidate_questions=pool,
            recently_seen_ids=seen_ids,
            consecutive_wrong_count=consecutive_wrong
        )

        if next_q:
            next_q_resp = QuestionItemResponse(
                id=next_q["id"],
                skill_id=next_q["skill_id"],
                difficulty=next_q["difficulty"],
                language=next_q["language"],
                type=next_q["type"],
                text=next_q["text"],
                options=next_q["options"],
                hint=get_effective_hint(next_q, lang)
            )

    await db.commit()

    return AnswerResponse(
        is_correct=is_correct,
        correct_index=question.correct_index,
        correct_answer_index=question.correct_index,
        explanation=question.explanation,
        xp_gained=xp_gained,
        xp_earned=xp_gained,
        flagged=flagged,
        current_question_number=attempts_done + (0 if is_completed else 1),
        total_questions=total_allowed,
        next_question=next_q_resp,
        is_completed=is_completed,
        summary=summary
    )


@router.post("/sessions/{session_id}/complete")
async def complete_practice_session(
    session_id: str,
    current_student: User = Depends(require_student),
    db: AsyncSession = Depends(get_db)
):
    session_stmt = select(Session).where(
        Session.id == session_id,
        Session.student_id == current_student.id
    )
    session = (await db.execute(session_stmt)).scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    if session.ended_at is None:
        session.ended_at = datetime.now(timezone.utc)

    # Attempts summary
    attempts_stmt = select(Attempt).where(Attempt.session_id == session.id)
    attempts = (await db.execute(attempts_stmt)).scalars().all()
    correct_count = sum(1 for a in attempts if a.is_correct)

    prof_stmt = select(StudentProfile).where(StudentProfile.student_id == current_student.id)
    profile = (await db.execute(prof_stmt)).scalar_one_or_none()
    streak = profile.current_streak if profile else 1

    await db.commit()

    return {
        "session_id": session.id,
        "total_xp_earned": max(20, correct_count * 10 + XP_SESSION_COMPLETION),
        "streak_count": streak,
        "new_badges": [],
        "unlocked_chest": True,
        "bonus_coins": 25,
        "daily_cap_reached": False
    }


@router.get("/questions/{question_id}/language/{target_lang}", response_model=QuestionItemResponse)
async def get_question_in_language(
    question_id: str,
    target_lang: str,
    db: AsyncSession = Depends(get_db)
):
    # 1. Fetch current question
    q_stmt = select(Question).where(Question.id == question_id)
    current_q = (await db.execute(q_stmt)).scalar_one_or_none()
    if not current_q:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")

    if current_q.language == target_lang:
        return QuestionItemResponse(
            id=current_q.id,
            skill_id=current_q.skill_id,
            difficulty=current_q.difficulty,
            language=current_q.language,
            type=current_q.type,
            text=current_q.text,
            options=current_q.options,
            hint=get_effective_hint(current_q, target_lang)
        )

    # 2. Match by concept_id in target_lang
    target_q = None
    if current_q.concept_id:
        c_stmt = select(Question).where(
            Question.concept_id == current_q.concept_id,
            Question.language == target_lang,
            Question.status == "approved"
        )
        target_q = (await db.execute(c_stmt)).scalars().first()

    # 3. Match by same skill_id and difficulty in target_lang
    if not target_q:
        s_stmt = select(Question).where(
            Question.skill_id == current_q.skill_id,
            Question.difficulty == current_q.difficulty,
            Question.language == target_lang,
            Question.status == "approved"
        )
        target_q = (await db.execute(s_stmt)).scalars().first()

    # 4. Match by any approved question in target_lang
    if not target_q:
        any_stmt = select(Question).where(
            Question.language == target_lang,
            Question.status == "approved"
        )
        target_q = (await db.execute(any_stmt)).scalars().first()

    # Fallback to current question if target language pool is not available
    if not target_q:
        target_q = current_q

    return QuestionItemResponse(
        id=target_q.id,
        skill_id=target_q.skill_id,
        difficulty=target_q.difficulty,
        language=target_q.language,
        type=target_q.type,
        text=target_q.text,
        options=target_q.options,
        hint=get_effective_hint(target_q, target_lang)
    )
