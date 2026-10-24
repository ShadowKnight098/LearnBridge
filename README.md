# LearnBridge 🎓
> **Multilingual Adaptive Learning Platform for Foundational Literacy & Numeracy (FLN)**  
> *Aligned with NEP 2020, NIPUN Bharat, DIKSHA, and Bhashini guidelines for Grades 3–5.*

---

## 📌 Overview

**LearnBridge** is an open-source, AI-powered multilingual adaptive learning platform designed to bridge learning gaps for primary school students (Grades 3–5). It assesses individual literacy and numeracy competencies through short (5–10 min) diagnostic sessions, serves personalized exercises calibrated to each student's mastery level, and supports seamless multilingual switching between **Telugu, Hindi, and English**.

The platform also empowers educators: teachers can upload chapter PDFs directly in the browser. Client-side OCR and text processing extract content and send chunks to an LLM to generate curriculum-aligned question drafts. **No AI-generated question is ever served to students without explicit teacher review and approval.**

---

## ✨ Key Features

### 🧠 1. Adaptive Learning Engine
- **Competency Tracking:** Real-time skill mastery tracking on a scale of `0.0 – 1.0` across 21 foundational skills (10 Numeracy, 8 Literacy, 3 Language).
- **Dynamic Difficulty Calibration:** Three difficulty bands (`Level 1: < 0.4`, `Level 2: 0.4 – 0.69`, `Level 3: >= 0.70`).
- **Smart Item Selection:** Automatically selects questions targeting the student's lowest-mastery skills while enforcing 7-day recency exclusions and consecutive-error step-down adjustments.
- **Diagnostic Mode:** 8–10 question initial onboarding assessment to establish student baseline without overwhelming learners.

### 📄 2. Teacher Content & PDF-to-Question Pipeline
- **Zero-Server-Load Extraction:** PDF text extraction (`pdf.js`) and multilingual OCR (`tesseract.js` for Telugu, Hindi, English) execute locally in the teacher's browser.
- **AI Question Generation:** Text chunks are structured and passed to LLMs (Gemini / Ollama) with strict JSON schema enforcement (`prompts/question_generation_prompt.md`).
- **Human-in-the-Loop Review:** Generated questions are marked as `draft`. Teachers can edit question text, options, answers, explanations, or regenerate before approving. Only `approved` questions enter the active question pool.

### 🎮 3. Gamification & Student Engagement
- **Motivation Mechanics:** Daily streaks (with streak freezes), experience points (XP), player levels (`floor(sqrt(XP/50)) + 1`), and achievement badges.
- **Avatar Customization & Coin Economy:** Students earn coins through regular practice and spend them in a safe, non-monetized accessory shop (hats, themes, companion pets).
- **Anti-Gaming Safeguards:** Attempts answered in under 1.5 seconds earn 0 XP and are automatically flagged for educator review.
- **Text-to-Speech (TTS):** Integrated read-aloud support for all questions and options across supported languages.

### 🔒 4. Role-Based Access Control (RBAC) & Security
- **3-Tier Hierarchy:** `Student → Teacher → Admin`.
- **Strict Ownership Guards:** Teachers only access their assigned classes and students; students only access their own practice sessions and profiles.
- **Kid-Friendly Student Login:** Students log in using a simple `Class Code` (e.g., `CLS3A`) and a 4-digit PIN (e.g., `1234`), avoiding complex passwords.
- **Token Security:** Argon2 / Bcrypt password hashing, JWT access tokens (15-minute expiry), and refresh tokens (7-day expiry).

### 📊 5. Actionable Educator & Admin Analytics
- **Student Mastery Profile:** Skill breakdown, accuracy trends, practice time, and identified learning gaps.
- **Classroom Heatmaps:** Student × Skill matrix highlighting classroom-wide bottlenecks.
- **Early Warning System:** Automated alerts flagging students who are falling behind or struggling consecutively.

---

## 🏗️ System Architecture

