from datetime import date, timedelta
import pytest
from app.services.adaptive import (
    update_mastery, band_difficulty, select_target_skill, select_next_question
)
from app.services.rewards import (
    calculate_attempt_xp, calculate_level, calculate_streak, evaluate_badges,
    XP_SESSION_COMPLETION
)


# ---------- Adaptive Tests (ADP-01 to ADP-13) ----------

def test_adp_01_correct_answer_raises_mastery():
    """ADP-01: Correct answer increases mastery, bounded by 1.0."""
    initial = 0.5
    updated = update_mastery(initial, is_correct=True, difficulty=2)
    assert updated > initial
    assert updated <= 1.0

    # Upper bound test
    near_top = update_mastery(0.98, is_correct=True, difficulty=3)
    assert near_top <= 1.0


def test_adp_02_wrong_answer_lowers_mastery():
    """ADP-02: Wrong answer decreases mastery, bounded by 0.0."""
    initial = 0.5
    updated = update_mastery(initial, is_correct=False, difficulty=2)
    assert updated < initial
    assert updated >= 0.0

    # Lower bound test
    near_zero = update_mastery(0.02, is_correct=False, difficulty=3)
    assert near_zero >= 0.0


def test_adp_03_harder_item_moves_mastery_more():
    """ADP-03: Harder items (difficulty 3) move score more than easier items (difficulty 1)."""
    initial = 0.5
    gain_diff1 = update_mastery(initial, is_correct=True, difficulty=1) - initial
    gain_diff3 = update_mastery(initial, is_correct=True, difficulty=3) - initial
    assert gain_diff3 > gain_diff1

    drop_diff1 = initial - update_mastery(initial, is_correct=False, difficulty=1)
    drop_diff3 = initial - update_mastery(initial, is_correct=False, difficulty=3)
    assert drop_diff3 > drop_diff1


def test_adp_04_05_06_banding_difficulty():
    """ADP-04, 05, 06: Mastery bands map to difficulties 1, 2, and 3."""
    assert band_difficulty(0.20) == 1
    assert band_difficulty(0.39) == 1
    assert band_difficulty(0.40) == 2
    assert band_difficulty(0.55) == 2
    assert band_difficulty(0.69) == 2
    assert band_difficulty(0.70) == 3
    assert band_difficulty(0.95) == 3


def test_adp_07_lowest_mastery_skill_chosen():
    """ADP-07: Skill with lowest mastery is chosen."""
    mastery_map = {"NUM-01": 0.8, "NUM-02": 0.35, "NUM-03": 0.6}
    chosen = select_target_skill(mastery_map, ["NUM-01", "NUM-02", "NUM-03"])
    assert chosen == "NUM-02"


def test_adp_08_recency_exclusion():
    """ADP-08: Question seen < 7 days ago is not repeated if alternative is available."""
    pool = [
        {"id": "q1", "skill_id": "NUM-01", "difficulty": 2, "language": "te", "status": "approved"},
        {"id": "q2", "skill_id": "NUM-01", "difficulty": 2, "language": "te", "status": "approved"}
    ]
    recently_seen = ["q1"]
    selected, reason = select_next_question(
        skill_id="NUM-01",
        target_difficulty=2,
        language="te",
        candidate_questions=pool,
        recently_seen_ids=recently_seen
    )
    assert selected is not None
    assert selected["id"] == "q2"
    assert reason == "optimal"


def test_adp_09_adjacent_difficulty_fallback():
    """ADP-09: Falls back to adjacent difficulty if target difficulty is unavailable."""
    # Only difficulty 1 is available when target is difficulty 2
    pool = [
        {"id": "q1", "skill_id": "NUM-01", "difficulty": 1, "language": "te", "status": "approved"}
    ]
    selected, reason = select_next_question(
        skill_id="NUM-01",
        target_difficulty=2,
        language="te",
        candidate_questions=pool,
        recently_seen_ids=[]
    )
    assert selected is not None
    assert selected["id"] == "q1"
    assert "adjacent" in reason


def test_adp_10_three_consecutive_wrong_remedial():
    """ADP-10: 3 consecutive wrong answers forces an easier item."""
    pool = [
        {"id": "q_easy", "skill_id": "NUM-01", "difficulty": 1, "language": "te", "status": "approved"},
        {"id": "q_med", "skill_id": "NUM-01", "difficulty": 2, "language": "te", "status": "approved"}
    ]
    selected, reason = select_next_question(
        skill_id="NUM-01",
        target_difficulty=2,
        language="te",
        candidate_questions=pool,
        recently_seen_ids=[],
        consecutive_wrong_count=3
    )
    assert selected is not None
    assert selected["id"] == "q_easy"
    assert reason == "remedial"


