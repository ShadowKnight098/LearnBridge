# Graph Report - LearnBridge  (2026-10-23)

## Corpus Check
- 92 files · ~66,347 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 10 file(s) not represented in the graph (top: (none) 6, .example 1, .pptx 1)

## Summary
- 703 nodes · 1738 edges · 40 communities (34 shown, 6 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 53 edges (avg confidence: 0.94)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `62173ce0`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- test_adaptive_rewards.py
- security.py
- api/auth.py
- LearnBridge — Implementation & Progress Tracker (`TRACK.md`)
- TTSService
- config.py
- api/content.py
- student.py
- adaptive.py
- dependencies.py
- 📽️ Detailed Slide-by-Slide Blueprint
- test_content_generation.py
- api/practice.py
- typing
- dependencies
- calculate_streak
- asyncio
- calculate_attempt_xp
- scripts
- @playwright/test
- tailwind.config.ts
- admin.py
- __init__.py
- useTranslation
- LearnBridge — Architecture
- LearnBridge — Product Requirements Document (PRD)
- LearnBridge — UX / UI Design Specification
- compilerOptions
- main.py
- package.json
- Part A — Learner Skill Map
- ocr.ts
- LearnBridge — Test Plan and Test Cases
- main.py
- Question Generation Prompt Specification
- devDependencies
- Settings
- next.config.mjs
- CLAUDE.md

## God Nodes (most connected - your core abstractions)
1. `User` - 52 edges
2. `useTranslation()` - 43 edges
3. `Base` - 27 edges
4. `react` - 26 edges
5. `hash_password()` - 25 edges
6. `PortalHeader()` - 25 edges
7. `create_access_token()` - 23 edges
8. `lucide-react` - 23 edges
9. `submit_answer()` - 22 edges
10. `Class` - 22 edges

## Surprising Connections (you probably didn't know these)
- `📝 Activity Log & Milestone Progress` --references--> `TTSService`  [INFERRED]
  TRACK.md → frontend/lib/tts.ts
- `7. Security Design` --references--> `require_role()`  [INFERRED]
  02-ARCHITECTURE.md → backend/app/core/dependencies.py
- `3. Components` --references--> `update_mastery()`  [INFERRED]
  02-ARCHITECTURE.md → backend/app/services/adaptive.py
- `📝 Activity Log & Milestone Progress` --references--> `band_difficulty()`  [INFERRED]
  TRACK.md → backend/app/services/adaptive.py
- `3. Components` --references--> `select_next_question()`  [INFERRED]
  02-ARCHITECTURE.md → backend/app/services/adaptive.py

## Import Cycles
- None detected.

## Communities (40 total, 6 thin omitted)

### Community 0 - "test_adaptive_rewards.py"
Cohesion: 0.13
Nodes (10): 3. Components, select_next_question(), update_mastery(), test_adp_01_correct_answer_raises_mastery(), test_adp_02_wrong_answer_lowers_mastery(), test_adp_03_harder_item_moves_mastery_more(), test_adp_08_recency_exclusion(), test_adp_09_adjacent_difficulty_fallback() (+2 more)

### Community 1 - "security.py"
Cohesion: 0.16
Nodes (7): Mastery, UserRole, call_llm(), e2e_client(), bench_client(), test_nfr_02_frontend_bundle_weight(), test_complete_practice_session_flow()

### Community 2 - "api/auth.py"
Cohesion: 0.17
Nodes (14): get_me(), login(), refresh_token(), student_login(), get_current_user(), create_refresh_token(), decode_token(), verify_password() (+6 more)

### Community 3 - "LearnBridge — Implementation & Progress Tracker (`TRACK.md`)"
Cohesion: 0.12
Nodes (14): metadata, RootLayout(), I18nProvider(), LearnBridge — Implementation & Progress Tracker (`TRACK.md`), Phase 0: Project Setup & Groundwork, Phase 1: Database Setup & Seed Execution, Phase 2: Backend Core, Auth & RBAC Security, Phase 3: Adaptive Learning & Rewards Engines (+6 more)

### Community 4 - "TTSService"
Cohesion: 0.26
Nodes (5): AudioButtonProps, LANG_MAP, TTSLanguage, TTSService, useSpeech()

### Community 5 - "config.py"
Cohesion: 0.17
Nodes (5): get_nested_keys(), test_lng_01_no_missing_locale_keys(), test_lng_02_telugu_hindi_characters_render(), test_lng_03_concept_id_pairs_in_sample_questions(), test_lng_04_audio_tts_language_mapping()

### Community 6 - "api/content.py"
Cohesion: 0.14
Nodes (16): add_document_chunks(), create_assignment(), create_document(), get_job_status(), list_questions(), update_question(), AssignmentCreate, AssignmentResponse (+8 more)

### Community 7 - "student.py"
Cohesion: 0.26
Nodes (6): get_shop_items(), get_student_progress(), get_student_rewards(), update_avatar(), get_db(), AvatarUpdate

### Community 8 - "adaptive.py"
Cohesion: 0.18
Nodes (5): band_difficulty(), select_target_skill(), test_adp_04_05_06_banding_difficulty(), test_adp_07_lowest_mastery_skill_chosen(), 📝 Activity Log & Milestone Progress

### Community 9 - "dependencies.py"
Cohesion: 0.19
Nodes (6): hash_password(), main(), sql_json(), reset_database(), main(), seed_students()

### Community 10 - "📽️ Detailed Slide-by-Slide Blueprint"
Cohesion: 0.11
Nodes (17): 💡 Anticipated Q&A (Evaluator Cheat Sheet), 📽️ Detailed Slide-by-Slide Blueprint, 📌 Executive Summary (Elevator Pitch), LearnBridge — Presentation Deck Summary & Slide Guide, 🎨 Recommended Presentation Design Language, Slide 10: Alignment with National Policy (NEP 2020 & NIPUN Bharat), Slide 11: Roadmap & Future Horizons, Slide 12: Conclusion & Q&A (+9 more)

### Community 11 - "test_content_generation.py"
Cohesion: 0.12
Nodes (11): build_generation_prompt(), generate_deterministic_fallback_questions(), process_document_generation(), validate_generated_questions(), test_document_and_review_workflow(), test_gen_01_valid_json_parsed(), test_gen_02_malformed_json_rejected(), test_gen_03_invalid_correct_index_rejected() (+3 more)

### Community 12 - "api/practice.py"
Cohesion: 0.18
Nodes (15): complete_practice_session(), ensure_starter_content(), get_question_in_language(), start_practice_session(), submit_answer(), AnswerResponse, AnswerSubmission, BadgeInfo (+7 more)

### Community 13 - "typing"
Cohesion: 0.18
Nodes (4): calculate_level(), evaluate_badges(), test_rwd_05_badges_awarded_once(), test_rwd_08_level_increases_with_xp()

### Community 14 - "dependencies"
Cohesion: 0.20
Nodes (10): dependencies, canvas-confetti, clsx, lucide-react, next, pdfjs-dist, react, react-dom (+2 more)

### Community 15 - "calculate_streak"
Cohesion: 0.22
Nodes (4): calculate_streak(), test_rwd_02_consecutive_days_streak(), test_rwd_03_missed_day_with_freeze(), test_rwd_04_missed_day_without_freeze_resets()

### Community 16 - "asyncio"
Cohesion: 0.22
Nodes (4): test_rep_01_03_class_accuracy_and_heatmap(), test_rep_02_teacher_sees_only_own_classes(), test_rep_05_csv_export_count(), test_rep_06_admin_school_report_covers_all_classes()

### Community 17 - "calculate_attempt_xp"
Cohesion: 0.33
Nodes (3): calculate_attempt_xp(), test_rwd_01_session_completed_zero_correct_earns_xp(), test_rwd_06_anti_gaming_under_1_5s()

### Community 18 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, build, dev, lint, start

### Community 21 - "admin.py"
Cohesion: 0.09
Nodes (34): create_class(), create_teacher(), list_classes(), list_teachers(), update_teacher(), export_class_csv(), get_class_report(), get_school_report() (+26 more)

### Community 32 - "__init__.py"
Cohesion: 0.14
Nodes (30): buy_shop_item(), Base, Alert, AlertKind, Assignment, Attempt, Badge, Challenge (+22 more)

### Community 39 - "useTranslation"
Cohesion: 0.11
Nodes (46): AdminClassesPage(), AdminDashboardPage(), AdminReportsPage(), AdminTeachersPage(), StaffLoginPage(), SplashPage(), BadgesShelfPage(), StudentHomePage() (+38 more)

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

### Community 70 - "main.py"
Cohesion: 0.14
Nodes (5): text_to_speech(), add_security_headers(), global_exception_handler(), health_check(), root()

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

### Community 118 - "main.py"
Cohesion: 0.07
Nodes (20): create_access_token(), client(), teacher_auth(), test_e2e_complete_six_scenarios(), test_nfr_01_next_question_turnaround_latency(), client(), student_auth(), client() (+12 more)

### Community 132 - "Question Generation Prompt Specification"
Cohesion: 0.29
Nodes (6): Inputs, Mandatory Constraints, Question Generation Prompt Specification, Required JSON Schema, System Role, Task

### Community 135 - "devDependencies"
Cohesion: 0.20
Nodes (10): devDependencies, autoprefixer, @playwright/test, postcss, tailwindcss, @types/canvas-confetti, @types/node, @types/react (+2 more)

## Knowledge Gaps
- **10 isolated node(s):** `clsx`, `react-dom`, `tailwind-merge`, `@types/canvas-confetti`, `@types/node` (+5 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 279 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `band_difficulty()` connect `adaptive.py` to `test_adaptive_rewards.py`, `api/practice.py`?**
  _High betweenness centrality (0.290) - this node is a cross-community bridge._
- **What connects `clsx`, `react-dom`, `tailwind-merge` to the rest of the system?**
  _10 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `test_adaptive_rewards.py` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._
- **Why does `📝 Activity Log & Milestone Progress` connect `adaptive.py` to `LearnBridge — Implementation & Progress Tracker (`TRACK.md`)`, `TTSService`?**
  _High betweenness centrality (0.286) - this node is a cross-community bridge._
- **Should `LearnBridge — Implementation & Progress Tracker (`TRACK.md`)` be split into smaller, more focused modules?**
  _Cohesion score 0.125 - nodes in this community are weakly interconnected._
- **Why does `TTSService` connect `TTSService` to `adaptive.py`?**
  _High betweenness centrality (0.252) - this node is a cross-community bridge._
- **Should `api/content.py` be split into smaller, more focused modules?**
  _Cohesion score 0.1350806451612903 - nodes in this community are weakly interconnected._