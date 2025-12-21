# GitHub Copilot Instructions

This file provides guidance to GitHub Copilot when working with code in this repository.

## Project Overview

**Classroom Dashboard Pro** is an interactive classroom management dashboard built with React 19, TypeScript, and Vite. It provides teachers with drag-and-drop widgets for classroom management including timers, noise meters, drawing boards, webcams, polls, schedules, and more.

**Key Technologies:**

- React 19 with TypeScript
- Vite for build tooling
- Firebase for authentication and data storage
- Tailwind CSS for styling
- ESLint + Prettier for code quality

## Development Commands

```bash
npm install              # Install dependencies
npm run dev              # Start dev server (port 3000)
npm run build            # Build for production
npm run preview          # Preview production build
npm run lint             # Run ESLint
npm run lint:fix         # Auto-fix ESLint issues
npm run type-check       # TypeScript type checking
npm run format           # Format code with Prettier
npm run format:check     # Check code formatting
npm run validate         # Run all checks (type-check + lint + format)
```

## Code Quality Standards

### Pre-commit Hooks

- Husky runs `lint-staged` on commit
- Auto-fixes ESLint issues on staged files
- Formats code with Prettier
- **All TypeScript errors must be resolved**
- **Zero ESLint errors policy** (warnings are allowed)

### CI/CD Validation

All pull requests must pass:

- ✅ TypeScript type checking
- ✅ ESLint (zero errors)
- ✅ Prettier formatting check
- ✅ Successful build

## Project Architecture

### State Management

- **Context API**: All state managed through `context/DashboardContext.tsx`
- **Hook**: `useDashboard()` provides state and actions
- **Persistence**: localStorage with keys `classroom_dashboards` and `classroom_visible_tools`

### Widget System

- **Location**: `components/widgets/`
- **Pattern**: Each widget is a self-contained component
- **Naming**: `<WidgetName>Widget.tsx` with optional `<WidgetName>Settings.tsx`
- **Registry**: Widget types defined in `types.ts` with `TOOLS` metadata array
- **Rendering**: `WidgetRenderer.tsx` maps types to components

### Data Model

```typescript
// Dashboard structure
interface Dashboard {
  id: string;
  name: string;
  background: string; // Tailwind class or URL/data URI
  widgets: WidgetData[];
  createdAt: number;
}

// Widget structure
interface WidgetData {
  id: string;
  type: WidgetType; // Union of 20 widget types
  x: number; // Position in pixels
  y: number;
  w: number; // Dimensions in pixels
  h: number;
  z: number; // Z-index for stacking
  flipped: boolean; // Settings panel visibility
  minimized?: boolean; // Minimized state
  config: Record<string, any>; // Widget-specific config
}
```

### Component Hierarchy

```
App.tsx (root)
└── DashboardProvider (context wrapper)
    └── DashboardView
        ├── Background layer
        ├── WidgetRenderer (per widget)
        │   └── DraggableWindow (universal wrapper)
        │       ├── Front face (widget content)
        │       └── Back face (settings panel)
        ├── Sidebar (dashboard management)
        ├── Dock (widget toolbar)
        └── ToastContainer (notifications)
```

### Path Aliasing

- Use `@/` as alias for root directory
- Configured in `vite.config.ts` and `tsconfig.json`
- Example: `import { useDashboard } from '@/context/DashboardContext'`

## Coding Conventions

### TypeScript

- **Strict mode enabled** - All strict type-checking options are on
- Avoid `any` type - Use proper types or `unknown`
- Prefix unused variables with underscore: `_unusedVar`
- Handle all promises - Use `void`, `await`, or `.catch()`

### React Patterns

- Use functional components with hooks
- Use `React.FC<Props>` for component typing (established pattern in this codebase)
- Use `useDashboard()` hook for widget state updates
- Call `updateWidget(id, { config: {...} })` to persist changes

### Code Style

- **Formatting**: Prettier enforced (single quotes, 2 spaces, no semicolons where optional)
- **Imports**: Group by external, internal, relative
- **Comments**: Only add when necessary to explain complex logic
- **Console logs**: Allowed for warn/error, avoid for regular logs

### Widget Development

When creating a new widget:

1. **Define type** in `types.ts`:

   ```typescript
   // Add to WidgetType union
   export type WidgetType = 'clock' | 'timer' | 'newWidget' | ...;

   // Add to TOOLS array (import icon from lucide-react)
   import { Clock } from 'lucide-react';
   export const TOOLS: ToolMetadata[] = [
     { type: 'newWidget', icon: Clock, label: 'New Widget', color: 'bg-blue-500' },
     // ...
   ];
   ```

2. **Create component** in `components/widgets/`:

   ```typescript
   // NewWidgetWidget.tsx
   export const NewWidgetWidget: React.FC<{ widget: WidgetData }> = ({
     widget,
   }) => {
     const { updateWidget } = useDashboard();
     // Widget implementation
   };

   // Optional settings component
   export const NewWidgetSettings: React.FC<{ widget: WidgetData }> = ({
     widget,
   }) => {
     // Settings implementation
   };
   ```

