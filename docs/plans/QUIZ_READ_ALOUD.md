# Quiz Read-Aloud (TTS) — Implementation Plan

**Date**: 2026-09-08 · **Branch**: `dev-paul` · **Status**: Draft for product-owner review — decisions in §2 were settled in a 16-question design interview on 2026-09-08; no code has been written. File paths and line numbers were verified against `dev-paul` at `76a98c372` on 2026-09-08; re-verify before relying on them.

Bring the accommodation that the Google Apps Script "Spartan Read Aloud" portal
(`OPS-PIvers/Spartan_Read_Aloud`) provides for paper assessments into SpartBoard's
native quizzes, so that students whose plans require assessments read aloud can
hear quiz questions, answer choices, and text inside stimuli without leaving the
quiz. The Apps Script portal stays in service for scanned/paper assessments.

---

## 1. Problem statement

- Some students' IEP/504 plans require all assessments read aloud. Today that is
  served by a separate Apps Script portal that OCRs uploaded PDFs/Docs, splits them
  into numbered chunks, synthesizes WAV audio with Google Cloud Text-to-Speech
  (`en-US-Standard-H`), stores it in Drive, and plays it with highlighting.
- SpartBoard quizzes are digital and structured, yet have **no** text-to-speech
  anywhere (`speechSynthesis`, `texttospeech`, `readAloud` have zero hits in the
  app, `functions/`, and `locales/`). `docs/rich-response-wayfinder.md` (RR-11)
  recorded this gap before per-student overrides existed.
- The plumbing an accommodation needs already exists:
  - **Per-student accommodations**: `StudentOverride` (`types.ts:4663`) carries
    extended time, question subsets, hidden options, rubric overrides, tab-warning
    thresholds and window shifts. It is delivered to the student only through the
    server-written pointer doc `/student_assignments/{studentUid}/items/{assignmentId}`
    (`StudentAssignmentPointer`, `types.ts:4680`), written solely by
    `setAssignmentTargetsV1` (`functions/src/studentAssignmentTargets.ts`) with
    field-level merge rules that prevent a partial payload from erasing a stored
    accommodation. Roster-level standing defaults live in
    `ClassRoster.defaultOverridesByStudentId` (`types.ts:195`). Teachers edit
    overrides in `components/common/library/OverrideEditorRow.tsx`.
  - **Answer-key-free student text**: `QuizPublicQuestion` (`types.ts` after
    `QuizBehaviorSettings`) is built by `toPublicQuestion`
    (`hooks/useQuizSession.ts:338`) and stored on `QuizSession.publicQuestions`
    (`types.ts:3649`). It has `text`, `choices`, `matchingLeft`/`matchingRight`,
    `orderingItems`.
  - **SSO student identity**: SSO students sign in with a custom token carrying the
    claims `studentRole: true`, `orgId`, `classIds` (validated client-side in
    `context/StudentAuthContext.tsx:96-121`, checked server-side as
    `request.auth.token.studentRole === true`, e.g. `functions/src/studentIdentity.ts:1225`).
    Anonymous code+PIN joiners have none of these.
  - **Vertex/Gemini callables** with ADC auth and per-user daily quota in
    `ai_usage/{uid}_{featureId}_{YYYY-MM-DD}` (`functions/src/aiGeneration.ts:443-479`);
    `generateWithAI` already has an `ocr` generation type (`aiGeneration.ts:805`).
  - **Storage precedent** for student-readable quiz audio:
    `quiz_response_media/{sessionId}/{responseKey}/{fileName}` (`storage.rules:259`).
- The student quiz app (`components/quiz/QuizStudentApp.tsx`, 4,828 lines) has no
  settings tray, language switcher, or font-size control; a read-aloud control is
  its first per-student UI affordance.

## 2. Decisions (locked 2026-09-08)

