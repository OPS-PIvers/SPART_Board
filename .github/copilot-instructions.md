# Copilot Instructions for SPART Board

## Project Overview

**SPART Board** is a React 19 + TypeScript + Vite application providing 20+ interactive classroom management widgets (timers, noise meters, drawing boards, polls, etc.) with Firebase backend. The project uses a **flat file structure** (no `src/` directory) with all source files at root level.

**Tech Stack:** React 19, TypeScript 5.8, Vite 6, Firebase (Auth/Firestore/Storage), Tailwind CSS, ESLint 9 (flat config), Prettier, Husky
**Runtime:** Node.js v20+ (tested with v20.19.6), npm 10+
**Repository Size:** ~395MB with node_modules, ~60 TypeScript/TSX files

## Critical Build & Validation Requirements

### ⚠️ ZERO-TOLERANCE CODE QUALITY POLICY

**All code changes MUST pass `npm run validate` with ZERO errors and ZERO warnings before committing.**

### Installation & Setup

**ALWAYS run `npm ci` (not `npm install`) for clean, reproducible builds:**

```bash
npm ci  # Takes ~10-15 seconds
```

This is required after cloning or when `package-lock.json` changes. Note: README.md mentions `npm install` for convenience, but `npm ci` is strongly preferred for CI/CD and development to ensure consistent dependency versions.

### Environment Setup

Create `.env.local` in root directory with these required variables (get values from team):

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_GEMINI_API_KEY=...
VITE_OPENWEATHER_API_KEY=...
```

**NEVER commit `.env.local` - it's in `.gitignore`.**

### Required Validation Steps (MUST Pass)

Run these commands in this exact order before every commit:

```bash
# 1. Type checking (takes ~3-5 seconds, must have 0 errors)
npm run type-check

# 2. Linting (takes ~5-10 seconds, must have 0 errors AND 0 warnings)
npm run lint

# 3. Format checking (takes ~2-3 seconds, must pass)
npm run format:check

# 4. Run all checks at once (recommended)
npm run validate  # Takes ~10-15 seconds total
```

**All checks MUST pass with zero errors and zero warnings.** The ESLint config uses `--max-warnings 0`.

### Build Commands

```bash
# Development server (runs on http://localhost:3000)
npm run dev  # Starts immediately, hot reload enabled

# Production build (takes ~4-5 seconds)
npm run build  # Outputs to dist/

# Preview production build
npm run preview  # Requires successful build first
```

**Build fails without environment variables.** For CI/CD, dummy values are acceptable for type-checking/linting (see workflows).

### Auto-fixing Issues

```bash
# Auto-fix linting issues
npm run lint:fix

# Auto-format all files
npm run format
```

**NEVER use eslint-disable, @ts-ignore, or @ts-nocheck comments.** Fix the root cause instead.

## Project Architecture

### Directory Structure

```
/ (root - no src/ directory)
├── components/
│   ├── admin/          - AdminSettings.tsx, FeaturePermissionsManager.tsx
│   ├── auth/           - LoginScreen.tsx
│   ├── common/         - DraggableWindow.tsx (wraps all widgets)
│   ├── layout/         - Sidebar.tsx, Dock.tsx, DashboardView.tsx
│   └── widgets/        - 21 widget files + WidgetRenderer.tsx
├── context/            - DashboardContext.tsx, AuthContext.tsx, hooks
├── hooks/              - useFirestore.ts, useStorage.ts
├── config/             - firebase.ts, widgetGradeLevels.ts
├── utils/              - migration.ts
├── scripts/            - setup-admins.js
├── App.tsx             - Root component
├── index.tsx           - Entry point
├── types.ts            - Global types, WidgetType union, TOOLS registry
├── *.config.{js,ts}    - Configuration files
└── .github/workflows/  - CI/CD pipelines
```

### Key Files (DO NOT MODIFY WITHOUT UNDERSTANDING)

- **types.ts** (392 lines): Central type system, WidgetType union, TOOLS registry, all widget config interfaces
- **DashboardContext.tsx** (467 lines): Global state management, widget CRUD, persistence
- **WidgetRenderer.tsx** (145 lines): Maps widget types to components
- **eslint.config.js**: ESLint 9 flat config - strict rules enforce code quality
- **tsconfig.json**: Strict TypeScript with `strict: true`, `noImplicitAny: true`

### State Management Pattern

Use `useDashboard()` hook to access centralized dashboard state:

```typescript
// Import using relative paths (project standard - NOT @ alias)
// Example from components/widgets/ subdirectory:
import { useDashboard } from '../../context/useDashboard';
const { widgets, addWidget, updateWidget, deleteWidget, bringToFront } =
  useDashboard();
