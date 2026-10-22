# Graph Report - LearnBridge  (2026-10-22)

## Corpus Check
- 82 files · ~49,571 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 9 file(s) not represented in the graph (top: (none) 6, .example 1, .ini 1)

## Summary
- 639 nodes · 1593 edges · 40 communities (34 shown, 6 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 46 edges (avg confidence: 0.94)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d91a7928`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- useTranslation
- test_performance.py
- test_rbac.py
- LearnBridge — Implementation & Progress Tracker (`TRACK.md`)
- User
- main.py
- security.py
- httpx
- teacher.py
- api/auth.py
- student.py
- __init__.py
- User
- test_content_generation.py
- api/content.py
- LearnBridge — Architecture
- LearnBridge — Product Requirements Document (PRD)
- validate_generated_questions
- LearnBridge — UX / UI Design Specification
- compilerOptions
- package.json
- test_adaptive_rewards.py
- Part A — Learner Skill Map
- ocr.ts
- LearnBridge — Test Plan and Test Cases
- dependencies
- select_next_question
- calculate_streak
- devDependencies
- asyncio
- api/practice.py
- Question Generation Prompt Specification
- rewards.py
- calculate_attempt_xp
- scripts
- Settings
- next.config.mjs
- tailwind.config.ts
- CLAUDE.md

## God Nodes (most connected - your core abstractions)
1. `User` - 50 edges
2. `useTranslation()` - 43 edges
3. `Base` - 27 edges
4. `react` - 26 edges
5. `PortalHeader()` - 25 edges
6. `create_access_token()` - 23 edges
7. `lucide-react` - 23 edges
8. `submit_answer()` - 20 edges
9. `hash_password()` - 18 edges
10. `Class` - 18 edges

## Surprising Connections (you probably didn't know these)
- `3. Components` --references--> `update_mastery()`  [INFERRED]
  02-ARCHITECTURE.md → backend/app/services/adaptive.py
- `📝 Activity Log & Milestone Progress` --references--> `band_difficulty()`  [INFERRED]
  TRACK.md → backend/app/services/adaptive.py
- `7. Security Design` --references--> `require_role()`  [INFERRED]
  02-ARCHITECTURE.md → backend/app/core/dependencies.py
- `3. Components` --references--> `select_next_question()`  [INFERRED]
  02-ARCHITECTURE.md → backend/app/services/adaptive.py
- `Phase 7: Frontend Client Applications (Next.js PWA)` --references--> `I18nProvider()`  [INFERRED]
  TRACK.md → frontend/lib/i18n.tsx

## Import Cycles
- None detected.

## Communities (40 total, 6 thin omitted)

### Community 0 - "useTranslation"
Cohesion: 0.10
Nodes (46): AdminClassesPage(), AdminDashboardPage(), AdminReportsPage(), AdminTeachersPage(), StaffLoginPage(), SplashPage(), BadgesShelfPage(), StudentHomePage() (+38 more)

### Community 1 - "test_performance.py"
Cohesion: 0.27
Nodes (3): hash_password(), bench_client(), test_nfr_01_next_question_turnaround_latency()

### Community 2 - "test_rbac.py"
Cohesion: 0.16
Nodes (10): create_access_token(), test_sec_01_teacher_cannot_add_student_to_other_teacher_class(), test_sec_02_teacher_cannot_access_other_teacher_document(), test_sec_03_student_calls_teacher_route(), test_sec_04_teacher_calls_admin(), test_sec_05_unauthenticated_request(), test_sec_06_expired_jwt(), test_sec_07_deactivated_user_login() (+2 more)

### Community 3 - "LearnBridge — Implementation & Progress Tracker (`TRACK.md`)"
Cohesion: 0.10
Nodes (17): metadata, RootLayout(), I18nProvider(), TTSService, useSpeech(), 📝 Activity Log & Milestone Progress, LearnBridge — Implementation & Progress Tracker (`TRACK.md`), Phase 0: Project Setup & Groundwork (+9 more)

### Community 4 - "User"
Cohesion: 0.20
Nodes (9): Class, User, UserRole, e2e_client(), test_e2e_complete_six_scenarios(), client(), setup_test_users(), client() (+1 more)

### Community 5 - "main.py"
Cohesion: 0.25
Nodes (3): add_security_headers(), health_check(), root()

### Community 6 - "security.py"
Cohesion: 0.29
Nodes (3): client(), student_auth(), test_complete_practice_session_flow()

### Community 20 - "teacher.py"
Cohesion: 0.20
Nodes (13): create_class(), create_teacher(), list_classes(), list_teachers(), update_teacher(), ClassCreate, ClassResponse, StudentCreate (+5 more)

### Community 21 - "api/auth.py"
Cohesion: 0.19
Nodes (13): get_me(), login(), refresh_token(), student_login(), get_current_user(), create_refresh_token(), decode_token(), verify_password() (+5 more)

### Community 23 - "student.py"
Cohesion: 0.16
Nodes (8): get_shop_items(), get_student_progress(), get_student_rewards(), update_avatar(), get_db(), set_sqlite_pragma(), BadgeInfo, StudentRewardsResponse

### Community 24 - "__init__.py"
Cohesion: 0.11
Nodes (32): buy_shop_item(), create_student(), get_teacher_classes(), get_teacher_students(), import_students_csv(), Base, Alert, AlertKind (+24 more)

### Community 25 - "User"
Cohesion: 0.21
Nodes (13): export_class_csv(), get_class_report(), get_school_report(), get_student_report(), list_teacher_alerts(), resolve_alert(), verify_student_ownership(), AlertResponse (+5 more)

### Community 31 - "test_content_generation.py"
Cohesion: 0.24
Nodes (4): client(), teacher_auth(), test_gen_02_malformed_json_rejected(), test_nfr_02_frontend_bundle_weight()

### Community 41 - "api/content.py"
Cohesion: 0.11
Nodes (24): add_document_chunks(), create_assignment(), create_document(), get_job_status(), list_questions(), update_question(), Chunk, Document (+16 more)

### Community 47 - "LearnBridge — Architecture"
Cohesion: 0.10
Nodes (18): 10. Configuration, 11. Observability (lightweight), 12. Repo Layout, 13. Architecture Decisions, 1. Two senses of "3-tier", 2. System Context, 4.1 PDF → Questions, 4.2 Adaptive Practice Session (+10 more)

### Community 48 - "LearnBridge — Product Requirements Document (PRD)"
Cohesion: 0.10
Nodes (19): 10. Risks and Mitigations, 11. Dependencies and Assumptions, 12. Open Questions, 1. Overview, 2. Problem Statement, 3. Goals and Non-Goals, 4. Users and Roles (3-level hierarchy), 5. User Stories (+11 more)

### Community 56 - "validate_generated_questions"
Cohesion: 0.12
Nodes (9): validate_generated_questions(), test_gen_01_valid_json_parsed(), test_gen_03_invalid_correct_index_rejected(), test_gen_04_duplicates_deduplicated(), get_nested_keys(), test_lng_01_no_missing_locale_keys(), test_lng_02_telugu_hindi_characters_render(), test_lng_03_concept_id_pairs_in_sample_questions() (+1 more)

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
Cohesion: 0.14
Nodes (9): band_difficulty(), select_target_skill(), update_mastery(), test_adp_01_correct_answer_raises_mastery(), test_adp_02_wrong_answer_lowers_mastery(), test_adp_03_harder_item_moves_mastery_more(), test_adp_04_05_06_banding_difficulty(), test_adp_07_lowest_mastery_skill_chosen() (+1 more)

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

### Community 119 - "select_next_question"
Cohesion: 0.20
Nodes (5): 3. Components, select_next_question(), test_adp_08_recency_exclusion(), test_adp_09_adjacent_difficulty_fallback(), test_adp_10_three_consecutive_wrong_remedial()

### Community 120 - "calculate_streak"
Cohesion: 0.22
Nodes (4): calculate_streak(), test_rwd_02_consecutive_days_streak(), test_rwd_03_missed_day_with_freeze(), test_rwd_04_missed_day_without_freeze_resets()

### Community 121 - "devDependencies"
Cohesion: 0.22
Nodes (9): devDependencies, autoprefixer, postcss, tailwindcss, @types/canvas-confetti, @types/node, @types/react, @types/react-dom (+1 more)

### Community 129 - "asyncio"
Cohesion: 0.22
Nodes (4): test_rep_01_03_class_accuracy_and_heatmap(), test_rep_02_teacher_sees_only_own_classes(), test_rep_05_csv_export_count(), test_rep_06_admin_school_report_covers_all_classes()

### Community 131 - "api/practice.py"
Cohesion: 0.29
Nodes (11): start_practice_session(), submit_answer(), AnswerResponse, AnswerSubmission, AvatarUpdate, PracticeSessionStart, QuestionItemResponse, SessionStartResponse (+3 more)

### Community 132 - "Question Generation Prompt Specification"
Cohesion: 0.29
Nodes (6): Inputs, Mandatory Constraints, Question Generation Prompt Specification, Required JSON Schema, System Role, Task

### Community 136 - "rewards.py"
Cohesion: 0.20
Nodes (4): calculate_level(), evaluate_badges(), test_rwd_05_badges_awarded_once(), test_rwd_08_level_increases_with_xp()

### Community 137 - "calculate_attempt_xp"
Cohesion: 0.33
Nodes (3): calculate_attempt_xp(), test_rwd_01_session_completed_zero_correct_earns_xp(), test_rwd_06_anti_gaming_under_1_5s()

### Community 143 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, build, dev, lint, start

## Knowledge Gaps
- **10 isolated node(s):** `react-dom`, `clsx`, `tailwind-merge`, `@types/node`, `@types/react` (+5 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 252 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `band_difficulty()` connect `test_adaptive_rewards.py` to `LearnBridge — Implementation & Progress Tracker (`TRACK.md`)`, `api/practice.py`?**
  _High betweenness centrality (0.306) - this node is a cross-community bridge._
- **What connects `react-dom`, `clsx`, `tailwind-merge` to the rest of the system?**
  _10 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `useTranslation` be split into smaller, more focused modules?**
  _Cohesion score 0.10422910422910422 - nodes in this community are weakly interconnected._
- **Why does `📝 Activity Log & Milestone Progress` connect `LearnBridge — Implementation & Progress Tracker (`TRACK.md`)` to `test_adaptive_rewards.py`?**
  _High betweenness centrality (0.303) - this node is a cross-community bridge._
- **Should `LearnBridge — Implementation & Progress Tracker (`TRACK.md`)` be split into smaller, more focused modules?**
  _Cohesion score 0.09686609686609686 - nodes in this community are weakly interconnected._
- **Why does `TTSService` connect `LearnBridge — Implementation & Progress Tracker (`TRACK.md`)` to `useTranslation`?**
  _High betweenness centrality (0.265) - this node is a cross-community bridge._
- **Should `__init__.py` be split into smaller, more focused modules?**
  _Cohesion score 0.10530612244897959 - nodes in this community are weakly interconnected._