| #   | Decision        | Choice                                                                                                                                                                                                                                           |
| --- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Q1  | Scope           | Native quiz content **plus text inside stimuli**. The Apps Script portal remains for paper assessments; no document-upload port.                                                                                                                 |
| Q2  | Engine          | **Google Cloud Text-to-Speech** called from a Cloud Function; MP3 cached in Storage keyed by hash of text + voice. No browser `speechSynthesis`.                                                                                                 |
| Q3  | Who             | **Per-student override** (`StudentOverride.readAloud`) **plus** an assignment-level "Allow read-aloud for everyone" toggle.                                                                                                                      |
| Q4  | Playback UX v1  | Speaker button on the question, on each choice/item, and on each text-bearing stimulus; a "Read question" button; playback speed 0.75×–1.5×; replay. Part-level highlight and an opt-in auto-read switch (see D1, D5). No word-level sync in v1. |
| Q5  | Stimulus text   | Extracted **at authoring time** (PDF text layer first, Gemini OCR fallback via the existing `ocr` generation type), stored as `QuizStimulus.readAloudText`, **teacher-reviewable and editable**. Nothing unreviewed is ever synthesized.         |
| Q6  | Voice           | **Neural2** voices, admin-configurable default per language in `admin_settings`.                                                                                                                                                                 |
| Q7  | When            | **On demand at first play**, cached forever by content hash. Client prefetches the current question's parts on load.                                                                                                                             |
| Q8  | Language        | Optional **quiz-level `language`** (BCP-47, default `en-US`) set in the quiz editor; voice map picks the matching Neural2 voice.                                                                                                                 |
| Q9  | Text source     | **Server-derived only.** The client sends `{sessionId, questionId, part}`; the function reads the session doc and synthesizes only text that exists there (or the reviewed `readAloudText`). Client-supplied text is never accepted.             |
| Q10 | Eligibility     | **SSO students only.** The caller must carry `studentRole === true` and own a pointer doc for the session. Anonymous PIN joiners never see the control.                                                                                          |
| Q11 | Gating          | New global feature permission **`quiz-read-aloud`** (admin → beta → public). When off for a user, no reference to read-aloud renders anywhere: not the override checkbox, the assignment toggle, the editor fields, nor student buttons.         |
| Q12 | Delivery        | **Three stacked PRs** into `dev-paul` (§7).                                                                                                                                                                                                      |
| Q13 | Quota           | Characters counted **under the student's uid** in `ai_usage` with feature key `tts`; cache hits are free; a hard **per-session ceiling** stops runaway replay.                                                                                   |
| Q14 | "Everyone"      | Means **all SSO students on that assignment**. Server check: pointer exists AND (`override.readAloud === true` OR `assignment.readAloudAll === true`).                                                                                           |
| Q15 | Teacher preview | **Yes**: a "Preview voice" button beside the language field in the quiz editor speaks the first question prompt (else a fixed localized sample) in the mapped voice, billed to the teacher under `tts` (D10).                                    |
| Q16 | Next step       | Plan doc only; product owner reviews before any code.                                                                                                                                                                                            |

### 2.1 Design decisions (locked 2026-09-08, UI grill)

