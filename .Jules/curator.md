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

## 2025-02-12 - [Security Fixes & Updates]

**Update:** `firebase-functions-test`
**Action:** Updated to `^3.4.1` in `functions/package.json`.

**Security:** `body-parser`
**Reason:** Vulnerability in `@google-cloud/functions-framework` (via transitive dependency).
**Action:** Added `pnpm.overrides` for `body-parser` to `^2.2.1` in `functions/package.json`.

**Security:** `lodash`
**Reason:** Vulnerability in `firebase-functions-test` (transitive).
**Action:** Added `pnpm.overrides` for `lodash` to `^4.17.23` in `functions/package.json`.

**Update:** Root Dependencies
**Action:** Updated `@playwright/test` to `^1.58.0` and `globals` to `^17.1.0`.