def test_adp_13_divergent_paths_simulation():
    """ADP-13: Weak, average, and strong simulated students diverge after 10 questions."""
    m_weak = 0.3
    m_avg = 0.3
    m_strong = 0.3

    for i in range(10):
        # Weak: 20% accuracy
        m_weak = update_mastery(m_weak, is_correct=(i % 5 == 0), difficulty=band_difficulty(m_weak))
        # Avg: 60% accuracy
        m_avg = update_mastery(m_avg, is_correct=(i % 5 != 0 and i % 5 != 1), difficulty=band_difficulty(m_avg))
        # Strong: 100% accuracy
        m_strong = update_mastery(m_strong, is_correct=True, difficulty=band_difficulty(m_strong))

    assert m_weak < 0.35
    assert 0.40 <= m_avg <= 0.75
    assert m_strong > 0.80
    assert band_difficulty(m_weak) == 1
    assert band_difficulty(m_strong) == 3


# ---------- Rewards Tests (RWD-01 to RWD-10) ----------

def test_rwd_01_session_completed_zero_correct_earns_xp():
    """RWD-01: Session completed with 0 correct still earns attempt XP + completion bonus."""
    total_xp = 0
    # 5 wrong answers (time > 1.5s)
    for _ in range(5):
        xp, flagged = calculate_attempt_xp(is_correct=False, is_retry=False, time_taken_ms=3000)
        assert not flagged
        total_xp += xp

    # Add completion bonus
    total_xp += XP_SESSION_COMPLETION
    assert total_xp == (5 * 2) + 10  # 20 XP


def test_rwd_02_consecutive_days_streak():
    """RWD-02: Active yesterday -> streak increases by 1."""
    today = date(2026, 10, 22)
    yesterday = today - timedelta(days=1)
    new_streak, freezes, status = calculate_streak(yesterday, current_streak=4, streak_freezes=1, today=today)
    assert new_streak == 5
    assert freezes == 1
    assert status == "incremented"


def test_rwd_03_missed_day_with_freeze():
    """RWD-03: Missed 1 day with freeze available keeps streak and consumes freeze."""
    today = date(2026, 10, 22)
    two_days_ago = today - timedelta(days=2)
    new_streak, freezes, status = calculate_streak(two_days_ago, current_streak=6, streak_freezes=1, today=today)
    assert new_streak == 6
    assert freezes == 0
    assert status == "freeze_consumed"


def test_rwd_04_missed_day_without_freeze_resets():
    """RWD-04: Missed day without freeze resets streak to 1."""
    today = date(2026, 10, 22)
    two_days_ago = today - timedelta(days=2)
    new_streak, freezes, status = calculate_streak(two_days_ago, current_streak=6, streak_freezes=0, today=today)
    assert new_streak == 1
    assert status == "reset"


def test_rwd_05_badges_awarded_once():
    """RWD-05: Already awarded badge is not returned again."""
    stats = {"sessions_count": 2, "streak": 4, "correct_run": 5}
    # First time earns first_steps, on_fire, streak_master
    new_badges = evaluate_badges(stats, already_awarded_ids=[])
    assert "first_steps" in new_badges
    assert "on_fire" in new_badges
    assert "streak_master" in new_badges

    # Second evaluation with first_steps already awarded
    subsequent = evaluate_badges(stats, already_awarded_ids=["first_steps", "on_fire"])
    assert "first_steps" not in subsequent
    assert "on_fire" not in subsequent
    assert "streak_master" in subsequent


def test_rwd_06_anti_gaming_under_1_5s():
    """RWD-06: Answer under 1.5s gives 0 XP and is flagged."""
    xp, flagged = calculate_attempt_xp(is_correct=True, time_taken_ms=1200)
    assert xp == 0
    assert flagged is True

    # Valid duration
    xp_valid, flagged_valid = calculate_attempt_xp(is_correct=True, time_taken_ms=2500)
    assert xp_valid == 5  # 2 attempt + 3 correct
    assert flagged_valid is False


def test_rwd_08_level_increases_with_xp():
    """RWD-08: Level scales with square root formula floor(sqrt(xp / 50)) + 1."""
    assert calculate_level(0) == 1
    assert calculate_level(49) == 1
    assert calculate_level(50) == 2
    assert calculate_level(199) == 2
    assert calculate_level(200) == 3
    assert calculate_level(450) == 4
