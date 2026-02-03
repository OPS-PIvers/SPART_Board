# AGENTS.md

This document provides comprehensive instructions and context for AI assistants working on the SPART Board repository. It consolidates information from `CLAUDE.md`, `DEV_WORKFLOW.md`, and `LINTING_SETUP.md`.

**Scope:** These instructions apply to the entire directory tree.

---

## 1. Project Overview

**SPART Board** is an interactive classroom management dashboard built with **React 19**, **TypeScript**, and **Vite**. It features a plugin-based widget system (timers, noise meters, drawing boards, etc.) and uses **Firebase** for backend services.

### Key Features

- **Dynamic Widget System:** A flexible, plugin-based architecture for classroom tools.
- **Real-time Sync:** Powered by Firestore for instant updates across devices.
- **Google Drive Sync:** Mandatory background sync to Google Drive for non-admin users, ensuring data portability and backup.
- **Roster System:** Integrated student rosters (`useRosters`) for widgets like Lunch Count, Random Picker, and Seating Charts.
- **Nexus Architecture:** Inter-widget communication allowing tools to work together (e.g., Timer starting when a Random Picker selects a student).
- **Live Sessions:** Teachers can broadcast their dashboard state to students in real-time.

### Tech Stack

- **Frontend:** React 19, TypeScript, Vite
- **Styling:** Tailwind CSS (Custom Brand Theme: Lexend, Patrick Hand fonts, Blue/Red/Gray brand colors)
- **Backend:** Firebase (Auth, Firestore, Storage)
- **Package Manager:** pnpm
- **State Management:** React Context (`DashboardContext`)
- **AI Integration:** Google Gemini API
- **Testing:** Vitest (Unit), Playwright (E2E)

---

## 2. Code Quality & Standards (CRITICAL)

This project enforces a **STRICT ZERO-TOLERANCE POLICY** for code quality.

### 🚫 Strict Rules

1.  **Zero Warnings, Zero Errors:**
    - You **MUST** ensure that `pnpm run validate` (which runs linting, type-checking, format checking, and unit tests) passes with **0 warnings and 0 errors**.
    - Do **NOT** commit code that generates warnings, even if the build technically passes.
2.  **No Suppressions:**
    - The use of suppression comments (e.g., `eslint-disable`, `// @ts-ignore`, `// @ts-nocheck`) is **FORBIDDEN** unless absolutely unavoidable and technically justified (e.g., library bug).
    - If you encounter a linting error, **FIX THE ROOT CAUSE**. Do not suppress it.
3.  **Strict Type Safety:**
    - **No `any`**: Explicitly define interfaces for all props, state, and widget configurations.
    - **No Implicit Types**: Enable `strict: true` behavior in your mental model.
4.  **Edit Source, Not Artifacts:**
    - Never edit files in `dist/` or other build directories.
5.  **Modular Structure:**
    - For complex widgets, use a dedicated subdirectory (e.g., `components/widgets/lunch/`) with a barrel file (`index.ts`) and co-located tests.

### Verification Command

Before marking any task as complete, you must run:

```bash
pnpm run validate
```

If this command reports _any_ issues, you must fix them.

---

## 3. Architecture & Patterns

### Directory Structure

- `components/widgets/`: Individual widget components. Modular widgets use sub-folders.
- `context/`: Global state providers (`DashboardContext.tsx`, `AuthContext.tsx`).
- `types.ts`: Central type definitions.
- `components/common/`: Shared UI components (e.g., `DraggableWindow`, `Button`).
- `components/admin/`: Administrative tools (`AdminSettings.tsx`, `FeaturePermissionsManager.tsx`).
- `config/`: Configuration files (`tools.ts`, `widgetGradeLevels.ts`, `widgetDefaults.ts`).
- `tests/e2e/`: Playwright end-to-end tests.

### State Management & Persistence

- **Centralized Store:** `DashboardContext` manages dashboard state, widget data, `dockItems` (including folders), and rosters.
- **Hook:** Use `useDashboard()` to access state and actions.
- **Cloud Persistence:** Dashboards are persisted to Firestore (real-time).
- **Google Drive Sync:** Automatic, debounced sync to Google Drive for non-admins (`useGoogleDrive`).
- **Local Persistence:** Tool visibility and dock organization (`dockItems`) are persisted to `localStorage`.

