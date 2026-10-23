# Graph Report - LearnBridge  (2026-10-23)

## Corpus Check
- 93 files · ~71,662 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 10 file(s) not represented in the graph (top: (none) 6, .example 1, .pptx 1)

## Summary
- 726 nodes · 1810 edges · 36 communities (28 shown, 8 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 53 edges (avg confidence: 0.94)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `bfc52c56`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- rewards.py
- teacher.py
- api/auth.py
- LearnBridge — Implementation & Progress Tracker (`TRACK.md`)
- calculate_streak
- start_practice_session
- api/content.py
- schemas/practice.py
- 2. Complete Technology Inventory & Rationale ("Why We Use It")
- adaptive.py
- 📽️ Detailed Slide-by-Slide Blueprint
- test_content_generation.py
- select_next_question
- Settings
- dependencies
- test_adaptive_rewards.py
- global_exception_handler
- scripts
- @playwright/test
- tailwind.config.ts
- api/reports.py
- __init__.py
- useTranslation
- LearnBridge — Architecture
- LearnBridge — Product Requirements Document (PRD)
- LearnBridge — UX / UI Design Specification
- compilerOptions
- package.json
- Part A — Learner Skill Map
- ocr.ts
- LearnBridge — Test Plan and Test Cases
- Question Generation Prompt Specification
- devDependencies
- next.config.mjs
- CLAUDE.md

## God Nodes (most connected - your core abstractions)
1. `User` - 53 edges
2. `useTranslation()` - 43 edges
3. `getStoredUser()` - 29 edges
4. `Base` - 27 edges
5. `react` - 26 edges
6. `hash_password()` - 25 edges
7. `PortalHeader()` - 25 edges
8. `create_access_token()` - 23 edges
9. `lucide-react` - 23 edges
10. `next` - 23 edges

## Surprising Connections (you probably didn't know these)
- `📝 Activity Log & Milestone Progress` --references--> `band_difficulty()`  [INFERRED]
  TRACK.md → backend/app/services/adaptive.py
- `3. Components` --references--> `select_next_question()`  [INFERRED]
  02-ARCHITECTURE.md → backend/app/services/adaptive.py
- `7. Security Design` --references--> `require_role()`  [INFERRED]
  02-ARCHITECTURE.md → backend/app/core/dependencies.py
- `3. Components` --references--> `update_mastery()`  [INFERRED]
  02-ARCHITECTURE.md → backend/app/services/adaptive.py
- `Phase 7: Frontend Client Applications (Next.js PWA)` --references--> `I18nProvider()`  [INFERRED]
  TRACK.md → frontend/lib/i18n.tsx

## Import Cycles
- None detected.

## Communities (36 total, 8 thin omitted)

### Community 0 - "rewards.py"
Cohesion: 0.22
Nodes (4): calculate_attempt_xp(), calculate_level(), evaluate_badges(), test_rwd_06_anti_gaming_under_1_5s()

### Community 1 - "teacher.py"
Cohesion: 0.05
Nodes (32): create_class(), create_teacher(), list_classes(), list_teachers(), update_teacher(), create_student(), create_teacher_class(), delete_student() (+24 more)

### Community 2 - "api/auth.py"
Cohesion: 0.08
Nodes (27): get_class_roster(), get_me(), login(), refresh_token(), student_login(), get_current_user(), create_access_token(), create_refresh_token() (+19 more)

### Community 3 - "LearnBridge — Implementation & Progress Tracker (`TRACK.md`)"
Cohesion: 0.08
Nodes (20): metadata, RootLayout(), AudioButtonProps, I18nProvider(), LANG_MAP, TTSLanguage, TTSService, useSpeech() (+12 more)

### Community 4 - "calculate_streak"
Cohesion: 0.22
Nodes (4): calculate_streak(), test_rwd_02_consecutive_days_streak(), test_rwd_03_missed_day_with_freeze(), test_rwd_04_missed_day_without_freeze_resets()

### Community 5 - "start_practice_session"
Cohesion: 0.27
Nodes (5): complete_practice_session(), ensure_starter_content(), get_question_in_language(), start_practice_session(), PracticeSessionStart

### Community 6 - "api/content.py"
Cohesion: 0.14
Nodes (17): add_document_chunks(), create_assignment(), create_document(), get_job_status(), list_questions(), update_question(), User, AssignmentCreate (+9 more)

### Community 7 - "schemas/practice.py"
Cohesion: 0.27
Nodes (11): submit_answer(), AnswerResponse, AnswerSubmission, AvatarUpdate, BadgeInfo, QuestionItemResponse, SessionStartResponse, SessionSummary (+3 more)

### Community 8 - "2. Complete Technology Inventory & Rationale ("Why We Use It")"
Cohesion: 0.13
Nodes (14): 1. Executive Summary & Design Principles, 2.1 Frontend Tier (Client Application), 2.2 Backend Tier (Application Server & APIs), 2.3 Database Tier (Persistence & State Management), 2.4 AI, LLM & Pedagogical Intelligence, 2.5 DevOps, Testing & Tooling, 2. Complete Technology Inventory & Rationale ("Why We Use It"), 3.1 3-Tier System Architecture Diagram (+6 more)

### Community 10 - "📽️ Detailed Slide-by-Slide Blueprint"
Cohesion: 0.11
Nodes (17): 💡 Anticipated Q&A (Evaluator Cheat Sheet), 📽️ Detailed Slide-by-Slide Blueprint, 📌 Executive Summary (Elevator Pitch), LearnBridge — Presentation Deck Summary & Slide Guide, 🎨 Recommended Presentation Design Language, Slide 10: Alignment with National Policy (NEP 2020 & NIPUN Bharat), Slide 11: Roadmap & Future Horizons, Slide 12: Conclusion & Q&A (+9 more)

### Community 11 - "test_content_generation.py"
Cohesion: 0.06
Nodes (25): text_to_speech(), build_generation_prompt(), call_llm(), generate_deterministic_fallback_questions(), process_document_generation(), validate_generated_questions(), sql_json(), client() (+17 more)

### Community 12 - "select_next_question"
Cohesion: 0.22
Nodes (4): select_next_question(), test_adp_08_recency_exclusion(), test_adp_09_adjacent_difficulty_fallback(), test_adp_10_three_consecutive_wrong_remedial()

### Community 14 - "dependencies"
Cohesion: 0.20
Nodes (10): dependencies, canvas-confetti, clsx, lucide-react, next, pdfjs-dist, react, react-dom (+2 more)

### Community 15 - "test_adaptive_rewards.py"
Cohesion: 0.12
Nodes (11): 3. Components, band_difficulty(), update_mastery(), test_adp_01_correct_answer_raises_mastery(), test_adp_02_wrong_answer_lowers_mastery(), test_adp_03_harder_item_moves_mastery_more(), test_adp_04_05_06_banding_difficulty(), test_adp_13_divergent_paths_simulation() (+3 more)

### Community 18 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, build, dev, lint, start

### Community 21 - "api/reports.py"
Cohesion: 0.18
Nodes (14): export_class_csv(), get_class_report(), get_school_report(), get_student_report(), list_teacher_alerts(), resolve_alert(), import_students_csv(), verify_student_ownership() (+6 more)

### Community 32 - "__init__.py"
Cohesion: 0.08
Nodes (42): buy_shop_item(), get_shop_items(), get_student_progress(), get_student_rewards(), update_avatar(), Base, Alert, AlertKind (+34 more)

### Community 39 - "useTranslation"
Cohesion: 0.12
Nodes (48): AdminClassesPage(), AdminDashboardPage(), AdminReportsPage(), AdminTeachersPage(), StaffLoginPage(), SplashPage(), BadgesShelfPage(), StudentHomePage() (+40 more)

### Community 47 - "LearnBridge — Architecture"
Cohesion: 0.10
Nodes (18): 10. Configuration, 11. Observability (lightweight), 12. Repo Layout, 13. Architecture Decisions, 1. Two senses of "3-tier", 2. System Context, 4.1 PDF → Questions, 4.2 Adaptive Practice Session (+10 more)

### Community 48 - "LearnBridge — Product Requirements Document (PRD)"
Cohesion: 0.10
Nodes (19): 10. Risks and Mitigations, 11. Dependencies and Assumptions, 12. Open Questions, 1. Overview, 2. Problem Statement, 3. Goals and Non-Goals, 4. Users and Roles (3-level hierarchy), 5. User Stories (+11 more)

### Community 58 - "LearnBridge — UX / UI Design Specification"
Cohesion: 0.11
Nodes (17): 10. Accessibility Checklist, 11. Ethical Design Rules, 12. Suggested Frontend Folder Structure, 1. Design Principles, 2. Design Tokens, 3. Mascot, 4. Student App — Screen Inventory, 5. Teacher App — Screen Inventory (+9 more)

### Community 62 - "compilerOptions"
Cohesion: 0.11
Nodes (17): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+9 more)

