## 2024-01-19 - Config Drift: Dockerfile using manual pnpm install
**Config Drift:** Dockerfile used `npm install -g pnpm` which might mismatch the project's pnpm version, leading to potential "works on my machine" issues.
**Fix:** Added `"packageManager": "pnpm@10.20.0"` to `package.json` and updated `Dockerfile` to use `corepack enable` for strict version enforcement.
