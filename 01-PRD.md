# LearnBridge — Product Requirements Document (PRD)

**Version:** 1.0  **Status:** Draft  **Alignment:** Ministry of Education (NEP 2020, NIPUN Bharat, DIKSHA, Bhashini)

---

## 1. Overview
LearnBridge is a multilingual adaptive learning platform. Short activities identify each learner's skill gaps in literacy and numeracy, and the platform recommends suitable exercises in at least two Indian languages. Teachers can upload a PDF; an AI model drafts questions from it, the teacher reviews them, and approved questions are served to students according to each student's level.

## 2. Problem Statement
- Learners in one class have very different levels of literacy, numeracy and language confidence.
- Teachers have limited time to personalise practice for 40–60 students.
- A child's home language often differs from the language of instruction.

## 3. Goals and Non-Goals
**Goals**
1. Diagnose skill gaps with short (5–10 min) activities.
2. Serve adaptive exercises per student, per skill.
3. Support at least two Indian languages (default: Telugu + Hindi, with English).
4. Let teachers turn their own PDFs into reviewed question sets.
5. Give teachers/admins clear progress reports.
6. Keep children engaged through ethical gamification.
7. Run at **zero infrastructure cost**.

**Non-Goals (v1)**
- Live video classes, chat or messaging between students.
- Real-money payments or ads.
- Full national curriculum coverage (v1 covers a defined skill map for Grades 3–5).
- Automated high-stakes grading.

## 4. Users and Roles (3-level hierarchy)
| Role | Description | Key permissions |
|---|---|---|
| **Admin** | School/district coordinator | Create/deactivate teachers, create classes, assign teachers, view all reports, manage languages/subjects |
| **Teacher** | Class teacher | Manage own students, upload PDFs, review/approve questions, assign sets, view class/student reports, award custom badges |
| **Student** | Learner (Grades 3–5) | Practise assigned/recommended exercises, earn rewards, view own progress |

Ownership rule: `student → teacher → admin`. A teacher can only access their own students, classes and documents.

## 5. User Stories
**Admin**
- A1: I create teacher accounts so they can start using the platform.
- A2: I create classes and assign teachers.
- A3: I view school-wide reports comparing classes.

**Teacher**
- T1: I add students individually or by CSV import.
- T2: I upload a chapter PDF and receive draft questions.
- T3: I approve, edit, delete or regenerate each draft question.
- T4: I assign a question set to a class or a single student.
- T5: I see which skills each student and the class struggle with.
- T6: I get an alert when a student is falling behind.
- T7: I award a custom badge for effort.

**Student**
- S1: I choose my language and see the app in it.
- S2: I take a short diagnostic so the app knows my level.
- S3: I get questions that are not too hard or too easy.
- S4: I hear questions read aloud.
- S5: I earn XP, streaks, badges and coins for effort and improvement.
- S6: I customise my avatar with earned coins.

## 6. Functional Requirements
### 6.1 Authentication and RBAC
- FR-1: Login with username/password (students may use class code + PIN).
- FR-2: JWT access + refresh tokens; role embedded in token.
- FR-3: Every endpoint enforces role AND ownership.
- FR-4: Admin can deactivate accounts (soft delete).

### 6.2 Content and PDF Pipeline
- FR-5: Teacher uploads PDF (max 20 MB) with grade, subject, language.
- FR-6: Text extracted in browser (pdf.js); scanned pages go through OCR (tesseract.js).
- FR-7: Text split into chunks (~300–600 words) retaining page numbers.
- FR-8: Each chunk sent to the LLM with a strict JSON schema; output validated (see `prompts/`).
- FR-9: Generated questions saved as `draft`. **Nothing reaches students until a teacher approves it.**
- FR-10: Teacher can edit text/options/answer/difficulty/skill tag, approve, reject or regenerate.
- FR-11: Question types: MCQ, true/false, fill-in-the-blank (v1); short answer (v2).

### 6.3 Adaptive Engine
- FR-12: Each question has `skill`, `difficulty` (1–3), `language`, `grade`, optional `concept_id` linking translations.
- FR-13: Mastery score (0–1) tracked per student per skill.
- FR-14: Diagnostic round of 8–10 questions across skills initialises mastery.
- FR-15: Next question = lowest-mastery skill with approved content, difficulty matched to mastery band.
- FR-16: Correct answers raise mastery; wrong answers lower it and show an explanation plus an easier variant.
- FR-17: Recently seen questions are not repeated within 7 days.
- FR-18: Teacher assignments constrain the pool; the engine adapts within it.

