# LearnBridge — Test Plan and Test Cases

Problem statement requires test cases. Run unit tests with `pytest`, E2E with Playwright.

## 1. RBAC / Security
| ID | Test | Expected |
|---|---|---|
| SEC-01 | Teacher A requests Teacher B's student | 403 |
| SEC-02 | Teacher A requests Teacher B's document/questions | 403 |
| SEC-03 | Student calls any `/teacher/*` or `/admin/*` route | 403 |
| SEC-04 | Teacher calls `/admin/teachers` | 403 |
| SEC-05 | Unauthenticated request to protected route | 401 |
| SEC-06 | Expired JWT | 401; refresh works |
| SEC-07 | Deactivated user logs in | Rejected |
| SEC-08 | Login brute force | Rate-limited |
| SEC-09 | Student A reads Student B's progress/rewards | 403 |

## 2. Content and Generation
| ID | Test | Expected |
|---|---|---|
| GEN-01 | LLM returns valid JSON | Saved as `draft` |
| GEN-02 | Malformed JSON | Rejected; retried up to 2 times; job logs error |
| GEN-03 | Correct answer not among options | Rejected |
| GEN-04 | Duplicate questions in a chunk | De-duplicated |
| GEN-05 | Output language ≠ requested language | Rejected |
| GEN-06 | Draft question requested by a student via practice API | Never served |
| GEN-07 | Teacher approves a question | Becomes servable |
| GEN-08 | LLM unavailable | Job fails gracefully; student flow unaffected |
| GEN-09 | Scanned PDF page with no text layer | Routed to OCR |
| GEN-10 | Student identifiers present in prompt | None (assert on prompt builder) |

## 3. Adaptive Engine (pure unit tests)
| ID | Test | Expected |
|---|---|---|
| ADP-01 | Correct answer | Mastery increases, ≤ 1 |
| ADP-02 | Wrong answer | Mastery decreases, ≥ 0 |
| ADP-03 | Harder item moves mastery more than easier item | True |
| ADP-04 | m = 0.2 | Difficulty 1 selected |
| ADP-05 | m = 0.5 | Difficulty 2 selected |
| ADP-06 | m = 0.8 | Difficulty 3 selected |
| ADP-07 | Lowest-mastery skill chosen | True |
| ADP-08 | Question seen < 7 days ago | Not repeated |
| ADP-09 | No candidates at target difficulty | Falls back to adjacent difficulty |
| ADP-10 | 3 consecutive wrong | Easier item + explanation |
| ADP-11 | Language switch mid-session | Same skill/concept in new language |
| ADP-12 | Teacher assignment active | Only assigned pool used |
| ADP-13 | Weak / average / strong simulated students | Divergent difficulty paths after 10 questions |

## 4. Rewards
| ID | Test | Expected |
|---|---|---|
| RWD-01 | Session completed with 0 correct | XP > 0 |
| RWD-02 | Consecutive days | Streak +1 |
| RWD-03 | Missed one day with freeze | Streak kept; freeze consumed |
| RWD-04 | Missed day without freeze | Streak resets to 1 |
| RWD-05 | Badge earned twice | Awarded once |
| RWD-06 | Answer under 1.5 s | 0 XP, attempt flagged |
| RWD-07 | Buy item with insufficient coins | Rejected; coins ≥ 0 |
| RWD-08 | XP crosses threshold | Level increases |
| RWD-09 | Daily cap reached | New session blocked with friendly message |
| RWD-10 | Reward transaction fails midway | No partial awards |

## 5. Reports
| ID | Test | Expected |
|---|---|---|
| REP-01 | Class accuracy equals raw attempts aggregate | Match |
| REP-02 | Teacher sees only own classes | True |
| REP-03 | Heatmap cell equals student's mastery | Match |
| REP-04 | Most-missed questions sorted correctly | True |
| REP-05 | CSV export row count equals students | Match |
| REP-06 | Admin comparison covers all classes | True |

## 6. Multilingual
| ID | Test | Expected |
|---|---|---|
| LNG-01 | UI in te/hi/en | No missing keys (CI check on locale files) |
| LNG-02 | Telugu/Hindi text renders | No tofu boxes |
| LNG-03 | `concept_id` pairs | Exist for every sample question |
| LNG-04 | Audio read-aloud available | Works or degrades gracefully with a message |

## 7. E2E Demo Scenarios (Playwright)
1. Admin creates teacher and class → teacher logs in.
2. Teacher adds 3 students (weak / average / strong).
3. Teacher uploads sample PDF → drafts appear → approves 5.
4. Each student completes a session; question paths differ.
5. Class report shows weak skills; teacher receives an alert for the weak student.
6. Student earns XP, streak and a badge; buys an avatar item.

## 8. Non-Functional
| ID | Test | Target |
|---|---|---|
| NFR-01 | Next-question latency | p95 < 300 ms locally |
| NFR-02 | Initial page weight (student) | < 1.5 MB |
| NFR-03 | Lighthouse accessibility | ≥ 90 |
| NFR-04 | Low-end device (throttled CPU) | Usable |
