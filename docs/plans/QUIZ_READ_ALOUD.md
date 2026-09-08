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

| #   | Decision        | Choice                                                                                                                                                                                                                                   |
| --- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Q1  | Scope           | Native quiz content **plus text inside stimuli**. The Apps Script portal remains for paper assessments; no document-upload port.                                                                                                         |
| Q2  | Engine          | **Google Cloud Text-to-Speech** called from a Cloud Function; MP3 cached in Storage keyed by hash of text + voice. No browser `speechSynthesis`.                                                                                         |
| Q3  | Who             | **Per-student override** (`StudentOverride.readAloud`) **plus** an assignment-level "Allow read-aloud for everyone" toggle.                                                                                                              |
| Q4  | Playback UX v1  | Speaker button on the question, on each choice/item, and on each text-bearing stimulus; a "Read whole question" button; playback speed 0.75×–1.5×; replay. **No** word-level highlighting or auto-play in v1.                            |
| Q5  | Stimulus text   | Extracted **at authoring time** (PDF text layer first, Gemini OCR fallback via the existing `ocr` generation type), stored as `QuizStimulus.readAloudText`, **teacher-reviewable and editable**. Nothing unreviewed is ever synthesized. |
| Q6  | Voice           | **Neural2** voices, admin-configurable default per language in `admin_settings`.                                                                                                                                                         |
| Q7  | When            | **On demand at first play**, cached forever by content hash. Client prefetches the current question's parts on load.                                                                                                                     |
| Q8  | Language        | Optional **quiz-level `language`** (BCP-47, default `en-US`) set in the quiz editor; voice map picks the matching Neural2 voice.                                                                                                         |
| Q9  | Text source     | **Server-derived only.** The client sends `{sessionId, questionId, part}`; the function reads the session doc and synthesizes only text that exists there (or the reviewed `readAloudText`). Client-supplied text is never accepted.     |
| Q10 | Eligibility     | **SSO students only.** The caller must carry `studentRole === true` and own a pointer doc for the session. Anonymous PIN joiners never see the control.                                                                                  |
| Q11 | Gating          | New global feature permission **`quiz-read-aloud`** (admin → beta → public). When off for a user, no reference to read-aloud renders anywhere: not the override checkbox, the assignment toggle, the editor fields, nor student buttons. |
| Q12 | Delivery        | **Three stacked PRs** into `dev-paul` (§7).                                                                                                                                                                                              |
| Q13 | Quota           | Characters counted **under the student's uid** in `ai_usage` with feature key `tts`; cache hits are free; a hard **per-session ceiling** stops runaway replay.                                                                           |
| Q14 | "Everyone"      | Means **all SSO students on that assignment**. Server check: pointer exists AND (`override.readAloud === true` OR `assignment.readAloudAll === true`).                                                                                   |
| Q15 | Teacher preview | **Yes**: a "Preview voice" button beside the language field in the quiz editor synthesizes one fixed sentence in the mapped voice, billed to the teacher under `tts`.                                                                    |
| Q16 | Next step       | Plan doc only; product owner reviews before any code.                                                                                                                                                                                    |

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
  | { kind: 'whole' }; // question + all choices/items, joined with pauses

type SynthesizeQuizAudioRequest =
  | {
      mode: 'student';
      sessionId: string;
      questionId: string;
      part: QuizReadAloudPart;
    }
  | { mode: 'preview'; language: string }; // teacher preview, fixed sentence
