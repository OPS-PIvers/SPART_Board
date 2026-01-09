import { useState, useEffect, useRef } from 'react';

interface VersionInfo {
  version: string;
  buildDate: string;
}

/**
 * React hook that polls the app's `/version.json` endpoint to detect when
 * a newer version of the application is available.
 *
 * Behavior:
 * - On mount, it performs an initial fetch to capture the current version.
 * - After the initial version is known, it polls `/version.json`
 *   every `checkIntervalMs` milliseconds.
 * - If the fetched version string differs from the initial version, the
 *   `updateAvailable` flag is set to `true`.
 *
 * @param checkIntervalMs - Polling interval in milliseconds (default: 60000ms).
 * @returns An object containing `updateAvailable` boolean and `reloadApp` function.
 */
export const useAppVersion = (checkIntervalMs = 60000) => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [currentVersion, setCurrentVersion] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Function to fetch the version
    const fetchVersion = async () => {
      try {
        const response = await fetch(`/version.json?t=${Date.now()}`);
        if (!response.ok) return null;
        const data = (await response.json()) as VersionInfo;
        return data.version;
      } catch (error) {
        console.error('Failed to check version', error);
        return null;
      }
    };

    const schedulePoll = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(async () => {
        const latestVersion = await fetchVersion();
        if (latestVersion && currentVersion && latestVersion !== currentVersion) {
          setUpdateAvailable(true);
        } else {
          // Schedule next poll only if no update found yet (or keep polling? usually stop after update found)
          // If update found, we stop polling? Usually yes.
          if (!latestVersion || latestVersion === currentVersion) {
             schedulePoll();
          }
        }
      }, checkIntervalMs);
    };

    if (!currentVersion) {
      // Initial check to set current version
      void fetchVersion().then((version) => {
        if (version) {
          setCurrentVersion(version);
        }
      });
      return;
    }

    // Start polling loop
    schedulePoll();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [currentVersion, checkIntervalMs]);

  const reloadApp = () => {
    window.location.reload();
  };

  return { updateAvailable, reloadApp };
};
