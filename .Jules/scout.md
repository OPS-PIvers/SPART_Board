## 2025-02-18 - Mocking Firebase Storage Initialization **Gap:** Unit tests for `useStorage` hook **Fix:** Mocked `firebase/storage` using `vi.hoisted` and mocked `config/firebase.ts` module.

The `config/firebase.ts` file initializes `getStorage(app)` immediately upon import. To test components/hooks that import this config (like `useStorage`), you must:

1. Mock `firebase/storage` methods (especially `getStorage`) using `vi.hoisted` so the mock is available before imports.
2. Mock `../config/firebase` (or wherever the config is imported from) to prevent the real initialization code from running and crashing the test environment (missing API keys).
