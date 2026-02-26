import { useMemo } from 'react';
import { useAuth } from '../context/useAuth';
import { GoogleDriveService } from '../utils/googleDriveService';

export const useGoogleDrive = () => {
  const { googleAccessToken, refreshGoogleToken } = useAuth();

  const driveService = useMemo(() => {
    if (!googleAccessToken) return null;
    return new GoogleDriveService(googleAccessToken);
  }, [googleAccessToken]);

  return {
    driveService,
    isConnected: !!googleAccessToken,
    refreshGoogleToken,
  };
};
