import { useState } from 'react';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { storage } from '../config/firebase';
import { useAuth } from '../context/useAuth';
import { useGoogleDrive } from './useGoogleDrive';

export const useStorage = () => {
  const [uploading, setUploading] = useState(false);
  const { isAdmin } = useAuth();
  const { driveService } = useGoogleDrive();

  const uploadFile = async (path: string, file: File): Promise<string> => {
    setUploading(true);
    try {
      const storageRef = ref(storage, path);
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);
      return url;
    } finally {
      setUploading(false);
    }
  };

  const uploadBackgroundImage = async (
    userId: string,
    file: File
  ): Promise<string> => {
    if (!isAdmin && driveService) {
      setUploading(true);
      try {
        const driveFile = await driveService.uploadFile(
          file,
          `background-${Date.now()}-${file.name}`,
          'Assets/Backgrounds'
        );
        // Make it public so it can be viewed as a background
        await driveService.makePublic(driveFile.id);
        // Use webContentLink for direct image access
        return driveFile.webContentLink ?? driveFile.webViewLink ?? '';
      } finally {
        setUploading(false);
      }
    }

    const timestamp = Date.now();
    return uploadFile(
      `users/${userId}/backgrounds/${timestamp}-${file.name}`,
      file
    );
  };

  const uploadSticker = async (userId: string, file: File): Promise<string> => {
    if (!isAdmin && driveService) {
      setUploading(true);
      try {
        const driveFile = await driveService.uploadFile(
          file,
          `sticker-${Date.now()}-${file.name}`,
          'Assets/Stickers'
        );
        await driveService.makePublic(driveFile.id);
        return driveFile.webContentLink ?? driveFile.webViewLink ?? '';
      } finally {
        setUploading(false);
      }
    }

    const timestamp = Date.now();
    return uploadFile(
      `users/${userId}/stickers/${timestamp}-${file.name}`,
      file
    );
  };

  const uploadScreenshot = async (
    userId: string,
    blob: Blob
  ): Promise<string> => {
    if (!isAdmin && driveService) {
      setUploading(true);
      try {
        const driveFile = await driveService.uploadFile(
          blob,
          `screenshot-${Date.now()}.jpg`,
          'Assets/Screenshots'
        );
        await driveService.makePublic(driveFile.id);
        return driveFile.webContentLink ?? driveFile.webViewLink ?? '';
      } finally {
        setUploading(false);
      }
    }

    const timestamp = Date.now();
    const storageRef = ref(
      storage,
      `users/${userId}/screenshots/${timestamp}.jpg`
    );

    setUploading(true);
    try {
      const snapshot = await uploadBytes(storageRef, blob);
      return await getDownloadURL(snapshot.ref);
    } finally {
      setUploading(false);
    }
  };

  const deleteFile = async (filePath: string): Promise<void> => {
    // If it's a Drive link, we try to delete it from Drive
    if (
      filePath.startsWith('https://lh3.googleusercontent.com') ||
      filePath.includes('drive.google.com')
    ) {
      if (driveService) {
        try {
          // Deletion of Drive assets by URL is not yet fully implemented
          console.warn(
            'Deletion of Drive assets by URL is not yet fully implemented'
          );
        } catch (e) {
          console.error('Failed to delete from Drive:', e);
        }
      }
      return;
    }

    const fileRef = ref(storage, filePath);
    await deleteObject(fileRef);
  };

  const uploadAdminBackground = async (
    backgroundId: string,
    file: File
  ): Promise<string> => {
    // Admins always save to Firebase Storage for global availability
    return uploadFile(`admin_backgrounds/${backgroundId}/${file.name}`, file);
  };

  const uploadWeatherImage = async (
    rangeId: string,
    file: File
  ): Promise<string> => {
    // Admins always save to Firebase Storage for global availability
    const timestamp = Date.now();
    const storageRef = ref(
      storage,
      `admin_weather/${rangeId}/${timestamp}-${file.name}`
    );

    const snapshot = await uploadBytes(storageRef, file);
    return getDownloadURL(snapshot.ref);
  };

  return {
    uploading,
    uploadFile,
    uploadBackgroundImage,
    uploadSticker,
    uploadScreenshot,
    deleteFile,
    uploadAdminBackground,
    uploadWeatherImage,
  };
};
