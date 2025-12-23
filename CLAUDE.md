# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Classroom Dashboard Pro is an interactive classroom management dashboard built with React 19, TypeScript, and Vite. It provides teachers with drag-and-drop widgets for classroom management including timers, noise meters, drawing boards, webcams, polls, schedules, and more.

**Key Features:**

- 20 widget types for classroom management
- Firebase Authentication with Google Sign-In
- Cloud-synced dashboards via Firestore
- Feature permissions system for widget access control
- Admin panel for user management
- Real-time collaboration support
- Drag-and-drop, resizable widgets
- Custom backgrounds (colors, gradients, images)

## Project Structure

**IMPORTANT:** This project uses a **flat file structure** - there is NO `src/` directory. All TypeScript/React files are in root-level directories:

```
/
├── components/           # All React components
│   ├── admin/           # Admin-only components (FeaturePermissionsManager, AdminSettings)
│   ├── auth/            # Authentication UI (LoginScreen)
│   ├── common/          # Shared components (DraggableWindow)
│   ├── layout/          # Layout components (Sidebar, Dock, DashboardView)
│   └── widgets/         # 21 widget implementations + WidgetRenderer
├── context/             # React Context providers
│   ├── AuthContext.tsx       # Authentication and permissions
│   ├── DashboardContext.tsx  # Dashboard state management
│   └── *.ts files            # Type definitions for contexts
├── hooks/               # Custom React hooks
│   ├── useFirestore.ts  # Firestore CRUD operations
│   └── useStorage.ts    # Firebase Storage operations
├── config/              # Configuration files
│   └── firebase.ts      # Firebase initialization
├── utils/               # Utility functions
│   └── migration.ts     # localStorage to Firestore migration
├── scripts/             # Setup and maintenance scripts
│   └── setup-admins.js  # Admin user setup script
├── .github/workflows/   # CI/CD GitHub Actions
│   ├── pr-validation.yml        # PR validation checks
│   ├── firebase-deploy.yml      # Production deployment
│   └── firebase-dev-deploy.yml  # Dev branch previews
├── App.tsx              # Root component
├── index.tsx            # Application entry point
├── types.ts             # Global TypeScript types and TOOLS registry
├── vite.config.ts       # Vite configuration
├── tsconfig.json        # TypeScript configuration
├── eslint.config.js     # ESLint configuration
└── firestore.rules      # Firestore security rules
```

## Development Commands

- **Start dev server**: `npm run dev` (runs on port 3000)
- **Build for production**: `npm run build`
- **Preview production build**: `npm run preview`
- **Install dependencies**: `npm install`

### Code Quality Commands

- **Type checking**: `npm run type-check`
- **Linting**: `npm run lint` (fails on errors, allows warnings)
- **Auto-fix linting**: `npm run lint:fix`
- **Format code**: `npm run format`
- **Check formatting**: `npm run format:check`
- **Validate all**: `npm run validate` (type-check + lint + format-check)

See [LINTING_SETUP.md](LINTING_SETUP.md) for detailed linting and CI/CD configuration.

## Environment Configuration

The app requires Firebase configuration and a Gemini API key:

1. Create `.env.local` in the root directory
2. Add Firebase config:
   ```env
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```
3. Add Gemini API key for AI features:
   ```env
   VITE_GEMINI_API_KEY=your_api_key_here
   ```
4. The Vite config exposes these as environment variables

**Security Note:** Never commit `.env.local` to git. It's in `.gitignore`.

### Authentication Bypass (Testing Only)

For development and automated testing, you can enable an authentication bypass mode.

- **Enable**: Set `VITE_AUTH_BYPASS='true'` in your `.env.local` or environment.
- **Behavior**:
  - The app will use a mock user (`mock-user-id`) with full admin privileges.
  - Firebase Auth and Firestore permission listeners are bypassed.
  - Sign-in/Sign-out actions modify local state only.
