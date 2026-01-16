import { useState } from 'react';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { storage } from '../config/firebase';

export const useStorage = () => {
  const [uploading, setUploading] = useState(false);

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
    const timestamp = Date.now();
    return uploadFile(
      `users/${userId}/backgrounds/${timestamp}-${file.name}`,
      file
    );
  };

  const uploadScreenshot = async (
    userId: string,
    blob: Blob
  ): Promise<string> => {
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
    const fileRef = ref(storage, filePath);
    await deleteObject(fileRef);
  };

  const uploadAdminBackground = async (
    backgroundId: string,
    file: File
  ): Promise<string> => {
    return uploadFile(`admin_backgrounds/${backgroundId}/${file.name}`, file);
  };

  const uploadWeatherImage = async (
    rangeId: string,
    file: File
  ): Promise<string> => {
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
    uploadScreenshot,
    deleteFile,
    uploadAdminBackground,
    uploadWeatherImage,
  };
};
