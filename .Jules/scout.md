## 2025-02-18 - Added Tests for useStorage Hook

**Gap:** `hooks/useStorage.ts` had extremely low coverage (1.35%), leaving critical file upload logic (Firebase & Google Drive) untested.

**Fix:** Created `tests/hooks/useStorage.test.ts` using Vitest.

- Mocked `firebase/storage` (including `getStorage`, `ref`, `uploadBytes`, `getDownloadURL`, `deleteObject`).
- Mocked `context/useAuth` and `hooks/useGoogleDrive`.
- Added tests for `uploadFile` (Firebase path).
- Added tests for `uploadBackgroundImage` (Admin/Firebase vs Non-Admin/Drive paths).
- Added tests for `deleteFile` (Firebase path).

**Result:** Coverage improved to ~46%.
