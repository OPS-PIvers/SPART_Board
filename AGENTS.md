# AGENTS.md

This document provides comprehensive instructions and context for AI assistants working on the Classroom Dashboard Pro repository. It consolidates information from `CLAUDE.md`, `DEV_WORKFLOW.md`, and `LINTING_SETUP.md`.

**Scope:** These instructions apply to the entire directory tree.

---

## 1. Project Overview

**Classroom Dashboard Pro** is an interactive classroom management dashboard built with **React 19**, **TypeScript**, and **Vite**. It features a plugin-based widget system (timers, noise meters, drawing boards, etc.) and uses **Firebase** for backend services.

### Tech Stack

- **Frontend:** React 19, TypeScript, Vite
- **Styling:** Tailwind CSS (PostCSS)
- **Backend:** Firebase (Auth, Firestore, Storage)
- **State Management:** React Context (`DashboardContext`)
- **AI Integration:** Google Gemini API

---

## 2. Code Quality & Standards (CRITICAL)

This project enforces a **STRICT ZERO-TOLERANCE POLICY** for code quality.

### 🚫 Strict Rules

1.  **Zero Warnings, Zero Errors:**
    - You **MUST** ensure that `npm run validate` (which runs linting, type-checking, and format checking) passes with **0 warnings and 0 errors**.
    - Do **NOT** commit code that generates warnings, even if the build technically passes.
2.  **No Suppressions:**
    - The use of suppression comments (e.g., `eslint-disable`, `// @ts-ignore`, `// @ts-nocheck`) is **FORBIDDEN** unless absolutely unavoidable and technically justified (e.g., library bug).
    - If you encounter a linting error, **FIX THE ROOT CAUSE**. Do not suppress it.
3.  **Strict Type Safety:**
    - **No `any`**: Explicitly define interfaces for all props, state, and widget configurations.
    - **No Implicit Types**: Enable `strict: true` behavior in your mental model.
4.  **Edit Source, Not Artifacts:**
    - Never edit files in `dist/` or other build directories.

### Verification Command

Before marking any task as complete, you must run:

```bash
npm run validate
```

If this command reports _any_ issues, you must fix them.

---

## 3. Architecture & Patterns

### Directory Structure

- `components/widgets/`: Individual widget components.
- `context/`: Global state providers (`DashboardContext.tsx`, `AuthContext.tsx`).
- `types.ts`: Central type definitions and the `TOOLS` registry.
- `components/common/`: Shared UI components (e.g., `DraggableWindow`).
- `components/admin/`: Administrative tools (`AdminSettings.tsx`, `FeaturePermissionsManager.tsx`).
- `config/`: Firebase and application configuration (`widgetGradeLevels.ts`).

### State Management

- **Centralized Store:** `DashboardContext` manages all dashboard state, widget data, and persistence.
- **Hook:** Use `useDashboard()` to access state and actions.
- **Persistence:** Dashboards are persisted to Firestore (cloud). Tool visibility preferences are persisted to `localStorage` (`classroom_visible_tools`). Legacy data is migrated from `classroom_dashboards` (localStorage) to Firestore.

### Widget System

The app uses a plugin-based architecture for widgets.

- **Definition:** Widgets are defined in the `WidgetType` union and `TOOLS` array in `types.ts`.
- **Implementation:** Each widget lives in `components/widgets/` (e.g., `TimerWidget.tsx`).
- **Rendering:** `WidgetRenderer.tsx` maps types to components.
- **Wrapper:** All widgets are wrapped in `DraggableWindow.tsx` for common functionality (drag, resize, flip).
- **Grade Levels:** Every widget is assigned one or more grade levels in `config/widgetGradeLevels.ts` (K-2, 3-5, 6-8, 9-12, or Universal). This allows users to filter the sidebar by their relevant grade range.

### Feature Permissions

Access to specific widgets can be dynamically controlled:

- **Access Levels:** 'public', 'beta', or 'admin'.
- **Enabled Toggle:** Widgets can be completely disabled via the `enabled` flag.
- **Beta Users:** A list of emails allowed to access 'beta' widgets.
- **Management:** Admins can adjust these settings in the `AdminSettings` view.

### Audio Handling

- **Singleton Pattern:** Use a single `AudioContext` instance per widget type (or globally where appropriate) to avoid browser limits.
- **Unlock on Interaction:** Resume `AudioContext` within user interaction handlers (e.g., click) to comply with autoplay policies.
- **Browser Compatibility:** Handle `window.webkitAudioContext` for Safari support.

---

## 4. Widget Development Guide (Type-Safe Workflow)

To add a new widget, you must follow these exact steps to maintain strict type safety:

1.  **Define Types (`types.ts`):**
    - Add the new type string to the `WidgetType` union.
    - Create a specific configuration interface (e.g., `export interface YourWidgetConfig { ... }`).
    - Add your new interface to the `WidgetConfig` union.
    - Update the `ConfigForWidget` helper type to map your `WidgetType` to your `YourWidgetConfig`.
    - Add metadata to the `TOOLS` array (icon, label, color).

2.  **Create Component (`components/widgets/<Name>Widget.tsx`):**
    - Implement the main view and optional settings view.
    - **Crucial:** Always cast `widget.config` to your specific interface immediately (e.g., `const config = widget.config as YourWidgetConfig`).

3.  **Register Renderer (`components/widgets/WidgetRenderer.tsx`):**
    - Import your component(s).
    - Add cases to `getWidgetContent()` and `getWidgetSettings()`.

4.  **Configure Defaults (`context/DashboardContext.tsx`):**
    - Add default dimensions and initial `config` values to the `addWidget` function.
    - Ensure the default config matches your interface exactly.

5.  **Assign Grade Levels (`config/widgetGradeLevels.ts`):**
    - Add the widget's intended grade levels to `WIDGET_GRADE_LEVELS`.

---

## 5. Development Workflow

### Branching

- **Feature Branches:** Work on `dev-<name>` branches (e.g., `dev-lead`, `dev-developer1`).
- **Main:** The production branch. PRs go from `dev-*` -> `main`.

### Deployments

- **Preview:** Pushing to a `dev-*` branch triggers a Firebase Preview deployment.
- **Production:** Merging to `main` deploys to the live site.

### Environment

- **Local:** Create `.env.local` with `VITE_FIREBASE_*` keys and `VITE_GEMINI_API_KEY`.
- **Secrets:** Never commit `.env` files.

---

## 6. Common Pitfalls

- **React Fast Refresh:** Define context hooks (like `useDashboard`) in their own files to avoid "Fast Refresh only works when a file only exports components" warnings.
- **Z-Index:** Do not manually manage z-indexes. Use `bringToFront(id)` from the context.
- **Widget Config:** Always cast `widget.config` to a specific interface (e.g., `as TimerConfig`) to ensure type safety.
- **Floating Promises:** Always handle promises (e.g., `void myAsyncFunc()` or `await ...`).

---

## 7. Admin & Security

- **Admin Access:** Controlled via Firestore `admins` collection and `isAdmin` flag in `AuthContext`.
- **Rules:** Firestore Security Rules enforce backend access control.
- **Setup:** Admin users must be explicitly added via the `scripts/setup-admins.js` script.
