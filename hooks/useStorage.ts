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
          `background-${Date.now()}-${file.name}`
        );
        // Make it public so it can be viewed as a background
        await driveService.makePublic(driveFile.id);
        // Use webContentLink for direct image access
        return driveFile.webContentLink || driveFile.webViewLink || '';
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
          `sticker-${Date.now()}-${file.name}`
        );
        await driveService.makePublic(driveFile.id);
        return driveFile.webContentLink || driveFile.webViewLink || '';
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
          `screenshot-${Date.now()}.jpg`
        );
        await driveService.makePublic(driveFile.id);
        return driveFile.webContentLink || driveFile.webViewLink || '';
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
    // Note: Deleting from Drive is not implemented here yet
    // For now, we only delete from Firebase Storage
    if (filePath.startsWith('http')) return; // Probably a Drive link

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