```

Response: `{ url: string; mimeType: 'audio/mpeg'; chars: number; cached: boolean }`.
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

- **Override editor** `components/common/library/OverrideEditorRow.tsx`: add a
  "Read aloud" checkbox after "Extended time" (`:255`). Rendered only when
  `canAccessFeature('quiz-read-aloud')`; the "No accommodations" summary at `:208`
  must include it. Standing defaults in the roster editor pick it up through the
  same component.
- **Assignment settings** `components/common/library/QuizBehaviorSettingsPanel.tsx`:
  new toggle "Read aloud for everyone (SSO students)" under the accommodation-ish
  area near the tab-switch toggle (`:112`), gated the same way, with help text stating
  that PIN joiners are excluded. Snapshotted onto the session at create time by the
  existing assign path (`hooks/useQuizAssignments.ts`).
- **Quiz editor** `components/widgets/QuizWidget/components/QuizEditorModal.tsx`
  (`:372` region): a "Language" select (en-US, es-US, de-DE, fr-FR, plus "Other…"
  free BCP-47 input) and the "Preview voice" button (Q15). Gated.
- **Stimulus manager** (PR3) `components/widgets/QuizWidget/components/StimulusManagerPanel.tsx`
  (`:370` area): for `image` and `pdf` stimuli, a "Read-aloud text" textarea with an
  "Extract text" button that calls `extractStimulusReadAloudTextV1`, shows a source
  badge (PDF text / OCR / edited), and a clear button. Empty text = no speaker button
  for students. Gated.
- **Admin** (PR1): card in Admin Settings → "Quiz read-aloud" editing
  `admin_settings/quiz_read_aloud` (voice per language, session ceiling).
- **Permission registry** (PR1): add `'quiz-read-aloud'` to `GlobalFeature`,
  `config/featureDefaults.ts` (default `admin`, enabled), and the admin
  `GlobalPermissionsManager` label/description strings in `locales/*.json`.

### 6.2 Student player (PR2)

- New `components/quiz/readAloud/` folder:
  - `useQuizReadAloud.ts`: owns one `HTMLAudioElement`, a prefetch queue (question,
    then choices in order), an in-memory `Map<partKey, url>` per session, playback
    rate state persisted in `localStorage` (`quiz_read_aloud_rate`), and the
    `synthesizeQuizAudioV1` callable. Stops audio on question change and on unmount.
  - `ReadAloudButton.tsx`: icon-only speaker button (`Volume2` / `Square` while
    playing), `aria-label` "Read question aloud" / "Read choice 2 aloud" / "Stop",
    `aria-pressed`, min 44×44 px hit target. Uses container-safe Tailwind classes
    (student app is not a widget; no cqmin needed).
  - `ReadAloudToolbar.tsx`: "Read whole question" + rate select (0.75, 1, 1.25, 1.5)
    - stop, placed in the `ActiveQuiz` header next to the hand-raise control
      (`QuizStudentApp.tsx:1336-1343`).
- Eligibility on the client: `readAloudEnabled = isSsoStudent && (myOverride?.readAloud || session.readAloudAll)`
  where `isSsoStudent` is derived from the current user's `studentRole` claim
  (already resolved for the `ssoGate` path at `QuizStudentApp.tsx:352`). The
  permission flag is not readable by students; the server is the authority, and the
  session doc gains `readAloudAll` only when the teacher's flag was on at assign time.
  For override-only students the server check in §4.1 step 4 is the guard; the client
  handles a `permission-denied` by hiding the controls for the rest of the session.
- Placement per question type:
  - MC: button beside the prompt, button at the end of each choice row.
  - FIB / free-response: prompt button only (placeholder text is not read).
  - Matching: buttons on each left and right item (`MatchingResponseInput.tsx`).
  - Ordering: button on each item (`OrderingResponseInput.tsx`).
  - Stimuli (PR3): button in `QuizStimulusView.tsx` header for image/pdf stimuli
    that have reviewed text.
- Audio etiquette: starting any read-aloud pauses another; the quiz's own sound
  effects (`soundEffectsEnabled`) are unaffected; timers keep running (extended time
  is the separate accommodation).
- i18n: all labels in `locales/en.json` under `quizReadAloud.*`; the other three
  locales get the English strings copied per repo convention for new keys.

## 7. Delivery — three stacked PRs to `dev-paul`

| PR                      | Branch                         | Contents                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Verifies                                                                                                                                                                                                                                                                                                                                                                                          |
| ----------------------- | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **PR1 data + gating**   | `feat/quiz-read-aloud-model`   | `GlobalFeature` id + `featureDefaults`; `StudentOverride.readAloud`; `QuizData.language`; `QuizAssignmentSettings.readAloudAll` + session snapshot; `admin_settings/quiz_read_aloud` type + admin card; override checkbox; behavior-panel toggle; editor language select (preview button lands with PR2's callable, so PR1 renders it disabled with "available after rollout" only if the flag is on — or omit until PR2, decided at PR time); locale strings. | Unit: types, `OverrideEditorRow` renders/gates the checkbox, `toPublicQuestion` unchanged, assign path snapshots `readAloudAll`/`language`. Rules tests: pointer doc with `override.readAloud` still student-readable, still not writable.                                                                                                                                                        |
| **PR2 engine + player** | `feat/quiz-read-aloud-engine`  | `synthesizeQuizAudioV1` (student + preview), Storage path + rules, `@google-cloud/text-to-speech` dep in `functions/`, quota keys, student player components, `ActiveQuiz` integration, teacher preview button, admin analytics label for `tts`.                                                                                                                                                                                                               | Function unit tests with mocked TTS client and Storage (deny anonymous, deny no-pointer, deny flag-off, cache hit skips quota, per-session ceiling, text only from session doc, stimulus id must be attached to the question). Student app unit tests for eligibility and button placement per question type. E2E: SSO fixture quiz with override → speaker buttons present; PIN joiner → absent. |
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
- Auto-play on question load.
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
