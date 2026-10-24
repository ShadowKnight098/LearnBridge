-- LearnBridge PostgreSQL schema (v1)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE user_role AS ENUM ('admin','teacher','student');
CREATE TYPE question_type AS ENUM ('mcq','tf','fill');
CREATE TYPE question_status AS ENUM ('draft','approved','rejected');
CREATE TYPE job_status AS ENUM ('queued','running','done','failed');

-- ---------- Users and hierarchy (admin -> teacher -> student) ----------
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role          user_role NOT NULL,
  parent_id     UUID REFERENCES users(id),      -- student->teacher, teacher->admin
  name          TEXT NOT NULL,
  username      TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,                  -- argon2/bcrypt (PIN hash for students)
  language      TEXT NOT NULL DEFAULT 'te',     -- preferred language: te|hi|en
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK ((role = 'admin' AND parent_id IS NULL) OR (role <> 'admin' AND parent_id IS NOT NULL))
);
CREATE INDEX idx_users_parent ON users(parent_id);
CREATE INDEX idx_users_role ON users(role);

CREATE TABLE classes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  grade      SMALLINT NOT NULL CHECK (grade BETWEEN 1 AND 12),
  teacher_id UUID NOT NULL REFERENCES users(id),
  class_code TEXT UNIQUE NOT NULL,              -- used for student login
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE class_students (
  class_id   UUID REFERENCES classes(id) ON DELETE CASCADE,
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (class_id, student_id)
);

-- ---------- Skills ----------
CREATE TABLE skills (
  id       TEXT PRIMARY KEY,                    -- e.g. NUM-02
  domain   TEXT NOT NULL,                       -- numeracy|literacy|language
  name_en  TEXT NOT NULL,
  name_hi  TEXT,
  name_te  TEXT,
  grade_min SMALLINT,
  grade_max SMALLINT
);
CREATE TABLE skill_prerequisites (
  skill_id TEXT REFERENCES skills(id),
  requires TEXT REFERENCES skills(id),
  PRIMARY KEY (skill_id, requires)
);

-- ---------- Documents, chunks, generation ----------
CREATE TABLE documents (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES users(id),
  filename   TEXT NOT NULL,
  subject    TEXT NOT NULL,
  grade      SMALLINT NOT NULL,
  language   TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE chunks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  page_no     INT,
  position    INT NOT NULL,
  text        TEXT NOT NULL
);
CREATE TABLE generation_jobs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  status      job_status NOT NULL DEFAULT 'queued',
  total_chunks INT NOT NULL DEFAULT 0,
  done_chunks  INT NOT NULL DEFAULT 0,
  error       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- Questions ----------
CREATE TABLE questions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id      UUID REFERENCES users(id),      -- teacher who owns it (NULL = seed/global)
  chunk_id      UUID REFERENCES chunks(id) ON DELETE SET NULL,
  concept_id    TEXT,                           -- links translations of the same question
  skill_id      TEXT NOT NULL REFERENCES skills(id),
  language      TEXT NOT NULL,
  grade         SMALLINT NOT NULL,
  difficulty    SMALLINT NOT NULL CHECK (difficulty BETWEEN 1 AND 3),
  type          question_type NOT NULL DEFAULT 'mcq',
  text          TEXT NOT NULL,
  options       JSONB NOT NULL,                 -- ["a","b","c","d"]
  correct_index SMALLINT NOT NULL,
  explanation   TEXT,
  hint          TEXT,
  source_snippet TEXT,
  status        question_status NOT NULL DEFAULT 'draft',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_at   TIMESTAMPTZ
);
CREATE INDEX idx_q_select ON questions(status, language, skill_id, difficulty);
CREATE INDEX idx_q_concept ON questions(concept_id);

CREATE TABLE assignments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id  UUID NOT NULL REFERENCES users(id),
  class_id    UUID REFERENCES classes(id),
  student_id  UUID REFERENCES users(id),
  document_id UUID REFERENCES documents(id),    -- restrict pool to this document's questions
  due_date    DATE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (class_id IS NOT NULL OR student_id IS NOT NULL)
);

