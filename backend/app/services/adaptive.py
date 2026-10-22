import math
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional, Any, Tuple


def update_mastery(current_mastery: float, is_correct: bool, difficulty: int) -> float:
    """
    Update student mastery score according to item difficulty and correctness.
    Learning rate scales from 0.10 (diff 1) to 0.20 (diff 3).
    Bounds result within [0.0, 1.0].
    """
    # Ensure difficulty is between 1 and 3
    diff = max(1, min(3, difficulty))
    lr = 0.10 + 0.05 * (diff - 1)

    m = max(0.0, min(1.0, current_mastery))
    if is_correct:
        new_m = m + lr * (1.0 - m)
    else:
        new_m = m - lr * m

    return round(max(0.0, min(1.0, new_m)), 4)


def band_difficulty(mastery: float) -> int:
    """
    Maps mastery score to target difficulty:
    - m < 0.40  -> Difficulty 1 (Easy)
    - 0.40 <= m < 0.70 -> Difficulty 2 (Medium)
    - m >= 0.70 -> Difficulty 3 (Hard)
    """
    if mastery < 0.40:
        return 1
    elif mastery < 0.70:
        return 2
    else:
        return 3


def select_target_skill(
    mastery_map: Dict[str, float],
    available_skill_ids: List[str],
    last_practised_map: Optional[Dict[str, datetime]] = None
) -> Optional[str]:
    """
    Selects the next skill:
    1. Filter available skills present in the content pool.
    2. Pick skill with lowest mastery score.
    3. Ties broken by least recently practised.
    """
    if not available_skill_ids:
        return None

    valid_skills = [s for s in available_skill_ids]
    if not valid_skills:
        return None

    def sort_key(s_id: str):
        m_score = mastery_map.get(s_id, 0.3)
        last_dt = (last_practised_map or {}).get(s_id, datetime.min.replace(tzinfo=timezone.utc))
        return (m_score, last_dt)

    return min(valid_skills, key=sort_key)


def select_next_question(
    skill_id: str,
    target_difficulty: int,
    language: str,
    candidate_questions: List[Dict[str, Any]],
    recently_seen_ids: List[str],
    consecutive_wrong_count: int = 0
) -> Tuple[Optional[Dict[str, Any]], str]:
    """
    Selects the next question for practice:
    1. If 3 or more consecutive wrong answers: force difficulty to max(1, target_difficulty - 1).
    2. Filter candidates matching skill_id, language, status == 'approved'.
    3. Try strict match: difficulty == target_difficulty, not in recently_seen_ids (seen < 7 days).
    4. Fallback 1: Relax difficulty by +/- 1 while keeping recency filter.
    5. Fallback 2: Any difficulty with recency filter.
    6. Fallback 3: Relax recency filter (allow repeats if pool exhausted).
    
    Returns: (Selected question dict or None, reason code)
    """
    # Rule: after 3 consecutive wrong answers, drop difficulty to provide an easier item with explanation
    effective_difficulty = target_difficulty
    is_remedial = False
    if consecutive_wrong_count >= 3:
        effective_difficulty = max(1, target_difficulty - 1)
        is_remedial = True

    # 1. Base filter
    pool = [
        q for q in candidate_questions
        if q.get("skill_id") == skill_id
        and q.get("language") == language
        and q.get("status", "approved") == "approved"
    ]

    if not pool:
        # Cross-skill fallback if target skill has no questions in this language
        pool = [
            q for q in candidate_questions
            if q.get("language") == language and q.get("status", "approved") == "approved"
        ]
        if not pool:
            return None, "empty_pool"

    recent_set = set(recently_seen_ids)

    # 2. Strict candidate pool: target difficulty and not recently seen
    strict_candidates = [
        q for q in pool
        if q.get("difficulty") == effective_difficulty and q.get("id") not in recent_set
    ]
    if strict_candidates:
        return strict_candidates[0], "remedial" if is_remedial else "optimal"

    # 3. Fallback 1: Relax difficulty by +/- 1
    adjacent_diffs = [d for d in [effective_difficulty - 1, effective_difficulty + 1] if 1 <= d <= 3]
    for adj_diff in adjacent_diffs:
        adj_candidates = [
            q for q in pool
            if q.get("difficulty") == adj_diff and q.get("id") not in recent_set
        ]
        if adj_candidates:
            return adj_candidates[0], f"adjacent_diff_{adj_diff}"

    # 4. Fallback 2: Any difficulty, not recently seen
    unseen_any_diff = [q for q in pool if q.get("id") not in recent_set]
    if unseen_any_diff:
        return unseen_any_diff[0], "any_diff_unseen"

    # 5. Fallback 3: Relax recency constraint (pool exhausted)
    diff_matched_seen = [q for q in pool if q.get("difficulty") == effective_difficulty]
    if diff_matched_seen:
        return diff_matched_seen[0], "reused_target_diff"

    return pool[0], "reused_fallback"