### Community 84 - "package.json"
Cohesion: 0.14
Nodes (13): name, private, version, autoprefixer, clsx, postcss, react-dom, tailwind-merge (+5 more)

### Community 100 - "Part A — Learner Skill Map"
Cohesion: 0.18
Nodes (10): Language Confidence (cross-cutting), LearnBridge — Skill Map (Grades 3–5) and Team Skills, Literacy (per language: Telugu, Hindi, English), Mastery Interpretation, Numeracy, Part A — Learner Skill Map, Part B — Team Skills Needed, Prerequisite Graph (excerpt) (+2 more)

### Community 107 - "ocr.ts"
Cohesion: 0.22
Nodes (8): DocumentChunk, extractDocumentChunks(), ProgressCallback, runTesseractOnPage(), splitTextIntoChunks(), TESSERACT_LANG_MAP, pdfjs-dist, tesseract.js

### Community 108 - "LearnBridge — Test Plan and Test Cases"
Cohesion: 0.20
Nodes (9): 1. RBAC / Security, 2. Content and Generation, 3. Adaptive Engine (pure unit tests), 4. Rewards, 5. Reports, 6. Multilingual, 7. E2E Demo Scenarios (Playwright), 8. Non-Functional (+1 more)

### Community 132 - "Question Generation Prompt Specification"
Cohesion: 0.29
Nodes (6): Inputs, Mandatory Constraints, Question Generation Prompt Specification, Required JSON Schema, System Role, Task

