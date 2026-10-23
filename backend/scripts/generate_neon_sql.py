import json
import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.core.security import hash_password

root_dir = backend_dir.parent
skills_file = root_dir / "content" / "skills.json"
questions_file = root_dir / "content" / "sample_questions.json"
out_file = root_dir / "neon_setup.sql"

admin_hash = hash_password("admin123")
teacher_hash = hash_password("teacher123")
student_hash = hash_password("1234")

def sql_str(val):
    if val is None:
        return "NULL"
    # Escape single quotes
    escaped = str(val).replace("'", "''")
    return f"'{escaped}'"

def sql_json(val):
    if val is None:
        return "'{}'::jsonb"
    s = json.dumps(val, ensure_ascii=False)
    escaped = s.replace("'", "''")
    return f"'{escaped}'::jsonb"

sql_lines = []

sql_lines.append("""-- ============================================================================
-- LearnBridge Neon PostgreSQL Setup Script
-- Compatible with Neon Serverless Postgres (and standard PostgreSQL 14+)
-- Idempotent: safe to run multiple times without duplicating rows.
-- ============================================================================

-- Enable pgcrypto extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enum Types
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('admin','teacher','student');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'question_type') THEN
    CREATE TYPE question_type AS ENUM ('mcq','tf','fill');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'question_status') THEN
    CREATE TYPE question_status AS ENUM ('draft','approved','rejected');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'job_status') THEN
    CREATE TYPE job_status AS ENUM ('queued','running','done','failed');
  END IF;
END $$;

-- 1. Users table
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role          user_role NOT NULL,
  parent_id     UUID REFERENCES users(id),
  name          TEXT NOT NULL,
  username      TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  language      TEXT NOT NULL DEFAULT 'te',
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK ((role = 'admin' AND parent_id IS NULL) OR (role <> 'admin' AND parent_id IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS idx_users_parent ON users(parent_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 2. Classes table
CREATE TABLE IF NOT EXISTS classes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  grade      SMALLINT NOT NULL CHECK (grade BETWEEN 1 AND 12),
  teacher_id UUID NOT NULL REFERENCES users(id),
  class_code TEXT UNIQUE NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Class - Students enrollment
CREATE TABLE IF NOT EXISTS class_students (
  class_id   UUID REFERENCES classes(id) ON DELETE CASCADE,
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (class_id, student_id)
);

-- 4. Skills & Prerequisites
CREATE TABLE IF NOT EXISTS skills (
  id        TEXT PRIMARY KEY,
  domain    TEXT NOT NULL,
  name_en   TEXT NOT NULL,
  name_hi   TEXT,
  name_te   TEXT,
  grade_min SMALLINT,
  grade_max SMALLINT
);

CREATE TABLE IF NOT EXISTS skill_prerequisites (
  skill_id TEXT REFERENCES skills(id),
  requires TEXT REFERENCES skills(id),
  PRIMARY KEY (skill_id, requires)
);

-- 5. Documents & Generation
CREATE TABLE IF NOT EXISTS documents (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES users(id),
  filename   TEXT NOT NULL,
  subject    TEXT NOT NULL,
  grade      SMALLINT NOT NULL,
  language   TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chunks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  page_no     INT,
  position    INT NOT NULL,
  text        TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS generation_jobs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id  UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  status       job_status NOT NULL DEFAULT 'queued',
  total_chunks INT NOT NULL DEFAULT 0,
  done_chunks  INT NOT NULL DEFAULT 0,
  error        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Questions
CREATE TABLE IF NOT EXISTS questions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id       UUID REFERENCES users(id),
  chunk_id       UUID REFERENCES chunks(id) ON DELETE SET NULL,
  concept_id     TEXT,
  skill_id       TEXT NOT NULL REFERENCES skills(id),
  language       TEXT NOT NULL,
  grade          SMALLINT NOT NULL,
  difficulty     SMALLINT NOT NULL CHECK (difficulty BETWEEN 1 AND 3),
  type           question_type NOT NULL DEFAULT 'mcq',
  text           TEXT NOT NULL,
  options        JSONB NOT NULL,
  correct_index  SMALLINT NOT NULL,
  explanation    TEXT,
  source_snippet TEXT,
  status         question_status NOT NULL DEFAULT 'draft',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_at    TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_q_select ON questions(status, language, skill_id, difficulty);
CREATE INDEX IF NOT EXISTS idx_q_concept ON questions(concept_id);

-- 7. Assignments
CREATE TABLE IF NOT EXISTS assignments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id  UUID NOT NULL REFERENCES users(id),
  class_id    UUID REFERENCES classes(id),
  student_id  UUID REFERENCES users(id),
  document_id UUID REFERENCES documents(id),
  due_date    DATE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (class_id IS NOT NULL OR student_id IS NOT NULL)
);

-- 8. Practice sessions & Attempts
CREATE TABLE IF NOT EXISTS sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    UUID NOT NULL REFERENCES users(id),
  is_diagnostic BOOLEAN NOT NULL DEFAULT FALSE,
  started_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at      TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS attempts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    UUID REFERENCES sessions(id) ON DELETE CASCADE,
  student_id    UUID NOT NULL REFERENCES users(id),
  question_id   UUID NOT NULL REFERENCES questions(id),
  chosen_index  SMALLINT,
  is_correct    BOOLEAN NOT NULL,
  time_taken_ms INT,
  flagged       BOOLEAN NOT NULL DEFAULT FALSE,
  language      TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_attempts_student ON attempts(student_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_attempts_question ON attempts(question_id);

-- 9. Mastery
CREATE TABLE IF NOT EXISTS mastery (
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  skill_id   TEXT REFERENCES skills(id),
  score      REAL NOT NULL DEFAULT 0.3 CHECK (score BETWEEN 0 AND 1),
  attempts   INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (student_id, skill_id)
);

-- 10. Student Gamification & Rewards
CREATE TABLE IF NOT EXISTS student_profile (
  student_id       UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  xp               INT NOT NULL DEFAULT 0 CHECK (xp >= 0),
  level            INT NOT NULL DEFAULT 1,
  coins            INT NOT NULL DEFAULT 0 CHECK (coins >= 0),
  current_streak   INT NOT NULL DEFAULT 0,
  longest_streak   INT NOT NULL DEFAULT 0,
  streak_freezes   INT NOT NULL DEFAULT 1,
  last_active_date DATE,
  avatar_config    JSONB NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS badges (
  id          TEXT PRIMARY KEY,
  name_en     TEXT NOT NULL,
  name_hi     TEXT,
  name_te     TEXT,
  description TEXT,
  criteria    JSONB NOT NULL,
  icon        TEXT
);

CREATE TABLE IF NOT EXISTS student_badges (
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  badge_id   TEXT REFERENCES badges(id),
  awarded_by UUID REFERENCES users(id),
  earned_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (student_id, badge_id)
);

CREATE TABLE IF NOT EXISTS reward_events (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id),
  type       TEXT NOT NULL,
  amount     INT NOT NULL DEFAULT 0,
  reason     TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS shop_items (
  id       TEXT PRIMARY KEY,
  name_en  TEXT NOT NULL,
  name_hi  TEXT,
  name_te  TEXT,
  category TEXT NOT NULL,
  cost     INT NOT NULL CHECK (cost >= 0),
  icon     TEXT
);

CREATE TABLE IF NOT EXISTS student_items (
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  item_id    TEXT REFERENCES shop_items(id),
  equipped   BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (student_id, item_id)
);

CREATE TABLE IF NOT EXISTS challenges (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope        TEXT NOT NULL DEFAULT 'student',
  class_id     UUID REFERENCES classes(id),
  description  TEXT NOT NULL,
  target       INT NOT NULL,
  reward_coins INT NOT NULL DEFAULT 0,
  start_date   DATE NOT NULL,
  end_date     DATE NOT NULL
);

-- 11. Reports & Teacher Alerts
CREATE TABLE IF NOT EXISTS report_snapshots (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope      TEXT NOT NULL,
  scope_id   UUID,
  payload    JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS alerts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES users(id),
  student_id UUID NOT NULL REFERENCES users(id),
  kind       TEXT NOT NULL,
  detail     TEXT,
  resolved   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
""")

