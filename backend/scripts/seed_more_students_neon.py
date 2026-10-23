import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import asyncio
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

import json
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from app.core.config import settings
from app.core.security import hash_password

STUDENTS_DATA = [
    {"name": "Ananya Verma", "username": "ananya_v", "language": "en", "color": "#8B5CF6", "xp": 120, "level": 2, "streak": 3},
    {"name": "Rahul Kumar", "username": "rahul_k", "language": "hi", "color": "#EC4899", "xp": 80, "level": 1, "streak": 2},
    {"name": "Priya Nair", "username": "priya_n", "language": "en", "color": "#3B82F6", "xp": 150, "level": 2, "streak": 4},
    {"name": "Mohammed Zaid", "username": "zaid_m", "language": "hi", "color": "#10B981", "xp": 60, "level": 1, "streak": 1},
    {"name": "Sita Devi", "username": "sita_d", "language": "te", "color": "#F59E0B", "xp": 140, "level": 2, "streak": 5},
    {"name": "Kavya Reddy", "username": "kavya_r", "language": "te", "color": "#6366F1", "xp": 95, "level": 1, "streak": 2},
    {"name": "Vikram Singh", "username": "vikram_s", "language": "hi", "color": "#14B8A6", "xp": 110, "level": 2, "streak": 3},
    {"name": "Sai Teja", "username": "sai_teja", "language": "te", "color": "#F43F5E", "xp": 175, "level": 3, "streak": 6},
]

SKILLS = ["NUM-01", "NUM-02", "NUM-03", "LIT-01", "LIT-03", "LANG-01"]

async def main():
    engine = create_async_engine(settings.DATABASE_URL)
    pin_hash = hash_password("1234")
    teacher_id = "a0000000-0000-0000-0000-000000000002"
    class_id = "c0000000-0000-0000-0000-000000000001"

    print("Connecting to Neon DB to seed students...")
    async with engine.begin() as conn:
        for idx, s in enumerate(STUDENTS_DATA, start=10):
            st_id = f"b0000000-0000-0000-0000-0000000000{idx:02d}"
            
            # 1. Insert user
            await conn.execute(
                text("""
                    INSERT INTO users (id, role, parent_id, name, username, password_hash, language, is_active)
                    VALUES (:id, 'student', :teacher_id, :name, :username, :password_hash, :language, TRUE)
                    ON CONFLICT (username) DO UPDATE SET
                        name = EXCLUDED.name,
                        language = EXCLUDED.language,
                        password_hash = EXCLUDED.password_hash
                """),
                {
                    "id": st_id,
                    "teacher_id": teacher_id,
                    "name": s["name"],
                    "username": s["username"],
                    "password_hash": pin_hash,
                    "language": s["language"],
                }
            )

            # 2. Enroll in Class 3A
            await conn.execute(
                text("""
                    INSERT INTO class_students (class_id, student_id)
                    VALUES (:class_id, :student_id)
                    ON CONFLICT (class_id, student_id) DO NOTHING
                """),
                {
                    "class_id": class_id,
                    "student_id": st_id,
                }
            )

            # 3. Create Student Profile
            avatar_obj = json.dumps({"color": s["color"], "hat": None, "theme": "default"})
            await conn.execute(
                text("""
                    INSERT INTO student_profile (student_id, xp, level, coins, current_streak, longest_streak, streak_freezes, avatar_config)
                    VALUES (:student_id, :xp, :level, :coins, :current_streak, :longest_streak, 1, CAST(:avatar_config AS jsonb))
                    ON CONFLICT (student_id) DO UPDATE SET
                        xp = EXCLUDED.xp,
                        level = EXCLUDED.level,
                        current_streak = EXCLUDED.current_streak
                """),
                {
                    "student_id": st_id,
                    "xp": s["xp"],
                    "level": s["level"],
                    "coins": s["xp"] // 2 + 15,
                    "current_streak": s["streak"],
                    "longest_streak": s["streak"] + 1,
                    "avatar_config": avatar_obj,
                }
            )

            # 4. Initialize Mastery
            for sk in SKILLS:
                score = round(0.3 + (idx % 5) * 0.12, 2)
                await conn.execute(
                    text("""
                        INSERT INTO mastery (student_id, skill_id, score, attempts)
                        VALUES (:student_id, :skill_id, :score, 2)
                        ON CONFLICT (student_id, skill_id) DO UPDATE SET
                            score = EXCLUDED.score
                    """),
                    {
                        "student_id": st_id,
                        "skill_id": sk,
                        "score": score,
                    }
                )

            print(f"  [OK] Seeded {s['name']} (@{s['username']}) - PIN: 1234, Lang: {s['language']}")

    await engine.dispose()
    print("\nAll 8 students successfully seeded into Neon DB!")

if __name__ == "__main__":
    asyncio.run(main())
