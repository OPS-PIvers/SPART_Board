import { useState, useEffect } from 'react';

interface VersionInfo {
  version: string;
  buildDate: string;
}

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
