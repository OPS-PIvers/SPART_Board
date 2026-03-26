# SPART Board No-Code/Low-Code Admin Roadmap

This document outlines opportunities to shift customization, design, and widget creation from code-level changes (React/Tailwind) into dynamic, admin-configurable settings within the SPART Board application. This shift lowers the barrier to scaling the app across different domains, empowering admins to match their branding and utility needs without coding.

> **Implementation status key:**
>
> - ✅ **Done** — fully implemented and shipped
> - 🔲 **Remaining** — planned but not yet implemented

---

## Phase 1: Global Branding & Theming (Design Customization)

Currently, the application relies heavily on hardcoded Tailwind utility classes and predefined `tailwind.config.js` settings for colors, fonts, and global styles.

### Opportunities

1.  ✅ **Dynamic Color Palettes:**
    - **Implemented:** `GlobalStyle` extended with `primaryColor`, `accentColor`, and `windowTitleColor` (optional hex strings). These are injected as CSS custom properties (`--spart-primary`, `--spart-accent`, `--spart-window-title`) on the dashboard root element at runtime, so any component can reference them via `var(--spart-primary)` without touching `tailwind.config.js`. Properties are also applied to `document.documentElement` so portaled widgets (rendered via `createPortal` outside the dashboard root) inherit the same values.
    - A **"Colors" tab** in `StylePanel` provides color pickers for each variable with per-color and bulk reset-to-default buttons. Changes save alongside the rest of `GlobalStyle` in Firestore.
    - **Remaining:** Tailwind utility classes (e.g. `bg-brand-blue-primary`) still use compile-time tokens. To make those classes themselves dynamic, the Tailwind config would need to reference the CSS variables — a larger refactor deferred for a future pass.

2.  🔲 **Custom Typography (Fonts):**
    - **Current State:** 11 font families (sans, serif, handwritten, retro, etc.) are selectable in `StylePanel`. All are loaded statically at build time.
    - **Goal:** Allow admins to select arbitrary Google Fonts or upload custom font files for their district. Store the font family name in Firestore and dynamically inject a `<link>` tag to load it.
    - **Remaining:** Implement a Google Fonts picker (API search or curated list), dynamic `<link>` injection in `DashboardView`, and `@font-face` upload via Firebase Storage.

3.  ✅ **UI Elements Styling (Borders, Transparencies):**
    - **Implemented:** `StylePanel` provides sliders and selectors for `windowTransparency`, `windowBorderRadius`, `dockTransparency`, `dockBorderRadius`, `dockTextColor`, and `dockTextShadow`. All values persist to Firestore via `setGlobalStyle()`.

4.  ✅ **Custom Backgrounds & Logos:**
    - **Implemented:** `BackgroundManager` admin panel allows uploading and managing background presets with support for static images, YouTube video backgrounds, and Google Drive images. Presets support per-building access levels (Admin/Beta/Public), category management, and grid/list views.
    - **Implemented:** Global branding UI in `GlobalPermissionsManager` allows uploading a custom logo (up to 1 MB) to replace the default SPART Board logo in the sidebar header. The logo URL is stored in the `app_settings` global Firestore document.

---

## Phase 2: Comprehensive Widget Configuration

Many widgets currently lack global admin settings, relying instead on user-level configuration or hardcoded behaviors.

### Opportunities

1.  **Implement Pending Widget Admin Configs:**

    Widget-level admin configuration panels set building-level defaults — the initial state a widget boots up with when a teacher adds it to their dashboard, based on their building assignment. See `docs/admin_settings_widget_configs.md` for the full reference.

    **Currently implemented (24 widgets):**
    Catalyst, Lunch Count, Weather, Webcam, Expectations, Schedule, Calendar, Stickers, Instructional Routines, Clock, Timer, Checklist, Sound, Note, Traffic Light, Random, Dice, Scoreboard, Materials, Math Tools, Mini Apps, Recess Gear, Talking Tool, Drawing.

    **Not yet implemented (10 widgets):** 🔲
    - **Classes:** SIS sync rate limits, display name format (First / First L. / First Last).
    - **Embed:** Domain allowlist for iframe sources, default URL per building.
    - **Magic (AI):** Per-widget prompt suggestions and usage quota overrides. _(Note: global daily Gemini rate limits are already configurable via Global Settings → Gemini AI Functions.)_
    - **PDF Viewer:** Max file size limit, default PDF URL per building.
    - **Poll:** District-wide pushed polls, default question templates.
    - **QR Code:** UTM tracking parameter appender.
    - **Quiz:** District curriculum repository integration.
    - **Record:** Max recording duration and resolution caps.
    - **Seating Chart:** Max node count, default template per building.
    - **Smart Notebook:** Max pages and stroke path limits.

    **Newer widget types without config panels yet (assess for need):** 🔲
    Number Line, Concept Web, Syntax Framer, Hotspot Image, Reveal Grid, Car Rider Pro, Video Activity, Graphic Organizer, Guided Learning, Music, Specialist Schedule, Starter Pack, Next Up.

