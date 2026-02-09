# Mason's Journal 🏗️

## 2026-01-20 - [Missing CI for Functions] **Bottleneck:** Backend code (functions) is not validated in PRs, risking broken deployments. **Fix:** Migrated functions to pnpm and added parallel CI job for functions build in `pr-validation.yml`.

## 2026-01-26 - [Broken Production Deploy] **Bottleneck:** Production deployment workflow was only deploying Hosting and missing Functions build/deploy, leading to config drift and potential runtime errors. **Fix:** Updated `firebase-deploy.yml` to install function deps, build functions, and deploy all targets using `firebase-tools` with a service account.

## 2026-01-30 - [Build Scripts & Chunk Optimization] **Bottleneck:** Missing convenience scripts for full-stack build caused friction; large chunk warnings in build output. **Fix:** Added `install:all`, `build:all` scripts and optimized `vite.config.ts` manual chunks.

## 2026-02-09 - [CI Standardization & Dev Validation] **Bottleneck:** Inconsistent build scripts across CI workflows caused maintenance friction; dev deployments lacked functions validation (type-check/build) risking hidden backend errors. **Fix:** Standardized all workflows to use `install:ci` and `build:all`. Upgraded `firebase-dev-deploy.yml` to run `type-check:all` and `build:all` to catch full-stack issues early.
