# Mason's Journal

## 2025-02-18 - Dockerfile Package Management Drift
**Config Drift:** The `Dockerfile` was using `npm install -g pnpm` which decoupled the container's pnpm version from the project's requirements.
**Fix:** Updated `Dockerfile` to use `corepack enable` and added `"packageManager": "pnpm@10.20.0"` to `package.json` to enforce strict versioning.