2.  🔲 **JSON Schema-Driven Admin UI:**
    - **Current State:** Each widget requires a bespoke React component for its admin configuration panel (e.g., `ClockConfigurationPanel.tsx`). There are 30+ such panels.
    - **Goal:** Automatically generate admin configuration forms based on a JSON schema defined for each widget, eliminating the need to write new React code for each new widget config.
    - **Implementation:** Define a JSON Schema for each widget's config alongside its type definition. A generic `ConfigurationPanel` component parses the schema and renders appropriate controls (toggle, slider, text input, color picker, select). New widgets get a config panel for free.
    - **Impact:** This would be foundational — unblocking rapid addition of the 10+ remaining widget configs and all future widgets without developer intervention.

---

## Phase 3: No-Code / Low-Code Widget Creation

Currently, adding a new widget requires writing a React component and updating multiple files: `types.ts`, `config/tools.ts`, `components/widgets/WidgetRegistry.ts`, `config/widgetDefaults.ts`, and `config/widgetGradeLevels.ts`.

### Opportunities

1.  **Enhance Mini Apps (Low-Code):**
    - **Current State:** `MiniAppLibraryModal` (Admin Settings → Global Settings) allows admins to publish raw HTML/JS apps with building and grade-level targeting. Apps run in sandboxed iframes communicating via `postMessage`. Building targeting, result collection via Google Apps Script, and a basic `<textarea>` code editor are all working.
    - 🔲 **Remaining:** Integrate an in-browser code editor (Monaco Editor) directly in the admin UI for writing HTML/CSS/JS with syntax highlighting, bracket matching, and autocomplete. This is the primary UX gap — the textarea-based editor is not suitable for non-developer admins writing or reviewing multi-line code. Formalize the `window.postMessage` SPART bridge API with a versioned schema and documented methods (e.g. `getRoster`, `playSound`).

2.  🔲 **Visual Widget Builder (No-Code):**
    - **Goal:** Allow non-technical admins to create simple widgets by combining predefined blocks (Text, Image, Button, Iframe) on a drag-and-drop canvas.
    - **Implementation:** Create a `custom-widget` type. The admin UI outputs a JSON UI definition. A generic `CustomWidgetRenderer` component renders this JSON at runtime without any code changes.

3.  🔲 **Data Binding & API Integrations:**
    - **Goal:** Allow admins to create widgets that fetch and display data from third-party APIs (e.g., a custom cafeteria menu API or bus tracker).
    - **Implementation:** Within the Visual Widget Builder, allow defining a logical "data source" backed by a REST endpoint — but never call arbitrary third-party URLs directly from the client. All external requests must flow through a server-side proxy (Firebase Cloud Function) that enforces per-domain allowlists, validation, rate limiting, and secret management. The proxy response fields are then mapped to widget blocks.

4.  🔲 **Action Buttons (Webhooks):**
    - **Goal:** Allow admins to create button blocks that trigger external actions (e.g., "Send Help Request to IT").
    - **Implementation:** Button blocks call a trusted server-side "webhook executor" endpoint with a logical action ID. The backend enforces an allowlist of destinations, attaches stored secrets/headers, performs per-user permission checks, executes the outbound webhook, and records audit logs. No outbound URLs or secrets are ever exposed to the client.

---

## Phase 4: Layout & Dashboard Templates

Empower admins to control the initial user experience for teachers.

### Opportunities

