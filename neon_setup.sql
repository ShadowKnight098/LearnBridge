-- ============================================================================
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
  hint           TEXT,
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

-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- SEED DATA: Skills & Skill Prerequisites
-- ----------------------------------------------------------------------------
INSERT INTO skills (id, domain, name_en, name_hi, name_te, grade_min, grade_max) VALUES ('NUM-01', 'numeracy', 'Number sense to 100', '100 तक संख्या ज्ञान', '100 వరకు సంఖ్యా జ్ఞానం', 3, 3) ON CONFLICT (id) DO NOTHING;
INSERT INTO skills (id, domain, name_en, name_hi, name_te, grade_min, grade_max) VALUES ('NUM-02', 'numeracy', 'Addition', 'जोड़', 'కూడిక', 3, 3) ON CONFLICT (id) DO NOTHING;
INSERT INTO skills (id, domain, name_en, name_hi, name_te, grade_min, grade_max) VALUES ('NUM-03', 'numeracy', 'Subtraction', 'घटाव', 'తీసివేత', 3, 3) ON CONFLICT (id) DO NOTHING;
INSERT INTO skills (id, domain, name_en, name_hi, name_te, grade_min, grade_max) VALUES ('NUM-04', 'numeracy', 'Multiplication tables', 'पहाड़े (गुणा)', 'గుణకార పట్టికలు', 3, 4) ON CONFLICT (id) DO NOTHING;
INSERT INTO skills (id, domain, name_en, name_hi, name_te, grade_min, grade_max) VALUES ('NUM-05', 'numeracy', 'Division basics', 'भाग (विभाजन)', 'భాగహారం ప్రాథమికాలు', 4, 4) ON CONFLICT (id) DO NOTHING;
INSERT INTO skills (id, domain, name_en, name_hi, name_te, grade_min, grade_max) VALUES ('NUM-06', 'numeracy', 'Fractions', 'भिन्न', 'భిన్నాలు', 4, 5) ON CONFLICT (id) DO NOTHING;
INSERT INTO skills (id, domain, name_en, name_hi, name_te, grade_min, grade_max) VALUES ('NUM-07', 'numeracy', 'Measurement', 'मापन (लंबाई, भार, समय)', 'కొలతలు (పొడవు, బరువు, సమయం)', 3, 4) ON CONFLICT (id) DO NOTHING;
INSERT INTO skills (id, domain, name_en, name_hi, name_te, grade_min, grade_max) VALUES ('NUM-08', 'numeracy', 'Money', 'मुद्रा (रुपये-पैसे)', 'డబ్బు (రూపాయలు)', 3, 4) ON CONFLICT (id) DO NOTHING;
INSERT INTO skills (id, domain, name_en, name_hi, name_te, grade_min, grade_max) VALUES ('NUM-09', 'numeracy', 'Word problems', 'इबारती सवाल', 'గణిత సమస్యలు', 3, 5) ON CONFLICT (id) DO NOTHING;
INSERT INTO skills (id, domain, name_en, name_hi, name_te, grade_min, grade_max) VALUES ('NUM-10', 'numeracy', 'Shapes and patterns', 'आकार और पैटर्न', 'ఆకారాలు మరియు నమూనాలు', 3, 4) ON CONFLICT (id) DO NOTHING;
INSERT INTO skills (id, domain, name_en, name_hi, name_te, grade_min, grade_max) VALUES ('LIT-01', 'literacy', 'Letter/akshara recognition', 'अक्षर पहचान', 'అక్షర గుర్తింపు', 3, 3) ON CONFLICT (id) DO NOTHING;
INSERT INTO skills (id, domain, name_en, name_hi, name_te, grade_min, grade_max) VALUES ('LIT-02', 'literacy', 'Vowel signs (matras / guninthalu)', 'मात्राएं', 'గుణింతాలు', 3, 3) ON CONFLICT (id) DO NOTHING;
INSERT INTO skills (id, domain, name_en, name_hi, name_te, grade_min, grade_max) VALUES ('LIT-03', 'literacy', 'Word reading and vocabulary', 'शब्द पठन और शब्दावली', 'పద పఠనం మరియు పదకోశం', 3, 4) ON CONFLICT (id) DO NOTHING;
INSERT INTO skills (id, domain, name_en, name_hi, name_te, grade_min, grade_max) VALUES ('LIT-04', 'literacy', 'Sentence construction', 'वाक्य रचना', 'వాక్య నిర్మాణం', 3, 4) ON CONFLICT (id) DO NOTHING;
INSERT INTO skills (id, domain, name_en, name_hi, name_te, grade_min, grade_max) VALUES ('LIT-05', 'literacy', 'Reading comprehension (literal)', 'गद्यांश समझ (प्रत्यक्ष)', 'గ్రహణ శక్తి (ప్రత్యక్ష ప్రశ్నలు)', 3, 5) ON CONFLICT (id) DO NOTHING;
INSERT INTO skills (id, domain, name_en, name_hi, name_te, grade_min, grade_max) VALUES ('LIT-06', 'literacy', 'Reading comprehension (inferential)', 'गद्यांश समझ (अनुमानात्मक)', 'గ్రహణ శక్తి (భావోద్దేశ ప్రశ్నలు)', 4, 5) ON CONFLICT (id) DO NOTHING;
INSERT INTO skills (id, domain, name_en, name_hi, name_te, grade_min, grade_max) VALUES ('LIT-07', 'literacy', 'Grammar basics', 'व्याकरण मूल बातें', 'వ్యాకరణ ప్రాథమికాలు', 4, 5) ON CONFLICT (id) DO NOTHING;
INSERT INTO skills (id, domain, name_en, name_hi, name_te, grade_min, grade_max) VALUES ('LIT-08', 'literacy', 'Fluency', 'धाराप्रवाह पठन', 'ధారాళంగా చదవడం', 3, 5) ON CONFLICT (id) DO NOTHING;
INSERT INTO skills (id, domain, name_en, name_hi, name_te, grade_min, grade_max) VALUES ('LANG-01', 'language', 'Home-language comfort', 'मातृभाषा सहजता', 'మాతృభాష సౌలభ్యం', 3, 5) ON CONFLICT (id) DO NOTHING;
INSERT INTO skills (id, domain, name_en, name_hi, name_te, grade_min, grade_max) VALUES ('LANG-02', 'language', 'Second-language bridging', 'द्वितीय भाषा सेतु', 'ద్వితీయ భాష వారధి', 3, 5) ON CONFLICT (id) DO NOTHING;
INSERT INTO skills (id, domain, name_en, name_hi, name_te, grade_min, grade_max) VALUES ('LANG-03', 'language', 'Instruction-language comprehension', 'निर्देश भाषा बोध', 'బోధనా భాష అవగాహన', 3, 5) ON CONFLICT (id) DO NOTHING;
INSERT INTO skill_prerequisites (skill_id, requires) VALUES ('NUM-02', 'NUM-01') ON CONFLICT (skill_id, requires) DO NOTHING;
INSERT INTO skill_prerequisites (skill_id, requires) VALUES ('NUM-03', 'NUM-01') ON CONFLICT (skill_id, requires) DO NOTHING;
INSERT INTO skill_prerequisites (skill_id, requires) VALUES ('NUM-04', 'NUM-02') ON CONFLICT (skill_id, requires) DO NOTHING;
INSERT INTO skill_prerequisites (skill_id, requires) VALUES ('NUM-05', 'NUM-04') ON CONFLICT (skill_id, requires) DO NOTHING;
INSERT INTO skill_prerequisites (skill_id, requires) VALUES ('NUM-06', 'NUM-05') ON CONFLICT (skill_id, requires) DO NOTHING;
INSERT INTO skill_prerequisites (skill_id, requires) VALUES ('NUM-07', 'NUM-01') ON CONFLICT (skill_id, requires) DO NOTHING;
INSERT INTO skill_prerequisites (skill_id, requires) VALUES ('NUM-08', 'NUM-02') ON CONFLICT (skill_id, requires) DO NOTHING;
INSERT INTO skill_prerequisites (skill_id, requires) VALUES ('NUM-09', 'NUM-02') ON CONFLICT (skill_id, requires) DO NOTHING;
INSERT INTO skill_prerequisites (skill_id, requires) VALUES ('NUM-09', 'NUM-03') ON CONFLICT (skill_id, requires) DO NOTHING;
INSERT INTO skill_prerequisites (skill_id, requires) VALUES ('LIT-02', 'LIT-01') ON CONFLICT (skill_id, requires) DO NOTHING;
INSERT INTO skill_prerequisites (skill_id, requires) VALUES ('LIT-03', 'LIT-02') ON CONFLICT (skill_id, requires) DO NOTHING;
INSERT INTO skill_prerequisites (skill_id, requires) VALUES ('LIT-04', 'LIT-03') ON CONFLICT (skill_id, requires) DO NOTHING;
INSERT INTO skill_prerequisites (skill_id, requires) VALUES ('LIT-05', 'LIT-03') ON CONFLICT (skill_id, requires) DO NOTHING;
INSERT INTO skill_prerequisites (skill_id, requires) VALUES ('LIT-06', 'LIT-05') ON CONFLICT (skill_id, requires) DO NOTHING;
INSERT INTO skill_prerequisites (skill_id, requires) VALUES ('LIT-07', 'LIT-04') ON CONFLICT (skill_id, requires) DO NOTHING;
INSERT INTO skill_prerequisites (skill_id, requires) VALUES ('LIT-08', 'LIT-03') ON CONFLICT (skill_id, requires) DO NOTHING;
-- ----------------------------------------------------------------------------
-- SEED DATA: Questions
-- ----------------------------------------------------------------------------
INSERT INTO questions (concept_id, skill_id, language, grade, difficulty, type, text, options, correct_index, explanation, status) VALUES ('num01_count_stars', 'NUM-01', 'en', 3, 1, 'mcq'::question_type, 'How many stars are here: ⭐ ⭐ ⭐ ⭐ ⭐ ?', '["3", "4", "5", "6"]'::jsonb, 2, 'Counting the stars one by one gives 5 stars.', 'approved');
INSERT INTO questions (concept_id, skill_id, language, grade, difficulty, type, text, options, correct_index, explanation, status) VALUES ('num01_count_stars', 'NUM-01', 'te', 3, 1, 'mcq'::question_type, 'ఇక్కడ ఎన్ని నక్షత్రాలు ఉన్నాయి: ⭐ ⭐ ⭐ ⭐ ⭐ ?', '["3", "4", "5", "6"]'::jsonb, 2, 'ఒక్కొక్కటిగా లెక్కిస్తే మొత్తం 5 నక్షత్రాలు ఉన్నాయి.', 'approved');
INSERT INTO questions (concept_id, skill_id, language, grade, difficulty, type, text, options, correct_index, explanation, status) VALUES ('num01_count_stars', 'NUM-01', 'hi', 3, 1, 'mcq'::question_type, 'यहाँ कितने तारे हैं: ⭐ ⭐ ⭐ ⭐ ⭐ ?', '["3", "4", "5", "6"]'::jsonb, 2, 'एक-एक करके गिनने पर कुल 5 तारे हैं।', 'approved');
INSERT INTO questions (concept_id, skill_id, language, grade, difficulty, type, text, options, correct_index, explanation, status) VALUES ('num01_compare_numbers', 'NUM-01', 'en', 3, 2, 'mcq'::question_type, 'Which number is greater: 47 or 74?', '["47", "74", "Both are equal", "Cannot be determined"]'::jsonb, 1, '74 has 7 tens, while 47 has only 4 tens. Therefore, 74 is greater.', 'approved');
INSERT INTO questions (concept_id, skill_id, language, grade, difficulty, type, text, options, correct_index, explanation, status) VALUES ('num01_compare_numbers', 'NUM-01', 'te', 3, 2, 'mcq'::question_type, 'వీటిలో ఏ సంఖ్య పెద్దది: 47 లేదా 74?', '["47", "74", "రెండూ సమానం", "చెప్పలేము"]'::jsonb, 1, '74 లో 7 పదులు ఉన్నాయి, 47 లో 4 పదులు మాత్రమే ఉన్నాయి. కాబట్టి 74 పెద్దది.', 'approved');
INSERT INTO questions (concept_id, skill_id, language, grade, difficulty, type, text, options, correct_index, explanation, status) VALUES ('num01_compare_numbers', 'NUM-01', 'hi', 3, 2, 'mcq'::question_type, 'इनमें से कौन सी संख्या बड़ी है: 47 या 74?', '["47", "74", "दोनों बराबर हैं", "कहा नहीं जा सकता"]'::jsonb, 1, '74 में 7 दहाई हैं जबकि 47 में 4 दहाई हैं। इसलिए 74 बड़ा है।', 'approved');
INSERT INTO questions (concept_id, skill_id, language, grade, difficulty, type, text, options, correct_index, explanation, status) VALUES ('num01_place_value', 'NUM-01', 'en', 3, 3, 'mcq'::question_type, 'In the number 85, what is the place value of 8?', '["8", "80", "50", "85"]'::jsonb, 1, '8 is in the tens place, so its value is 8 x 10 = 80.', 'approved');
INSERT INTO questions (concept_id, skill_id, language, grade, difficulty, type, text, options, correct_index, explanation, status) VALUES ('num01_place_value', 'NUM-01', 'te', 3, 3, 'mcq'::question_type, '85 సంఖ్యలో, 8 యొక్క స్థాన విలువ ఎంత?', '["8", "80", "50", "85"]'::jsonb, 1, '8 పదుల స్థానంలో ఉంది, కాబట్టి దాని విలువ 8 x 10 = 80.', 'approved');
INSERT INTO questions (concept_id, skill_id, language, grade, difficulty, type, text, options, correct_index, explanation, status) VALUES ('num01_place_value', 'NUM-01', 'hi', 3, 3, 'mcq'::question_type, 'संख्या 85 में, 8 का स्थानीय मान क्या है?', '["8", "80", "50", "85"]'::jsonb, 1, '8 दहाई के स्थान पर है, इसलिए इसका मान 8 x 10 = 80 है।', 'approved');
INSERT INTO questions (concept_id, skill_id, language, grade, difficulty, type, text, options, correct_index, explanation, status) VALUES ('num02_add_single', 'NUM-02', 'en', 3, 1, 'mcq'::question_type, 'What is 4 + 3?', '["6", "7", "8", "9"]'::jsonb, 1, '4 plus 3 equals 7.', 'approved');
INSERT INTO questions (concept_id, skill_id, language, grade, difficulty, type, text, options, correct_index, explanation, status) VALUES ('num02_add_single', 'NUM-02', 'te', 3, 1, 'mcq'::question_type, '4 + 3 మొత్తం ఎంత?', '["6", "7", "8", "9"]'::jsonb, 1, '4 కి 3 కలిపితే 7 వస్తుంది.', 'approved');
INSERT INTO questions (concept_id, skill_id, language, grade, difficulty, type, text, options, correct_index, explanation, status) VALUES ('num02_add_single', 'NUM-02', 'hi', 3, 1, 'mcq'::question_type, '4 + 3 कितना होता है?', '["6", "7", "8", "9"]'::jsonb, 1, '4 में 3 जोड़ने पर 7 आता है।', 'approved');
INSERT INTO questions (concept_id, skill_id, language, grade, difficulty, type, text, options, correct_index, explanation, status) VALUES ('num02_add_double_nocarry', 'NUM-02', 'en', 3, 2, 'mcq'::question_type, 'What is 23 + 14?', '["35", "37", "47", "39"]'::jsonb, 1, 'Add ones: 3 + 4 = 7. Add tens: 2 + 1 = 3. Result is 37.', 'approved');
INSERT INTO questions (concept_id, skill_id, language, grade, difficulty, type, text, options, correct_index, explanation, status) VALUES ('num02_add_double_nocarry', 'NUM-02', 'te', 3, 2, 'mcq'::question_type, '23 + 14 మొత్తం ఎంత?', '["35", "37", "47", "39"]'::jsonb, 1, 'ఒకట్ల స్థానం: 3 + 4 = 7. పదుల స్థానం: 2 + 1 = 3. మొత్తం 37.', 'approved');
INSERT INTO questions (concept_id, skill_id, language, grade, difficulty, type, text, options, correct_index, explanation, status) VALUES ('num02_add_double_nocarry', 'NUM-02', 'hi', 3, 2, 'mcq'::question_type, '23 + 14 कितना होता है?', '["35", "37", "47", "39"]'::jsonb, 1, 'इकाई: 3 + 4 = 7. दहाई: 2 + 1 = 3. कुल उत्तर 37 है।', 'approved');
INSERT INTO questions (concept_id, skill_id, language, grade, difficulty, type, text, options, correct_index, explanation, status) VALUES ('num02_add_double_carry', 'NUM-02', 'en', 3, 3, 'mcq'::question_type, 'What is 38 + 27?', '["55", "63", "65", "57"]'::jsonb, 2, '8 + 7 = 15 (5 down, 1 carry). 1 + 3 + 2 = 6. Result is 65.', 'approved');
INSERT INTO questions (concept_id, skill_id, language, grade, difficulty, type, text, options, correct_index, explanation, status) VALUES ('num02_add_double_carry', 'NUM-02', 'te', 3, 3, 'mcq'::question_type, '38 + 27 మొత్తం ఎంత?', '["55", "63", "65", "57"]'::jsonb, 2, '8 + 7 = 15 (5 ఉంచి, 1 దస్తా). 1 + 3 + 2 = 6. మొత్తం 65.', 'approved');
INSERT INTO questions (concept_id, skill_id, language, grade, difficulty, type, text, options, correct_index, explanation, status) VALUES ('num02_add_double_carry', 'NUM-02', 'hi', 3, 3, 'mcq'::question_type, '38 + 27 कितना होता है?', '["55", "63", "65", "57"]'::jsonb, 2, '8 + 7 = 15 (5 लिखकर 1 हासिल). 1 + 3 + 2 = 6. कुल उत्तर 65 है।', 'approved');
INSERT INTO questions (concept_id, skill_id, language, grade, difficulty, type, text, options, correct_index, explanation, status) VALUES ('num03_sub_single', 'NUM-03', 'en', 3, 1, 'mcq'::question_type, 'What is 9 - 4?', '["4", "5", "6", "3"]'::jsonb, 1, 'Subtracting 4 from 9 gives 5.', 'approved');
INSERT INTO questions (concept_id, skill_id, language, grade, difficulty, type, text, options, correct_index, explanation, status) VALUES ('num03_sub_single', 'NUM-03', 'te', 3, 1, 'mcq'::question_type, '9 - 4 తీసివేస్తే ఎంత?', '["4", "5", "6", "3"]'::jsonb, 1, '9 నుండి 4 తీసివేస్తే 5 వస్తుంది.', 'approved');
INSERT INTO questions (concept_id, skill_id, language, grade, difficulty, type, text, options, correct_index, explanation, status) VALUES ('num03_sub_single', 'NUM-03', 'hi', 3, 1, 'mcq'::question_type, '9 - 4 कितना होता है?', '["4", "5", "6", "3"]'::jsonb, 1, '9 में से 4 घटाने पर 5 आता है।', 'approved');
INSERT INTO questions (concept_id, skill_id, language, grade, difficulty, type, text, options, correct_index, explanation, status) VALUES ('num04_mult_table5', 'NUM-04', 'en', 3, 1, 'mcq'::question_type, 'What is 5 × 4?', '["15", "20", "25", "30"]'::jsonb, 1, '5 multiplied by 4 equals 20.', 'approved');
INSERT INTO questions (concept_id, skill_id, language, grade, difficulty, type, text, options, correct_index, explanation, status) VALUES ('num04_mult_table5', 'NUM-04', 'te', 3, 1, 'mcq'::question_type, '5 × 4 విలువ ఎంత?', '["15", "20", "25", "30"]'::jsonb, 1, '5 ని 4 సార్లు గుణిస్తే 20 వస్తుంది.', 'approved');
INSERT INTO questions (concept_id, skill_id, language, grade, difficulty, type, text, options, correct_index, explanation, status) VALUES ('num04_mult_table5', 'NUM-04', 'hi', 3, 1, 'mcq'::question_type, '5 × 4 कितना होता है?', '["15", "20", "25", "30"]'::jsonb, 1, '5 को 4 से गुणा करने पर 20 आता है।', 'approved');
INSERT INTO questions (concept_id, skill_id, language, grade, difficulty, type, text, options, correct_index, explanation, status) VALUES ('num06_frac_half', 'NUM-06', 'en', 4, 1, 'mcq'::question_type, 'If a whole roti is cut into 2 equal parts, what is one part called?', '["One-fourth (1/4)", "One-half (1/2)", "Three-fourths (3/4)", "Whole (1)"]'::jsonb, 1, 'One out of two equal parts is represented as 1/2 (half).', 'approved');
INSERT INTO questions (concept_id, skill_id, language, grade, difficulty, type, text, options, correct_index, explanation, status) VALUES ('num06_frac_half', 'NUM-06', 'te', 4, 1, 'mcq'::question_type, 'ఒక రొట్టెను 2 సమాన భాగాలుగా చేస్తే, ఒక భాగాన్ని ఏమంటారు?', '["పావు భాగం (1/4)", "సగం భాగం (1/2)", "ముప్పావు భాగం (3/4)", "పూర్తి రొట్టె (1)"]'::jsonb, 1, 'రెండు సమాన భాగాలలో ఒక భాగాన్ని సగం (1/2) అంటారు.', 'approved');
INSERT INTO questions (concept_id, skill_id, language, grade, difficulty, type, text, options, correct_index, explanation, status) VALUES ('num06_frac_half', 'NUM-06', 'hi', 4, 1, 'mcq'::question_type, 'यदि एक रोटी को 2 बराबर भागों में बांटा जाए, तो एक भाग को क्या कहेंगे?', '["एक-चौथाई (1/4)", "आधा (1/2)", "तीन-चौथाई (3/4)", "पूरी रोटी (1)"]'::jsonb, 1, 'दो बराबर हिस्सों में से एक हिस्से को आधा (1/2) कहते हैं।', 'approved');
INSERT INTO questions (concept_id, skill_id, language, grade, difficulty, type, text, options, correct_index, explanation, status) VALUES ('lit01_vowel_recognition', 'LIT-01', 'en', 3, 1, 'mcq'::question_type, 'Which of these letters is a vowel?', '["B", "E", "T", "M"]'::jsonb, 1, 'E is a vowel (A, E, I, O, U are vowels).', 'approved');
INSERT INTO questions (concept_id, skill_id, language, grade, difficulty, type, text, options, correct_index, explanation, status) VALUES ('lit01_vowel_recognition', 'LIT-01', 'te', 3, 1, 'mcq'::question_type, 'కింది అక్షరాలలో అచ్చు ఏది?', '["క", "అ", "గ", "చ"]'::jsonb, 1, '''అ'' అనేది అచ్చు. మిగిలినవి హల్లులు.', 'approved');
INSERT INTO questions (concept_id, skill_id, language, grade, difficulty, type, text, options, correct_index, explanation, status) VALUES ('lit01_vowel_recognition', 'LIT-01', 'hi', 3, 1, 'mcq'::question_type, 'इनमें से कौन सा वर्ण एक स्वर है?', '["क", "अ", "ग", "च"]'::jsonb, 1, '''अ'' एक स्वर है। बाकी सब व्यंजन हैं।', 'approved');
INSERT INTO questions (concept_id, skill_id, language, grade, difficulty, type, text, options, correct_index, explanation, status) VALUES ('lit03_word_antonym_big', 'LIT-03', 'en', 3, 2, 'mcq'::question_type, 'What is the opposite of the word ''Big''?', '["Tall", "Small", "Heavy", "Wide"]'::jsonb, 1, 'The opposite (antonym) of ''Big'' is ''Small''.', 'approved');
INSERT INTO questions (concept_id, skill_id, language, grade, difficulty, type, text, options, correct_index, explanation, status) VALUES ('lit03_word_antonym_big', 'LIT-03', 'te', 3, 2, 'mcq'::question_type, '''పెద్ద'' అనే పదానికి వ్యతిరేక పదం ఏమిటి?', '["పొడవు", "చిన్న", "బరువు", "వెడల్పు"]'::jsonb, 1, '''పెద్ద'' పదానికి వ్యతిరేక పదం ''చిన్న''.', 'approved');
INSERT INTO questions (concept_id, skill_id, language, grade, difficulty, type, text, options, correct_index, explanation, status) VALUES ('lit03_word_antonym_big', 'LIT-03', 'hi', 3, 2, 'mcq'::question_type, '''बड़ा'' शब्द का विलोम (उल्टा) शब्द क्या है?', '["लंबा", "छोटा", "भारी", "चौड़ा"]'::jsonb, 1, '''बड़ा'' का विलोम शब्द ''छोटा'' होता है।', 'approved');
INSERT INTO questions (concept_id, skill_id, language, grade, difficulty, type, text, options, correct_index, explanation, status) VALUES ('lit05_comp_rabbit_sun', 'LIT-05', 'en', 3, 1, 'mcq'::question_type, 'Read the sentence: ''The white rabbit hopped near the green bush.'' Where did the rabbit hop?', '["On the tree", "Near the green bush", "Inside the river", "Over the house"]'::jsonb, 1, 'The sentence clearly states that the rabbit hopped ''near the green bush''.', 'approved');
INSERT INTO questions (concept_id, skill_id, language, grade, difficulty, type, text, options, correct_index, explanation, status) VALUES ('lit05_comp_rabbit_sun', 'LIT-05', 'te', 3, 1, 'mcq'::question_type, 'వాక్యం చదవండి: ''తెల్ల కుందేలు పచ్చని పొద దగ్గర గెంతుతోంది.'' కుందేలు ఎక్కడ గెంతుతోంది?', '["చెట్టు మీద", "పచ్చని పొద దగ్గర", "నది లోపల", "ఇంటి పైకి"]'::jsonb, 1, 'వాక్యంలో కుందేలు ''పచ్చని పొద దగ్గర'' గెంతుతోందని స్పష్టంగా ఉంది.', 'approved');
INSERT INTO questions (concept_id, skill_id, language, grade, difficulty, type, text, options, correct_index, explanation, status) VALUES ('lit05_comp_rabbit_sun', 'LIT-05', 'hi', 3, 1, 'mcq'::question_type, 'वाक्य पढ़ें: ''सफेद खरगोश हरी झाड़ी के पास कूद रहा था।'' खरगोश कहाँ कूद रहा था?', '["पेड़ के ऊपर", "हरी झाड़ी के पास", "नदी के अंदर", "घर की छत पर"]'::jsonb, 1, 'वाक्य में स्पष्ट रूप से लिखा है कि खरगोश ''हरी झाड़ी के पास'' कूद रहा था।', 'approved');
-- ----------------------------------------------------------------------------
-- SEED DATA: Users, Classes, Students, Profiles, and Initial Mastery
-- ----------------------------------------------------------------------------
-- 1. Admin (Username: admin / Password: admin123)
INSERT INTO users (id, role, parent_id, name, username, password_hash, language, is_active)
VALUES ('a0000000-0000-0000-0000-000000000001', 'admin', NULL, 'Admin Coordinator', 'admin', '$argon2id$v=19$m=65536,t=3,p=4$4dwbA+CcU6p1LmUMgTCmVA$zxnTKul54STTLegieJxymFqV9PwxxGdM7/pFW4C9QKE', 'en', TRUE)
ON CONFLICT (username) DO NOTHING;

-- 2. Teacher (Username: teacher1 / Password: teacher123)
INSERT INTO users (id, role, parent_id, name, username, password_hash, language, is_active)
VALUES ('a0000000-0000-0000-0000-000000000002', 'teacher', 'a0000000-0000-0000-0000-000000000001', 'Teacher Lakshmi', 'teacher1', '$argon2id$v=19$m=65536,t=3,p=4$1Lq31rr3nnMOodT6f6+V0g$4XEOjBmmvzOMcKElmFAhOexK3lSko4aB0KzT89PywGo', 'te', TRUE)
ON CONFLICT (username) DO NOTHING;

-- 3. Class (Class Code: CLS3A)
INSERT INTO classes (id, name, grade, teacher_id, class_code, created_by)
VALUES ('c0000000-0000-0000-0000-000000000001', 'Class 3 - Section A', 3, 'a0000000-0000-0000-0000-000000000002', 'CLS3A', 'a0000000-0000-0000-0000-000000000001')
ON CONFLICT (class_code) DO NOTHING;

-- 4. Students (PIN: 1234)
-- Student 1 (Telugu)
INSERT INTO users (id, role, parent_id, name, username, password_hash, language, is_active)
VALUES ('s0000000-0000-0000-0000-000000000001', 'student', 'a0000000-0000-0000-0000-000000000002', 'Aarav Sharma', 'student1', '$argon2id$v=19$m=65536,t=3,p=4$z1lLidGaM2ZM6d2715pzjg$wu2j48TLX0gNklnVT0fYzvJMdXqjZ5u/v8a9auUmKgc', 'te', TRUE)
ON CONFLICT (username) DO NOTHING;

-- Student 2 (Hindi)
INSERT INTO users (id, role, parent_id, name, username, password_hash, language, is_active)
VALUES ('s0000000-0000-0000-0000-000000000002', 'student', 'a0000000-0000-0000-0000-000000000002', 'Bhavya Patel', 'student2', '$argon2id$v=19$m=65536,t=3,p=4$z1lLidGaM2ZM6d2715pzjg$wu2j48TLX0gNklnVT0fYzvJMdXqjZ5u/v8a9auUmKgc', 'hi', TRUE)
ON CONFLICT (username) DO NOTHING;

-- Student 3 (English)
INSERT INTO users (id, role, parent_id, name, username, password_hash, language, is_active)
VALUES ('s0000000-0000-0000-0000-000000000003', 'student', 'a0000000-0000-0000-0000-000000000002', 'Chiranjeevi Rao', 'student3', '$argon2id$v=19$m=65536,t=3,p=4$z1lLidGaM2ZM6d2715pzjg$wu2j48TLX0gNklnVT0fYzvJMdXqjZ5u/v8a9auUmKgc', 'en', TRUE)
ON CONFLICT (username) DO NOTHING;

-- 5. Class Enrollments
INSERT INTO class_students (class_id, student_id) VALUES
  ('c0000000-0000-0000-0000-000000000001', 's0000000-0000-0000-0000-000000000001'),
  ('c0000000-0000-0000-0000-000000000001', 's0000000-0000-0000-0000-000000000002'),
  ('c0000000-0000-0000-0000-000000000001', 's0000000-0000-0000-0000-000000000003')
ON CONFLICT (class_id, student_id) DO NOTHING;

-- 6. Student Gamification Profiles
INSERT INTO student_profile (student_id, xp, level, coins, current_streak, longest_streak, streak_freezes, avatar_config) VALUES
  ('s0000000-0000-0000-0000-000000000001', 0, 1, 25, 1, 1, 1, '{"color":"#6C4DF6","hat":null,"theme":"default"}'::jsonb),
  ('s0000000-0000-0000-0000-000000000002', 0, 1, 25, 1, 1, 1, '{"color":"#00C49F","hat":null,"theme":"default"}'::jsonb),
  ('s0000000-0000-0000-0000-000000000003', 0, 1, 25, 1, 1, 1, '{"color":"#FFBB28","hat":null,"theme":"default"}'::jsonb)
ON CONFLICT (student_id) DO NOTHING;

-- 7. Initial Starting Mastery
INSERT INTO mastery (student_id, skill_id, score, attempts) VALUES
  ('s0000000-0000-0000-0000-000000000001', 'NUM-01', 0.3, 0),
  ('s0000000-0000-0000-0000-000000000001', 'NUM-02', 0.3, 0),
  ('s0000000-0000-0000-0000-000000000001', 'NUM-03', 0.3, 0),
  ('s0000000-0000-0000-0000-000000000001', 'NUM-04', 0.3, 0),
  ('s0000000-0000-0000-0000-000000000001', 'LIT-01', 0.3, 0),
  ('s0000000-0000-0000-0000-000000000001', 'LIT-03', 0.3, 0),
  ('s0000000-0000-0000-0000-000000000001', 'LIT-05', 0.3, 0),
  ('s0000000-0000-0000-0000-000000000002', 'NUM-01', 0.3, 0),
  ('s0000000-0000-0000-0000-000000000002', 'NUM-02', 0.3, 0),
  ('s0000000-0000-0000-0000-000000000002', 'NUM-03', 0.3, 0),
  ('s0000000-0000-0000-0000-000000000002', 'NUM-04', 0.3, 0),
  ('s0000000-0000-0000-0000-000000000002', 'LIT-01', 0.3, 0),
  ('s0000000-0000-0000-0000-000000000002', 'LIT-03', 0.3, 0),
  ('s0000000-0000-0000-0000-000000000002', 'LIT-05', 0.3, 0),
  ('s0000000-0000-0000-0000-000000000003', 'NUM-01', 0.3, 0),
  ('s0000000-0000-0000-0000-000000000003', 'NUM-02', 0.3, 0),
  ('s0000000-0000-0000-0000-000000000003', 'NUM-03', 0.3, 0),
  ('s0000000-0000-0000-0000-000000000003', 'NUM-04', 0.3, 0),
  ('s0000000-0000-0000-0000-000000000003', 'LIT-01', 0.3, 0),
  ('s0000000-0000-0000-0000-000000000003', 'LIT-03', 0.3, 0),
  ('s0000000-0000-0000-0000-000000000003', 'LIT-05', 0.3, 0)
ON CONFLICT (student_id, skill_id) DO NOTHING;


-- Migration: ensure hint column exists
ALTER TABLE questions ADD COLUMN IF NOT EXISTS hint TEXT;