| #   | Decision            | Choice                                                                                                                                                                                                                                                     |
| --- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | Highlight           | **Part-level.** The prompt, choice or item whose audio is playing gets a soft brand-blue tint + outline. No word-level sync.                                                                                                                               |
| D2  | MC rows             | **Sibling speaker.** Each choice row is a flex pair: existing choice button grows, a 44 px speaker button sits beside it with the same height and radius. Never nested inside the choice button; own `aria-label`.                                         |
| D3  | Toolbar             | **Compact sticky bar under the progress header**, full width, glass surface. Not rendered at all for ineligible students so layout never shifts.                                                                                                           |
| D4  | Modes               | **Self-paced (light) only for v1.** Live teacher-paced quizzes (`session.sessionMode !== 'student'`) get no read-aloud; the server rejects them too.                                                                                                       |
| D5  | Autoplay            | **Tap only**, plus an opt-in **Auto-read** switch in the toolbar, off by default, persisted per device in `localStorage`. Once on, each new question's prompt plays after the browser has a prior gesture.                                                 |
| D6  | Speed               | **One cycling pill** 1× → 1.25× → 1.5× → 0.75× → 1×, 44 px, current rate as its label, `aria-live` announces the new rate.                                                                                                                                 |
| D7  | States              | Speaker icon becomes a spinner while synthesizing. Failure: icon returns and one inline line under the toolbar, "Couldn't load audio. Tap to try again." Quota exhausted: controls unmount and one calm line says read-aloud is unavailable for this quiz. |
| D8  | Matching / Ordering | **Trailing speaker outside the drag surface**: `[grip] [text] [speaker]`, `pointerdown` stopped before the drag listeners. Muted until hover/focus on pointer devices, always visible on touch.                                                            |
| D9  | Read order          | "Read question" = prompt, pause, then choices as "A. …", "B. …" (letters spoken); Matching reads left column then right; Ordering reads items in shown order. Attached stimulus text (PR3) is read first. Highlight walks each part.                       |
| D10 | Preview text        | First question prompt if present, else a fixed localized sample sentence. Same cache key scheme as student playback.                                                                                                                                       |
| D11 | Copy                | Override checkbox label **"Read aloud"**, help line **"Signed-in students only."** Same two strings on the assignment-wide toggle. No tooltips, no parentheticals.                                                                                         |
| D12 | Stimulus text UI    | **Collapsed disclosure row** under each image/pdf stimulus card: "Read-aloud text" + source badge (PDF text / OCR / Edited / None). Expands to textarea, Extract, Clear.                                                                                   |
| D13 | Admin card          | One row per language (en-US, es-US, de-DE, fr-FR): Neural2 voice select + Play sample. Below: "Characters per session" number input showing the default. Save. Existing admin card styling.                                                                |
| D14 | Auto-read control   | Small labeled switch "Auto-read", existing switch styling, right end of the toolbar, `role="switch"` + `aria-checked`.                                                                                                                                     |

## 3. Data model

All additions are optional fields; no migration.

```ts
// types.ts — StudentOverride (types.ts:4663)
readAloud?: boolean; // quiz only; requires SSO + 'quiz-read-aloud' permission

// types.ts — QuizData (types.ts:3426)
/** BCP-47 tag used to pick the read-aloud voice. Absent = 'en-US'. */
language?: string;

// types.ts — QuizStimulus (types.ts:3287)
/** Teacher-reviewed text spoken for image/pdf stimuli. Absent = no speaker button. */
readAloudText?: string;
/** How readAloudText was produced; 'edited' once the teacher touches it. */
readAloudSource?: 'pdf-text' | 'ocr' | 'edited';

// types.ts — QuizAssignmentSettings (types.ts:4697)
/** Read-aloud for every SSO student on this assignment, not only overrides. */
readAloudAll?: boolean;

// types.ts — QuizSession (types.ts:3626), snapshotted at create time (freeze-live)
readAloudAll?: boolean;
language?: string;
/** Per-stimulus reviewed text, keyed by stimulus id; the only stimulus text the synth function may speak. */
readAloudTextByStimulusId?: Record<string, string>;

// types.ts — GlobalFeature union
| 'quiz-read-aloud'
```

Notes:

- `readAloudText` is authoring content; it must **not** travel through
  `APPEARANCE_CONFIG_KEYS` (it is quiz data, not widget config, so this is moot, but
  stated for the record).
- `QuizPublicQuestion` is unchanged: its `text`, `choices`, `matchingLeft/Right`,
  `orderingItems` are already the exact strings a student sees, so they are the exact
  strings to speak.
- `setAssignmentTargetsV1` needs no contract change: `readAloud` rides inside the
  existing `override` object and inherits the field-level merge protection.
- Roster standing defaults (`defaultOverridesByStudentId`) pick up `readAloud`
  for free, so a student flagged once on the roster is flagged on every future
  assignment to that roster.

### Admin voice configuration

`admin_settings/quiz_read_aloud`:

```ts
{
  voicesByLanguage: Record<string, string>; // 'en-US' -> 'en-US-Neural2-F', 'es-US' -> 'es-US-Neural2-A', ...
  defaultLanguage: 'en-US';
  maxCharsPerSession: 200_000; // Q13 ceiling
  speakingRateDefault: 1.0;
}
```

Seeded on first read with en-US / es-US / de-DE / fr-FR Neural2 voices (the app's
four UI locales). Editable from a small card in Admin Settings (PR1).

## 4. Cloud Functions

### 4.1 `synthesizeQuizAudioV1` (onCall, `functions/src/quizReadAloud.ts`)

