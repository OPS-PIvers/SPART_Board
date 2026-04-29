# Test Coverage Gaps — Scheduled Task Journal

_Audit model: claude-sonnet-4-6_
_Action model: claude-opus-4-6_
_Audit cadence: weekly — Monday_
_Last audited: 2026-04-29_
_Last action: 2026-04-27_

---

## In Progress

_Nothing currently in progress._

---

## Open

### HIGH hooks/ coverage — session hooks still missing tests (partial progress)

- **Detected:** 2026-04-13
- **Progress (2026-04-27):** Added test coverage for `useQuizSessionTeacher` (16 tests). Covers `removeStudent` (deleteDoc-by-responseKey path + null-sessionId no-op), `revealAnswer` (dotted-path updateDoc), `hideAnswer` (deleteField sentinel at dotted path), `endQuizSession` (status='ended' + endedAt + autoProgressAt-null patch, finalizeAllResponses sweep that touches only joined/in-progress responses and skips already-completed ones, no batch.commit when nothing needs finalizing, null-sessionId no-op), and `advanceQuestion` (no-op before session loads, review-phase gate when `showPodiumBetweenQuestions` is enabled, student-paced mode skipping review, advance-to-next-index path, `startedAt` set on first advance and preserved on later ones, pass-through when already in `reviewing` phase, and the advance-past-end path that flips to 'ended' + clears `questionPhase` via `deleteField` + invokes `finalizeAllResponses`). Test count for this file is now 40 (24 prior + 16 new). The auto-progress effect is the remaining untested teacher-side path; deferred because driving it requires a real-time mock of the responses subcollection callback in tandem with the session state.
- **Progress (2026-04-22):** Added test coverage for `useQuizSession.ts` (24 tests). Covers pure helpers (`normalizeAnswer`, `gradeAnswer` across MC/FIB/Matching/Ordering, `toPublicQuestion` including `correctAnswer` strip-off for each question type) and `useQuizSessionStudent` student-join logic (`lookupSession` empty/no-match/all-ended/joinable-picker paths; `joinQuizSession` invalid-code/empty-PIN/no-session/all-ended throws, most-recent-joinable selection, PIN truncation to 10 chars, code normalization, and `classPeriod` backfill on existing responses).
- **Progress (2026-04-20):** Added initial test coverage for `useLiveSession.ts` (9 tests covering `joinSession` input validation and sanitization — code normalization, PIN truncation, duplicate-PIN rejection, self-rejoin allowance, and all error paths). Also confirmed pre-existing coverage for `useGuidedLearningSession.ts` (pure-helper test) and `useGoogleDrive.ts` / `useStorage.ts` (full test files in `tests/hooks/`). Remaining critical hooks with zero coverage:
  - `useQuizSession.ts` — teacher-side action tests landed 2026-04-27 (advance/end/reveal/remove). Auto-progress effect (responses-listener-driven) still untested.
  - `useVideoActivity.ts` / `useVideoActivitySession.ts` — video activity session management
  - `useMiniAppSession.ts` — mini-app assignment session lifecycle
  - `useRosters.ts` — roster CRUD, student list management
  - `useImageUpload.ts` — image upload handling with Firebase Storage
  - `useFirestore.ts` — core Firestore CRUD for dashboards
  - `useStarterPacks.ts` — starter pack template management
  - `useScreenRecord.ts` — screen recording lifecycle
  - `useLiveSession.ts` — needs deeper coverage (teacher actions: `startSession`, `updateSessionConfig`, `endSession`, `toggleFreezeStudent`, `toggleGlobalFreeze`)
- **File:** hooks/ directory
- **Fix:** Next priority: cover `useQuizSession`'s auto-progress effect (drive both `onSnapshot` callbacks so the responses-listener-driven advance fires), then expand `useLiveSession` to cover teacher-mode actions (`startSession`, `updateSessionConfig`, `endSession`, `toggleFreezeStudent`, `toggleGlobalFreeze`). Use Vitest with mock Firebase adapters. See `tests/hooks/useLiveSession.test.ts` and the `useQuizSessionTeacher` block in `tests/hooks/useQuizSession.test.ts` as reference patterns.

### MEDIUM utils/ coverage — 20 of 45 utility files have no tests

- **Detected:** 2026-04-13
- **Progress (2026-04-29):** Count improved from 28 untested/41 files (2026-04-22) to 20 untested/45 files. Since last audit, `googleDriveService.ts`, `quizDriveService.ts`, `security.ts`, `widgetHelpers.ts`, and `urlHelpers.ts` gained test files. 4 new util files were added since last audit (`plc.ts`, `testClassAccess.ts`, `widgetDragFlag.ts`, `styles.ts`, `first5.ts`, `periodCompat.ts`) and currently have no tests. Still untested:
  - `backgrounds.ts` — background format detection and CSS generation (pure)
  - `slug.ts` — URL slug generation (pure, easy to test)
  - `googleCalendarService.ts` — Google Calendar API integration
  - `guidedLearningDriveService.ts` — guided learning material sync from Drive
  - `imageProcessing.ts` — image manipulation (resize, crop, compress)
  - `pexelsService.ts` — Pexels stock image API integration
  - `quizAudio.ts` — quiz audio generation utilities
  - `soundboardConfig.ts` — sound configuration parser
  - `plc.ts` — PLC (Professional Learning Community) utilities (new)
  - `testClassAccess.ts` — test class access controls (new)
  - `widgetDragFlag.ts` — widget drag state (new)
  - `styles.ts` — style utilities (new)
  - `first5.ts` — First5 widget utilities (new)
  - `periodCompat.ts` — period compatibility utilities (new)
- **File:** utils/ directory
- **Fix:** Next priority is `backgrounds.ts` and `slug.ts` (pure, no deps). Then `plc.ts` and `testClassAccess.ts` (new business logic, high value). Use vi.mock() for service wrappers.

### LOW widget test coverage — significant improvement, ~26 widgets remain untested

- **Detected:** 2026-04-13
- **Progress (2026-04-29):** Test file count has grown dramatically to 61 widget test files (was 7 on 2026-04-22). New coverage includes ActivityWall, Breathing, Catalyst, Checklist, Classes, ClockWidget, Countdown, DiceWidget, DrawingWidget, Embed, ExpectationsWidget, GraphicOrganizer, GuidedLearning, InstructionalRoutines, LunchCount, MaterialsWidget, MiniApp, NumberLine, PdfWidget, PollWidget, QRWidget, RecessGear, Schedule, Scoreboard, SeatingChart, SmartNotebook, SoundWidget, SoundboardWidget, TalkingTool, TextWidget, TimeTool, TrafficLightWidget, UrlWidget, VideoActivityWidget, Weather, and math-tools/random/stickers sub-components. Approximately 26 widgets still have no component-level test file.
- **File:** components/widgets/ directory
- **Detail:** Widgets with no test coverage include: BloomsTaxonomy, Calendar, CarRiderPro, ConceptWeb, CustomWidget (main), First5, HotspotImage, MathToolInstance, MusicWidget, NeedDoPutThen, NextUp, Onboarding, RevealGrid, SpecialistSchedule, StarterPack, SyntaxFramer, WorkSymbols and several sub-components.
- **Fix:** Focus on RevealGrid (has significant CSS scaling debt), NeedDoPutThen, WorkSymbols, and ConceptWeb. These widgets have config logic worth regression-testing. Use React Testing Library with Vitest. Mock useDashboard() and useAuth() hooks.

---

## Completed

_No completed items yet._
