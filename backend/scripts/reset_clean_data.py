import asyncio
import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy import text
from app.core.database import engine
from app.core.security import hash_password

async def reset_database():
    print("Beginning database cleanup: purging all test/entered data while preserving clean teacher details...")
    
    async with engine.begin() as conn:
        # 1. Delete student attempts and practice sessions
        print("Purging attempts and sessions...")
        await conn.execute(text("DELETE FROM attempts"))
        await conn.execute(text("DELETE FROM sessions"))

        # 2. Delete student mastery, rewards, items, profiles
        print("Purging student mastery, rewards, badges, and profiles...")
        await conn.execute(text("DELETE FROM mastery"))
        await conn.execute(text("DELETE FROM reward_events"))
        await conn.execute(text("DELETE FROM student_badges"))
        await conn.execute(text("DELETE FROM student_items"))
        await conn.execute(text("DELETE FROM student_profile"))

        # 3. Delete alerts and reports
        print("Purging alerts and report snapshots...")
        await conn.execute(text("DELETE FROM alerts"))
        await conn.execute(text("DELETE FROM report_snapshots"))

        # 4. Delete documents, chunks, and generation jobs
        print("Purging documents, chunks, and generation jobs...")
        await conn.execute(text("DELETE FROM chunks"))
        await conn.execute(text("DELETE FROM generation_jobs"))
        await conn.execute(text("DELETE FROM documents"))

        # 5. Delete assignments and challenges
        print("Purging assignments and challenges...")
        await conn.execute(text("DELETE FROM assignments"))
        await conn.execute(text("DELETE FROM challenges"))

        # 6. Delete draft / generated test questions and detach owner references
        print("Cleaning draft / generated questions...")
        await conn.execute(text("DELETE FROM questions WHERE status != 'approved'"))
        await conn.execute(text("UPDATE questions SET owner_id = NULL"))

        # 7. Delete class student enrollments
        print("Purging class students...")
        await conn.execute(text("DELETE FROM class_students"))

        # 8. Clean up extra test classes
        print("Cleaning test classes...")
        await conn.execute(text("DELETE FROM classes WHERE class_code != 'CLS3A'"))

        # 9. Clean up users - remove all students, test teachers, test admins
        print("Cleaning users (removing test accounts, students, extra teachers)...")
        await conn.execute(text("DELETE FROM users WHERE role = 'student'"))
        await conn.execute(text("DELETE FROM users WHERE role = 'teacher' AND username != 'teacher1'"))
        await conn.execute(text("DELETE FROM users WHERE role = 'admin' AND username != 'admin'"))

        # 10. Ensure canonical Admin exists
        admin_res = await conn.execute(text("SELECT id FROM users WHERE username = 'admin'"))
        admin_row = admin_res.fetchone()
        admin_id = "a0000000-0000-0000-0000-000000000001"
        if not admin_row:
            print("Creating canonical Admin Coordinator account...")
            pwd_hash = hash_password("admin123")
            await conn.execute(text(
                "INSERT INTO users (id, role, name, username, password_hash, language, is_active, created_at) "
                "VALUES (:id, 'admin', 'Admin Coordinator', 'admin', :pwd, 'en', true, now())"
            ), {"id": admin_id, "pwd": pwd_hash})
        else:
            admin_id = str(admin_row[0])

        # 11. Ensure canonical Teacher exists
        teacher_res = await conn.execute(text("SELECT id FROM users WHERE username = 'teacher1'"))
        teacher_row = teacher_res.fetchone()
        teacher_id = "a0000000-0000-0000-0000-000000000002"
        pwd_hash = hash_password("teacher123")
        if not teacher_row:
            print("Creating canonical Teacher Lakshmi account...")
            await conn.execute(text(
                "INSERT INTO users (id, role, parent_id, name, username, password_hash, language, is_active, created_at) "
                "VALUES (:id, 'teacher', :parent_id, 'Teacher Lakshmi', 'teacher1', :pwd, 'te', true, now())"
            ), {"id": teacher_id, "parent_id": admin_id, "pwd": pwd_hash})
        else:
            teacher_id = str(teacher_row[0])
            # Reset password to known default teacher123 and ensure parent_id is set
            await conn.execute(text(
                "UPDATE users SET name = 'Teacher Lakshmi', password_hash = :pwd, parent_id = :parent_id, is_active = true WHERE id = :id"
            ), {"id": teacher_id, "pwd": pwd_hash, "parent_id": admin_id})

        # 12. Ensure clean canonical class CLS3A for Teacher
        cls_res = await conn.execute(text("SELECT id FROM classes WHERE class_code = 'CLS3A'"))
        cls_row = cls_res.fetchone()
        if not cls_row:
            print("Creating clean Class 3 - Section A for teacher...")
            cls_id = "c0000000-0000-0000-0000-000000000001"
            await conn.execute(text(
                "INSERT INTO classes (id, name, grade, teacher_id, class_code, created_by, created_at) "
                "VALUES (:id, 'Class 3 - Section A', 3, :t_id, 'CLS3A', :c_by, now())"
            ), {"id": cls_id, "t_id": teacher_id, "c_by": admin_id})
        else:
            await conn.execute(text(
                "UPDATE classes SET teacher_id = :t_id, created_by = :c_by, name = 'Class 3 - Section A', grade = 3 WHERE class_code = 'CLS3A'"
            ), {"t_id": teacher_id, "c_by": admin_id})

        print("\nCleanup successfully completed!")

    # Verify counts
    async with engine.connect() as conn:
        print("\n--- Current Clean Database State ---")
        for tbl in ['users', 'classes', 'class_students', 'questions', 'sessions', 'attempts', 'mastery', 'student_profile', 'alerts', 'documents', 'generation_jobs']:
            try:
                cnt = (await conn.execute(text(f'SELECT count(*) FROM "{tbl}"'))).scalar()
                print(f"  {tbl}: {cnt}")
            except Exception as e:
                print(f"  {tbl}: {e}")

        res = await conn.execute(text("SELECT id, role, name, username FROM users"))
        print("\nActive Users in Database:")
        for r in res.fetchall():
            print(f"  [{r[1].upper()}] {r[2]} (username: {r[3]})")

        res = await conn.execute(text("SELECT id, name, grade, class_code FROM classes"))
        print("\nClasses in Database:")
        for r in res.fetchall():
            print(f"  {r[1]} - Grade {r[2]} (Code: {r[3]})")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(reset_database())
