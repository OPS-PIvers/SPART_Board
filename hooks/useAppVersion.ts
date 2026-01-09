import { useState, useEffect } from 'react';

/**
 * Describes the version metadata served from `/version.json`.
 *
 * The backend is expected to expose a JSON file with at least a semantic
 * version string and a build date. Only the `version` field is used for
 * comparison in this hook; `buildDate` is available for display/logging.
 */
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
 * - After the initial version is known, it starts polling `/version.json`
 *   every `checkIntervalMs` milliseconds (default: 60_000 ms / 60 seconds).
 * - If the fetched version string differs from the initial version, the
 *   `updateAvailable` flag is set to `true` and remains true for the
 *   lifetime of the hook instance.
 *
 * Consumers can use `updateAvailable` to show an update banner or dialog,
 * and call `reloadApp` to reload the page and pick up the new build.
 *
 * @param checkIntervalMs - Polling interval in milliseconds used to check
 *   for a new app version. Defaults to 60_000 ms (once per minute).
 * @returns An object with:
 *   - `updateAvailable`: `true` when a newer version has been detected.
 *   - `reloadApp`: function that reloads the current page.
 */
export const useAppVersion = (checkIntervalMs = 60000) => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [currentVersion, setCurrentVersion] = useState<string | null>(null);

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

    if (!currentVersion) {
      // Initial check to set current version
      void fetchVersion().then((version) => {
        if (version) {
          setCurrentVersion(version);
        }
      });
      return;
    }

    // Polling
    const intervalId = setInterval(async () => {
      const latestVersion = await fetchVersion();
      if (latestVersion && latestVersion !== currentVersion) {
        setUpdateAvailable(true);
      }
    }, checkIntervalMs);

    return () => clearInterval(intervalId);
  }, [currentVersion, checkIntervalMs]);

  const reloadApp = () => {
    window.location.reload();
  };

  return { updateAvailable, reloadApp };
};
