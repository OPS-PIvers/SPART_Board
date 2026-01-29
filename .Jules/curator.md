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

## 2025-02-12 - [Feb 12 Maintenance]

**Update:** Root Dependencies
**Action:** Updated `react` & `react-dom` (19.2.4), `typescript-eslint` (8.54.0), `globals` (17.2.0).
**Verification:** Ran `pnpm validate` - All passed.

**Update:** Functions Dependencies
**Action:** Updated `axios` (1.13.3), `firebase-admin` (13.6.0), `@google/genai` (1.38.0).
**Verification:** Ran `pnpm build` in functions - All passed.

## 2025-02-12 - [Security Audit & Fixes]

**Security:** `hono` & `tar`
**Reason:** Found vulnerabilities (Hono: XSS, IP Spoofing; Tar: Arbitrary File Creation).
**Action:** Added `hono` to `devDependencies` (^4.11.7) and updated overrides for `hono` (^4.11.7) and `tar` (^7.5.7).
**Verification:** Ran `pnpm audit` (0 vulnerabilities) and `pnpm test` (Passed).

**Update:** Functions Dependencies
**Action:** Updated `axios` (^1.13.4) and `firebase-functions` (^7.0.5) in `functions/`.
**Verification:** Ran `pnpm build` in functions - All passed.
