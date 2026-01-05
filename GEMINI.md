# Gemini Context: Classroom Dashboard Pro

## Project Overview

**Classroom Dashboard Pro** is an interactive, widget-based classroom management application built with **React 19**, **TypeScript**, and **Vite**. It leverages **Firebase** for backend services (Authentication, Firestore, Storage) and features a drag-and-drop interface for various classroom tools (timers, polls, noise meters, etc.).

**Key Technologies:**

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Lucide React
- **Backend:** Firebase (Auth, Firestore, Storage)
- **AI:** Gemini API (via `@google/genai`)

## Project Structure & Architecture

**CRITICAL NOTE:** This project uses a **flat file structure**. There is **NO `src/` directory**. All source code resides at the project root.

### Directory Layout

- `@/` (Root Alias): Maps to the project root directory.
- `/components/`: React components.
  - `admin/`: Admin-specific components (`FeaturePermissionsManager.tsx`).
  - `auth/`: Authentication UI (`LoginScreen.tsx`).
  - `common/`: Reusable components (e.g., `DraggableWindow.tsx`).
  - `layout/`: Core layout (`Sidebar.tsx`, `Dock.tsx`, `DashboardView.tsx`).
  - `widgets/`: Individual widget implementations and `WidgetRenderer.tsx`.
- `/context/`: React Context providers (`AuthContext`, `DashboardContext`).
- `/hooks/`: Custom hooks (`useFirestore`, `useStorage`).
- `/config/`: Configuration files (`firebase.ts`, `widgetGradeLevels.ts`).
- `/types.ts`: Global TypeScript definitions and the `TOOLS` registry.
- `/App.tsx`: Root application component.
- `/main.tsx` or `/index.tsx`: Entry point.

### Architecture Patterns

- **State Management:** Centralized via React Context (`DashboardContext`, `AuthContext`).
- **Widget System:** Plugin-based. New widgets are added to `components/widgets/`, registered in `types.ts` (`WidgetType`, `TOOLS`), and mapped in `WidgetRenderer.tsx`.
- **Data Persistence:**
  - **Primary:** Firestore (real-time sync).
  - **Fallback:** `localStorage` (migrated to Firestore on sign-in).
- **Security:** Firestore Security Rules enforce ownership (users can only edit their own dashboards) and admin privileges.

## Development Workflow

### Key Commands

- **Install Dependencies:** `npm install`
- **Start Dev Server:** `npm run dev` (Port 3000)
- **Build for Production:** `npm run build`
- **Preview Build:** `npm run preview`
- **Linting:** `npm run lint` (Zero-tolerance policy)
- **Fix Linting:** `npm run lint:fix`
- **Type Check:** `npm run type-check`
- **Format:** `npm run format`

### Code Quality & Standards

- **Strict TypeScript:** No implicit `any`. Explicitly annotate types.
- **ESLint/Prettier:** Code must be linted and formatted. Pre-commit hooks (Husky) enforce this.
- **Path Aliases:** Always use `@/` to import from the root.
  - _Correct:_ `import { useAuth } from '@/context/useAuth'`
  - _Incorrect:_ `import { useAuth } from '../../context/useAuth'` or `import ... from 'src/context/...'`

## Widget Development Guide

To add a new widget:

1.  **Define Type:** Add the new type string to `WidgetType` in `types.ts`.
2.  **Register Metadata:** Add a new entry to the `TOOLS` array in `types.ts` (icon, label, color).
3.  **Create Component:** Build the widget in `components/widgets/YourWidget.tsx`.
    - Must accept `widget: WidgetData` prop.
    - Use `useDashboard()` for state updates.
4.  **Register Renderer:** Add the component to the switch statement in `components/widgets/WidgetRenderer.tsx`.
5.  **Set Defaults:** Define default dimensions and config in `context/DashboardContext.tsx` (`addWidget` function).

## Environment Configuration

Required variables in `.env.local` (do not commit):

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_GEMINI_API_KEY=...
```
