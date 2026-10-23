# LearnBridge — Architecture

## 1. Two senses of "3-tier"
1. **Technical 3-tier:** Presentation (Next.js PWA) → Application (FastAPI) → Data (PostgreSQL).
2. **Role hierarchy (3 levels):** Admin → Teacher → Student.

## 2. System Context
```
 Admin / Teacher / Student  (Browser PWA)
            │ HTTPS + JSON (JWT)
            ▼
  ┌───────────────────────────────┐
  │ FastAPI backend               │
  │  - Auth + RBAC                │
  │  - Adaptive engine            │
  │  - Rewards service            │
  │  - Reports service            │
  │  - Generation service ──────────► LLM (Gemini free tier / Ollama)
  └───────────────┬───────────────┘
                  ▼
           PostgreSQL (local Docker / Neon) or SQLite
```
PDF text extraction and OCR run **in the teacher's browser** (pdf.js, tesseract.js); only extracted text chunks reach the server.

## 3. Components
| Component | Responsibility | Tech |
|---|---|---|
| Student app | Practice, rewards, avatar, language toggle, audio | Next.js, Tailwind, Framer Motion, Lottie |
| Teacher app | Classes, PDF upload, question review, reports | Next.js, shadcn/ui, Recharts |
| Admin app | Teachers, classes, school reports | Next.js |
| API | REST endpoints, validation | FastAPI, Pydantic |
| Auth/RBAC | JWT, role + ownership checks | PyJWT, argon2 |
| Adaptive service | `select_next_question`, `update_mastery` | Pure Python module |
| Rewards service | XP, level, streak, badges, coins | Pure Python + DB transaction |
| Generation service | Prompting, JSON validation, retries | Python, LLM client |
| Jobs | Track long generation tasks | `generation_jobs` table + FastAPI BackgroundTasks |
| Database | System of record | PostgreSQL + SQLAlchemy + Alembic |

## 4. Key Flows
### 4.1 PDF → Questions
1. Teacher selects PDF, grade, subject, language (browser).
2. pdf.js extracts text; low-text pages go to tesseract.js OCR (packs: `tel`, `hin`, `eng`).
3. Browser splits text into chunks and calls `POST /teacher/documents/{id}/chunks`.
4. Server creates a `generation_job`; a BackgroundTask loops over chunks: build prompt → call LLM → parse JSON → validate → insert `questions(status='draft')`.
5. Teacher polls `GET /teacher/jobs/{id}` and reviews drafts.
6. Approve sets `status='approved'`; only approved questions are servable.

### 4.2 Adaptive Practice Session
1. `POST /practice/sessions` creates a session and returns the first question.
2. `POST /practice/sessions/{id}/answer` records the attempt, updates mastery, returns feedback, reward delta and the next question.
3. At session end, rewards are finalised (XP, streak, badges) and a summary is returned.

### 4.3 Reports
Aggregations over `attempts` and `mastery`; heavy ones cached in `report_snapshots`.

## 5. Adaptive Algorithm (v1: rule-based)
```
mastery[skill] in [0,1]; initialised from the diagnostic round (default 0.3)

update_mastery(m, correct, difficulty):
    lr = 0.10 + 0.05 * (difficulty - 1)       # harder items move the score more
    return m + lr*(1-m) if correct else m - lr*m

band(m): m < 0.4 -> difficulty 1 ; 0.4 <= m < 0.7 -> 2 ; m >= 0.7 -> 3

select_next_question(student, pool):
    skill = argmin mastery over skills present in pool (ties -> least recently practised)
    candidates = approved questions with that skill, difficulty = band(m),
                 student's language, not seen in the last 7 days
    fallback: relax difficulty by +/-1, then relax recency
    after 3 consecutive wrong -> serve difficulty-1 item + explanation
```
Upgrade path (v2): Bayesian Knowledge Tracing or Elo ratings behind the same two function signatures.