```
                       Browser / Progressive Web App (Next.js 14)
   ┌──────────────────────────────┬─────────────────────────────┬─────────────────────────────┐
   │        Student Portal        │        Teacher Portal       │         Admin Portal        │
   │  - Diagnostic & Practice     │  - PDF Upload & Browser OCR │  - Teacher Account Mgmt     │
   │  - TTS Audio & Mascots       │  - Question Review Queue    │  - Class Allocations        │
   │  - Avatar Shop & Rewards     │  - Student Roster & Alerts  │  - Cross-School Analytics   │
   └──────────────────────────────┴─────────────────────────────┴─────────────────────────────┘
                                                 │
                                                 │ HTTPS / REST (JSON + JWT)
                                                 ▼
                                     FastAPI Backend Gateway
   ┌──────────────────────────────────────────────────────────────────────────────────────────┐
   │  • Auth & RBAC Security (Argon2 / PyJWT / Ownership Verifier)                             │
   │  • Adaptive Service (update_mastery, band, select_next_question)                         │
   │  • Rewards Engine (XP, streak freeze, badges, coin ledger)                               │
   │  • Question Generation Pipeline (Chunker, LLM Prompter, JSON Validator)                  │
   │  • Reporting & Analytics Service                                                         │
   └──────────────────────────────┬─────────────────────────────┬─────────────────────────────┘
                                  │                             │
                   Database Calls │                             │ Background LLM Tasks
                                  ▼                             ▼
          PostgreSQL (Neon / Docker) / SQLite          Gemini 2.5 Flash / Ollama
```

---