- **Safety**: This mode is automatically disabled in production builds (`import.meta.env.PROD`), but should never be enabled in a production environment configuration.
- **Limitation**: This is a client-side bypass only. It does **not** bypass server-side Firestore security rules. If your testing involves real Firestore interactions, you must configure security rules to allow access for the mock user or use the Firebase Emulator Suite.

## Architecture

### Core Patterns

**State Management**: Centralized through React Context

- **DashboardContext** (`context/DashboardContext.tsx`): All dashboard state, widgets, and persistence logic
  - Uses Firestore for cloud storage with real-time sync
  - Falls back to localStorage for tool visibility preferences
  - Provides `useDashboard()` hook for accessing state and actions
  - Automatic migration from localStorage to Firestore on first sign-in

- **AuthContext** (`context/AuthContext.tsx`): Authentication and permissions
  - Firebase Authentication with Google Sign-In
  - Admin status checking via Firestore `admins` collection
  - Feature permissions for widget access control
  - Provides `useAuth()` hook with `user`, `isAdmin`, `canAccessWidget()`

**Widget System**: Plugin-based architecture

- Each widget is a self-contained component in `components/widgets/`
- Widget types are defined in `types.ts` with the `WidgetType` union (21 types) and `TOOLS` metadata array
- All widgets follow the pattern: `<WidgetName>Widget` component + optional `<WidgetName>Settings` component
- Widgets are rendered through `WidgetRenderer.tsx` which maps widget types to components
- Each widget receives a `widget: WidgetData` prop containing position, size, z-index, and config

**Data Model**:

- `Dashboard`: Contains id, name, background, widgets array, and createdAt timestamp
- `WidgetData`: Contains id, type, position (x, y), dimensions (w, h), z-index (z), flipped state, minimized state, and a flexible config object
- `FeaturePermission`: Controls widget access with accessLevel ('admin' | 'beta' | 'public'), betaUsers array, and enabled flag

**Component Hierarchy**:

```
App.tsx (root)
└── AuthProvider (authentication context)
    └── DashboardProvider (dashboard context wrapper)
        └── Conditional: isAuthenticated?
            ├── DashboardView (main app)
            │   ├── Background layer
            │   ├── WidgetRenderer (one per widget)
            │   │   └── DraggableWindow (wraps all widgets)
            │   │       ├── Front face (widget content)
            │   │       └── Back face (settings panel)
            │   ├── Sidebar (dashboard + background management)
            │   ├── Dock (widget toolbar)
            │   └── AdminSettings (admin-only)
            └── ToastContainer (notifications)
            OR
            └── LoginScreen (if not authenticated)
```

### Key Files

**Root Level:**

- `App.tsx`: Root component with AuthProvider, DashboardProvider, and conditional rendering
- `index.tsx`: Application entry point, mounts App to DOM
- `types.ts`: All TypeScript type definitions and the TOOLS registry (20 widget types)

**Context:**

- `context/DashboardContext.tsx`: Global state management with 15+ actions for dashboard/widget manipulation
- `context/AuthContext.tsx`: Authentication state, admin status, and permission checking

**Components:**

- `components/common/DraggableWindow.tsx`: Universal wrapper providing drag/resize/flip/z-index for all widgets
- `components/layout/Sidebar.tsx`: Dashboard switcher, background selector (presets/colors/gradients), and tool visibility manager
- `components/layout/Dock.tsx`: Collapsible bottom toolbar for adding widgets (respects permissions)
- `components/layout/DashboardView.tsx`: Main dashboard view with widget rendering
- `components/widgets/WidgetRenderer.tsx`: Central router mapping widget types to component implementations
- `components/admin/FeaturePermissionsManager.tsx`: Admin UI for managing widget access permissions
- `components/admin/AdminSettings.tsx`: Admin panel with user management tools
- `components/auth/LoginScreen.tsx`: Google Sign-In UI

**Hooks:**

- `hooks/useFirestore.ts`: Firestore CRUD operations for dashboards
- `hooks/useStorage.ts`: Firebase Storage operations for file uploads