# Badges & Shop Items
sql_lines.append("""-- ----------------------------------------------------------------------------
-- SEED DATA: Badges & Shop Items
-- ----------------------------------------------------------------------------
INSERT INTO badges (id, name_en, name_hi, name_te, description, criteria, icon) VALUES
  ('first_steps','First Steps','पहला कदम','మొదటి అడుగు','Complete your first session','{"type":"sessions","count":1}'::jsonb,'footsteps'),
  ('on_fire','On Fire','जोश में','ఉత్సాహంగా','3-day streak','{"type":"streak","days":3}'::jsonb,'flame'),
  ('week_warrior','Week Warrior','सप्ताह योद्धा','వారపు వీరుడు','7-day streak','{"type":"streak","days":7}'::jsonb,'shield'),
  ('streak_master','Streak Master','लगातार सही','వరుస సరైనవి','5 correct in a row','{"type":"correct_run","count":5}'::jsonb,'zap'),
  ('comeback_kid','Comeback Kid','वापसी','తిరిగి వచ్చిన వీరుడు','Raise a weak skill by 0.2','{"type":"mastery_gain","min_gain":0.2}'::jsonb,'trending-up'),
  ('bilingual_star','Bilingual Star','द्विभाषी सितारा','ద్విభాషా తార','Practise in two languages','{"type":"languages","count":2}'::jsonb,'languages'),
  ('teachers_choice','Teacher''s Choice','शिक्षक की पसंद','ఉపాధ్యాయుని ఎంపిక','Awarded by your teacher','{"type":"manual"}'::jsonb,'award')
ON CONFLICT (id) DO NOTHING;

INSERT INTO shop_items (id, name_en, name_hi, name_te, category, cost, icon) VALUES
  ('hat_cap','Cap','टोपी','టోపీ','hat',30,'cap'),
  ('hat_crown','Crown','मुकुट','కిరీటం','hat',80,'crown'),
  ('theme_jungle','Jungle theme','जंगल थीम','అడవి థీమ్','theme',50,'trees'),
  ('theme_space','Space theme','अंतरिक्ष थीम','అంతరిక్ష థీమ్','theme',50,'rocket'),
  ('pet_parrot','Parrot','तोता','చిలుక','pet',100,'bird')
ON CONFLICT (id) DO NOTHING;
""")

