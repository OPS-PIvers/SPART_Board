# AGENTS.md

> **Attention Agents:** This file contains critical information about the project structure, development workflows, and coding standards. Please read it carefully before starting any task.

## 1. Project Overview

**SPART Board** is a React-based dashboard application for classrooms, built with:

- **Frontend:** React 19, TypeScript 5.x, Vite
- **Styling:** Tailwind CSS
- **State Management:** React Context (`DashboardContext`, `AuthContext`) + Firestore (real-time)
- **Backend:** Firebase Functions (Node.js)
- **Testing:** Vitest (Unit), Playwright (E2E)
- **Linting:** ESLint (Flat Config), Prettier

### Key Directories

- `components/`: UI components.
  - `admin/`: Administrative tools (e.g., `AdminSettings.tsx`).
  - `common/`: Shared, reusable components (e.g., `Button`, `Modal`).
  - `layout/`: Layout components (e.g., `Sidebar`, `Dock`).
  - `widgets/`: Individual widget implementations (e.g., `ClockWidget`, `SeatingChartWidget`).
- `config/`: Configuration files (e.g., `widgetDefaults.ts`, `tools.ts`).
- `context/`: React Context definitions and hooks.
- `hooks/`: Custom React hooks.
- `functions/`: Firebase Cloud Functions.
- `tests/`: Test files (E2E and unit tests for utilities). Note: Component tests are often co-located.

---

## 2. State Management

- **`DashboardContext`**: The central store for dashboard state, widgets, dock items, and rosters.
  - **Hook:** `useDashboard()` provides access to state and actions (e.g., `addWidget`, `updateWidget`).
- **`AuthContext`**: Manages user authentication and role-based access (Admin vs. User).
- **Persistence**:
  - **Firestore**: Real-time sync for dashboards.
  - **Google Drive**: Automatic background sync for non-admins via `useGoogleDrive`.
  - **LocalStorage**: Persists tool visibility and dock organization.

---

## 3. Widget System

Widgets are the core building blocks of the dashboard. They are modular, draggable, and resizable.

### Architecture

- **Registry**: `components/widgets/WidgetRegistry.ts` maps widget types to their components and settings panels. It handles lazy loading.
- **Defaults**: Initial dimensions and configuration are defined in `config/widgetDefaults.ts`.
- **Grade Levels**: `config/widgetGradeLevels.ts` controls which widgets are available for different grade bands.

### Scaling Strategies

The app uses a hybrid scaling approach:

1.  **CSS Container Queries (Preferred):** Newer widgets (e.g., `TimeTool`, `Clock`) set `skipScaling: true` in `WidgetRegistry.ts`.
    - **Rule:** Use container query units (`cqw`, `cqh`, `cqmin`) for all internal sizing (font, padding, icons) to ensure responsiveness.
    - **Example:** `fontSize: 'min(14px, 3.5cqmin)'`
2.  **JS-Based Scaling (Legacy):** Older widgets use `ScalableWidget` which applies a CSS `transform: scale(...)`.

### Nexus (Inter-Widget Communication)

Widgets can communicate via the "Nexus" system.

- **Documentation:** All active connections must be documented in `.Jules/nexus.md`.
- **Pattern:** Widgets can "push" actions (e.g., Randomizer triggering a Timer) or "pull" data (e.g., Weather widget reading location).

---

## 4. UI & Components

Use these standardized components to maintain consistency:

- **`Button`**: The primary button component. Supports `variant` (primary, secondary, ghost, danger, hero) and `size`.
- **`SettingsLabel`**: Standard label for settings panels. (`text-xxs font-black uppercase tracking-widest`).
- **`Modal`**: Standard dialog component. Handles overlays, closing on Escape, and focus management.
- **`Toggle`**: Switch component for boolean settings.
- **`MagicInput`**: specialized input for AI generation tasks.

**Styling:** Use Tailwind CSS utility classes. Avoid custom CSS files unless absolutely necessary.

---

## 5. Development Workflow

### Scripts (pnpm)

- **`pnpm run dev`**: Start the development server.
- **`pnpm run validate`**: **Run this before pushing.** Executes `type-check`, `lint`, `format:check`, and `test`.
- **`pnpm run lint:fix`**: Automatically fix linting errors.
- **`pnpm run test`**: Run unit tests (Vitest).
- **`pnpm run test:e2e`**: Run end-to-end tests (Playwright).

### Authentication

- **Local Dev**: Set `VITE_AUTH_BYPASS=true` in `.env.local` to skip login and use a mock admin account.

### CI/CD

- **Validation**: The `pr-validation.yml` workflow runs on every PR. It executes `lint`, `format:check`, `type-check:all`, unit tests, and E2E tests.
- **Deployment**: `firebase-deploy.yml` handles production deployments.

---

## 6. Testing Guidelines

### Unit Tests (Vitest)

- **Co-location**: Place test files next to the source file (e.g., `Widget.test.tsx` next to `Widget.tsx`).
- **Best Practices**:
  - Use `@testing-library/react` and `@testing-library/user-event`.
  - Avoid `container.querySelector`. Use accessible queries (`getByRole`, `getByText`, `getByLabelText`).
  - **Mocking**: Explicitly mock `useDashboard` and other hooks when testing widgets in isolation.

### E2E Tests (Playwright)

- **Location**: `tests/e2e/`.
- **Interaction**: Use `user-event` patterns. For drag-and-drop (dnd-kit), you may need `.click({ force: true })` or specific drag steps.
- **Selectors**: Use stable selectors like `data-testid` or accessible roles.

---

## 7. Common Pitfalls & Standards

1.  **Strict Linting**: The project treats warnings as errors (`max-warnings 0`).
    - **No Explicit Any**: Do not use `any`. Define proper interfaces.
    - **Strict Null Checks**: Handle `null` and `undefined` explicitly. Optional chaining (`?.`) is your friend, but be aware of strict checks in CI.
2.  **Z-Index**: Do not manually manage z-indexes. Use the `bringToFront` action from `DashboardContext`.
3.  **Floating Promises**: Always handle promises. Use `void` if you intentionally want to ignore the result (e.g., `void myFunction()`), or `await` it.
4.  **Accessibility**:
    - Hidden inputs (like file uploads) must have `aria-label`.
    - Icon-only buttons must have `aria-label`.
5.  **React Hooks**:
    - `useEffect` must return `undefined` or a cleanup function. Do not return `null` or `false`.
    - Dependency arrays must be exhaustive (enforced by linter).