-- ---------- Practice and mastery ----------
CREATE TABLE sessions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  UUID NOT NULL REFERENCES users(id),
  is_diagnostic BOOLEAN NOT NULL DEFAULT FALSE,
  started_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at    TIMESTAMPTZ
);
CREATE TABLE attempts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID REFERENCES sessions(id) ON DELETE CASCADE,
  student_id  UUID NOT NULL REFERENCES users(id),
  question_id UUID NOT NULL REFERENCES questions(id),
  chosen_index SMALLINT,
  is_correct  BOOLEAN NOT NULL,
  time_taken_ms INT,
  flagged     BOOLEAN NOT NULL DEFAULT FALSE,   -- suspiciously fast
  language    TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_attempts_student ON attempts(student_id, created_at DESC);
CREATE INDEX idx_attempts_question ON attempts(question_id);

CREATE TABLE mastery (
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  skill_id   TEXT REFERENCES skills(id),
  score      REAL NOT NULL DEFAULT 0.3 CHECK (score BETWEEN 0 AND 1),
  attempts   INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (student_id, skill_id)
);

-- ---------- Rewards ----------
CREATE TABLE student_profile (
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
CREATE TABLE badges (
  id          TEXT PRIMARY KEY,                 -- e.g. first_steps
  name_en     TEXT NOT NULL,
  name_hi     TEXT,
  name_te     TEXT,
  description TEXT,
  criteria    JSONB NOT NULL,
  icon        TEXT
);
CREATE TABLE student_badges (
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  badge_id   TEXT REFERENCES badges(id),
  awarded_by UUID REFERENCES users(id),         -- teacher for manual badges
  earned_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (student_id, badge_id)            -- prevents duplicate awards
);
CREATE TABLE reward_events (                    -- append-only audit log
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id),
  type       TEXT NOT NULL,                     -- xp|coin|badge|streak|purchase
  amount     INT NOT NULL DEFAULT 0,
  reason     TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE shop_items (
  id       TEXT PRIMARY KEY,
  name_en  TEXT NOT NULL,
  name_hi  TEXT,
  name_te  TEXT,
  category TEXT NOT NULL,
  cost     INT NOT NULL CHECK (cost >= 0),
  icon     TEXT
);
CREATE TABLE student_items (
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  item_id    TEXT REFERENCES shop_items(id),
  equipped   BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (student_id, item_id)
);
CREATE TABLE challenges (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope       TEXT NOT NULL DEFAULT 'student',  -- student|class
  class_id    UUID REFERENCES classes(id),
  description TEXT NOT NULL,
  target      INT NOT NULL,
  reward_coins INT NOT NULL DEFAULT 0,
  start_date  DATE NOT NULL,
  end_date    DATE NOT NULL
);

-- ---------- Reports / alerts ----------
CREATE TABLE report_snapshots (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope      TEXT NOT NULL,                     -- class|student|school
  scope_id   UUID,
  payload    JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE alerts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES users(id),
  student_id UUID NOT NULL REFERENCES users(id),
  kind       TEXT NOT NULL,                     -- falling_behind|random_clicking|inactive
  detail     TEXT,
  resolved   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- Seed: badges and shop ----------
INSERT INTO badges (id,name_en,name_hi,name_te,description,criteria) VALUES
 ('first_steps','First Steps','पहला कदम','మొదటి అడుగు','Complete your first session','{"type":"sessions","count":1}'),
 ('on_fire','On Fire','जोश में','ఉత్సాహంగా','3-day streak','{"type":"streak","days":3}'),
 ('week_warrior','Week Warrior','सप्ताह योद्धा','వారపు వీరుడు','7-day streak','{"type":"streak","days":7}'),
 ('streak_master','Streak Master','लगातार सही','వరుస సరైనవి','5 correct in a row','{"type":"correct_run","count":5}'),
 ('comeback_kid','Comeback Kid','वापसी','తిరిగి వచ్చిన వీరుడు','Raise a weak skill by 0.2','{"type":"mastery_gain","min_gain":0.2}'),
 ('bilingual_star','Bilingual Star','द्विभाषी सितारा','ద్విభాషా తార','Practise in two languages','{"type":"languages","count":2}'),
 ('teachers_choice','Teacher''s Choice','शिक्षक की पसंद','ఉపాధ్యాయుని ఎంపిక','Awarded by your teacher','{"type":"manual"}');
INSERT INTO shop_items (id,name_en,category,cost) VALUES
 ('hat_cap','Cap','hat',30),('hat_crown','Crown','hat',80),
 ('theme_jungle','Jungle theme','theme',50),('theme_space','Space theme','theme',50),
 ('pet_parrot','Parrot','pet',100);