## 6. Rewards Logic
```
xp_for_attempt = 2 (attempt) + 3 (correct) + 2 (retry-correct)
session_bonus  = 10 on completion
level(xp)      = floor(sqrt(xp / 50)) + 1
streak         = +1 if last_active == yesterday; unchanged if today;
                 otherwise consume a streak freeze or reset to 1
anti_gaming    = if time_taken < 1.5 s -> xp = 0 and attempt flagged
badge          = rules evaluated after each session; UNIQUE(student_id, badge_id)
```
All writes occur in one DB transaction and append to `reward_events`.

## 7. Security Design
- Passwords hashed with argon2/bcrypt; students may use class code + PIN.
- JWT access (15 min) + refresh (7 days); role claim; `require_role()` on every route.
- **Ownership checks** on every resource (matrix below).
- Rate-limit login and generation endpoints.
- CORS restricted to the frontend origin; HTTPS in production.
- API keys only in backend `.env`, never in the browser.
- Student identifiers never included in LLM prompts.
- Soft-delete users; reward events are append-only.

### RBAC Matrix
| Resource | Admin | Teacher | Student |
|---|---|---|---|
| Teachers | CRUD | read self | — |
| Classes | CRUD | read own | read own |
| Students | read all | CRUD own | read self |
| Documents / questions | read all | CRUD own | — |
| Approved questions | — | — | via practice API only |
| Attempts / mastery | read all | own students | self |
| Reports | school-wide | own classes | own |
| Rewards | read all | read own students, award badges | read / spend self |

## 8. API Outline (REST)
```
POST  /auth/login | /auth/refresh
GET/POST/PATCH  /admin/teachers
GET/POST        /admin/classes
GET/POST/PATCH  /teacher/students          POST /teacher/students/import (CSV)
POST            /teacher/documents
POST            /teacher/documents/{id}/chunks
GET             /teacher/jobs/{id}
GET             /teacher/questions?status=draft
PATCH           /teacher/questions/{id}    (edit / approve / reject)
POST            /teacher/assignments
GET             /teacher/reports/class/{id}   GET /teacher/reports/student/{id}
GET             /admin/reports/school
POST            /practice/sessions
POST            /practice/sessions/{id}/answer
GET             /student/me/progress | /student/me/rewards
POST            /student/me/shop/{item_id}/buy
PATCH           /student/me/avatar
GET             /health
```

## 9. Deployment
**Demo (recommended):** `docker compose up` runs frontend, backend and Postgres on one laptop.
**Optional online:** frontend on Vercel/Netlify/Cloudflare Pages; backend on a free host (Render/Fly/Railway); DB on Neon/PostgreSQL. Free-tier terms change, so verify them. Free backends may sleep; wake the app before a demo.

## 10. Configuration
`.env` keys: `DATABASE_URL`, `JWT_SECRET`, `LLM_PROVIDER` (`gemini|ollama|none`), `LLM_API_KEY`, `LLM_MODEL`, `FRONTEND_ORIGIN`, `DAILY_SESSION_CAP`.

## 11. Observability (lightweight)
Structured JSON logs; `generation_jobs` stores errors; `/health` endpoint.

## 12. Repo Layout
```
learnbridge/
├── frontend/   app/(student) (teacher) (admin), components, locales
├── backend/    app/api, core, models, services/{adaptive,rewards,generator,reports}, tests, alembic
├── db/schema.sql
├── content/    skills.json, sample_questions.json
├── prompts/    question_generation_prompt.md
├── docs/
└── docker-compose.yml
```

## 13. Architecture Decisions
| # | Decision | Reason |
|---|---|---|
| ADR-1 | PostgreSQL over MongoDB | Relational data; JSONB for options |
| ADR-2 | Browser-side PDF/OCR | Zero server cost, no worker infrastructure |
| ADR-3 | BackgroundTasks over Celery/Redis | Fewer moving parts at ₹0 |
| ADR-4 | Rule-based adaptivity first | Explainable, testable, swappable |
| ADR-5 | Mandatory teacher approval | Child safety and quality control |
| ADR-6 | Hand-made bank as backbone | Demo resilience if the LLM fails |
