# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Classroom Dashboard Pro is an interactive classroom management dashboard built with React 19, TypeScript, and Vite. It provides teachers with drag-and-drop widgets for classroom management including timers, noise meters, drawing boards, webcams, polls, schedules, and more.

## Development Commands

- **Start dev server**: `npm run dev` (runs on port 3000)
- **Build for production**: `npm run build`
- **Preview production build**: `npm run preview`
- **Install dependencies**: `npm install`

## Environment Configuration

The app requires Firebase configuration and a Gemini API key:

- Create `.env.local` in the root directory
- Add Firebase config:
  - `VITE_FIREBASE_API_KEY=your_firebase_api_key`
  - `VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com`
  - `VITE_FIREBASE_PROJECT_ID=your_project_id`
  - `VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com`
  - `VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id`
  - `VITE_FIREBASE_APP_ID=your_app_id`
- Add Gemini API key for AI features:
  - `GEMINI_API_KEY=your_api_key_here`
- The Vite config exposes these as environment variables

## Architecture

### Core Patterns

**State Management**: Centralized through React Context (`DashboardContext.tsx`)

- All dashboard state, widgets, and persistence logic lives in `context/DashboardContext.tsx`
- Uses localStorage with key `classroom_dashboards` for dashboard persistence
- Uses localStorage with key `classroom_visible_tools` for tool visibility settings
- Provides hooks: `useDashboard()` for accessing state and actions throughout the app

**Widget System**: Plugin-based architecture

- Each widget is a self-contained component in `components/widgets/`
- Widget types are defined in `types.ts` with the `WidgetType` union and `TOOLS` metadata array
- All widgets follow the pattern: `<WidgetName>Widget` component + optional `<WidgetName>Settings` component
- Widgets are rendered through `WidgetRenderer.tsx` which maps widget types to components
- Each widget receives a `widget: WidgetData` prop containing position, size, z-index, and config

**Data Model**:

- `Dashboard`: Contains id, name, background, widgets array, and createdAt timestamp
- `WidgetData`: Contains id, type, position (x, y), dimensions (w, h), z-index (z), flipped state, and a flexible config object
- Widget configs are type-specific and defined with defaults in `DashboardContext.tsx` line 128-149

**Component Hierarchy**:

```
App.tsx (root)
└── DashboardProvider (context wrapper)
    └── DashboardView
        ├── Background layer
        ├── WidgetRenderer (one per widget)
        │   └── DraggableWindow (wraps all widgets)
        │       ├── Front face (widget content)
        │       └── Back face (settings panel)
        ├── Sidebar (dashboard + background management)
        ├── Dock (widget toolbar)
        └── ToastContainer (notifications)
```

### Key Files

- `App.tsx`: Root component with background rendering, widget display area, and toast system
- `types.ts`: All TypeScript type definitions and the TOOLS registry (20 widget types)
- `context/DashboardContext.tsx`: Global state management with 15+ actions for dashboard/widget manipulation
- `components/common/DraggableWindow.tsx`: Universal wrapper providing drag/resize/flip/z-index for all widgets
- `components/layout/Sidebar.tsx`: Dashboard switcher, background selector (presets/colors/gradients), and tool visibility manager
- `components/layout/Dock.tsx`: Collapsible bottom toolbar for adding widgets
- `components/widgets/WidgetRenderer.tsx`: Central router mapping widget types to component implementations

### Path Aliasing

The project uses `@/` as an alias for the root directory:

- Configured in `vite.config.ts` (line 18-20) and `tsconfig.json` (line 21-24)
- Example: `import { useDashboard } from '@/context/DashboardContext'`

## Adding a New Widget

1. **Define the widget type** in `types.ts`:
   - Add to the `WidgetType` union (line 8-12)
   - Add metadata entry to `TOOLS` array with icon, label, and color (line 48-69)

2. **Create widget component** in `components/widgets/`:
   - Follow naming: `<WidgetName>Widget.tsx`
   - Export main component: `export const <WidgetName>Widget: React.FC<{ widget: WidgetData }>`
   - Optionally export settings: `export const <WidgetName>Settings: React.FC<{ widget: WidgetData }>`
   - Use `useDashboard()` hook to access `updateWidget()` for config changes