1.  ✅ **Dashboard Templates:**
    - **Implemented:** Full `DashboardTemplatesManager` admin component (Admin Settings → Templates tab). Admins can:
      - Create templates by capturing the current board's widgets, globalStyle, and background
      - Set name, description, comma-separated tags, target grade levels, and target buildings
      - Publish/unpublish to the user-facing Starter Pack
      - Apply a template to the current board (adds all template widgets)
      - Delete templates with confirmation
    - Templates are stored in `/dashboard_templates/{id}` in Firestore. Security rules: authenticated users read, admins write.
    - `DashboardTemplate` type defined in `types.ts` with full metadata.
    - 🔲 **Remaining:** Automatic template assignment on first login based on a user's building/grade profile. Currently templates must be applied manually by the user from the Starter Pack.

2.  ✅ **Mandatory/Locked Widgets:**
    - **Implemented:** `isLocked?: boolean` added to the `WidgetData` interface. When `true`:
      - Drag is blocked (pointer events on the title bar are a no-op)
      - All four corner resize handles are hidden
      - Keyboard `Delete` shortcut is suppressed (both `onKeyDown` handler and the `widget-keyboard-action` custom event)
      - The close (X) button is replaced with an amber lock badge with a tooltip
    - Admins set `isLocked: true` on a widget via templates or direct Firestore edits.
    - 🔲 **Remaining:** A dedicated admin UI surface to lock/unlock individual widgets on a teacher's live board without requiring direct Firestore edits.

---

## Phase 5: Access Control, User Experience & Operations

These capabilities are foundational to deploying SPART Board across an entire district as a managed product.

### Opportunities

1.  ✅ **Global Feature Permissions:**
    - **Implemented:** `GlobalPermissionsManager` (Admin Settings → Global Settings) provides access control for 9 cross-cutting features that are not tied to individual widgets:
      - Gemini AI Functions (with configurable daily usage limit)
      - Live Sessions
      - Remote Control
      - Dashboard Sharing
      - Dashboard Importing
      - Magic Layout
      - Smart Paste
      - Smart Polls
      - Embed: Generate Mini App
      - Video Activity Audio Transcription
    - Each feature supports Admin/Beta/Public access levels, enable/disable toggle, and per-feature beta user email lists.

2.  ✅ **Widget-Level Feature Permissions:**
    - **Implemented:** `FeaturePermissionsManager` controls which widget types are accessible district-wide. Each widget type can be set to Admin-only, Beta (allowlisted emails), or Public access, and can be fully disabled.

3.  ✅ **Custom Announcements Widget:**
    - **Implemented:** An `Announcements` admin component allows admins to publish embedded content or rich text announcements that appear as a widget on teacher dashboards. Supports both embed (iframe) and text/HTML content modes.

