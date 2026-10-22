# LearnBridge — UX / UI Design Specification

## 1. Design Principles
1. **Child-first:** big, bright, friendly, one task per screen.
2. **Low-literacy friendly:** icons + audio on every text element.
3. **Effort over perfection:** feedback is encouraging; rewards follow effort and improvement.
4. **Low-end ready:** light assets, system fonts fallback, minimal animation weight.
5. **Language equality:** every screen works identically in te / hi / en.
6. **Teachers: clarity over decoration:** dense but scannable dashboards.

## 2. Design Tokens
| Token | Student app | Teacher/Admin app |
|---|---|---|
| Primary | `#6C4DF6` (purple) | `#2F5BEA` (blue) |
| Success | `#2BB673` | `#1F9D61` |
| Warning/XP | `#FFB020` | `#E69A00` |
| Error (soft) | `#FF6B6B` (never harsh red) | `#D64545` |
| Background | `#F6F3FF` | `#F7F8FA` |
| Text | `#1E1B3A` | `#1A1F2B` |
| Radius | 20 px buttons, 24 px cards | 8 px |
| Touch target | ≥ 56 px | ≥ 40 px |
| Font | Noto Sans / Noto Sans Telugu / Noto Sans Devanagari (rounded headings optional) | same |
| Base size | 20 px (student), 16 px (teacher) | |

Contrast: meet WCAG AA at minimum. Never rely on colour alone (pair with icon/text).

## 3. Mascot
A friendly animal guide (e.g., an owl or elephant named in each language). States: greeting, thinking, cheering, encouraging (wrong answer), celebrating (level-up), sleepy (daily cap). Speech bubbles use the student's language and have an audio button.

## 4. Student App — Screen Inventory
| # | Screen | Key elements |
|---|---|---|
| S1 | Splash / language pick | 3 big language cards (తెలుగు, हिन्दी, English) |
| S2 | Login | Class code + picture/PIN login; avatar-based for young children |
| S3 | Home | Avatar, level + XP bar, 🔥 streak, big **Start** button, skill path, badge shelf, language toggle |
| S4 | Diagnostic intro | Mascot: "Let's see what you know!" (no pass/fail framing) |
| S5 | Question | Progress bar, 🔊 read-aloud, question, 2–4 large answer buttons, mascot corner |
| S6 | Feedback | Correct: confetti + "+5 XP". Wrong: gentle shake, "Almost! Let's look again", explanation, Next |
| S7 | Session complete | Stars, XP earned, streak update, mystery chest, new badges |
| S8 | Skill path | Journey map; each skill node shows 0–3 stars |
| S9 | Badges | Grid; locked ones show progress ("2/5") |
| S10 | Avatar shop | Items with coin cost, preview, equip |
| S11 | Weekly challenge / class goal | Progress ring and shared class bar |
| S12 | Daily cap | Sleepy mascot: "Great work! See you tomorrow" |

### Question screen wireframe
```
┌──────────────────────────────┐
│ ←   ███████░░░░░░  4/10   🌐 │
│                              │
│  🦉  ┌────────────────────┐  │
│      │ 2 + 3 = ?       🔊 │  │
│      └────────────────────┘  │
│                              │
│   ┌────────┐   ┌────────┐    │
│   │   4    │   │   5    │    │
│   └────────┘   └────────┘    │
│   ┌────────┐   ┌────────┐    │
│   │   6    │   │   7    │    │
│   └────────┘   └────────┘    │
│                              │
│ ⭐ 35 XP            🔥 3 days │
└──────────────────────────────┘
```

### Student interaction rules
- One question per screen; answers confirmed on tap; no timers visible to the child.
- Wrong answers never use red full-screen flashes or the word "Wrong".
- Sounds default on with a visible mute toggle; respect `prefers-reduced-motion`.
- Session cap reached → friendly end screen (no dark patterns, no guilt messages).

