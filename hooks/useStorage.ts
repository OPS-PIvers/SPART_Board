import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { storage } from '../config/firebase';

export const useStorage = () => {
  const uploadBackgroundImage = async (
    userId: string,
    file: File
  ): Promise<string> => {
    const timestamp = Date.now();
    const storageRef = ref(
      storage,
      `users/${userId}/backgrounds/${timestamp}-${file.name}`
    );

    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);

    return downloadURL;
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

    const snapshot = await uploadBytes(storageRef, blob);
    const downloadURL = await getDownloadURL(snapshot.ref);

    return downloadURL;
  };

  const deleteFile = async (filePath: string): Promise<void> => {
    const fileRef = ref(storage, filePath);
    await deleteObject(fileRef);
  };

  const uploadAdminBackground = async (
    backgroundId: string,
    file: File
  ): Promise<string> => {
    const storageRef = ref(
      storage,
      `admin_backgrounds/${backgroundId}/${file.name}`
    );

    const snapshot = await uploadBytes(storageRef, file);
    return getDownloadURL(snapshot.ref);
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
    uploadBackgroundImage,
    uploadScreenshot,
    deleteFile,
    uploadAdminBackground,
    uploadWeatherImage,
  };
};
