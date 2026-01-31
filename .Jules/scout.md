# Scout's Journal

## 2025-05-20 - Testing Infrastructure & Mocks

**Gap:** Root `vitest` runner failed to resolve dependencies imported by `functions/src/index.ts` (e.g., `crypto-js`, `@google/genai`) because `functions` is not a workspace.
**Fix:** Installed these backend dependencies in root `devDependencies`. This ensures `vitest` can resolve imports when compiling function source files from the root context.

**Gap:** `AnnotationCanvas` tests produced "Not implemented" warnings for `getContext` and errors for `setPointerCapture` in JSDOM environment.
**Fix:** Updated `tests/setup.ts` to mock `Element.prototype.setPointerCapture` (and release/has) and `HTMLCanvasElement.prototype.getContext`. This stabilizes tests relying on pointer events or canvas context presence without needing a heavy `canvas` binary dependency.