## 💻 Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | [Next.js 14](https://nextjs.org/) (App Router), [React 18](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Tailwind CSS](https://tailwindcss.com/), [Lucide React](https://lucide.dev/), [Canvas-Confetti](https://www.npmjs.com/package/canvas-confetti) |
| **In-Browser Processing**| [PDF.js](https://mozilla.github.io/pdf.js/), [Tesseract.js](https://tesseract.projectnaptha.com/) (OCR for `tel`, `hin`, `eng`) |
| **Backend API** | [FastAPI](https://fastapi.tiangolo.com/), [Python 3.10+](https://www.python.org/), [Pydantic v2](https://docs.pydantic.dev/), [Uvicorn](https://www.uvicorn.org/) |
| **Database & ORM** | [SQLAlchemy 2.0](https://www.sqlalchemy.org/) (Async), [PostgreSQL](https://www.postgresql.org/) ([Neon Serverless](https://neon.tech/) / Docker) / [SQLite](https://www.sqlite.org/) via `aiosqlite` |
| **Security & Auth** | [Argon2-cffi](https://argon2-cffi.readthedocs.io/), [Bcrypt](https://pypi.org/project/bcrypt/), [PyJWT](https://pyjwt.readthedocs.io/) |
| **Testing** | [Pytest](https://docs.pytest.org/), [pytest-asyncio](https://github.com/pytest-dev/pytest-asyncio), [Playwright](https://playwright.dev/) (End-to-End browser tests) |

---

## 📁 Repository Structure

```text
learnbridge/
├── 01-PRD.md                  # Product Requirements Document
├── 02-ARCHITECTURE.md         # Technical architecture & RBAC matrix
├── 03-DESIGN.md               # UI design system & layout specifications
├── 04-SKILL-MAP.md            # FLN competence taxonomy & learning progressions
├── 05-TEST-PLAN.md            # Test scenarios & quality assurance matrix
├── TRACK.md                   # Detailed implementation tracker (Phases 0–8)
├── docker-compose.yml         # Container configuration for local PostgreSQL
├── schema.sql                 # Canonical PostgreSQL DDL schema
├── neon_setup.sql             # Cloud database initialization script
├── content/
│   ├── skills.json            # Seed data: FLN skills & prerequisite definitions
│   └── sample_questions.json  # Multilingual seed question bank
├── prompts/
│   └── question_generation_prompt.md # Strict prompt schema for LLM chunk generation
├── backend/
│   ├── app/
│   │   ├── api/               # API Routers (auth, student, teacher, admin, practice, reports, tts)
│   │   ├── core/              # Config, async database session, JWT & RBAC dependencies
│   │   ├── models/            # SQLAlchemy ORM entity definitions
│   │   ├── schemas/           # Pydantic request/response validation models
│   │   ├── services/          # Adaptive math, rewards logic, LLM generator
│   │   └── main.py            # FastAPI entry point & CORS configuration
│   ├── scripts/               # Seed scripts (`seed.py`, `reset_clean_data.py`)
│   ├── tests/                 # Unit & integration test suites
│   ├── requirements.txt       # Python dependencies
│   └── run_server.py          # Windows/Linux compatible Uvicorn launcher
└── frontend/
    ├── app/                   # Next.js App Router (student, teacher, admin, login portals)
    ├── components/            # Reusable UI components (Mascot, AudioButton, Navbars, Drawers)
    ├── lib/                   # API client bindings, browser OCR & TTS wrappers
    ├── locales/               # Bilingual localization dictionaries (en.json, hi.json, te.json)
    ├── tests-e2e/             # Automated Playwright test suite
    └── package.json           # Frontend dependencies & scripts
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18.x or later) & **npm**
- **Python** (v3.10 or later)
- **Git**
- *(Optional)* PostgreSQL instance or [Neon DB](https://neon.tech/) account (SQLite works out-of-the-box for local testing).

---

### 1. Clone the Repository

```bash
git clone https://github.com/ShadowKnight098/LearnBridge.git
cd LearnBridge
```

---

### 2. Backend Setup

1. **Create and activate a virtual environment:**
   ```bash
   cd backend
   python -m venv venv

   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure Environment Variables:**
   Copy `.env.example` in the project root to `.env`:
   ```bash
   cp ../.env.example ../.env
   ```
   *(Update `LLM_API_KEY` with your Google Gemini API key if you plan to generate questions from PDFs).*

4. **Initialize and Seed the Database:**
   ```bash
   python scripts/seed.py
   ```

5. **Start the FastAPI Server:**
   ```bash
   python run_server.py
   # Or directly using uvicorn:
   # uvicorn app.main:app --reload --port 8000
   ```
   *The API will be accessible at `http://127.0.0.1:8000` (Interactive Swagger docs: `http://127.0.0.1:8000/docs`).*

---

### 3. Frontend Setup

1. **Open a new terminal and navigate to `frontend`:**
   ```bash
   cd frontend
   ```

2. **Install node dependencies:**
   ```bash
   npm install
   ```

3. **Run the Next.js development server:**
   ```bash
   npm run dev
   ```
   *The web client will be running at `http://localhost:3000`.*

---

## 🔑 Default Demo Accounts

The seed script creates the following pre-configured user credentials for immediate testing:

| Role | Username / Identifier | Password / PIN | Description |
|---|---|---|---|
| **Admin** | `admin` | `admin123` | District coordinator dashboard, teacher management |
| **Teacher** | `teacher1` | `teacher123` | Class 3 teacher, PDF question generation & approval |
| **Student** | Class: `CLS3A`, Roll: `student1` | `1234` | Telugu primary language, Grade 3 |
| **Student** | Class: `CLS3A`, Roll: `student2` | `1234` | Hindi primary language, Grade 3 |
| **Student** | Class: `CLS3A`, Roll: `student3` | `1234` | English primary language, Grade 3 |

---

## 🧪 Running Tests

### Backend Unit & Integration Tests
```bash
cd backend
pytest
```

### Frontend End-to-End Tests
```bash
cd frontend
npx playwright test
```

---

## 📜 Educational Guidelines & Policy Alignment

LearnBridge is designed around the core tenets of:
- **NEP 2020 (National Education Policy):** Early emphasis on Foundational Literacy and Numeracy (FLN) and mother-tongue / regional language instruction.
- **NIPUN Bharat:** Competency-based stage learning with measurable learning outcomes (Lakshyas).
- **DIKSHA & Bhashini:** Interoperable question patterns and high-quality Indian language text-to-speech support.

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