4.  ✅ **Student / Read-Only View:**
    - **Implemented:** `StudentContexts.tsx` provides a `StudentProvider` that wraps the app in read-only Auth and Dashboard contexts. All widget state is visible but all write operations (add, update, delete widget) are no-ops. Used for rendering dashboards in a student-facing read-only mode without requiring a separate auth flow.
    - 🔲 **Remaining:** Admin UI to publish a specific dashboard as a student-facing URL (shareable link to a read-only view of a teacher's active board).

5.  ✅ **User Management:**
    - **Implemented:** `UserManagementPanel` in Admin Settings provides admin-level control over user roles.
    - 🔲 **Remaining:** Bulk user import (e.g., CSV upload of staff emails + building assignments), building assignment management, and automated role provisioning via directory sync (Google Workspace / Azure AD).

6.  ✅ **Analytics:**
    - **Implemented:** `AnalyticsManager` in Admin Settings provides usage tracking and reporting.
    - 🔲 **Remaining:** District-level dashboards showing widget adoption by building, active user counts, and template usage rates. Exportable reports for admin review.

7.  ✅ **Onboarding / Setup Wizard:**
    - **Implemented:** `setupCompleted` state tracked in `AuthContext` and Firestore. Onboarding completion is persisted per user.
    - 🔲 **Remaining:** Building-profile-driven onboarding that auto-selects the correct starter template, walks teachers through their first widget additions, and surfaces relevant admin-configured defaults for their school.

---

## Gap Analysis

The following gaps represent the highest-risk areas where the current plan does **not** yet achieve the goal of full admin customization without code changes:

| Gap                                                 | Risk                                                                                                                     | Recommended Next Step                                                                                        |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| **10 widget types lack admin config panels**        | Admins cannot set building-level defaults for Embed, Poll, Classes, QR, Quiz, Record, PDF, Seating Chart, Smart Notebook | Implement panels in priority order; consider JSON schema approach (Phase 2.2) to accelerate                  |
| **13 newer widget types have no config assessment** | Growing widget library outpaces admin tooling                                                                            | Audit each new widget type against `docs/admin_settings_widget_configs.md` at release time                   |
| **Mini App editor is textarea-only**                | Non-developer admins cannot realistically write or review HTML/JS apps                                                   | Integrate Monaco Editor in `MiniAppLibraryModal` (Phase 3.1); highest-value UX fix for the low-code path     |
| **Template auto-assignment unimplemented**          | New teachers see a blank board; the right starter content exists but isn't delivered automatically                       | Implement first-login building profile check and auto-apply matching published template                      |
| **Widget lock/unlock requires Firestore console**   | Locking widgets via templates works, but unlocking or adjusting locked state on a live board requires direct DB access   | Build a simple lock toggle in the widget's admin settings or in `DashboardTemplatesManager`                  |
| **No student-facing shareable URL**                 | Read-only student view is implemented at the code level but there is no admin-driven publishing mechanism                | Admin "Publish to Students" action that generates a shareable, unauthenticated read-only URL for a dashboard |
| **Custom fonts require code changes**               | Districts wanting their own typography must submit code changes                                                          | Implement Google Fonts picker with dynamic `<link>` injection (Phase 1.2)                                    |
| **Bulk user provisioning is manual**                | Scaling to 500+ teachers requires manual role assignment or direct Firestore edits                                       | Building assignment via CSV or directory sync integration (Phase 5.5)                                        |

---

## Summary

| Phase | Item                                            | Status                                         |
| ----- | ----------------------------------------------- | ---------------------------------------------- |
| 1.1   | Dynamic Color Palettes (CSS variables)          | ✅ Done                                        |
| 1.2   | Custom Typography (Google Fonts)                | 🔲 Remaining                                   |
| 1.3   | UI Elements Styling (borders, transparency)     | ✅ Done                                        |
| 1.4   | Custom Backgrounds & Logos                      | ✅ Done                                        |
| 2.1   | Widget Admin Configs (24 of 34 widget types)    | ✅ Partial — 10 types + 13 newer types pending |
| 2.2   | JSON Schema-Driven Admin UI                     | 🔲 Remaining                                   |
| 3.1   | Enhanced Mini Apps (Monaco Editor)              | 🔲 Remaining (building targeting ✅ done)      |
| 3.2   | Visual Widget Builder                           | 🔲 Remaining                                   |
| 3.3   | Data Binding & API Integrations                 | 🔲 Remaining                                   |
| 3.4   | Action Buttons (Webhooks)                       | 🔲 Remaining                                   |
| 4.1   | Dashboard Templates (create/apply/publish)      | ✅ Done                                        |
| 4.1   | Auto-assign template on first login             | 🔲 Remaining                                   |
| 4.2   | Mandatory/Locked Widgets (enforcement)          | ✅ Done                                        |
| 4.2   | Admin UI to lock/unlock live widgets            | 🔲 Remaining                                   |
| 5.1   | Global Feature Permissions                      | ✅ Done                                        |
| 5.2   | Widget-Level Feature Permissions                | ✅ Done                                        |
| 5.3   | Custom Announcements Widget                     | ✅ Done                                        |
| 5.4   | Student / Read-Only View (code layer)           | ✅ Done                                        |
| 5.4   | Student-facing shareable published URL          | 🔲 Remaining                                   |
| 5.5   | User Management UI                              | ✅ Done                                        |
| 5.5   | Bulk user provisioning / directory sync         | 🔲 Remaining                                   |
| 5.6   | Analytics (basic)                               | ✅ Done                                        |
| 5.6   | District-level analytics dashboards + export    | 🔲 Remaining                                   |
| 5.7   | Onboarding / Setup Wizard (completion tracking) | ✅ Done                                        |
| 5.7   | Building-profile-driven onboarding flow         | 🔲 Remaining                                   |

By completing the remaining widget admin config panels, integrating Monaco Editor for the Mini App library, implementing template auto-assignment on first login, and adding the student-facing publish URL, SPART Board will reach a state where a district admin can fully configure, brand, and deploy the platform for their teachers and students without any developer intervention. The JSON Schema-driven admin UI (Phase 2.2) and Visual Widget Builder (Phase 3.2) represent the next frontier — turning widget creation itself into an admin-level operation.

---

**Last Updated**: 2026-03-26
**Version**: 1.2.0