# Seed Skills
if skills_file.exists():
    with open(skills_file, "r", encoding="utf-8") as f:
        skills = json.load(f)

    sql_lines.append("""-- ----------------------------------------------------------------------------
-- SEED DATA: Skills & Skill Prerequisites
-- ----------------------------------------------------------------------------""")
    for s in skills:
        sql_lines.append(
            f"INSERT INTO skills (id, domain, name_en, name_hi, name_te, grade_min, grade_max) "
            f"VALUES ({sql_str(s['id'])}, {sql_str(s['domain'])}, {sql_str(s['name_en'])}, "
            f"{sql_str(s.get('name_hi'))}, {sql_str(s.get('name_te'))}, "
            f"{s.get('grade_min', 'NULL')}, {s.get('grade_max', 'NULL')}) "
            f"ON CONFLICT (id) DO NOTHING;"
        )

    for s in skills:
        for prereq in s.get("prerequisites", []):
            sql_lines.append(
                f"INSERT INTO skill_prerequisites (skill_id, requires) "
                f"VALUES ({sql_str(s['id'])}, {sql_str(prereq)}) "
                f"ON CONFLICT (skill_id, requires) DO NOTHING;"
            )

# Seed Questions
if questions_file.exists():
    with open(questions_file, "r", encoding="utf-8") as f:
        questions = json.load(f)

    sql_lines.append("""-- ----------------------------------------------------------------------------
-- SEED DATA: Questions
-- ----------------------------------------------------------------------------""")
    for q in questions:
        sql_lines.append(
            f"INSERT INTO questions (concept_id, skill_id, language, grade, difficulty, type, text, options, correct_index, explanation, status) "
            f"VALUES ({sql_str(q.get('concept_id'))}, {sql_str(q['skill_id'])}, {sql_str(q['language'])}, "
            f"{q['grade']}, {q['difficulty']}, {sql_str(q.get('type', 'mcq'))}::question_type, "
            f"{sql_str(q['text'])}, {sql_json(q['options'])}, {q['correct_index']}, "
            f"{sql_str(q.get('explanation'))}, 'approved');"
        )