Request:

```ts
type QuizReadAloudPart =
  | { kind: 'question' }
  | { kind: 'choice'; index: number }
  | { kind: 'matchingLeft' | 'matchingRight' | 'orderingItem'; index: number }
  | { kind: 'stimulus'; stimulusId: string }
  | { kind: 'whole' }; // D9: prompt, pause, then "A. …" choices / left then right / items in order

type SynthesizeQuizAudioRequest =
  | {
      mode: 'student';
      sessionId: string;
      questionId: string;
      part: QuizReadAloudPart;
    }
  | { mode: 'preview'; language: string; quizId?: string }; // D10: first prompt of the teacher's quiz, else fixed sample
```

Response: `{ url: string; mimeType: 'audio/mpeg'; chars: number; cached: boolean; parts?: { kind: string; index?: number; startMs: number }[] }`
(`parts` only for `whole`, from SSML `<mark>` timepoints, so the client highlight can walk the rows per D9).
`url` is a short-lived signed URL (15 min) to the cached object, matching the
download-URL shape the student player needs for `<audio>` and `preload`.

Server steps, student mode:

1. `request.auth` required; `request.auth.token.studentRole === true` else `permission-denied`.
2. Load `/student_assignments/{uid}/items/{sessionId}`; missing → `permission-denied`.
3. Load `/quiz_sessions/{sessionId}`; require `session.status` open for taking; require
   `pointer.override?.readAloud === true || session.readAloudAll === true`.
4. Resolve the global permission `quiz-read-aloud` for the **teacher** uid
   (`session.teacherUid`), mirroring how `generateWithAI` gates on
   `global_permissions/{featureId}` (`aiGeneration.ts:535-537`). Off → `permission-denied`.
   Rationale: the feature flag is a district rollout switch; students have no
   permission rows of their own.
5. Resolve text from the session doc only: `publicQuestions.find(q => q.id === questionId)`
   and the requested part; stimulus parts read `session.readAloudTextByStimulusId[stimulusId]`
   and additionally require the question's `stimulusIds` to include that id. Any miss →
   `invalid-argument`. Text is trimmed and capped at 5,000 characters (Cloud TTS request limit).
6. Voice = `voicesByLanguage[session.language ?? defaultLanguage]`. Cache key =
   `sha256(voice + ' ' + speakingRate + ' ' + text)`.
7. Object path `quiz_tts_cache/{voice}/{hash}.mp3`. If it exists → signed URL, `cached: true`,
   no quota write.
8. Else: enforce quota. Transaction on `ai_usage/{uid}_tts_{YYYY-MM-DD}` (same
   shape as `aiGeneration.ts:466-479`) **and** a per-session counter
   `ai_usage/{uid}_tts_session_{sessionId}` against `maxCharsPerSession`. Over →
   `resource-exhausted` with a student-readable message.
9. Call Cloud TTS `text:synthesize` via `@google-cloud/text-to-speech` with ADC
   (same project; add the Text-to-Speech API to the project and grant the functions
   service account `roles/cloudtts.user`, deployment note in §8). Input is plain text
   for v1; SSML with `<mark>` is reserved for a future highlighting PR.
   `audioConfig: { audioEncoding: 'MP3', speakingRate: 1.0 }`. Speed changes are
   client-side via `HTMLMediaElement.playbackRate` so one cached file serves every rate.
10. Write the MP3 to Storage with `contentType: audio/mpeg`, `cacheControl: public, max-age=31536000, immutable`
    and custom metadata `{ chars, voice, createdAt }`. Return signed URL, `cached: false`.

Preview mode: teacher auth (`!studentRole`), permission `quiz-read-aloud` for the
caller, fixed sentence per language from `locales/en.json` `quizReadAloud.previewSentence`,
same cache path, quota under the teacher's uid.

Error mapping on the client: `permission-denied` hides the controls (should not
happen because the client gates first); `resource-exhausted` shows an inline
"Read-aloud limit reached for this quiz — tell your teacher" note and disables the
buttons for the session; `unavailable` (TTS outage) shows a retry.

### 4.2 `extractStimulusReadAloudTextV1` (onCall, same file) — PR3

