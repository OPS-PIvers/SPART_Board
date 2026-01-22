# Curator's Journal

## 2025-02-12 - [Initial Setup]

**Insight:** Initializing Curator Journal.
**Concept:** Tracking dependency blockers, vulnerabilities, and deprecations.

## 2025-02-12 - [Initial Maintenance]

**Blocker:** Tailwind CSS v4
**Reason:** Major version upgrade (v3 -> v4) requires significant migration effort and testing of all styles.
**Plan:** Schedule a dedicated task for Tailwind v4 migration.

**Blocker:** Vite v7
**Reason:** Major version upgrade (v6 -> v7) requires checking plugin compatibility and build configuration.
**Plan:** Defer until stability is confirmed and specific features are needed.

**Fix:** `components/widgets/ClockWidget.tsx`
**Reason:** Found duplicate object keys during type-check which caused build failure.
**Action:** Removed duplicate `clockStyle` and `glow` properties from destructuring assignment.

## Philosophy

- Software ages like milk, not wine.
- A secure dependency is better than a shiny new one.
- "Latest" is not always "Greatest" (stability first).
- A clean package.json tells a story of a well-maintained project.

## Journal Entries

## 2025-02-12 - [Security & Maintenance]

**Fix:** `tar` vulnerability
**Reason:** Remedied race condition in `tar` <=7.5.3 by updating override to `^7.5.4`.

**Blocker:** `firebase-admin` (functions)
**Reason:** Major version mismatch (v12 vs v13 in root). Skipping update to avoid breaking changes in backend functions without comprehensive integration tests.
**Plan:** Schedule migration of functions to `firebase-admin` v13.