## 5. Teacher App — Screen Inventory
| # | Screen | Key elements |
|---|---|---|
| T1 | Dashboard | Classes, at-risk students, recent activity, "Upload PDF" CTA |
| T2 | Class detail | Student table (level, streak, weak skill), add/import students |
| T3 | Student detail | Mastery bars, accuracy trend, recent attempts, award badge |
| T4 | Upload PDF | Drag-drop, grade/subject/language, progress for extraction + generation |
| T5 | Question review | Card per draft: question, options, correct answer, source snippet + page, difficulty, skill tag; **Approve / Edit / Reject / Regenerate**; bulk approve |
| T6 | Question bank | Filter by skill/difficulty/language/status; pair translations |
| T7 | Assignments | Choose set, target (class/group/student), due date |
| T8 | Class report | Heatmap (students × skills), most-missed questions, export |
| T9 | Alerts | Students falling behind or flagged for random clicking |

### Question review card wireframe
```
┌───────────────────────────────────────────────┐
│ Skill: Fractions   Difficulty: ●●○   te        │
│ Q: ½ + ½ = ?                                   │
│ ○ 1/4   ● 1   ○ 2   ○ 1/2        Answer: 1     │
│ Source: Chapter 4, p.12  "…two halves make…"   │
│ [✓ Approve] [✎ Edit] [↻ Regenerate] [✕ Reject] │
└───────────────────────────────────────────────┘
```

## 6. Admin App — Screen Inventory
| # | Screen | Key elements |
|---|---|---|
| A1 | Overview | School KPIs: active students, sessions/week, mastery change |
| A2 | Teachers | List, create, deactivate, reset password |
| A3 | Classes | Create, assign teacher, grade |
| A4 | School reports | Class/teacher comparison, participation, export |
| A5 | Settings | Languages, subjects, daily cap, reward config |

## 7. Heatmap Spec (Class Report)
Rows = students, columns = skills, cell colour by mastery (<0.4 red-orange, 0.4–0.7 amber, >0.7 green) plus the numeric value for accessibility. Click a cell to see the attempts behind it.

## 8. Rewards Visual Language
| Element | Visual |
|---|---|
| XP | ⭐ with animated count-up |
| Level | Circular badge with number; bar fills with spring animation |
| Streak | 🔥 with day count; grey when at risk, never shaming |
| Coins | 🪙 |
| Badge | Illustrated medal, name in student's language |
| Chest | Animated mystery box opening at session end |

### Badge catalogue (starter)
| Badge | Criteria |
|---|---|
| First Steps | Complete first session |
| On Fire | 3-day streak |
| Week Warrior | 7-day streak |
| Streak Master | 5 correct in a row |
| Comeback Kid | Raise a weak skill (<0.4) by ≥ 0.2 |
| Bilingual Star | Complete sessions in two languages |
| Math Wizard | Reach 0.8 mastery in 3 numeracy skills |
| Word Explorer | Reach 0.8 mastery in 3 literacy skills |
| Teacher's Choice | Awarded manually by the teacher |

## 9. Localisation Guidelines
- All UI strings in `locales/{en,hi,te}.json`; no hard-coded text.
- Allow ~30% text expansion; avoid fixed-width buttons.
- Use native numerals only if the pedagogy calls for it (configurable).
- Native-speaker review of mascot dialogue, feedback phrases and badge names.
- Audio: browser Web Speech API for demo; Bhashini TTS as an upgrade.

## 10. Accessibility Checklist
- [ ] Touch targets ≥ 48 px
- [ ] Text contrast AA
- [ ] Every question has audio
- [ ] Keyboard and screen-reader labels on teacher/admin apps
- [ ] Reduced-motion setting honoured
- [ ] No information conveyed by colour alone

## 11. Ethical Design Rules
No ads, no purchases, no guilt notifications, no public ranking of low scores, daily cap on, minimal child data, teacher visibility into engagement and suspicious answering.

## 12. Suggested Frontend Folder Structure
```
frontend/
├── app/(student)/{home,practice,rewards,shop,badges}
├── app/(teacher)/{classes,students,upload,review,bank,assignments,reports}
├── app/(admin)/{teachers,classes,reports,settings}
├── components/{ui,question,mascot,charts,rewards}
├── lib/{api,auth,i18n,tts,offline}
└── locales/{en,hi,te}.json
```
