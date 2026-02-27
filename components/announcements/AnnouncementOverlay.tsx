/**
 * AnnouncementOverlay
 *
 * Listens to the Firestore `announcements` collection and renders any
 * announcement that is currently active and targeted at the current user's
 * building(s) as a floating widget overlay on top of the dashboard.
 *
 * Dismissal logic (per the AnnouncementDismissalType):
 *   'user'      – A dismiss button is shown. Click stores the dismissal in
 *                 localStorage keyed by `{id}_{activatedAt}`.
 *   'scheduled' – The overlay automatically disappears once the wall clock
 *                 passes the configured scheduledDismissalTime (checked
 *                 every 30 seconds).
 *   'duration'  – A countdown shows remaining time. The overlay hides after
 *                 dismissalDurationSeconds seconds from first appearance.
 *   'admin'     – No dismiss control is shown. The admin must deactivate the
 *                 announcement in Admin Settings → Announcements.
 *
 * Dismissals are persisted in localStorage so they survive a page reload.
 * The key format `{id}_{activatedAt}` means that if an admin re-activates an
 * announcement (bumping activatedAt), all users see it again.
 */

import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  Suspense,
} from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { X, Bell, Lock } from 'lucide-react';
import { db, isAuthBypass } from '@/config/firebase';
import { useAuth } from '@/context/useAuth';
import { Announcement, WidgetData, WidgetConfig } from '@/types';
import { WIDGET_COMPONENTS } from '@/components/widgets/WidgetRegistry';

const DISMISSALS_KEY = 'spart_announcement_dismissals';
const SCHEDULE_CHECK_INTERVAL_MS = 30_000;

type DismissalRecord = Record<string, number>; // epochKey -> timestamp dismissed