# Seed Users, Class, Students, Mastery
sql_lines.append(f"""-- ----------------------------------------------------------------------------
-- SEED DATA: Users, Classes, Students, Profiles, and Initial Mastery
-- ----------------------------------------------------------------------------
-- 1. Admin (Username: admin / Password: admin123)
INSERT INTO users (id, role, parent_id, name, username, password_hash, language, is_active)
VALUES ('a0000000-0000-0000-0000-000000000001', 'admin', NULL, 'Admin Coordinator', 'admin', '{admin_hash}', 'en', TRUE)
ON CONFLICT (username) DO NOTHING;

-- 2. Teacher (Username: teacher1 / Password: teacher123)
INSERT INTO users (id, role, parent_id, name, username, password_hash, language, is_active)
VALUES ('a0000000-0000-0000-0000-000000000002', 'teacher', 'a0000000-0000-0000-0000-000000000001', 'Teacher Lakshmi', 'teacher1', '{teacher_hash}', 'te', TRUE)
ON CONFLICT (username) DO NOTHING;

-- 3. Class (Class Code: CLS3A)
INSERT INTO classes (id, name, grade, teacher_id, class_code, created_by)
VALUES ('c0000000-0000-0000-0000-000000000001', 'Class 3 - Section A', 3, 'a0000000-0000-0000-0000-000000000002', 'CLS3A', 'a0000000-0000-0000-0000-000000000001')
ON CONFLICT (class_code) DO NOTHING;

-- 4. Students (PIN: 1234)
-- Student 1 (Telugu)
INSERT INTO users (id, role, parent_id, name, username, password_hash, language, is_active)
VALUES ('b0000000-0000-0000-0000-000000000001', 'student', 'a0000000-0000-0000-0000-000000000002', 'Aarav Sharma', 'student1', '{student_hash}', 'te', TRUE)
ON CONFLICT (username) DO NOTHING;

-- Student 2 (Hindi)
INSERT INTO users (id, role, parent_id, name, username, password_hash, language, is_active)
VALUES ('b0000000-0000-0000-0000-000000000002', 'student', 'a0000000-0000-0000-0000-000000000002', 'Bhavya Patel', 'student2', '{student_hash}', 'hi', TRUE)
ON CONFLICT (username) DO NOTHING;

-- Student 3 (English)
INSERT INTO users (id, role, parent_id, name, username, password_hash, language, is_active)
VALUES ('b0000000-0000-0000-0000-000000000003', 'student', 'a0000000-0000-0000-0000-000000000002', 'Chiranjeevi Rao', 'student3', '{student_hash}', 'en', TRUE)
ON CONFLICT (username) DO NOTHING;

-- 5. Class Enrollments
INSERT INTO class_students (class_id, student_id) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001'),
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002'),
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003')
ON CONFLICT (class_id, student_id) DO NOTHING;

-- 6. Student Gamification Profiles
INSERT INTO student_profile (student_id, xp, level, coins, current_streak, longest_streak, streak_freezes, avatar_config) VALUES
  ('b0000000-0000-0000-0000-000000000001', 0, 1, 25, 1, 1, 1, '{{"color":"#6C4DF6","hat":null,"theme":"default"}}'::jsonb),
  ('b0000000-0000-0000-0000-000000000002', 0, 1, 25, 1, 1, 1, '{{"color":"#00C49F","hat":null,"theme":"default"}}'::jsonb),
  ('b0000000-0000-0000-0000-000000000003', 0, 1, 25, 1, 1, 1, '{{"color":"#FFBB28","hat":null,"theme":"default"}}'::jsonb)
ON CONFLICT (student_id) DO NOTHING;

-- 7. Initial Starting Mastery
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
""")

with open(out_file, "w", encoding="utf-8") as f:
    f.write("\n".join(sql_lines) + "\n")

print(f"Generated {out_file} with {len(sql_lines)} sections!")
