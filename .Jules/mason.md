# Mason's Journal 🏗️

## 2026-01-20 - [Missing CI for Functions] **Bottleneck:** Backend code (functions) is not validated in PRs, risking broken deployments. **Fix:** Migrated functions to pnpm and added parallel CI job for functions build in `pr-validation.yml`.

## 2026-01-26 - [Broken Production Deploy] **Bottleneck:** Production deployment workflow was only deploying Hosting and missing Functions build/deploy, leading to config drift and potential runtime errors. **Fix:** Updated `firebase-deploy.yml` to install function deps, build functions, and deploy all targets using `firebase-tools` with a service account.

## 2026-01-30 - [Build Scripts & Chunk Optimization] **Bottleneck:** Missing convenience scripts for full-stack build caused friction; large chunk warnings in build output. **Fix:** Added `install:all`, `build:all` scripts and optimized `vite.config.ts` manual chunks.

## 2026-02-05 - [Backend Testing & Pipeline Optimization] **Bottleneck:** Backend functions were not being tested in CI, and deployment workflows had redundant install/build steps. **Fix:** Added `vitest` config for functions, created `test:all` script, and updated CI workflows to run full-stack tests and use optimized `install:ci` and `build:all` commands.
