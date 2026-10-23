# Graph Report - LearnBridge  (2026-10-23)

## Corpus Check
- 93 files · ~64,201 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 11 file(s) not represented in the graph (top: (none) 6, .example 1, .pptx# 1)

## Summary
- 697 nodes · 1722 edges · 31 communities (25 shown, 6 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 53 edges (avg confidence: 0.94)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8f9b2fbb`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- useTranslation
- User
- api/auth.py
- LearnBridge — Implementation & Progress Tracker (`TRACK.md`)
- TTSService
- @playwright/test
- api/content.py
- api/practice.py
- 📽️ Detailed Slide-by-Slide Blueprint
- test_content_generation.py
- test_adaptive_rewards.py
- admin.py
- User
- LearnBridge — Architecture
- LearnBridge — Product Requirements Document (PRD)
- LearnBridge — UX / UI Design Specification
- compilerOptions
- package.json
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
6. `hash_password()` - 23 edges
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

## Communities (31 total, 6 thin omitted)

### Community 0 - "useTranslation"
Cohesion: 0.11
Nodes (46): AdminClassesPage(), AdminDashboardPage(), AdminReportsPage(), AdminTeachersPage(), StaffLoginPage(), SplashPage(), BadgesShelfPage(), StudentHomePage() (+38 more)

### Community 1 - "User"
Cohesion: 0.05
Nodes (56): buy_shop_item(), create_student(), create_teacher_class(), get_teacher_classes(), get_teacher_students(), import_students_csv(), TeacherClassCreate, Base (+48 more)

### Community 2 - "api/auth.py"
Cohesion: 0.16
Nodes (17): get_me(), login(), refresh_token(), student_login(), get_current_user(), create_access_token(), create_refresh_token(), decode_token() (+9 more)

### Community 3 - "LearnBridge — Implementation & Progress Tracker (`TRACK.md`)"
Cohesion: 0.12
Nodes (14): metadata, RootLayout(), I18nProvider(), LearnBridge — Implementation & Progress Tracker (`TRACK.md`), Phase 0: Project Setup & Groundwork, Phase 1: Database Setup & Seed Execution, Phase 2: Backend Core, Auth & RBAC Security, Phase 3: Adaptive Learning & Rewards Engines (+6 more)

### Community 4 - "TTSService"
Cohesion: 0.26
Nodes (5): AudioButtonProps, LANG_MAP, TTSLanguage, TTSService, useSpeech()

### Community 6 - "api/content.py"
Cohesion: 0.13
Nodes (17): add_document_chunks(), create_assignment(), create_document(), get_job_status(), list_questions(), update_question(), Chunk, AssignmentCreate (+9 more)

### Community 9 - "api/practice.py"
Cohesion: 0.07
Nodes (28): complete_practice_session(), ensure_starter_content(), get_question_in_language(), start_practice_session(), submit_answer(), get_shop_items(), get_student_progress(), get_student_rewards() (+20 more)

### Community 10 - "📽️ Detailed Slide-by-Slide Blueprint"
Cohesion: 0.11
Nodes (17): 💡 Anticipated Q&A (Evaluator Cheat Sheet), 📽️ Detailed Slide-by-Slide Blueprint, 📌 Executive Summary (Elevator Pitch), LearnBridge — Presentation Deck Summary & Slide Guide, 🎨 Recommended Presentation Design Language, Slide 10: Alignment with National Policy (NEP 2020 & NIPUN Bharat), Slide 11: Roadmap & Future Horizons, Slide 12: Conclusion & Q&A (+9 more)

### Community 11 - "test_content_generation.py"
Cohesion: 0.06
Nodes (23): text_to_speech(), Document, GenerationJob, build_generation_prompt(), call_llm(), generate_deterministic_fallback_questions(), process_document_generation(), validate_generated_questions() (+15 more)

### Community 12 - "test_adaptive_rewards.py"
Cohesion: 0.05
Nodes (25): 3. Components, band_difficulty(), select_next_question(), select_target_skill(), update_mastery(), calculate_level(), calculate_streak(), evaluate_badges() (+17 more)

### Community 21 - "admin.py"
Cohesion: 0.20
Nodes (13): create_class(), create_teacher(), list_classes(), list_teachers(), update_teacher(), ClassCreate, ClassResponse, StudentCreate (+5 more)

### Community 25 - "User"
Cohesion: 0.20
Nodes (13): export_class_csv(), get_class_report(), get_school_report(), get_student_report(), list_teacher_alerts(), resolve_alert(), verify_student_ownership(), AlertResponse (+5 more)

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

### Community 118 - "dependencies"
Cohesion: 0.20
Nodes (10): dependencies, canvas-confetti, clsx, lucide-react, next, pdfjs-dist, react, react-dom (+2 more)

### Community 121 - "devDependencies"
Cohesion: 0.20
Nodes (10): devDependencies, autoprefixer, @playwright/test, postcss, tailwindcss, @types/canvas-confetti, @types/node, @types/react (+2 more)

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
- **10 isolated node(s):** `clsx`, `react-dom`, `tailwind-merge`, `@types/canvas-confetti`, `@types/node` (+5 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 279 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `band_difficulty()` connect `test_adaptive_rewards.py` to `api/practice.py`?**
  _High betweenness centrality (0.290) - this node is a cross-community bridge._
- **What connects `clsx`, `react-dom`, `tailwind-merge` to the rest of the system?**
  _10 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `useTranslation` be split into smaller, more focused modules?**
  _Cohesion score 0.10912280701754386 - nodes in this community are weakly interconnected._
- **Why does `📝 Activity Log & Milestone Progress` connect `test_adaptive_rewards.py` to `LearnBridge — Implementation & Progress Tracker (`TRACK.md`)`, `TTSService`?**
  _High betweenness centrality (0.287) - this node is a cross-community bridge._
- **Should `User` be split into smaller, more focused modules?**
  _Cohesion score 0.05463544641157434 - nodes in this community are weakly interconnected._
- **Why does `TTSService` connect `TTSService` to `test_adaptive_rewards.py`?**
  _High betweenness centrality (0.252) - this node is a cross-community bridge._
- **Should `LearnBridge — Implementation & Progress Tracker (`TRACK.md`)` be split into smaller, more focused modules?**
  _Cohesion score 0.125 - nodes in this community are weakly interconnected._