**Config:**

- `config/firebase.ts`: Firebase initialization with auth, firestore, and storage

### Path Aliasing

The project uses `@/` as an alias for the **root directory** (not `src/`):

- Configured in `vite.config.ts` (line 12-14) and `tsconfig.json` (line 15-17)
- Example: `import { useDashboard } from '@/context/DashboardContext'`
- Maps to: `/context/DashboardContext.tsx` (no src folder)

## Firestore Data Structure

### Collections

```
/users/{userId}/dashboards/{dashboardId}
  - id: string
  - name: string
  - background: string
  - widgets: WidgetData[]
  - createdAt: number

/admins/{email}
  - (document exists = user is admin)

/feature_permissions/{widgetType}
  - widgetType: WidgetType
  - accessLevel: 'admin' | 'beta' | 'public'
  - betaUsers: string[] (email addresses)
  - enabled: boolean
```

### Security Rules

- Dashboards: Users can only read/write their own dashboards
- Admins: Only admins can create admin documents (via Admin SDK or Console)
- Feature Permissions: All authenticated users can read, only admins can write

See `firestore.rules` for complete security rules.

## Feature Permissions System

**New in v1.1.0** - Granular access control for widgets

### How It Works

1. **Default Behavior**: If no permission record exists for a widget, it's accessible to all authenticated users (public)
2. **Access Levels**:
   - `admin`: Only administrators can access (alpha testing)
   - `beta`: Only users in the betaUsers email list can access (beta testing)
   - `public`: All authenticated users can access (general availability)
3. **Disable Widgets**: Set `enabled: false` to disable a widget for everyone (including admins)

### Managing Permissions

**As an Admin:**

1. Access Admin Settings from the Sidebar (gear icon)
2. Navigate to "Feature Permissions" tab
3. For each widget, set:
   - Access Level (Admin/Beta/Public)
   - Enabled status
   - Beta user emails (for beta access level)
4. Save changes

**Programmatically:**

```typescript
import { useAuth } from '@/context/useAuth';

function MyComponent() {
  const { canAccessWidget } = useAuth();

  if (canAccessWidget('timer')) {
    // User can access timer widget
  }
}
```

### Implementation Details

- Permissions are stored in Firestore `feature_permissions` collection
- Real-time sync via `onSnapshot` in AuthContext
- Dock automatically filters widgets based on permissions
- Adding a widget that user can't access shows an error toast

## Adding a New Widget

### 1. Define the Widget Type

In `types.ts`:

**a) Add to WidgetType union** (around line 23-43):

```typescript
export type WidgetType =
  | 'clock'
  | 'timer'
  // ... existing types
  | 'yourNewWidget'; // Add here
```

**b) Add metadata to TOOLS array** (around line 80-126):

```typescript
export const TOOLS: ToolMetadata[] = [
  // ... existing tools
  {
    type: 'yourNewWidget',
    icon: YourIcon, // from lucide-react
    label: 'Your Widget',
    color: 'bg-purple-500',
  },
];
```

### 2. Create Widget Component

In `components/widgets/YourNewWidget.tsx`:

```typescript
import React from 'react';
import { WidgetData } from '@/types';
import { useDashboard } from '@/context/useDashboard';

export const YourNewWidget: React.FC<{ widget: WidgetData }> = ({ widget }) => {
  const { updateWidget } = useDashboard();

  // Access config
  const { someSetting } = widget.config;

  // Update config
  const handleChange = (newValue: string) => {
    updateWidget(widget.id, {
      config: { ...widget.config, someSetting: newValue }
    });
  };

  return (
    <div className="p-4">
      {/* Your widget UI */}
    </div>
  );
};

// Optional: Settings panel (shown when widget is flipped)
export const YourNewWidgetSettings: React.FC<{ widget: WidgetData }> = ({ widget }) => {
  const { updateWidget } = useDashboard();

  return (
    <div className="p-4">
      {/* Your settings UI */}
    </div>
  );
};
```