### Widget System

- **Registry:** Widgets are registered in `components/widgets/WidgetRegistry.ts`. This centralizes component mapping, lazy loading, and scaling configuration.
- **Defaults:** Initial dimensions and config values live in `config/widgetDefaults.ts`.
- **Wrapper:** All widgets are wrapped in `DraggableWindow.tsx` for drag, resize, and flip functionality.
- **Scaling:** The app uses a hybrid scaling approach. Traditional JS-based scaling via `ScalableWidget` is used by default, but newer widgets leverage **CSS Container Queries** (enabled by setting `skipScaling: true` in `WIDGET_SCALING_CONFIG`).

### Nexus Architecture (Inter-Widget Communication)

Widgets can interact via two patterns:

- **Pull:** A widget reads data from another widget (e.g., `RecessGearWidget` reading from `WeatherWidget`).
- **Push:** A widget triggers an action in another widget (e.g., `RandomWidget` starting a `TimeToolWidget`).
- **Documentation:** All active connections must be documented in `.Jules/nexus.md`.

### Grade Levels

- Widgets are assigned grade levels in `config/widgetGradeLevels.ts`.
- **ALL_GRADE_LEVELS:** Use this constant for widgets appropriate for all ages (replaces the legacy 'universal' string).
- Filtering is managed in the sidebar based on these assignments.

---

## 4. Widget Development Guide (Type-Safe Workflow)

To add a new widget, follow these steps:

1.  **Define Types (`types.ts`) & Configuration (`config/tools.ts`):**
    - Add the new type string to the `WidgetType` union in `types.ts`.
    - Create a specific configuration interface and add it to the `WidgetConfig` union.
    - Update `ConfigForWidget` helper type.
    - Add metadata to the `TOOLS` array in `config/tools.ts`.

2.  **Create Component (`components/widgets/<Name>Widget.tsx`):**
    - Implement the view and settings view.
    - Cast `widget.config` to your specific interface immediately.

3.  **Register in Registry (`components/widgets/WidgetRegistry.ts`):**
    - Add entries to `WIDGET_COMPONENTS` and `WIDGET_SETTINGS_COMPONENTS` (use lazy loading).
    - Configure scaling in `WIDGET_SCALING_CONFIG`. Use `skipScaling: true` if using CSS Container Queries.

4.  **Configure Defaults (`config/widgetDefaults.ts`):**
    - Add default dimensions (`w`, `h`) and initial `config` values to `WIDGET_DEFAULTS`.

5.  **Assign Grade Levels (`config/widgetGradeLevels.ts`):**
    - Add the widget's intended grade levels to `WIDGET_GRADE_LEVELS`.

---

## 5. Development Workflow

### Environment

For full functionality including Firebase services and AI features, create a `.env.local` file in the root directory:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_GEMINI_API_KEY=...
VITE_OPENWEATHER_API_KEY=...
```

### Auth Bypass Mode

For local development without needing real Firebase credentials for every session, set `VITE_AUTH_BYPASS=true` in your `.env.local`. This provides a mock admin user and skips the login screen.

### Branching & Deployments

- **Feature Branches:** Work on `dev-<name>` branches.
- **Previews:** Pushing to a `dev-*` branch triggers a Firebase Preview deployment.
- **Production:** Merging to `main` deploys to the live site.

---

## 6. Common Pitfalls

- **Z-Index:** Do not manually manage z-indexes. Use `bringToFront(id)` from the context.
- **Event Propagation:** For interactive elements inside a `DraggableWindow` (like sliders or nested draggables), use `e.stopPropagation()` to prevent the window from capturing drag/click events.
- **CSS Scaling:** When using CSS Container Queries for font scaling, use a formula like `min(20cqw, 60cqh)` to fill space effectively while respecting height constraints.
- **Floating Promises:** Always handle promises (e.g., `void myAsyncFunc()` or `await ...`).

---

## 7. Admin & Security

- **Admin Access:** Controlled via Firestore `admins` collection and `isAdmin` flag in `AuthContext`.
- **Feature Permissions:** Managed via `feature_permissions` and `global_permissions` collections in Firestore.
- **Setup:** Admin users must be explicitly added via the `scripts/setup-admins.js` script.