function getDismissals(): DismissalRecord {
  try {
    const raw = localStorage.getItem(DISMISSALS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as DismissalRecord;
  } catch {
    return {};
  }
}

function saveDismissal(epochKey: string) {
  const record = getDismissals();
  record[epochKey] = Date.now();
  try {
    localStorage.setItem(DISMISSALS_KEY, JSON.stringify(record));
  } catch {
    // localStorage full – not critical
  }
}

function isDismissed(a: Announcement): boolean {
  if (!a.activatedAt) return false;
  const key = `${a.id}_${a.activatedAt}`;
  const record = getDismissals();
  return !!record[key];
}

/** Parse "HH:MM" into minutes-since-midnight for comparison. */
function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function currentMinutes(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

/** Returns true when the announcement should currently be visible based on scheduled activation time. */
function isScheduledTimeReached(a: Announcement): boolean {
  if (a.activationType !== 'scheduled') return a.isActive;
  if (!a.scheduledActivationTime) return false;
  return currentMinutes() >= timeToMinutes(a.scheduledActivationTime);
}

/** Returns true when a scheduled-dismissal announcement has passed its dismissal time. */
function isScheduledDismissalPast(a: Announcement): boolean {
  if (a.dismissalType !== 'scheduled' || !a.scheduledDismissalTime)
    return false;
  return currentMinutes() >= timeToMinutes(a.scheduledDismissalTime);
}

/** Loading fallback for Suspense-wrapped lazy widget components. */
const WidgetLoadingFallback: React.FC = () => (
  <div className="flex items-center justify-center h-full w-full text-slate-400">
    <div className="animate-spin w-6 h-6 border-2 border-slate-300 border-t-brand-blue-primary rounded-full" />
  </div>
);

/**
 * Renders the widget content for a given announcement using the same
 * lazy-loaded component registry as the main dashboard.
 */
const AnnouncementWidgetContent: React.FC<{ announcement: Announcement }> = ({
  announcement,
}) => {
  // Track viewport size reactively so maximized widgets stay correct on resize
  const [viewportSize, setViewportSize] = useState({
    w: window.innerWidth,
    h: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setViewportSize({ w: window.innerWidth, h: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const WidgetComponent = WIDGET_COMPONENTS[announcement.widgetType];

  const fakeWidget: WidgetData = {
    id: `announcement-${announcement.id}`,
    type: announcement.widgetType,
    x: 0,
    y: 0,
    w: announcement.maximized ? viewportSize.w : announcement.widgetSize.w,
    h: announcement.maximized ? viewportSize.h : announcement.widgetSize.h,
    z: 9990,
    flipped: false,
    minimized: false,
    maximized: announcement.maximized,
    config: announcement.widgetConfig as WidgetConfig,
  };

  if (!WidgetComponent) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400 text-sm">
        Widget type &quot;{announcement.widgetType}&quot; is not renderable.
      </div>
    );
  }

  return (
    <div className="h-full w-full" style={{ containerType: 'size' }}>
      <Suspense fallback={<WidgetLoadingFallback />}>
        <WidgetComponent widget={fakeWidget} />
      </Suspense>
    </div>
  );
};

/** A single announcement window. */
const AnnouncementWindow: React.FC<{
  announcement: Announcement;
  onDismiss: (id: string, activatedAt: number | null) => void;
}> = ({ announcement, onDismiss }) => {
  const isDuration = announcement.dismissalType === 'duration';
  const total = announcement.dismissalDurationSeconds ?? 60;
  // Initialize with the full duration so we can display it immediately
  const [secondsLeft, setSecondsLeft] = useState<number | null>(
    isDuration ? total : null
  );
  const [scheduledDismissed, setScheduledDismissed] = useState(false);
  // Mount timestamp recorded inside the effect (avoids impure Date.now() in render)
  const mountedAt = useRef<number>(0);

  // Duration-based countdown: tick once per second via setInterval
  useEffect(() => {
    if (!isDuration) return;
    mountedAt.current = Date.now();

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - mountedAt.current) / 1000);
      const remaining = total - elapsed;
      if (remaining <= 0) {
        clearInterval(interval);
        onDismiss(announcement.id, announcement.activatedAt);
      } else {
        setSecondsLeft(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [announcement, isDuration, onDismiss, total]);

  // Scheduled dismissal check
  useEffect(() => {
    if (announcement.dismissalType !== 'scheduled') return;

    const check = () => {
      if (isScheduledDismissalPast(announcement)) {
        setScheduledDismissed(true);
        onDismiss(announcement.id, announcement.activatedAt);
      }
    };

    check();
    const interval = setInterval(check, SCHEDULE_CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [announcement, onDismiss]);

  if (scheduledDismissed) return null;

  const isMaximized = announcement.maximized;

  const containerStyle: React.CSSProperties = isMaximized
    ? {
        position: 'fixed',
        inset: 0,
        zIndex: 9990,
      }
    : {
        position: 'relative',
        width: announcement.widgetSize.w,
        height: announcement.widgetSize.h + 48, // + header
        flexShrink: 0,
      };

  const headerStyle: React.CSSProperties = {
    height: 48,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 12px',
    background: 'rgba(15,23,42,0.85)',
    backdropFilter: 'blur(8px)',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    flexShrink: 0,
  };

  const contentHeight = isMaximized
    ? 'calc(100% - 48px)'
    : announcement.widgetSize.h;

  return (
    <div
      className={`rounded-2xl overflow-hidden shadow-2xl border border-white/20 flex flex-col ${
        isMaximized ? 'fixed inset-0 rounded-none' : ''
      }`}
      style={isMaximized ? { zIndex: 9990 } : containerStyle}
    >
      {/* Header bar */}
      <div style={headerStyle}>
        <div className="flex items-center gap-2 text-white/90 min-w-0">
          <Bell className="w-4 h-4 shrink-0 text-yellow-400" />
          <span className="text-sm font-semibold truncate">
            {announcement.name}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Duration countdown chip */}
          {announcement.dismissalType === 'duration' &&
            secondsLeft !== null && (
              <span className="text-xs font-mono bg-white/10 text-white/80 px-2 py-0.5 rounded-full">
                {secondsLeft}s
              </span>
            )}

          {/* Admin-only lock indicator */}
          {announcement.dismissalType === 'admin' && (
            <span
              title="Only an admin can close this announcement"
              className="flex items-center gap-1 text-xs text-white/50 bg-white/10 px-2 py-0.5 rounded-full"
            >
              <Lock className="w-3 h-3" />
              Admin only
            </span>
          )}

          {/* Dismiss button (user-dismissable only) */}
          {announcement.dismissalType === 'user' && (
            <button
              onClick={() =>
                onDismiss(announcement.id, announcement.activatedAt)
              }
              title="Dismiss announcement"
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-white/80 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Dismiss
            </button>
          )}
        </div>
      </div>

      {/* Widget content */}
      <div
        className="bg-slate-900 overflow-hidden"
        style={{ height: contentHeight, flex: isMaximized ? '1' : undefined }}
      >
        <AnnouncementWidgetContent announcement={announcement} />
      </div>
    </div>
  );
};

/**
 * Top-level overlay container. Renders all active, visible announcements
 * as floating windows above the dashboard.
 */
export const AnnouncementOverlay: React.FC = () => {
  const { user, selectedBuildings } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(() => {
    // Pre-populate from localStorage on mount
    const rec = getDismissals();
    return new Set(Object.keys(rec));
  });
  // Re-evaluate scheduled announcements periodically
  const [tick, setTick] = useState(0);

  // Subscribe to the announcements collection
  useEffect(() => {
    if (!user && !isAuthBypass) return;

    const unsub = onSnapshot(
      collection(db, 'announcements'),
      (snap) => {
        const items: Announcement[] = [];
        snap.forEach((d) =>
          items.push({ id: d.id, ...d.data() } as Announcement)
        );
        setAnnouncements(items);
      },
      (err) => {
        console.error('[AnnouncementOverlay] Firestore error:', err);
      }
    );
    return unsub;
  }, [user]);

  // Periodic tick for scheduled activation/dismissal checks
  useEffect(() => {
    const interval = setInterval(
      () => setTick((t) => t + 1),
      SCHEDULE_CHECK_INTERVAL_MS
    );
    return () => clearInterval(interval);
  }, []);

  const handleDismiss = useCallback(
    (id: string, activatedAt: number | null) => {
      const key = `${id}_${activatedAt}`;
      saveDismissal(key);
      setDismissed((prev) => new Set([...prev, key]));
    },
    []
  );

  // Determine which announcements are visible to this user
  const visible = announcements.filter((a) => {
    // Must pass scheduled/manual activation check
    const activated = isScheduledTimeReached(a);
    if (!activated) return false;

    // Must not have been dismissed by this user in this push epoch
    const epochKey = `${a.id}_${a.activatedAt}`;
    if (dismissed.has(epochKey) || isDismissed(a)) return false;

    // Check building targeting (empty = all buildings)
    if (a.targetBuildings.length > 0) {
      const userBuildings =
        selectedBuildings.length > 0 ? selectedBuildings : [];
      // If user has no buildings set, they see all-building announcements (no specific targeting)
      if (userBuildings.length === 0) {
        // User has no building configured — only show untargeted announcements
        return a.targetBuildings.length === 0;
      }
      // User has buildings — check for overlap
      const hasOverlap = a.targetBuildings.some((b) =>
        userBuildings.includes(b)
      );
      if (!hasOverlap) return false;
    }

    return true;
  });

  // Re-run filtering on each tick (for scheduled activation)
  // The tick dependency ensures `visible` is recomputed
  void tick;

  if (visible.length === 0) return null;

  // Separate maximized from windowed
  const maximized = visible.filter((a) => a.maximized);
  const windowed = visible.filter((a) => !a.maximized);

  return (
    <>
      {/* Maximized announcements render over everything */}
      {maximized.map((a) => (
        <AnnouncementWindow
          key={`${a.id}_${a.activatedAt}`}
          announcement={a}
          onDismiss={handleDismiss}
        />
      ))}

      {/* Windowed announcements stack in the bottom-center */}
      {windowed.length > 0 && (
        <div
          className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[9985] flex flex-wrap justify-center gap-4 pointer-events-none"
          aria-live="polite"
        >
          {windowed.map((a) => (
            <div
              key={`${a.id}_${a.activatedAt}`}
              className="pointer-events-auto"
            >
              <AnnouncementWindow announcement={a} onDismiss={handleDismiss} />
            </div>
          ))}
        </div>
      )}
    </>
  );
};
