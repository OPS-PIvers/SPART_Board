# Mason's Journal 🏗️

## 2026-01-20 - [Missing CI for Functions] **Bottleneck:** Backend code (functions) is not validated in PRs, risking broken deployments. **Fix:** Migrated functions to pnpm and added parallel CI job for functions build in `pr-validation.yml`.

## 2026-01-26 - [Broken Production Deploy] **Bottleneck:** Production deployment workflow was only deploying Hosting and missing Functions build/deploy, leading to config drift and potential runtime errors. **Fix:** Updated `firebase-deploy.yml` to install function deps, build functions, and deploy all targets using `firebase-tools` with a service account.

## 2026-01-30 - [Build Scripts & Chunk Optimization] **Bottleneck:** Missing convenience scripts for full-stack build caused friction; large chunk warnings in build output. **Fix:** Added `install:all`, `build:all` scripts and optimized `vite.config.ts` manual chunks.

## 2026-02-04 - [Missing E2E Tests in CI] **Bottleneck:** End-to-end tests were defined in `package.json` but not running in CI, risking frontend regressions. **Fix:** Added `e2e` job to `pr-validation.yml` running Playwright tests and configured artifact upload for debugging.