### 3. Add Default Config

In `context/DashboardContext.tsx`, in the `addWidget` function (around line 255-340):

```typescript
const defaults: Record<string, Partial<WidgetData>> = {
  // ... existing defaults
  yourNewWidget: {
    w: 300,
    h: 200,
    config: {
      someSetting: 'defaultValue',
      anotherSetting: true,
    },
  },
};
```

### 4. Register in WidgetRenderer

In `components/widgets/WidgetRenderer.tsx`:

**a) Import component** (top of file):

```typescript
import { YourNewWidget, YourNewWidgetSettings } from './YourNewWidget';
```

**b) Add to getWidgetContent()** (around line 28-77):

```typescript
const getWidgetContent = (widget: WidgetData) => {
  switch (widget.type) {
    // ... existing cases
    case 'yourNewWidget':
      return <YourNewWidget widget={widget} />;
    // ... rest
  }
};
```

**c) Add to getWidgetSettings()** if settings exist (around line 79-116):

```typescript
const getWidgetSettings = (widget: WidgetData) => {
  switch (widget.type) {
    // ... existing cases
    case 'yourNewWidget':
      return <YourNewWidgetSettings widget={widget} />;
    // ... rest
  }
};
```

**d) Optionally customize title in getTitle()** (around line 118-126):

```typescript
const getTitle = (widget: WidgetData) => {
  switch (widget.type) {
    // ... existing cases
    case 'yourNewWidget':
      return widget.config.customTitle || 'Your Widget';
    // ... rest
  }
};
```

### 5. Test Your Widget

1. Run `npm run dev`
2. Open the Dock (bottom toolbar)
3. Click your new widget to add it
4. Test drag, resize, flip, settings
5. Refresh page to ensure persistence works

## Widget Development Patterns

### Audio Context Management

Widgets using sound (Timer, Stopwatch, SoundWidget) use a global AudioContext singleton pattern to avoid browser's context limits:

```typescript
let globalAudioContext: AudioContext | null = null;

const getAudioContext = (): AudioContext => {
  if (!globalAudioContext) {
    globalAudioContext = new AudioContext();
  }
  return globalAudioContext;
};
```

See `components/widgets/TimerWidget.tsx` lines 6-17 for reference.

### Persistence

- Widget state changes should update via `updateWidget(id, { config: {...} })` which automatically syncs to Firestore
- Use `saveCurrentDashboard()` only for manual save operations (rare)
- Firestore updates are debounced to avoid excessive writes

### Draggable Window

All widgets are wrapped in `DraggableWindow` which provides:

- **Drag to move**: Click and drag title bar
- **Resize**: Drag bottom-right corner handle
- **Flip animation**: Click gear icon to reveal settings panel
- **Z-index management**: Click widget to bring to front
- **Close button**: Remove widget from dashboard
- **Minimize**: Collapse to title bar only

### Settings Panel

- Accessible by clicking the gear icon on any widget
- Settings flip to the back of the widget card
- Use `useDashboard().updateWidget()` hook to save config changes
- Changes are auto-saved to Firestore

### Using Hooks

**Dashboard Actions:**

```typescript
const {
  dashboards,
  activeDashboard,
  addWidget,
  updateWidget,
  deleteWidget,
  bringToFront,
  saveCurrentDashboard,
  createDashboard,
  deleteDashboard,
  switchDashboard,
} = useDashboard();
```

**Authentication & Permissions:**

```typescript
const {
  user,
  isAdmin,
  loading,
  signIn,
  signOut,
  canAccessWidget,
  featurePermissions,
} = useAuth();
```

## UI Styling

- **Design System**: Tailwind CSS with custom classes
- **Color Palette**: Primarily slate grays with accent colors per widget type
- **Animations**: Uses Tailwind's `animate-in`, `slide-in-from-*`, and custom transitions
- **Responsive**: Mobile-friendly dock and sidebar designs with viewport-based scaling
- **Dark Mode**: Default slate-900 background, designed for dark UI