### 6.4 Student Experience and Rewards
- FR-19: One question per screen, progress bar, audio read-aloud, language toggle always visible.
- FR-20: XP for attempts (bonus for correct, retry, session completion).
- FR-21: Levels, daily streak (with streak freeze), badges, coins, avatar shop, weekly challenge.
- FR-22: Reward events logged in `reward_events` (auditable).
- FR-23: Anti-gaming: answers faster than a minimum threshold earn no XP and are flagged.
- FR-24: Daily session cap with a friendly "come back tomorrow" screen.

### 6.5 Reports
- FR-25: Student report: mastery per skill, accuracy trend, time, weak skills.
- FR-26: Class report: skill × student heatmap, class averages, most-missed questions, at-risk list.
- FR-27: Admin report: class/teacher comparison, participation, improvement.
- FR-28: Export CSV and PDF (browser print-to-PDF acceptable in v1).

### 6.6 Multilingual
- FR-29: UI strings in locale files for en, hi, te.
- FR-30: Question content stored per language; `concept_id` links equivalents.
- FR-31: Switching language mid-session continues the same skill.

## 7. Non-Functional Requirements
| Area | Requirement |
|---|---|
| Performance | Next question < 300 ms (p95) on a 3G-class connection |
| Device | Works on low-end Android phones (2 GB RAM); initial page weight < 1.5 MB |
| Offline (stretch) | Cache next session's questions; sync attempts when online |
| Accessibility | Touch targets ≥ 48 px, high contrast, audio support, icon-supported UI |
| Security | Hashed passwords (argon2/bcrypt), HTTPS, RBAC, login rate limiting |
| Privacy | Minimal child data; no third-party trackers; no student data sent to the LLM |
| Reliability | LLM failure must not break student flow (fallback to hand-made bank) |
| Cost | ₹0 infrastructure using free tiers / local hosting |
| Testability | Adaptive and reward logic are pure functions with unit tests |

## 8. Success Metrics
- ≥ 70% of students complete ≥ 3 sessions per week during a pilot.
- Mastery on the weakest skill improves ≥ 15% over 4 weeks.
- ≥ 80% of generated questions approved with little or no edit.
- Teacher time to create a 20-question set < 10 minutes.
- Zero cross-teacher data leaks in RBAC tests.

(Targets are proposals; adjust after a first pilot.)

## 9. Scope by Release
| Release | Contents |
|---|---|
| **MVP** | Auth/RBAC, hand-made bilingual bank, diagnostic + adaptive session, teacher class report, XP/levels/streak |
| **v1** | PDF → questions → review, badges, mascot, audio, admin reports, CSV import |
| **v1.5** | Avatar shop, weekly challenges, class goals, teacher alerts, PDF reports |
| **v2** | Offline mode, voice answers, short-answer grading, Bayesian Knowledge Tracing |

## 10. Risks and Mitigations
| Risk | Mitigation |
|---|---|
| Indic OCR/extraction is poor | Test real PDFs in week 1; allow manual text paste; fall back to hand-made bank |
| LLM hallucinated questions | Ground in chunk, auto-validate, mandatory teacher review |
| Free-tier rate limits/outages | Per-chunk calls with retry/backoff, caching, pre-generated demo set |
| Weak students demotivated | Reward effort/improvement; optional "most improved" boards only |
| Over-engagement | Daily cap, no guilt nudges, no purchases |
| Free hosts sleep | Run locally via Docker for the demo |
| Translation errors | Teacher verifies; `concept_id` pairs reviewed |

## 11. Dependencies and Assumptions
- Teachers have a laptop/phone with internet at least when uploading PDFs.
- Students use shared or personal low-end smartphones.
- A free LLM tier (e.g., Google Gemini via AI Studio) or a local Ollama model is available. Verify current limits before relying on them.

## 12. Open Questions
1. Final language pair (suggested: Telugu + Hindi, English UI option)?
2. Grade range for MVP (suggested: 3–5)?
3. Shared devices at the pilot school (affects login: PIN vs password)?
4. Is Bhashini API access approved in time?
