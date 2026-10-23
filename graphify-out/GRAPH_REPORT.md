# Graph Report - LearnBridge  (2026-10-23)

## Corpus Check
- 87 files · ~60,914 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 9 file(s) not represented in the graph (top: (none) 6, .example 1, .ini 1)

## Summary
- 675 nodes · 1676 edges · 39 communities (31 shown, 8 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 51 edges (avg confidence: 0.94)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a5ebcafd`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- useTranslation
- test_rbac.py
- api/auth.py
- LearnBridge — Implementation & Progress Tracker (`TRACK.md`)
- User
- add_security_headers
- api/content.py
- student.py
- database.py
- api/practice.py
- 📽️ Detailed Slide-by-Slide Blueprint
- test_content_generation.py
- update_mastery
- main.py
- select_next_question
- adaptive.py
- admin.py
- __init__.py
- User
- json
- LearnBridge — Architecture
- LearnBridge — Product Requirements Document (PRD)
- LearnBridge — UX / UI Design Specification
- compilerOptions
- package.json
- test_adaptive_rewards.py
- Part A — Learner Skill Map
- ocr.ts
- LearnBridge — Test Plan and Test Cases
- dependencies
- devDependencies
- asyncio
- Question Generation Prompt Specification
- scripts
- Settings
- next.config.mjs
- tailwind.config.ts
- CLAUDE.md

## God Nodes (most connected - your core abstractions)
1. `User` - 52 edges
2. `useTranslation()` - 43 edges
3. `Base` - 27 edges
4. `react` - 26 edges
5. `PortalHeader()` - 25 edges
6. `create_access_token()` - 23 edges
7. `lucide-react` - 23 edges
8. `submit_answer()` - 22 edges
9. `Class` - 22 edges
10. `hash_password()` - 21 edges

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

## Communities (39 total, 8 thin omitted)

### Community 0 - "useTranslation"
Cohesion: 0.10
Nodes (48): AdminClassesPage(), AdminDashboardPage(), AdminReportsPage(), AdminTeachersPage(), StaffLoginPage(), SplashPage(), BadgesShelfPage(), StudentHomePage() (+40 more)

### Community 1 - "test_rbac.py"
Cohesion: 0.11
Nodes (12): hash_password(), ClassStudent, seed_students(), e2e_client(), test_e2e_complete_six_scenarios(), bench_client(), test_nfr_01_next_question_turnaround_latency(), test_nfr_02_frontend_bundle_weight() (+4 more)

### Community 2 - "api/auth.py"
Cohesion: 0.07
Nodes (28): get_me(), login(), refresh_token(), student_login(), get_current_user(), create_access_token(), create_refresh_token(), decode_token() (+20 more)

### Community 3 - "LearnBridge — Implementation & Progress Tracker (`TRACK.md`)"
Cohesion: 0.10
Nodes (17): metadata, RootLayout(), I18nProvider(), TTSService, useSpeech(), 📝 Activity Log & Milestone Progress, LearnBridge — Implementation & Progress Tracker (`TRACK.md`), Phase 0: Project Setup & Groundwork (+9 more)

### Community 4 - "User"
Cohesion: 0.20
Nodes (13): export_class_csv(), resolve_alert(), create_student(), create_teacher_class(), get_teacher_classes(), get_teacher_students(), import_students_csv(), TeacherClassCreate (+5 more)

### Community 6 - "api/content.py"
Cohesion: 0.19
Nodes (17): add_document_chunks(), create_assignment(), create_document(), get_job_status(), list_questions(), update_question(), Assignment, AssignmentCreate (+9 more)

### Community 7 - "student.py"
Cohesion: 0.19
Nodes (14): buy_shop_item(), get_shop_items(), get_student_progress(), get_student_rewards(), update_avatar(), get_db(), RewardEvent, AnswerResponse (+6 more)

### Community 9 - "api/practice.py"
Cohesion: 0.22
Nodes (10): complete_practice_session(), ensure_starter_content(), start_practice_session(), submit_answer(), StudentBadge, AnswerSubmission, PracticeSessionStart, QuestionItemResponse (+2 more)

### Community 10 - "📽️ Detailed Slide-by-Slide Blueprint"
Cohesion: 0.11
Nodes (17): 💡 Anticipated Q&A (Evaluator Cheat Sheet), 📽️ Detailed Slide-by-Slide Blueprint, 📌 Executive Summary (Elevator Pitch), LearnBridge — Presentation Deck Summary & Slide Guide, 🎨 Recommended Presentation Design Language, Slide 10: Alignment with National Policy (NEP 2020 & NIPUN Bharat), Slide 11: Roadmap & Future Horizons, Slide 12: Conclusion & Q&A (+9 more)

### Community 11 - "test_content_generation.py"
Cohesion: 0.22
Nodes (7): GenerationJob, Question, build_generation_prompt(), call_llm(), process_document_generation(), test_document_and_review_workflow(), test_gen_10_prompt_builder_no_student_id()

### Community 12 - "update_mastery"
Cohesion: 0.18
Nodes (6): 3. Components, update_mastery(), test_adp_01_correct_answer_raises_mastery(), test_adp_02_wrong_answer_lowers_mastery(), test_adp_03_harder_item_moves_mastery_more(), test_adp_13_divergent_paths_simulation()

### Community 13 - "main.py"
Cohesion: 0.24
Nodes (3): text_to_speech(), health_check(), root()

### Community 14 - "select_next_question"
Cohesion: 0.22
Nodes (4): select_next_question(), test_adp_08_recency_exclusion(), test_adp_09_adjacent_difficulty_fallback(), test_adp_10_three_consecutive_wrong_remedial()

### Community 21 - "admin.py"
Cohesion: 0.21
Nodes (13): create_class(), create_teacher(), list_classes(), list_teachers(), update_teacher(), ClassCreate, ClassResponse, StudentCreate (+5 more)

### Community 24 - "__init__.py"
Cohesion: 0.16
Nodes (23): Base, Alert, AlertKind, Attempt, Badge, Challenge, ChallengeScope, Chunk (+15 more)

### Community 25 - "User"
Cohesion: 0.26
Nodes (10): get_class_report(), get_school_report(), get_student_report(), list_teacher_alerts(), AlertResponse, ClassReportResponse, HeatmapCell, MostMissedQuestion (+2 more)

### Community 41 - "json"
Cohesion: 0.10
Nodes (11): validate_generated_questions(), sql_json(), test_gen_01_valid_json_parsed(), test_gen_02_malformed_json_rejected(), test_gen_03_invalid_correct_index_rejected(), test_gen_04_duplicates_deduplicated(), get_nested_keys(), test_lng_01_no_missing_locale_keys() (+3 more)

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

### Community 92 - "test_adaptive_rewards.py"
Cohesion: 0.10
Nodes (12): calculate_attempt_xp(), calculate_level(), calculate_streak(), evaluate_badges(), test_adp_04_05_06_banding_difficulty(), test_rwd_01_session_completed_zero_correct_earns_xp(), test_rwd_02_consecutive_days_streak(), test_rwd_03_missed_day_with_freeze() (+4 more)

### Community 100 - "Part A — Learner Skill Map"
Cohesion: 0.18
Nodes (10): Language Confidence (cross-cutting), LearnBridge — Skill Map (Grades 3–5) and Team Skills, Literacy (per language: Telugu, Hindi, English), Mastery Interpretation, Numeracy, Part A — Learner Skill Map, Part B — Team Skills Needed, Prerequisite Graph (excerpt) (+2 more)

### Community 107 - "ocr.ts"
Cohesion: 0.22
Nodes (8): DocumentChunk, extractDocumentChunks(), ProgressCallback, runTesseractOnPage(), splitTextIntoChunks(), TESSERACT_LANG_MAP, pdfjs-dist, tesseract.js

### Community 108 - "LearnBridge — Test Plan and Test Cases"
Cohesion: 0.20
Nodes (9): 1. RBAC / Security, 2. Content and Generation, 3. Adaptive Engine (pure unit tests), 4. Rewards, 5. Reports, 6. Multilingual, 7. E2E Demo Scenarios (Playwright), 8. Non-Functional (+1 more)

### Community 118 - "dependencies"
Cohesion: 0.20
Nodes (10): dependencies, canvas-confetti, clsx, lucide-react, next, pdfjs-dist, react, react-dom (+2 more)

### Community 121 - "devDependencies"
Cohesion: 0.22
Nodes (9): devDependencies, autoprefixer, postcss, tailwindcss, @types/canvas-confetti, @types/node, @types/react, @types/react-dom (+1 more)

### Community 129 - "asyncio"
Cohesion: 0.22
Nodes (4): test_rep_01_03_class_accuracy_and_heatmap(), test_rep_02_teacher_sees_only_own_classes(), test_rep_05_csv_export_count(), test_rep_06_admin_school_report_covers_all_classes()

### Community 132 - "Question Generation Prompt Specification"
Cohesion: 0.29
Nodes (6): Inputs, Mandatory Constraints, Question Generation Prompt Specification, Required JSON Schema, System Role, Task

### Community 143 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, build, dev, lint, start

## Knowledge Gaps
- **10 isolated node(s):** `react-dom`, `clsx`, `tailwind-merge`, `@types/node`, `@types/react` (+5 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 271 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `band_difficulty()` connect `api/practice.py` to `LearnBridge — Implementation & Progress Tracker (`TRACK.md`)`, `test_adaptive_rewards.py`, `update_mastery`, `adaptive.py`?**
  _High betweenness centrality (0.288) - this node is a cross-community bridge._
- **What connects `react-dom`, `clsx`, `tailwind-merge` to the rest of the system?**
  _10 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `useTranslation` be split into smaller, more focused modules?**
  _Cohesion score 0.10288867250892568 - nodes in this community are weakly interconnected._
- **Why does `📝 Activity Log & Milestone Progress` connect `LearnBridge — Implementation & Progress Tracker (`TRACK.md`)` to `api/practice.py`?**
  _High betweenness centrality (0.285) - this node is a cross-community bridge._
- **Should `test_rbac.py` be split into smaller, more focused modules?**
  _Cohesion score 0.11174242424242424 - nodes in this community are weakly interconnected._
- **Why does `TTSService` connect `LearnBridge — Implementation & Progress Tracker (`TRACK.md`)` to `useTranslation`?**
  _High betweenness centrality (0.249) - this node is a cross-community bridge._
- **Should `api/auth.py` be split into smaller, more focused modules?**
  _Cohesion score 0.07164404223227752 - nodes in this community are weakly interconnected._