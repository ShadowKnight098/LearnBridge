import math
from datetime import date, timedelta
from typing import Dict, List, Optional, Tuple, Any

# Anti-gaming threshold in milliseconds (1.5 seconds)
ANTI_GAMING_THRESHOLD_MS = 1500

XP_ATTEMPT_BASE = 2
XP_CORRECT_BONUS = 3
XP_RETRY_BONUS = 2
XP_SESSION_COMPLETION = 10
COINS_SESSION_COMPLETION = 5


def calculate_attempt_xp(
    is_correct: bool,
    is_retry: bool = False,
    time_taken_ms: Optional[int] = None
) -> Tuple[int, bool]:
    """
    Computes XP for an attempt:
    - If answer given under 1.5s (1500 ms) -> 0 XP and flagged.
    - Otherwise: 2 XP attempt + 3 XP for correct (+ 2 XP if retry was correct).
    """
    if time_taken_ms is not None and time_taken_ms < ANTI_GAMING_THRESHOLD_MS:
        return 0, True  # flagged

    xp = XP_ATTEMPT_BASE
    if is_correct:
        xp += XP_CORRECT_BONUS
        if is_retry:
            xp += XP_RETRY_BONUS

    return xp, False


def calculate_level(xp: int) -> int:
    """
    Calculates student level from total accumulated XP:
    level = floor(sqrt(xp / 50)) + 1
    """
    if xp <= 0:
        return 1
    return math.floor(math.sqrt(xp / 50)) + 1


def calculate_streak(
    last_active_date: Optional[date],
    current_streak: int,
    streak_freezes: int,
    today: Optional[date] = None
) -> Tuple[int, int, str]:
    """
    Evaluates streak logic on practice activity:
    - Same day: streak unchanged.
    - Consecutive day (yesterday): streak + 1.
    - Missed 1 day with freeze: streak maintained, freeze decremented.
    - Missed day without freeze: streak resets to 1.
    - First ever day: streak is 1.

    Returns: (new_streak, new_streak_freezes, status_code)
    """
    if today is None:
        today = date.today()

    if last_active_date is None:
        return 1, streak_freezes, "started"

    diff_days = (today - last_active_date).days

    if diff_days <= 0:
        # Already active today
        return max(1, current_streak), streak_freezes, "same_day"
    elif diff_days == 1:
        # Active yesterday -> increment streak
        return current_streak + 1, streak_freezes, "incremented"
    elif diff_days == 2:
        # Missed exactly one day
        if streak_freezes > 0:
            return current_streak, streak_freezes - 1, "freeze_consumed"
        else:
            return 1, streak_freezes, "reset"
    else:
        # Missed multiple days
        return 1, streak_freezes, "reset"


def evaluate_badges(
    stats: Dict[str, Any],
    already_awarded_ids: List[str]
) -> List[str]:
    """
    Evaluates criteria for badges against current student statistics.
    Returns list of newly earned badge IDs.
    """
    awarded_set = set(already_awarded_ids)
    new_badges = []

    # 1. First Steps: 1 completed session
    if "first_steps" not in awarded_set:
        if stats.get("sessions_count", 0) >= 1:
            new_badges.append("first_steps")

    # 2. On Fire: 3-day streak
    if "on_fire" not in awarded_set:
        if stats.get("streak", 0) >= 3:
            new_badges.append("on_fire")

    # 3. Week Warrior: 7-day streak
    if "week_warrior" not in awarded_set:
        if stats.get("streak", 0) >= 7:
            new_badges.append("week_warrior")

    # 4. Streak Master: 5 correct in a row
    if "streak_master" not in awarded_set:
        if stats.get("correct_run", 0) >= 5:
            new_badges.append("streak_master")

    # 5. Comeback Kid: Raise weak skill (< 0.4) by >= 0.2
    if "comeback_kid" not in awarded_set:
        if stats.get("max_mastery_gain_from_weak", 0.0) >= 0.20:
            new_badges.append("comeback_kid")

    # 6. Bilingual Star: Practised in 2 or more distinct languages
    if "bilingual_star" not in awarded_set:
        if len(stats.get("languages_practised", [])) >= 2:
            new_badges.append("bilingual_star")

    return new_badges
