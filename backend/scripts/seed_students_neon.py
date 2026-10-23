import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import asyncio
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from sqlalchemy.ext.asyncio import create_async_engine
from app.core.security import hash_password

db_url = 'postgresql+psycopg://neondb_owner:npg_AvCf5eRl0ZGt@ep-ancient-shadow-azoldoyd-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require'

async def seed_students():
    engine = create_async_engine(db_url)
    pin_hash = hash_password("1234")
    
    statements = [
        # Student 1
        f"""
        INSERT INTO users (id, role, parent_id, name, username, password_hash, language, is_active)
        VALUES ('b0000000-0000-0000-0000-000000000001', 'student', 'a0000000-0000-0000-0000-000000000002', 'Aarav Sharma', 'student1', '{pin_hash}', 'te', TRUE)
        ON CONFLICT (username) DO NOTHING;
        """,
        # Student 2
        f"""
        INSERT INTO users (id, role, parent_id, name, username, password_hash, language, is_active)
        VALUES ('b0000000-0000-0000-0000-000000000002', 'student', 'a0000000-0000-0000-0000-000000000002', 'Bhavya Patel', 'student2', '{pin_hash}', 'hi', TRUE)
        ON CONFLICT (username) DO NOTHING;
        """,
        # Student 3
        f"""
        INSERT INTO users (id, role, parent_id, name, username, password_hash, language, is_active)
        VALUES ('b0000000-0000-0000-0000-000000000003', 'student', 'a0000000-0000-0000-0000-000000000002', 'Chiranjeevi Rao', 'student3', '{pin_hash}', 'en', TRUE)
        ON CONFLICT (username) DO NOTHING;
        """,
        # Enroll in CLS3A
        """
        INSERT INTO class_students (class_id, student_id) VALUES
          ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001'),
          ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002'),
          ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003')
        ON CONFLICT (class_id, student_id) DO NOTHING;
        """,
        # Profiles
        """
        INSERT INTO student_profile (student_id, xp, level, coins, current_streak, longest_streak, streak_freezes, avatar_config) VALUES
          ('b0000000-0000-0000-0000-000000000001', 0, 1, 25, 1, 1, 1, '{"color":"#6C4DF6","hat":null,"theme":"default"}'::jsonb),
          ('b0000000-0000-0000-0000-000000000002', 0, 1, 25, 1, 1, 1, '{"color":"#00C49F","hat":null,"theme":"default"}'::jsonb),
          ('b0000000-0000-0000-0000-000000000003', 0, 1, 25, 1, 1, 1, '{"color":"#FFBB28","hat":null,"theme":"default"}'::jsonb)
        ON CONFLICT (student_id) DO NOTHING;
        """,
        # Mastery
        """
        INSERT INTO mastery (student_id, skill_id, score, attempts) VALUES
          ('b0000000-0000-0000-0000-000000000001', 'NUM-01', 0.3, 0),
          ('b0000000-0000-0000-0000-000000000001', 'NUM-02', 0.3, 0),
          ('b0000000-0000-0000-0000-000000000001', 'NUM-03', 0.3, 0),
          ('b0000000-0000-0000-0000-000000000001', 'NUM-04', 0.3, 0),
          ('b0000000-0000-0000-0000-000000000001', 'LIT-01', 0.3, 0),
          ('b0000000-0000-0000-0000-000000000001', 'LIT-03', 0.3, 0),
          ('b0000000-0000-0000-0000-000000000001', 'LIT-05', 0.3, 0),
          ('b0000000-0000-0000-0000-000000000002', 'NUM-01', 0.3, 0),
          ('b0000000-0000-0000-0000-000000000002', 'NUM-02', 0.3, 0),
          ('b0000000-0000-0000-0000-000000000002', 'NUM-03', 0.3, 0),
          ('b0000000-0000-0000-0000-000000000002', 'NUM-04', 0.3, 0),
          ('b0000000-0000-0000-0000-000000000002', 'LIT-01', 0.3, 0),
          ('b0000000-0000-0000-0000-000000000002', 'LIT-03', 0.3, 0),
          ('b0000000-0000-0000-0000-000000000002', 'LIT-05', 0.3, 0),
          ('b0000000-0000-0000-0000-000000000003', 'NUM-01', 0.3, 0),
          ('b0000000-0000-0000-0000-000000000003', 'NUM-02', 0.3, 0),
          ('b0000000-0000-0000-0000-000000000003', 'NUM-03', 0.3, 0),
          ('b0000000-0000-0000-0000-000000000003', 'NUM-04', 0.3, 0),
          ('b0000000-0000-0000-0000-000000000003', 'LIT-01', 0.3, 0),
          ('b0000000-0000-0000-0000-000000000003', 'LIT-03', 0.3, 0),
          ('b0000000-0000-0000-0000-000000000003', 'LIT-05', 0.3, 0)
        ON CONFLICT (student_id, skill_id) DO NOTHING;
        """
    ]
    
    async with engine.begin() as conn:
        for stmt in statements:
            await conn.exec_driver_sql(stmt)
            
    print("Students seeded into Neon DB successfully!")
    await engine.dispose()

if __name__ == '__main__':
    asyncio.run(seed_students())
