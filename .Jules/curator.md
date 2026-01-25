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

## 2026-01-25 - [Security & Cleanup]

**Security:** `functions/package.json`
**Reason:** Vulnerabilities in transitive dependencies (`body-parser`, `lodash`).
**Action:** Added `pnpm.overrides` for `body-parser` (^2.2.1) and `lodash` (^4.17.23).

**Cleanup:** `package.json` (Root)
**Action:** Removed unused `cross-env` from devDependencies.

**Update:** `package.json` (Root)
**Action:** Updated `@playwright/test` (^1.58.0) and `globals` (^17.1.0).

## Philosophy

- Software ages like milk, not wine.
- A secure dependency is better than a shiny new one.
- "Latest" is not always "Greatest" (stability first).
- A clean package.json tells a story of a well-maintained project.

## Journal Entries