3. **Add default config** in `context/DashboardContext.tsx`:

   ```typescript
   const defaults = {
     newWidget: {
       w: 300,
       h: 200,
       config: {
         /* defaults */
       },
     },
   };
   ```

4. **Register in WidgetRenderer**:

   ```typescript
   // Import components
   import { NewWidgetWidget, NewWidgetSettings } from './NewWidgetWidget';

   // Add to getWidgetContent()
   case 'newWidget': return <NewWidgetWidget widget={widget} />;

   // Add to getWidgetSettings() if settings exist
   case 'newWidget': return <NewWidgetSettings widget={widget} />;
   ```

### Important Patterns

**DraggableWindow**: All widgets are wrapped automatically - provides:

- Drag-to-move (via title bar)
- Resize (bottom-right corner)
- Flip for settings (gear icon)
- Z-index management (click to bring to front)
- Close button

**Audio Context**: Use singleton pattern to avoid context limits:

```typescript
let audioContext: AudioContext | null = null;
const getAudioContext = () => {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
};
```

**State Updates**: Always use `updateWidget()` for persistence:

```typescript
const { updateWidget } = useDashboard();
updateWidget(widget.id, {
  config: { ...widget.config, newValue: value },
});
```

## Environment Configuration

Create `.env.local` with:

```bash
# Firebase
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Gemini AI
GEMINI_API_KEY=your_gemini_api_key
```

## Admin User Management

Admin access can be set up via Firebase Firestore:

- Admin emails are configured in `scripts/setup-admins.js`
- Admin documents stored in Firestore `admins` collection
- See `ADMIN_SETUP.md` for detailed setup instructions
- Current `AuthContext.tsx` provides basic authentication (user, signInWithGoogle, signOut)

**Note**: Admin role checking (isAdmin flag) is documented in ADMIN_SETUP.md but not yet implemented in AuthContext. If you need admin functionality, refer to the setup documentation.

## Development Workflow

### Branch Strategy

- `main` - Production branch (deploys to live site)
- `dev-*` - Developer branches (deploy to preview channels)
  - `dev-lead`, `dev-developer1`, `dev-developer2`
- Each dev branch gets a persistent Firebase preview URL

### Making Changes

1. Create/checkout your dev branch
2. Make changes and commit
3. Push to your branch (auto-deploys to preview)
4. Test on preview URL
5. Create PR to `main` when ready
6. PR validation runs automatically
7. After approval, merge deploys to production

### Before Committing

- Pre-commit hook runs automatically
- Fix any ESLint errors shown
- Warnings won't block but should be addressed

### Before Pushing

```bash
npm run validate  # Runs type-check + lint + format:check
```

## Common Gotchas

- Widget z-index starts at 1, increments on interaction - use `bringToFront(id)`, don't set manually
- Background can be Tailwind class OR URL/data URI
- Widget dimensions are in pixels, not percentages
- `flipped` state managed by DraggableWindow, not individual widgets
- Audio contexts must be resumed on user interaction
- Always use `@/` path alias for imports from root

## File Structure

```
/
├── .github/
│   └── workflows/           # CI/CD workflows
├── components/
│   ├── auth/               # Authentication components
│   ├── common/             # Shared components (DraggableWindow)
│   ├── layout/             # Layout components (Sidebar, Dock)
│   └── widgets/            # Widget components (20+ widgets)
├── context/
│   ├── AuthContext.tsx     # Authentication state
│   └── DashboardContext.tsx # Dashboard state & logic
├── hooks/                  # Custom React hooks
├── scripts/                # Admin setup scripts
├── utils/                  # Utility functions
├── App.tsx                 # Root component
├── types.ts                # TypeScript type definitions
├── vite.config.ts          # Vite configuration
└── tsconfig.json           # TypeScript configuration
```

## Key Files Reference

- `App.tsx` - Root component, background rendering, toast system
- `types.ts` - All TypeScript types, TOOLS registry (20 widget types)
- `context/DashboardContext.tsx` - Global state management (15+ actions)
- `components/common/DraggableWindow.tsx` - Universal widget wrapper
- `components/layout/Sidebar.tsx` - Dashboard switcher, background selector
- `components/layout/Dock.tsx` - Collapsible widget toolbar
- `components/widgets/WidgetRenderer.tsx` - Widget type → component mapper

## Testing Approach

- No formal test framework currently in place
- Manual testing on preview deployments
- CI validates: type checking, linting, formatting, builds
- Test widget functionality in dev environment before PR

## Browser Permissions

The app may request:

- Camera (for Webcam widget)
- Microphone (for Sound Meter widget)
- Geolocation (for Weather widget)

Permissions defined in `metadata.json`

## Additional Documentation

- `CLAUDE.md` - Comprehensive guide for Claude AI
- `DEV_WORKFLOW.md` - Detailed workflow and deployment guide
- `LINTING_SETUP.md` - Linting and type checking details
- `ADMIN_SETUP.md` - Admin user setup instructions
- `README.md` - Quick start guide