### Tailwind Configuration

Standard Tailwind classes work out of the box. Common patterns:

- Cards: `bg-white/10 backdrop-blur-sm rounded-lg border border-white/20`
- Buttons: `bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition`
- Inputs: `bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white`

## Browser Permissions

The app requests camera, microphone, and geolocation permissions for specific widgets:

- **Webcam Widget**: Camera access
- **Sound Widget**: Microphone access (for noise meter)
- **Weather Widget**: Geolocation access (optional)

See `metadata.json` for manifest configuration.

## Data Persistence

### Firestore (Primary)

- All dashboards are stored in Firestore under `/users/{userId}/dashboards/`
- Real-time sync via `onSnapshot` listeners
- Automatic migration from localStorage on first sign-in
- Supports multiple users sharing the same dashboard (future feature)

### localStorage (Fallback)

- Tool visibility settings: `classroom_visible_tools`
- Legacy dashboard data: `classroom_dashboards` (migrated to Firestore)

### Export/Import

- Export: Downloads dashboard as JSON file (Sidebar share button)
- Import: Upload JSON file to restore dashboard (Sidebar import button)
- Useful for backup or sharing dashboards

## Admin User Management

The app uses Firebase Authentication with admin role management through Firestore. See [ADMIN_SETUP.md](ADMIN_SETUP.md) for detailed setup instructions.

### Admin Access Control

- Admin status is checked via Firestore `admins` collection
- Each admin email has a document in `/admins/{email}`
- The `isAdmin` flag from `useAuth()` hook indicates admin status
- Firestore Security Rules enforce admin-only access to sensitive collections

### Setting Up Admin Users

1. **Add admin email to Firestore**:
   - Use Firebase Console or Admin SDK
   - Create document in `/admins/{email}` collection
   - Document can be empty (existence = admin)

2. **Deploy Firestore Security Rules**:

   ```bash
   firebase deploy --only firestore:rules
   ```

3. **Run the admin setup script** (optional):
   ```bash
   npm install firebase-admin
   # Get service account credentials from Firebase Console
   # Save as scripts/service-account-key.json
   node scripts/setup-admins.js
   ```

### Admin Features

- **Feature Permissions Manager**: Control widget access levels
- **User Management**: View and manage user accounts (future)
- **Analytics**: Usage statistics (future)

### Using Admin Status in Components

```typescript
import { useAuth } from '@/context/useAuth';

function MyComponent() {
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    return <p>Access denied</p>;
  }

  return <AdminPanel />;
}
```

## CI/CD and Code Quality

### GitHub Actions Workflows

**1. PR Validation** (`.github/workflows/pr-validation.yml`)

- Runs on PRs to `main` and `dev-*` branches
- Checks: type-check, lint, format-check, build
- Adds comment to PR with results
- **Enforces**: Zero TypeScript errors, zero ESLint errors, proper formatting

**2. Production Deploy** (`.github/workflows/firebase-deploy.yml`)

- Runs on pushes to `main` branch
- Same validation as PR + deploy to Firebase live site
- Production URL: https://spartboard.web.app

**3. Dev Branch Deploy** (`.github/workflows/firebase-dev-deploy.yml`)

- Runs on pushes to configured dev branches (`dev-lead`, `dev-developer1`, `dev-developer2`, etc.)
- Creates persistent preview URLs (30 days)
- Pattern: `https://spartboard--dev-{branch}-XXXXXXXX.web.app`

See [DEV_WORKFLOW.md](DEV_WORKFLOW.md) for development branch workflow.

### Pre-commit Hooks

- **Husky** runs `lint-staged` on git commit
- Auto-formats staged files with Prettier
- Auto-fixes ESLint issues where possible
- Commit blocked if errors remain

### Code Quality Standards

