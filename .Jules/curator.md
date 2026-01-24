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

## 2026-01-24 - [Security Patch & Updates]

**Vulnerability Pattern:** `body-parser` (DoS) and `lodash` (Prototype Pollution) in nested dependencies of `functions/`.
**Fix:** Added `pnpm.overrides` in `functions/package.json` to force `body-parser` >= 2.2.1 and `lodash` >= 4.17.23.
**Note:** Verified existence of `lodash@4.17.23` and `body-parser@2.2.1` in the registry and successfully installed.
**Upgrade:** Updated `@playwright/test` (1.57.0 -> 1.58.0) and `globals` (17.0.0 -> 17.1.0) in root.
**Verification:** All tests passed. `functions/` build successful.