Teacher-only. Input `{ stimulusId, driveFileId | url, type: 'image' | 'pdf' }`.
PDF: download via the teacher's Drive token (reuse `getAccessToken` / `downloadDriveFile`
deps from `functions/src/getQuizArtifactPlaybackUrl.ts`), extract the text layer with
`pdf-parse`; if fewer than 40 characters per page come back, fall back to OCR.
OCR: reuse the `ocr` branch of `generateWithAI` (Gemini multimodal with
`inlineData`, `aiGeneration.ts:921-936`) page by page (PDF pages rasterised server-side
are out of scope; for PDFs without a text layer v1 sends the first 4 pages as images
via `pdfjs-dist` canvas rendering, or returns `needs-manual` if that exceeds 60 s).
Returns `{ text, source: 'pdf-text' | 'ocr' | 'needs-manual' }`. Quota under the
teacher's `ocr` feature key, unchanged.

## 5. Storage

```
// storage.rules — new block above the default deny
match /quiz_tts_cache/{voice}/{fileName} {
  // Read only via signed URLs minted by synthesizeQuizAudioV1; no direct client reads.
  allow read, write: if false;
}
```

The bucket path is unreadable to clients by design; the function signs URLs with the
default service account, exactly as other server-minted media paths do. Because the
object name is a content hash, the same question text in two quizzes shares one file
and is billed once district-wide. A quarterly lifecycle rule (age > 365 days) is
optional and noted in §8; the cache is safe to purge at any time.

## 6. Client

### 6.1 Teacher surfaces (PR1 unless noted)

- **Override editor** `components/common/library/OverrideEditorRow.tsx`: a
  "Read aloud" checkbox after "Extended time" (`:255`) with the help line
  "Signed-in students only." (D11). Rendered only when
  `canAccessFeature('quiz-read-aloud')`; the "No accommodations" summary at `:208`
  must include it. Standing defaults in the roster editor pick it up through the
  same component.
- **Assignment settings** `components/common/library/QuizBehaviorSettingsPanel.tsx`:
  toggle "Read aloud" with the same help line, under the accommodation-ish area near
  the tab-switch toggle (`:112`), gated the same way. Snapshotted onto the session at
  create time by the existing assign path (`hooks/useQuizAssignments.ts`).
- **Quiz editor** `components/widgets/QuizWidget/components/QuizEditorModal.tsx`
  (`:372` region): a "Language" select (en-US, es-US, de-DE, fr-FR, plus "Other…"
  free BCP-47 input) and the "Preview voice" button (Q15, D10) that speaks the first
  question prompt, else a fixed sample. Gated.
- **Stimulus manager** (PR3) `components/widgets/QuizWidget/components/StimulusManagerPanel.tsx`
  (`:370` area): for `image` and `pdf` stimuli, a collapsed "Read-aloud text"
  disclosure row (D12) carrying a source badge (PDF text / OCR / Edited / None). Open
  it for the textarea, "Extract text" (calls `extractStimulusReadAloudTextV1`) and
  "Clear". Empty text = no speaker button for students. Gated.
- **Admin** (PR1): card in Admin Settings → "Quiz read-aloud" editing
  `admin_settings/quiz_read_aloud` (D13): one row per language with a Neural2 voice
  select and Play sample, then a "Characters per session" number input, then Save.
- **Permission registry** (PR1): add `'quiz-read-aloud'` to `GlobalFeature`,
  `config/featureDefaults.ts` (default `admin`, enabled), and the admin
  `GlobalPermissionsManager` label/description strings in `locales/*.json`.

### 6.2 Student player (PR2)

Applies to the self-paced (light) `ActiveQuiz` shell only (D4). The player pulls
its classes from the same light token block as the MC rows
(`QuizStudentApp.tsx:2645`); live dark mode is untouched in v1.