- **TypeScript**: Strict mode enabled, no `any` without explicit annotation
- **ESLint**: Zero errors allowed, warnings acceptable
- **Prettier**: All files must be formatted
- **Tests**: (Not yet implemented)

See [LINTING_SETUP.md](LINTING_SETUP.md) for complete linting documentation.

## Common Gotchas

### File Structure

- **No `src/` directory!** All files are in root-level directories (`components/`, `context/`, etc.)
- Path alias `@/` maps to root, not to `src/`

### Widget Development

- Widget z-index starts at 1 and increments. Don't manually set z-index; use `bringToFront(id)`
- Widget dimensions use px values, not percentages
- The `flipped` state is managed by DraggableWindow, not individual widgets
- Audio contexts must be resumed on user interaction (see Timer/Stopwatch unlock patterns)

### Authentication & Permissions

- Admin status requires the Firestore admin document to exist
- `isAdmin` is `null` while loading, `true`/`false` when loaded
- Feature permissions default to public if not set
- `canAccessWidget()` returns false if widget is disabled or user lacks permission

### Firestore

- Dashboard IDs are UUIDs, not Firestore auto-IDs
- Always check `user?.uid` before Firestore operations
- Real-time listeners must be cleaned up (return unsubscribe function)

### Styling

- Background can be a Tailwind class string OR a URL/data URI (handled in `components/layout/DashboardView.tsx`)
- Custom backgrounds set via inline style, not className
- Widgets should use transparent/semi-transparent backgrounds to blend with dashboard background

### Migration

- localStorage data is automatically migrated to Firestore on first sign-in
- Migration only runs once per user (tracked via `migrated` state)
- Old localStorage data is deleted after successful migration

## Testing

**Current Status**: No automated tests yet

**Future Plans**:

- Vitest for unit tests
- React Testing Library for component tests
- Playwright for E2E tests

## Performance Considerations

- Widgets are NOT virtualized - limit to ~20 widgets per dashboard for best performance
- Firestore real-time listeners are efficient but multiply with users
- Large canvas drawings (DrawingWidget) can impact performance
- Webcam/video streams are resource-intensive

## Browser Support

- **Recommended**: Chrome 90+, Edge 90+, Firefox 88+, Safari 14+
- **Required**: ES2022 support, CSS Grid, Flexbox, WebRTC (for camera/mic)
- **Mobile**: Responsive but optimized for tablet/desktop

## Troubleshooting

### Build fails with "Cannot find module '@/...'"

- Check `vite.config.ts` and `tsconfig.json` path alias configuration
- Ensure path starts from root, not `src/`

### "User not authenticated" errors

- Check Firebase config in `.env.local`
- Ensure user is signed in before accessing Firestore
- Check `useAuth()` `loading` state before rendering

### Widgets not saving

- Check Firestore rules allow user to write to their dashboards
- Check browser console for Firestore errors
- Verify `updateWidget()` is called with correct widget ID

### Admin features not showing

- Check Firestore `admins/{email}` document exists
- Wait for `isAdmin` to load (check for `null` vs `false`)
- Check `useAuth()` `loading` state

### Linting errors blocking commits

- Run `npm run lint:fix` to auto-fix
- Check pre-commit hook output for specific errors
- See [LINTING_SETUP.md](LINTING_SETUP.md)

## Resources

- **Documentation**: See `*.md` files in root
- **Firebase Console**: https://console.firebase.google.com
- **Vite Docs**: https://vitejs.dev
- **React 19 Docs**: https://react.dev
- **Tailwind CSS**: https://tailwindcss.com
- **Lucide Icons**: https://lucide.dev

## Contributing

1. Create a dev branch: `dev-yourname`
2. Make changes and commit (pre-commit hooks will run)
3. Push to your dev branch (creates preview deployment)
4. Test on preview URL
5. Create PR to `main`
6. Wait for PR validation to pass
7. Request review
8. Merge after approval

---

**Last Updated**: 2025-12-22
**Version**: 1.1.0