```

Never manage z-index manually - use `bringToFront(id)`. State persists to Firestore automatically.

### Widget Development Pattern

**Every new widget requires changes to 5 files in this exact order:**

1. **types.ts**: Add to `WidgetType` union, create config interface, add to `WidgetConfig` union, update `ConfigForWidget` helper, add metadata to `TOOLS` array
2. **components/widgets/YourWidget.tsx**: Create component, **ALWAYS cast config** (e.g., `const config = widget.config as YourWidgetConfig`)
3. **components/widgets/WidgetRenderer.tsx**: Import component, add cases to `getWidgetContent()` and `getWidgetSettings()`
4. **context/DashboardContext.tsx**: Add default dimensions and initial config in `addWidget()` function
5. **config/widgetGradeLevels.ts**: Assign grade levels (K-2, 3-5, 6-8, 9-12, or Universal)

### Common Pitfalls (AVOID THESE)

- ❌ Editing files in `dist/` or `node_modules/` (build artifacts)
- ❌ Using `any` type (define explicit interfaces)
- ❌ Unhandled promises (use `void asyncFunc()` or `await` or `.catch()`)
- ❌ Suppression comments (eslint-disable, @ts-ignore)
- ❌ Manual z-index management (use `bringToFront()`)
- ❌ Defining context hooks in component files (causes Fast Refresh warnings)
- ❌ Multiple AudioContext instances per widget (use singleton pattern)

## CI/CD Workflows

### GitHub Actions (All run automatically)

**1. PR Validation** (`.github/workflows/pr-validation.yml`)

- Triggers: PRs to `main` or `dev-*` branches
- Steps: `npm ci` → `type-check` → `lint` → `format:check` → `build`
- **Build MUST succeed with 0 errors and 0 warnings**

**2. Production Deploy** (`.github/workflows/firebase-deploy.yml`)

- Triggers: Push to `main` branch
- Steps: Same validation + deploy to Firebase Hosting (live site)

**3. Dev Preview Deploy** (`.github/workflows/firebase-dev-deploy.yml`)

- Triggers: Push to `dev-paul`, `dev-jen`, or `dev-bailey` branches
- Steps: Same validation + deploy to persistent preview channels (30-day URLs)
- Preview URLs: `spartboard--dev-<name>-<hash>.web.app`

### Pre-commit Hook

Husky runs `lint-staged` automatically on commit:

- Auto-fixes ESLint errors on `.ts`, `.tsx` files
- Auto-formats all staged files with Prettier
- **Commit blocked if errors remain**

## Branching Strategy

- `main` - Production branch (protected, requires PR)
- `dev-paul`, `dev-jen`, `dev-bailey` - Developer test environments (auto-deploy to preview)
- Feature branches: Create PR from `dev-*` → `main`

**Workflow:** Make changes on dev branch → push → preview URL updates → create PR → merge to main → production deploy

## Firebase Configuration

- **Hosting:** Deploys `dist/` folder, SPA routing via rewrites to `/index.html`
- **Firestore:** Database with security rules in `firestore.rules`
- **Authentication:** Google Sign-In only
- **Admin Access:** Controlled via `admins` collection, setup via `scripts/setup-admins.js`

## Quick Reference Commands

```bash
npm ci                      # Install dependencies (always use this, not npm install)
npm run dev                 # Start dev server (port 3000)
npm run validate            # Run all checks (REQUIRED before commit)
npm run build               # Production build
npm run lint:fix            # Auto-fix linting issues
npm run format              # Auto-format all files
```

## Trust These Instructions

These instructions have been validated by running all commands successfully. Only search or explore if:

- Instructions are incomplete for your specific task
- You encounter errors not mentioned here
- You need to understand implementation details

**For any other scenario, trust and follow these instructions exactly as written.**