- New `components/quiz/readAloud/` folder:
  - `useQuizReadAloud.ts`: owns one `HTMLAudioElement`, a prefetch queue (question,
    then choices in order), an in-memory `Map<partKey, url>` per session, the
    `synthesizeQuizAudioV1` callable, and two `localStorage` keys:
    `quiz_read_aloud_rate` and `quiz_read_aloud_auto`. Exposes
    `{ playingPart, loadingPart, error, play(part), stop(), rate, cycleRate(), auto, setAuto() }`.
    Stops audio on question change and on unmount; when `auto` is on and the page
    has a prior gesture, plays `{kind:'question'}` on question change.
  - `ReadAloudButton.tsx`: icon-only 44×44 button. Idle `Volume2`, playing `Square`,
    loading `Loader2` spinning (`motion-reduce` keeps a static icon). `aria-label`
    "Read question aloud" / "Read choice B aloud" / "Read item 3 aloud" / "Stop",
    `aria-pressed` while playing. Light-mode classes:
    `rounded-2xl border-2 border-slate-200 bg-white text-slate-600 hover:border-slate-300`,
    playing `border-brand-blue-primary bg-brand-blue-lighter text-brand-blue-primary`.
  - `ReadAloudToolbar.tsx` (D3): sticky bar directly under the progress header,
    `bg-white/85 backdrop-blur border-b border-slate-200`, contents left→right:
    "Read question" button with `Volume2`, the speed pill (D6), then the Auto-read
    switch (D14) at the right end. Beneath it, only when needed, one line for the
    error or quota message (D7).
  - `readAloudHighlight.ts`: `highlightClass(part, playingPart)` returning
    `ring-2 ring-brand-blue-primary/60 bg-brand-blue-lighter/60` for the part being
    read (D1). MC rows, prompt block, matching/ordering items and the stimulus header
    apply it.
- Eligibility on the client:
  `readAloudEnabled = isSsoStudent && isStudentPaced && (myOverride?.readAloud || session.readAloudAll)`
  where `isSsoStudent` is derived from the current user's `studentRole` claim
  (already resolved for the `ssoGate` path at `QuizStudentApp.tsx:352`) and
  `isStudentPaced` is `session.sessionMode === 'student'` (`:1593`). The permission
  flag is not readable by students; the server is the authority, and the session doc
  gains `readAloudAll` only when the teacher's flag was on at assign time. For
  override-only students the server check in §4.1 step 4 is the guard; the client
  handles a `permission-denied` by hiding the controls for the rest of the session.
  When not eligible nothing read-aloud-related mounts, so layout is identical to
  today.
- Placement per question type:
  - Prompt: speaker at the trailing end of the prompt block for every type.
  - MC (D2): each row becomes `flex items-stretch gap-2`; the existing choice
    `<button>` gets `flex-1`, the speaker sits beside it, never inside it.
  - FIB / free-response: prompt speaker only (placeholder text is not read).
  - Matching / Ordering (D8): `[grip] [text] [speaker]` in
    `MatchingResponseInput.tsx` and `OrderingResponseInput.tsx`; the speaker calls
    `stopPropagation` on `pointerdown` so it never starts a drag. `opacity-60` until
    hover/focus on `(hover: hover)` devices, full opacity on touch.
  - Stimuli (PR3): speaker in the `QuizStimulusView.tsx` header for image/pdf
    stimuli that have reviewed text.
- "Read question" (D9): plays `{kind:'whole'}`; the server joins prompt, a 600 ms
  SSML break, then "A. …", "B. …" for MC, left column then right for Matching,
  items in shown order for Ordering, with attached stimulus text first. The response
  `parts` timings drive the row-by-row highlight.
- Audio etiquette: starting any read-aloud stops the previous one; the quiz's own
  sound effects (`soundEffectsEnabled`) are unaffected; timers keep running (extended
  time is the separate accommodation).
- Accessibility: every control is keyboard reachable in DOM order, visible
  `focus-visible:ring-2` ring, 44 px minimum targets, AA contrast on the light
  surface, `aria-live="polite"` region announcing rate changes and errors.
- i18n: all labels in `locales/en.json` under `quizReadAloud.*`; the other three
  locales get the English strings copied per repo convention for new keys.

## 7. Delivery — three stacked PRs to `dev-paul`

