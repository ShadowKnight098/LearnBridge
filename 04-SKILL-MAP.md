# LearnBridge — Skill Map (Grades 3–5) and Team Skills

Skills are the unit the adaptive engine tracks. Each skill has an ID, a grade band, prerequisites and a difficulty ladder (1 easy, 2 medium, 3 hard). IDs are stable; questions are tagged with them.

> This is a starter map aligned in spirit with NIPUN Bharat foundational literacy/numeracy goals. Validate and adjust it with a practising teacher or the official learning outcomes before a real pilot.

## Part A — Learner Skill Map

### Numeracy
| ID | Skill | Grade | Prerequisites | L1 (easy) | L2 (medium) | L3 (hard) |
|---|---|---|---|---|---|---|
| NUM-01 | Number sense to 100 | 3 | — | Count objects to 20 | Compare/order numbers to 100 | Place value (tens/ones) |
| NUM-02 | Addition | 3 | NUM-01 | 1-digit + 1-digit | 2-digit, no carry | 2-digit with carry |
| NUM-03 | Subtraction | 3 | NUM-01 | 1-digit | 2-digit, no borrow | 2-digit with borrow |
| NUM-04 | Multiplication tables | 3–4 | NUM-02 | Tables 2, 5, 10 | Tables 3, 4, 6 | Tables 7, 8, 9 |
| NUM-05 | Division basics | 4 | NUM-04 | Equal sharing | Division facts | Division with remainder |
| NUM-06 | Fractions | 4–5 | NUM-05 | Identify ½, ¼ | Compare simple fractions | Add like-denominator fractions |
| NUM-07 | Measurement (length, weight, time) | 3–4 | NUM-01 | Read a clock (hour) | Units conversion (cm/m) | Time duration problems |
| NUM-08 | Money | 3–4 | NUM-02 | Identify coins/notes | Make a total | Change calculation |
| NUM-09 | Word problems | 3–5 | NUM-02, NUM-03 | 1-step | 2-step | Multi-step with mixed ops |
| NUM-10 | Shapes and patterns | 3–4 | — | Name shapes | Complete patterns | Symmetry/perimeter |

### Literacy (per language: Telugu, Hindi, English)
| ID | Skill | Grade | Prerequisites | L1 (easy) | L2 (medium) | L3 (hard) |
|---|---|---|---|---|---|---|
| LIT-01 | Letter/akshara recognition | 3 | — | Identify vowels | Identify consonants | Letter–sound mapping |
| LIT-02 | Vowel signs (matras / guninthalu) | 3 | LIT-01 | Single sign | Words with signs | Confusable signs |
| LIT-03 | Word reading and vocabulary | 3–4 | LIT-02 | Picture–word match | Synonyms/antonyms | Words in context |
| LIT-04 | Sentence construction | 3–4 | LIT-03 | Arrange 3 words | Complete a sentence | Correct a sentence |
| LIT-05 | Reading comprehension (literal) | 3–5 | LIT-03 | 2-line passage, factual Q | 5-line passage | Short story, sequencing |
| LIT-06 | Reading comprehension (inferential) | 4–5 | LIT-05 | Simple "why" | Cause–effect | Main idea / moral |
| LIT-07 | Grammar basics | 4–5 | LIT-04 | Nouns/verbs | Tense, singular/plural | Mixed usage |
| LIT-08 | Fluency (read aloud, v2) | 3–5 | LIT-03 | Word list | Sentence | Passage |

### Language Confidence (cross-cutting)
| ID | Skill | Measured by |
|---|---|---|
| LANG-01 | Home-language comfort | Accuracy and time on L1 literacy items in home language |
| LANG-02 | Second-language bridging | Accuracy on paired `concept_id` items across languages |
| LANG-03 | Instruction-language comprehension | Accuracy on instructions-only items in the language of instruction |

A large gap between LANG-01 and LANG-03 tells the teacher that a student knows the concept but struggles with the language of instruction.

### Mastery Interpretation
| Mastery | Label | Stars | Action |
|---|---|---|---|
| < 0.40 | Needs support | 0–1 | Easier items, explanations, teacher alert if persistent |
| 0.40–0.69 | Developing | 2 | Mixed practice |
| ≥ 0.70 | Secure | 3 | Move to the next skill / harder items |

### Question Tagging Convention
`skill_id` (e.g., NUM-02), `difficulty` (1–3), `grade`, `language`, `concept_id` (shared across translations), `type` (mcq / tf / fill).

### Prerequisite Graph (excerpt)
```
NUM-01 ─► NUM-02 ─► NUM-04 ─► NUM-05 ─► NUM-06
   └────► NUM-03 ─┐
NUM-02 + NUM-03 ──┴► NUM-09
LIT-01 ─► LIT-02 ─► LIT-03 ─► LIT-04 ─► LIT-07
                       └────► LIT-05 ─► LIT-06
```
If a student scores low on a skill, the engine checks its prerequisites and may route to the weakest prerequisite first.

---

## Part B — Team Skills Needed
| Area | Skills | Roles |
|---|---|---|
| Frontend | React/Next.js, TypeScript, Tailwind, Framer Motion, i18n, PWA basics | Student UI, dashboards |
| Backend | Python, FastAPI, SQLAlchemy, JWT/RBAC, REST design | API, auth |
| Data | PostgreSQL, schema design, SQL aggregation | Reports, mastery |
| AI/Content | Prompt design, JSON validation, PDF text extraction, OCR (Tesseract) | PDF → questions |
| Algorithms | Adaptive learning (rule-based → BKT/Elo), basic statistics | Adaptive engine |
| Design | Child-friendly UI, illustration, mascot, accessibility | UX |
| Language/Education | Native Telugu/Hindi reviewers, a teacher advisor | Content quality |
| DevOps | Docker, free-tier deployment, CI | Delivery |
| QA | pytest, Playwright, RBAC/security testing | Test cases |

### Suggested split for 4 people
| Person | Focus |
|---|---|
| A | Backend core, DB, auth/RBAC |
| B | Adaptive engine, rewards, unit tests |
| C | Student UI, animations, i18n, audio |
| D | Teacher/admin dashboards, PDF pipeline, content |
