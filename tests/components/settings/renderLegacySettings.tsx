import React, { Suspense } from 'react';
import { render, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { WidgetData, WidgetType } from '@/types';
import { WIDGET_DEFAULTS } from '@/config/widgetDefaults';
import {
  WIDGET_SETTINGS_COMPONENTS,
  WIDGET_APPEARANCE_COMPONENTS,
} from '@/components/widgets/WidgetRegistry';
import {
  DashboardContext,
  DashboardContextValue,
} from '@/context/DashboardContextValue';
import { AuthContext, AuthContextType } from '@/context/AuthContextValue';
import {
  CustomWidgetsContext,
  CustomWidgetsContextValue,
} from '@/context/CustomWidgetsContextValue';
import {
  SavedWidgetsContext,
  SavedWidgetsContextValue,
} from '@/context/SavedWidgetsContextValue';
import {
  ToolVisibilityContext,
  ToolVisibilityContextValue,
} from '@/context/ToolVisibilityContextValue';

export type LegacySlot = 'settings' | 'appearance';

const FALLBACK_TEXT = 'legacy-settings-loading';

/** Fixed widget id so snapshots never embed a random uuid. */
export const LEGACY_WIDGET_ID = 'legacy-settings-widget';

export const buildLegacyWidget = (type: WidgetType): WidgetData => {
  const defaults = WIDGET_DEFAULTS[type] ?? {};
  return {
    ...defaults,
    id: LEGACY_WIDGET_ID,
    type,
    x: 0,
    y: 0,
    w: defaults.w ?? 300,
    h: defaults.h ?? 200,
    z: 1,
    config: { ...(defaults.config ?? {}) },
  } as WidgetData;
};

const asyncNoop = () => Promise.resolve();

const dashboardValue = {
  dashboards: [],
  activeDashboard: {
    id: 'legacy-dashboard',
    name: 'Legacy',
    background: 'bg-slate-900',
    widgets: [],
    createdAt: 0,
  },
  rosters: [],
  activeRosterId: null,
  selectedWidgetId: null,
  isActiveBoardReadOnly: false,
  drawingWidgetsMigrating: false,
  pendingAssignmentEditId: null,
  pendingAssignmentSetupId: null,
  updateWidget: vi.fn(),
  addWidget: vi.fn(),
  removeWidget: vi.fn(),
  bringToFront: vi.fn(),
  moveWidgetLayer: vi.fn(),
  deleteAllWidgets: vi.fn(),
  updateDashboard: vi.fn(),
  setBackground: vi.fn(),
  setActiveRoster: vi.fn(),
  addToast: vi.fn(),
  clearPendingAssignmentEdit: vi.fn(),
  clearPendingAssignmentSetup: vi.fn(),
  saveCurrentDashboard: asyncNoop,
} as unknown as DashboardContextValue;

const authValue = {
  user: {
    uid: 'legacy-user',
    email: 'legacy@example.com',
    displayName: 'Legacy User',
  },
  isAdmin: false,
  loading: false,
  profileLoaded: true,
  isExternalUser: false,
  orgId: null,
  selectedBuildings: [],
  userGradeLevels: [],
  featurePermissions: [],
  globalPermissions: [],
  appSettings: null,
  savedWidgetPresets: {},
  customMaterials: [],
  materialsPreferences: {},
  googleAccessToken: null,
  quizGraderMode: 'manual',
  quizGraderAutoAdvance: false,
  disableCloseConfirmation: false,
  canSeeShareTracking: false,
  canAccessQuizMediaResponse: false,
  canAccessWidget: () => true,
  canAccessFeature: () => true,
  getAssignmentMode: () => 'quiz',
  ensureGoogleScope: () => Promise.resolve(null),
  refreshGoogleToken: () => Promise.resolve(null),
  saveWidgetPreset: asyncNoop,
  saveCustomMaterials: asyncNoop,
  saveMaterialsPreferences: asyncNoop,
  updateAccountPreferences: asyncNoop,
  updateAppSettings: asyncNoop,
  signInWithGoogle: asyncNoop,
  signOut: asyncNoop,
} as unknown as AuthContextType;

const customWidgetsValue = {
  customWidgets: [],
  customTools: [],
  loading: false,
  saveCustomWidget: () => Promise.resolve('id'),
  setPublished: asyncNoop,
  deleteCustomWidget: asyncNoop,
} as unknown as CustomWidgetsContextValue;

const savedWidgetsValue = {
  savedWidgets: [],
  loading: false,
  saveSavedWidget: () => Promise.resolve('id'),
  setPinnedToDock: asyncNoop,
  deleteSavedWidget: asyncNoop,
} as unknown as SavedWidgetsContextValue;

const toolVisibilityValue = {
  visibleTools: [],
  isToolVisible: () => true,
  toggleToolVisibility: vi.fn(),
} as unknown as ToolVisibilityContextValue;

const withProviders = (children: React.ReactNode) => (
  <AuthContext.Provider value={authValue}>
    <CustomWidgetsContext.Provider value={customWidgetsValue}>
      <SavedWidgetsContext.Provider value={savedWidgetsValue}>
        <DashboardContext.Provider value={dashboardValue}>
          <ToolVisibilityContext.Provider value={toolVisibilityValue}>
            {children}
          </ToolVisibilityContext.Provider>
        </DashboardContext.Provider>
      </SavedWidgetsContext.Provider>
    </CustomWidgetsContext.Provider>
  </AuthContext.Provider>
);

/** Mounts the slot content only — never SettingsPanel or drawer chrome. */
export const renderLegacySettings = async (
  type: WidgetType,
  slot: LegacySlot = 'settings'
): Promise<HTMLElement> => {
  const map =
    slot === 'appearance'
      ? WIDGET_APPEARANCE_COMPONENTS
      : WIDGET_SETTINGS_COMPONENTS;
  const Component = map[type];
  if (!Component) {
    throw new Error(
      `No ${slot} component registered for widget type "${type}"`
    );
  }
  const widget = buildLegacyWidget(type);
  const { container } = render(
    withProviders(
      <Suspense fallback={<span>{FALLBACK_TEXT}</span>}>
        <Component widget={widget} />
      </Suspense>
    )
  );
  await waitFor(
    () => {
      if (container.textContent?.includes(FALLBACK_TEXT)) {
        throw new Error('still suspended');
      }
    },
    { timeout: 20000 }
  );
  return container;
};