3. **Add default config** in `DashboardContext.tsx`:
   - Add entry to the `defaults` object in `addWidget()` function (line 128-149)
   - Include default dimensions (w, h) and initial config values

4. **Register in WidgetRenderer**:
   - Import components in `WidgetRenderer.tsx`
   - Add case to `getWidgetContent()` switch (line 28-50)
   - Add case to `getWidgetSettings()` switch if settings exist (line 54-70)
   - Optionally customize title in `getTitle()` (line 73-81)

## Widget Development Patterns

**Audio Context Management**: Widgets using sound (Timer, Stopwatch) use a global AudioContext singleton pattern to avoid context limits. See `TimerWidget.tsx` lines 8-15.

**Persistence**: Widget state changes should update via `updateWidget(id, { config: {...} })` which automatically syncs to the context. Use `saveCurrentDashboard()` only for manual save operations.

**Draggable Window**: All widgets are wrapped in `DraggableWindow` which provides:

- Drag-to-move via title bar
- Resize via bottom-right corner handle
- Flip animation to reveal settings panel
- Z-index management (click to bring to front)
- Close button to remove widget

**Settings Panel**: Accessible by clicking the gear icon. Settings flip to the back of the widget card. Use the `useDashboard().updateWidget()` hook to save config changes.

## UI Styling

- **Design System**: Tailwind CSS with custom classes
- **Color Palette**: Primarily slate grays with accent colors per widget type
- **Animations**: Uses Tailwind's `animate-in`, `slide-in-from-*`, and custom transitions
- **Responsive**: Mobile-friendly dock and sidebar designs with viewport-based scaling

## Browser Permissions

The app requests camera, microphone, and geolocation permissions (see `metadata.json`) for widgets like Webcam, Sound Meter, and Weather.

## Data Persistence

All data is stored in browser localStorage:

- Dashboards can be exported/imported via JSON (Sidebar share/import buttons)
- No backend or database required
- Background images can be URLs or Base64-encoded data URIs

## Admin User Management

The app uses Firebase Authentication with admin role management through Firestore:

### Admin Access Control

- Admin status is checked via Firestore `admins` collection
- Each admin email has a document in `/admins/{email}`
- The `isAdmin` flag from `useAuth()` hook indicates admin status
- Firestore Security Rules enforce admin-only access to sensitive collections

### Setting Up Admin Users

1. **Update admin email list** in [src/context/AuthContext.tsx](src/context/AuthContext.tsx):

   ```typescript
   const ADMIN_EMAILS = [
     'your-email@example.com',
     'teammate1@example.com',
     'teammate2@example.com',
   ];
   ```

2. **Deploy Firestore Security Rules**:

   ```bash
   firebase deploy --only firestore:rules
   ```

3. **Run the admin setup script**:

   ```bash
   # Install firebase-admin if not already installed
   npm install firebase-admin

   # Get service account credentials from Firebase Console:
   # Project Settings > Service Accounts > Generate New Private Key
   # Save as scripts/service-account-key.json

   # Update ADMIN_EMAILS in scripts/setup-admins.js
   # Then run:
   node scripts/setup-admins.js
   ```

### Security Notes

- Admin documents in Firestore can only be created via Firebase Console or Admin SDK
- Regular users cannot grant themselves admin access
- The `isAdmin` check is enforced server-side via Firestore Security Rules
- Service account keys should never be committed to git (already in .gitignore)

### Using Admin Status in Components

```typescript
import { useAuth } from '@/context/AuthContext';

function MyComponent() {
  const { isAdmin } = useAuth();

  return isAdmin ? (
    <AdminPanel />
  ) : (
    <RegularUserView />
  );
}
```

## Common Gotchas

- Widget z-index starts at 1 and increments. Don't manually set z-index; use `bringToFront(id)`
- Background can be a Tailwind class string OR a URL/data URI (handled in `App.tsx` lines 36-58)
- Widget dimensions use px values, not percentages
- The `flipped` state is managed by DraggableWindow, not individual widgets
- Audio contexts must be resumed on user interaction (see Timer/Stopwatch unlock patterns)
- Admin status requires both the ADMIN_EMAILS list AND the Firestore admin document to exist
