## 2025-02-18 - Added Tests for useStorage Hook

**Gap:** `hooks/useStorage.ts` had extremely low coverage (1.35%), leaving critical file upload logic (Firebase & Google Drive) untested.

**Fix:** Created `tests/hooks/useStorage.test.ts` using Vitest.

- Mocked `firebase/storage` (including `getStorage`, `ref`, `uploadBytes`, `getDownloadURL`, `deleteObject`).
- Mocked `context/useAuth` and `hooks/useGoogleDrive`.
- Added tests for `uploadFile` (Firebase path).
- Added tests for `uploadBackgroundImage` (Admin/Firebase vs Non-Admin/Drive paths).
- Added tests for `deleteFile` (Firebase path).

**Result:** Coverage improved to ~46%.

## 2025-02-18 - Expanded Coverage for PollWidget

**Gap:** `components/widgets/PollWidget.tsx` had low coverage (26%), with most interactions (voting, settings) untested.

**Fix:** Rewrote `components/widgets/PollWidget.test.tsx` to include `PollWidget` (view) tests and expanded `PollSettings` tests.

- Tested rendering, voting, and reset flows.
- Tested configuration updates: question, options (add/remove/edit).
- Mocked `window.confirm` to test destructive actions.
- Mocked `URL.createObjectURL` for CSV export testing.
- Verified disabled state for "Import Class" button instead of unreachable error toast.

**Result:** Coverage improved to 96%.
