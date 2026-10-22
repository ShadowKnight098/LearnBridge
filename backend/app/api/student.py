from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import require_student
from app.models import (
    User, StudentProfile, Mastery, Attempt, Badge, StudentBadge,
    ShopItem, StudentItem, RewardEvent
)
from app.schemas.practice import (
    StudentProgressResponse, StudentRewardsResponse, BadgeInfo,
    ShopItemResponse, AvatarUpdate
)

router = APIRouter(prefix="/student", tags=["Student Profile & Shop"])


@router.get("/me/progress", response_model=StudentProgressResponse)
async def get_student_progress(
    current_student: User = Depends(require_student),
    db: AsyncSession = Depends(get_db)
):
    mastery_stmt = select(Mastery).where(Mastery.student_id == current_student.id)
    masteries = (await db.execute(mastery_stmt)).scalars().all()

    mastery_scores = {m.skill_id: round(m.score, 3) for m in masteries}
    weak_skills = [m.skill_id for m in masteries if m.score < 0.40]
    secure_skills = [m.skill_id for m in masteries if m.score >= 0.70]

    raw_attempts = (await db.execute(select(Attempt).where(Attempt.student_id == current_student.id))).scalars().all()
    total_attempts = len(raw_attempts)
    correct_attempts = sum(1 for a in raw_attempts if a.is_correct)

    accuracy = round((correct_attempts / max(1, total_attempts)) * 100, 1) if total_attempts > 0 else 0.0

    return StudentProgressResponse(
        mastery_scores=mastery_scores,
        total_attempts=total_attempts,
        overall_accuracy=accuracy,
        weak_skills=weak_skills,
        secure_skills=secure_skills
    )


@router.get("/me/rewards", response_model=StudentRewardsResponse)
async def get_student_rewards(
    current_student: User = Depends(require_student),
    db: AsyncSession = Depends(get_db)
):
    prof_stmt = select(StudentProfile).where(StudentProfile.student_id == current_student.id)
    profile = (await db.execute(prof_stmt)).scalar_one_or_none()

    if not profile:
        profile = StudentProfile(
            student_id=current_student.id,
            xp=0,
            level=1,
            coins=20,
            current_streak=0,
            longest_streak=0,
            streak_freezes=1,
            avatar_config={"color": "#6C4DF6", "hat": None, "theme": "default"}
        )
        db.add(profile)
        await db.commit()
        await db.refresh(profile)

    # All badges catalogue
    all_badges = (await db.execute(select(Badge))).scalars().all()
    earned_badges_stmt = select(StudentBadge).where(StudentBadge.student_id == current_student.id)
    earned_badges = (await db.execute(earned_badges_stmt)).scalars().all()
    earned_map = {b.badge_id: b.earned_at for b in earned_badges}

    badge_items = [
        BadgeInfo(
            id=b.id,
            name_en=b.name_en,
            name_hi=b.name_hi,
            name_te=b.name_te,
            description=b.description,
            icon=b.icon,
            earned=(b.id in earned_map),
            earned_at=earned_map.get(b.id)
        )
        for b in all_badges
    ]

    return StudentRewardsResponse(
        xp=profile.xp,
        level=profile.level,
        coins=profile.coins,
        current_streak=profile.current_streak,
        longest_streak=profile.longest_streak,
        streak_freezes=profile.streak_freezes,
        badges=badge_items,
        avatar_config=profile.avatar_config
    )


@router.get("/me/shop", response_model=List[ShopItemResponse])
async def get_shop_items(
    current_student: User = Depends(require_student),
    db: AsyncSession = Depends(get_db)
):
    all_items = (await db.execute(select(ShopItem))).scalars().all()
    owned_stmt = select(StudentItem).where(StudentItem.student_id == current_student.id)
    owned_items = (await db.execute(owned_stmt)).scalars().all()
    owned_map = {o.item_id: o.equipped for o in owned_items}

    return [
        ShopItemResponse(
            id=item.id,
            name_en=item.name_en,
            name_hi=item.name_hi,
            name_te=item.name_te,
            category=item.category,
            cost=item.cost,
            icon=item.icon,
            purchased=(item.id in owned_map),
            equipped=owned_map.get(item.id, False)
        )
        for item in all_items
    ]


@router.post("/me/shop/{item_id}/buy", response_model=dict)
async def buy_shop_item(
    item_id: str,
    current_student: User = Depends(require_student),
    db: AsyncSession = Depends(get_db)
):
    # Verify item exists
    item = await db.get(ShopItem, item_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")

    # Check if already purchased
    owned_stmt = select(StudentItem).where(
        StudentItem.student_id == current_student.id,
        StudentItem.item_id == item_id
    )
    already_owned = (await db.execute(owned_stmt)).scalar_one_or_none()
    if already_owned:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Item already purchased")

    # Check student coin balance
    prof_stmt = select(StudentProfile).where(StudentProfile.student_id == current_student.id)
    profile = (await db.execute(prof_stmt)).scalar_one()

    if profile.coins < item.cost:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient coins. Item costs {item.cost} coins, but you have {profile.coins}."
        )

    # Deduct coins & record purchase
    profile.coins -= item.cost
    db.add(StudentItem(student_id=current_student.id, item_id=item.id, equipped=True))
    db.add(RewardEvent(
        student_id=current_student.id,
        type="purchase",
        amount=-item.cost,
        reason=f"Bought {item.name_en}"
    ))

    # Update avatar config
    avatar_config = dict(profile.avatar_config or {})
    avatar_config[item.category] = item.id
    profile.avatar_config = avatar_config

    await db.commit()

    return {
        "success": True,
        "message": f"Successfully purchased {item.name_en}!",
        "remaining_coins": profile.coins,
        "equipped": True,
        "avatar_config": profile.avatar_config
    }


@router.patch("/me/avatar", response_model=dict)
async def update_avatar(
    payload: AvatarUpdate,
    current_student: User = Depends(require_student),
    db: AsyncSession = Depends(get_db)
):
    prof_stmt = select(StudentProfile).where(StudentProfile.student_id == current_student.id)
    profile = (await db.execute(prof_stmt)).scalar_one()

    avatar_config = dict(profile.avatar_config or {})
    if payload.color is not None:
        avatar_config["color"] = payload.color
    if payload.hat is not None:
        avatar_config["hat"] = payload.hat
    if payload.theme is not None:
        avatar_config["theme"] = payload.theme
    if payload.pet is not None:
        avatar_config["pet"] = payload.pet

    profile.avatar_config = avatar_config
    await db.commit()

    return {
        "success": True,
        "avatar_config": profile.avatar_config
    }