| PR                      | Branch                         | Contents                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Verifies                                                                                                                                                                                                                                                                                                                                                                                          |
| ----------------------- | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **PR1 data + gating**   | `feat/quiz-read-aloud-model`   | `GlobalFeature` id + `featureDefaults`; `StudentOverride.readAloud`; `QuizData.language`; `QuizAssignmentSettings.readAloudAll` + session snapshot; `admin_settings/quiz_read_aloud` type + admin card; override checkbox; behavior-panel toggle; editor language select (preview button lands with PR2's callable, so PR1 renders it disabled with "available after rollout" only if the flag is on — or omit until PR2, decided at PR time); locale strings. | Unit: types, `OverrideEditorRow` renders/gates the checkbox, `toPublicQuestion` unchanged, assign path snapshots `readAloudAll`/`language`. Rules tests: pointer doc with `override.readAloud` still student-readable, still not writable.                                                                                                                                                        |
| **PR2 engine + player** | `feat/quiz-read-aloud-engine`  | `synthesizeQuizAudioV1` (student + preview), Storage path + rules, `@google-cloud/text-to-speech` dep in `functions/`, quota keys, student player components (toolbar, button, highlight helper), `ActiveQuiz` light-mode integration, teacher preview button, admin analytics label for `tts`.                                                                                                                                                                | Function unit tests with mocked TTS client and Storage (deny anonymous, deny no-pointer, deny flag-off, cache hit skips quota, per-session ceiling, text only from session doc, stimulus id must be attached to the question). Student app unit tests for eligibility and button placement per question type. E2E: SSO fixture quiz with override → speaker buttons present; PIN joiner → absent. |
| **PR3 stimuli**         | `feat/quiz-read-aloud-stimuli` | `QuizStimulus.readAloudText/readAloudSource`; `extractStimulusReadAloudTextV1`; stimulus manager UI; `readAloudTextByStimulusId` snapshot on the session; stimulus speaker button.                                                                                                                                                                                                                                                                             | Function tests (pdf-text vs ocr fallback vs needs-manual); editor tests (extract, edit flips source to `edited`, clear removes); student test (button only when text exists and stimulus attached).                                                                                                                                                                                               |

Each PR is independently shippable behind the `quiz-read-aloud` flag at `admin`.
Rollout: admin → beta (the teachers with read-aloud students) → public.

## 8. Deployment and operations

- **Enable the Cloud Text-to-Speech API** on the Firebase project and grant the
  Cloud Functions runtime service account `roles/cloudtts.user`. Per
  `dev-branch-deploys-functions-to-prod`, a push to `dev-paul` deploys functions to
  the shared prod project: the new function is additive and flag-gated, so this is
  safe, but the API must be enabled **before** PR2 merges or the callable returns
  `unavailable`.
- **Cost**: Neural2 is US$16 per 1M characters after 1M free per month. A 20-question
  MC quiz is roughly 3,000 characters; with caching, a class of 30 all reading the
  same quiz costs one synthesis. Budget alert at US$20/month on the TTS SKU.
- **Privacy**: cached objects contain only quiz text, never student identity; object
  names are hashes; no PII enters `ai_usage` beyond the uid already used by other AI
  features. Consistent with the student PII posture in `studentAssignmentTargets.ts`.
- **Cache purge**: safe at any time; optional lifecycle rule at 365 days.

## 9. Out of scope (v1)

- Word/sentence highlighting synchronized to audio (needs SSML marks + timepoints;
  Neural2 supports them, so the cache key already includes voice to allow a later
  `ssml` variant).
- Auto-read without the opt-in switch (D5).
- Read-aloud in live teacher-paced (dark) quizzes (D4).
- Reading PDF stimuli page by page for long documents (v1 caps OCR at 4 pages;
  longer documents get `needs-manual` and the teacher pastes text).
- Browser `speechSynthesis` fallback when offline.
- Read-aloud for video-activity, guided-learning, or mini-app assignments (the
  override field is quiz-only, matching the other quiz-only override fields).
- Retiring the Apps Script portal.

## 10. Open questions (raise, do not silently answer)

1. Should `readAloudAll` also be offered on the **roster** so a whole class section
   defaults on, or is assignment-level enough for v1? (Plan assumes assignment-level.)
2. Per-session ceiling default of 200k characters ≈ 65 full reads of a 20-question
   quiz. Confirm, or set lower.
3. Preview button: land disabled in PR1 or omit until PR2? (Plan leans omit.)
