import asyncio
import json
import os
import sys
from pathlib import Path

if sys.platform == "win32":
    try:
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    except Exception:
        pass

# Add backend directory to path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy import select
from app.core.database import engine, AsyncSessionLocal, Base
from app.core.security import hash_password
from app.models import (
    User, Class, ClassStudent, Skill, SkillPrerequisite,
    Question, StudentProfile, Badge, ShopItem, Mastery
)

ROOT_DIR = backend_dir.parent


async def seed():
    print("Connecting to database and creating tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        # 1. Seed Badges
        print("Seeding badges...")
        badges_data = [
            {
                "id": "first_steps",
                "name_en": "First Steps",
                "name_hi": "पहला कदम",
                "name_te": "మొదటి అడుగు",
                "description": "Complete your first session",
                "criteria": {"type": "sessions", "count": 1},
                "icon": "footsteps"
            },
            {
                "id": "on_fire",
                "name_en": "On Fire",
                "name_hi": "जोश में",
                "name_te": "ఉత్సాహంగా",
                "description": "3-day streak",
                "criteria": {"type": "streak", "days": 3},
                "icon": "flame"
            },
            {
                "id": "week_warrior",
                "name_en": "Week Warrior",
                "name_hi": "सप्ताह योद्धा",
                "name_te": "వారపు వీరుడు",
                "description": "7-day streak",
                "criteria": {"type": "streak", "days": 7},
                "icon": "shield"
            },
            {
                "id": "streak_master",
                "name_en": "Streak Master",
                "name_hi": "लगातार सही",
                "name_te": "వరుస సరైనవి",
                "description": "5 correct answers in a row",
                "criteria": {"type": "correct_run", "count": 5},
                "icon": "zap"
            },
            {
                "id": "comeback_kid",
                "name_en": "Comeback Kid",
                "name_hi": "वापसी",
                "name_te": "తిరిగి వచ్చిన వీరుడు",
                "description": "Raise a weak skill by 0.2",
                "criteria": {"type": "mastery_gain", "min_gain": 0.2},
                "icon": "trending-up"
            },
            {
                "id": "bilingual_star",
                "name_en": "Bilingual Star",
                "name_hi": "द्विभाषी सितारा",
                "name_te": "ద్విభాషా తార",
                "description": "Practise in two languages",
                "criteria": {"type": "languages", "count": 2},
                "icon": "languages"
            },
            {
                "id": "teachers_choice",
                "name_en": "Teacher's Choice",
                "name_hi": "शिक्षक की पसंद",
                "name_te": "ఉపాధ్యాయుని ఎంపిక",
                "description": "Awarded by your teacher",
                "criteria": {"type": "manual"},
                "icon": "award"
            }
        ]

        for b in badges_data:
            exists = await session.get(Badge, b["id"])
            if not exists:
                session.add(Badge(**b))

        # 2. Seed Shop Items
        print("Seeding shop items...")
        shop_data = [
            {"id": "hat_cap", "name_en": "Cap", "name_hi": "टोपी", "name_te": "టోపీ", "category": "hat", "cost": 30, "icon": "cap"},
            {"id": "hat_crown", "name_en": "Crown", "name_hi": "मुकुट", "name_te": "కిరీటం", "category": "hat", "cost": 80, "icon": "crown"},
            {"id": "theme_jungle", "name_en": "Jungle theme", "name_hi": "जंगल थीम", "name_te": "అడవి థీమ్", "category": "theme", "cost": 50, "icon": "trees"},
            {"id": "theme_space", "name_en": "Space theme", "name_hi": "अंतरिक्ष थीम", "name_te": "అంతరిక్ష థీమ్", "category": "theme", "cost": 50, "icon": "rocket"},
            {"id": "pet_parrot", "name_en": "Parrot", "name_hi": "तोता", "name_te": "చిలుక", "category": "pet", "cost": 100, "icon": "bird"}
        ]

        for item in shop_data:
            exists = await session.get(ShopItem, item["id"])
            if not exists:
                session.add(ShopItem(**item))

        # 3. Seed Skills and Prerequisites
        skills_file = ROOT_DIR / "content" / "skills.json"
        if skills_file.exists():
            print(f"Seeding skills from {skills_file}...")
            with open(skills_file, "r", encoding="utf-8") as f:
                skills_list = json.load(f)

            for s in skills_list:
                existing_skill = await session.get(Skill, s["id"])
                if not existing_skill:
                    session.add(Skill(
                        id=s["id"],
                        domain=s["domain"],
                        name_en=s["name_en"],
                        name_hi=s.get("name_hi"),
                        name_te=s.get("name_te"),
                        grade_min=s.get("grade_min"),
                        grade_max=s.get("grade_max")
                    ))
            await session.flush()

            for s in skills_list:
                for prereq in s.get("prerequisites", []):
                    stmt = select(SkillPrerequisite).where(
                        SkillPrerequisite.skill_id == s["id"],
                        SkillPrerequisite.requires == prereq
                    )
                    res = await session.execute(stmt)
                    if not res.scalar_one_or_none():
                        session.add(SkillPrerequisite(skill_id=s["id"], requires=prereq))

        # 4. Seed Questions
        questions_file = ROOT_DIR / "content" / "sample_questions.json"
        if questions_file.exists():
            print(f"Seeding questions from {questions_file}...")
            with open(questions_file, "r", encoding="utf-8") as f:
                questions_list = json.load(f)

            for q in questions_list:
                stmt = select(Question).where(
                    Question.concept_id == q.get("concept_id"),
                    Question.language == q["language"]
                )
                res = await session.execute(stmt)
                if not res.scalar_one_or_none():
                    session.add(Question(
                        concept_id=q.get("concept_id"),
                        skill_id=q["skill_id"],
                        language=q["language"],
                        grade=q["grade"],
                        difficulty=q["difficulty"],
                        type=q.get("type", "mcq"),
                        text=q["text"],
                        options=q["options"],
                        correct_index=q["correct_index"],
                        explanation=q.get("explanation"),
                        hint=q.get("hint"),
                        status="approved"
                    ))

        # 5. Seed Users (Admin, Teacher, Students)
        print("Seeding default users and classes...")
        admin_stmt = select(User).where(User.username == "admin")
        admin = (await session.execute(admin_stmt)).scalar_one_or_none()
        if not admin:
            admin = User(
                role="admin",
                name="Admin Coordinator",
                username="admin",
                password_hash=hash_password("admin123"),
                language="en",
                is_active=True
            )
            session.add(admin)
            await session.flush()

        teacher_stmt = select(User).where(User.username == "teacher1")
        teacher = (await session.execute(teacher_stmt)).scalar_one_or_none()
        if not teacher:
            teacher = User(
                role="teacher",
                parent_id=admin.id,
                name="Teacher Lakshmi",
                username="teacher1",
                password_hash=hash_password("teacher123"),
                language="te",
                is_active=True
            )
            session.add(teacher)
            await session.flush()

        # Class
        class_stmt = select(Class).where(Class.class_code == "CLS3A")
        cls = (await session.execute(class_stmt)).scalar_one_or_none()
        if not cls:
            cls = Class(
                name="Class 3 - Section A",
                grade=3,
                teacher_id=teacher.id,
                class_code="CLS3A",
                created_by=admin.id
            )
            session.add(cls)
            await session.flush()

        # Students
        students_info = [
            ("student1", "Aarav Sharma", "te"),
            ("student2", "Bhavya Patel", "hi"),
            ("student3", "Chiranjeevi Rao", "en")
        ]

        for uname, sname, slang in students_info:
            s_stmt = select(User).where(User.username == uname)
            student = (await session.execute(s_stmt)).scalar_one_or_none()
            if not student:
                student = User(
                    role="student",
                    parent_id=teacher.id,
                    name=sname,
                    username=uname,
                    password_hash=hash_password("1234"),  # 4-digit PIN for students
                    language=slang,
                    is_active=True
                )
                session.add(student)
                await session.flush()

                # Enroll in class
                session.add(ClassStudent(class_id=cls.id, student_id=student.id))

                # Create or update student profile (handling trigger-created row)
                prof_stmt = select(StudentProfile).where(StudentProfile.student_id == student.id)
                profile = (await session.execute(prof_stmt)).scalar_one_or_none()
                if not profile:
                    profile = StudentProfile(student_id=student.id)
                    session.add(profile)
                profile.xp = 0
                profile.level = 1
                profile.coins = 25
                profile.current_streak = 1
                profile.longest_streak = 1
                profile.streak_freezes = 1
                profile.avatar_config = {"color": "#6C4DF6", "hat": None, "theme": "default"}

        await session.commit()
        print("Database seeded successfully!")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed())
