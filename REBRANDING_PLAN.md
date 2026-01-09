# Rebranding Plan: School Boards

This document outlines the low-risk strategy for rebranding **Classroom Dashboard Pro** (and legacy **SPART Board**) to **School Boards**.

## Objective

To update the user-facing identity of the application to "School Boards" and refer to individual dashboards as "Boards," while avoiding high-risk changes to the database structure or internal code symbols.

---

## 🟢 Phase 1: User Interface & Branding (Low Risk)

_These changes affect only the visible text and do not impact functionality._

### 1. Web Metadata

- **File:** `index.html`
  - Change `<title>Classroom Dashboard</title>` to `<title>School Boards</title>`.
- **File:** `metadata.json`
  - Update `name` to `"School Boards"`.
  - Update `description` to refer to "School Boards".

### 2. Authentication & Landing

- **File:** `components/auth/LoginScreen.tsx`
  - Change main heading "Classroom Dashboard" to "School Boards".
  - Change "Sign in to access your dashboards" to "Sign in to access your boards".

### 3. Navigation & Sidebar

- **File:** `components/layout/Sidebar.tsx`
  - Change logo/header "SPARTBOARD" to "SCHOOL BOARDS".
  - Change "My Dashboards" section header to "My Boards".
  - Change "New Dashboard" button/modal title to "New Board".
  - Change "Rename Dashboard" modal title to "Rename Board".
  - Change "Delete dashboard" tooltip to "Delete board".

### 4. Notifications & Logic

- **File:** `context/DashboardContext.tsx`
  - Update toast messages (e.g., "Welcome! Dashboard created" → "Welcome! Board created").
  - Update default name "My First Dashboard" → "My First Board".
  - Update "Dashboard removed" → "Board removed".

---

## 🟡 Phase 2: Project Metadata (Low Risk)

_Updates to documentation and configuration._

- **File:** `package.json`
  - Update `"name": "school-boards"`.
- **File:** `README.md`
  - Update all references to "Classroom Dashboard Pro" with "School Boards".
- **File:** `GEMINI.md` / `AGENTS.md`
  - Update project overview to reflect the new name.

---

## 🔴 Phase 3: Out of Scope (High Risk - DO NOT CHANGE)

_These items will remain as-is to ensure stability and data persistence._

- **Firestore Collections:** The `/users/{uid}/dashboards` path will remain unchanged. Renaming this would require a full data migration.
- **Internal Types/Interfaces:** The `Dashboard` interface and `WidgetData` types will remain.
- **Context/Hooks:** `DashboardContext` and `useDashboard` will keep their current names to avoid breaking dozens of component imports.
- **Local Storage Keys:** Keys like `classroom_dashboards` and `spartboard_gradeFilter` will remain to preserve user settings.

---

## Verification Checklist

- [ ] Application title in browser tab says "School Boards".
- [ ] Login screen displays "School Boards".
- [ ] Sidebar header displays "SCHOOL BOARDS".
- [ ] Sidebar list is titled "My Boards".
- [ ] Creating a new board shows "Board created" notification.
- [ ] Modals use "Board" instead of "Dashboard".
- [ ] Existing user data is still accessible (no data loss).
