## 2025-02-18 - Added Tests for useStorage Hook

**Gap:** `hooks/useStorage.ts` had extremely low coverage (1.35%), leaving critical file upload logic (Firebase & Google Drive) untested.

**Fix:** Created `tests/hooks/useStorage.test.ts` using Vitest.

- Mocked `firebase/storage` (including `getStorage`, `ref`, `uploadBytes`, `getDownloadURL`, `deleteObject`).
- Mocked `context/useAuth` and `hooks/useGoogleDrive`.
- Added tests for `uploadFile` (Firebase path).
- Added tests for `uploadBackgroundImage` (Admin/Firebase vs Non-Admin/Drive paths).
- Added tests for `deleteFile` (Firebase path).

**Result:** Coverage improved to ~46%.

## 2026-02-12 - Added Tests for PromptDialog Component

**Gap:** `components/widgets/InstructionalRoutines/PromptDialog.tsx` was completely untested (11.11% coverage), leaving user interactions (typing, confirm/cancel) and keyboard shortcuts verified only manually.

**Fix:** Created `components/widgets/InstructionalRoutines/PromptDialog.test.tsx` using Vitest and React Testing Library.

- Used `user-event` for realistic interaction simulation (typing, clicking).
- Ensured test isolation by clearing mocks in `beforeEach`.
- Verified accessibility via role-based queries.
- Tested keyboard shortcuts (Cmd+Enter, Ctrl+Enter).

**Result:** Coverage for `PromptDialog.tsx` improved to 100%.