### Community 135 - "devDependencies"
Cohesion: 0.20
Nodes (10): devDependencies, autoprefixer, @playwright/test, postcss, tailwindcss, @types/canvas-confetti, @types/node, @types/react (+2 more)

## Knowledge Gaps
- **10 isolated node(s):** `clsx`, `react-dom`, `tailwind-merge`, `@types/canvas-confetti`, `@types/node` (+5 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 295 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `band_difficulty()` connect `test_adaptive_rewards.py` to `rewards.py`, `LearnBridge — Implementation & Progress Tracker (`TRACK.md`)`, `start_practice_session`, `schemas/practice.py`, `adaptive.py`?**
  _High betweenness centrality (0.279) - this node is a cross-community bridge._
- **What connects `clsx`, `react-dom`, `tailwind-merge` to the rest of the system?**
  _10 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `teacher.py` be split into smaller, more focused modules?**
  _Cohesion score 0.052434456928838954 - nodes in this community are weakly interconnected._
- **Why does `📝 Activity Log & Milestone Progress` connect `LearnBridge — Implementation & Progress Tracker (`TRACK.md`)` to `test_adaptive_rewards.py`?**
  _High betweenness centrality (0.275) - this node is a cross-community bridge._
- **Should `api/auth.py` be split into smaller, more focused modules?**
  _Cohesion score 0.08313725490196078 - nodes in this community are weakly interconnected._
- **Should `LearnBridge — Implementation & Progress Tracker (`TRACK.md`)` be split into smaller, more focused modules?**
  _Cohesion score 0.08387096774193549 - nodes in this community are weakly interconnected._
- **Should `api/content.py` be split into smaller, more focused modules?**
  _Cohesion score 0.14015151515151514 - nodes in this community are weakly interconnected._