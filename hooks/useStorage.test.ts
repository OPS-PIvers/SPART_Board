import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useStorage } from './useStorage';

// Hoist mocks so they are available in vi.mock factories
const {
  mockUseAuth,
  mockUseGoogleDrive,
  mockUploadBytes,
  mockGetDownloadURL,
  mockDeleteObject,
  mockRef,
} = vi.hoisted(() => {
  return {
    mockUseAuth: vi.fn(),
    mockUseGoogleDrive: vi.fn(),
    mockUploadBytes: vi.fn(),
    mockGetDownloadURL: vi.fn(),
    mockDeleteObject: vi.fn(),
    mockRef: vi.fn(),
  };
});

// Mock Firebase Storage
vi.mock('firebase/storage', () => {
  return {
    getStorage: vi.fn(() => ({})),
    ref: mockRef,
    uploadBytes: mockUploadBytes,
    getDownloadURL: mockGetDownloadURL,
    deleteObject: mockDeleteObject,
  };
});

// Mock Config Firebase
vi.mock('../config/firebase', () => ({
  storage: {}, // Mock storage instance
}));

// Mock Auth Context
vi.mock('../context/useAuth', () => ({
  useAuth: mockUseAuth,
}));

// Mock Google Drive Hook
vi.mock('./useGoogleDrive', () => ({
  useGoogleDrive: mockUseGoogleDrive,
}));

describe('useStorage', () => {
  const mockDriveService = {
    uploadFile: vi.fn(),
    makePublic: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mocks
    mockUseAuth.mockReturnValue({ isAdmin: false });
    mockUseGoogleDrive.mockReturnValue({ driveService: null });

    mockRef.mockImplementation((_storage: unknown, path: unknown) => ({
      fullPath: String(path),
    }));
    mockUploadBytes.mockResolvedValue({ ref: { fullPath: 'mock-ref' } });
    mockGetDownloadURL.mockResolvedValue(
      'https://firebase-storage.com/file.jpg'
    );
    mockDeleteObject.mockResolvedValue(undefined);

    mockDriveService.uploadFile.mockResolvedValue({
      id: 'drive-file-id',
      webContentLink: 'https://drive.google.com/file.jpg',
    });
    mockDriveService.makePublic.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('uploadFile', () => {
    it('should upload file to Firebase Storage', async () => {
      const { result } = renderHook(() => useStorage());
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });
      const path = 'test/path/test.txt';

      let url;
      await act(async () => {
        url = await result.current.uploadFile(path, file);
      });

      expect(mockRef).toHaveBeenCalledWith(expect.anything(), path);
      expect(mockUploadBytes).toHaveBeenCalledWith(expect.anything(), file);
      expect(mockGetDownloadURL).toHaveBeenCalled();
      expect(url).toBe('https://firebase-storage.com/file.jpg');
      expect(result.current.uploading).toBe(false);
    });

    it('should set uploading state correctly during upload', async () => {
      const { result } = renderHook(() => useStorage());
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });

      mockUploadBytes.mockResolvedValue({ ref: {} });

      // We use a rejected promise to verify state reset
      mockUploadBytes.mockRejectedValueOnce(new Error('Upload failed'));

      await act(async () => {
        await expect(result.current.uploadFile('path', file)).rejects.toThrow(
          'Upload failed'
        );
      });
      expect(result.current.uploading).toBe(false);
    });
  });

  describe('uploadBackgroundImage', () => {
    it('should upload to Firebase when user is Admin, regardless of Drive service', async () => {
      mockUseAuth.mockReturnValue({ isAdmin: true });
      mockUseGoogleDrive.mockReturnValue({ driveService: mockDriveService }); // Even if drive is available

      const { result } = renderHook(() => useStorage());
      const file = new File(['img'], 'bg.jpg', { type: 'image/jpeg' });
      const userId = 'user-123';

      let url;
      await act(async () => {
        url = await result.current.uploadBackgroundImage(userId, file);
      });

      // Should call Firebase
      expect(mockRef).toHaveBeenCalledWith(
        expect.anything(),
        expect.stringContaining(`users/${userId}/backgrounds/`)
      );
      expect(mockUploadBytes).toHaveBeenCalled();
      // Should NOT call Drive
      expect(mockDriveService.uploadFile).not.toHaveBeenCalled();
      expect(url).toBe('https://firebase-storage.com/file.jpg');
    });

    it('should upload to Firebase when Drive service is unavailable (and not Admin)', async () => {
      mockUseAuth.mockReturnValue({ isAdmin: false });
      mockUseGoogleDrive.mockReturnValue({ driveService: null });

      const { result } = renderHook(() => useStorage());
      const file = new File(['img'], 'bg.jpg', { type: 'image/jpeg' });
      const userId = 'user-123';

      let url;
      await act(async () => {
        url = await result.current.uploadBackgroundImage(userId, file);
      });

      expect(mockRef).toHaveBeenCalledWith(
        expect.anything(),
        expect.stringContaining(`users/${userId}/backgrounds/`)
      );
      expect(mockUploadBytes).toHaveBeenCalled();
      expect(url).toBe('https://firebase-storage.com/file.jpg');
    });

    it('should upload to Drive when User is NOT Admin and Drive service IS available', async () => {
      mockUseAuth.mockReturnValue({ isAdmin: false });
      mockUseGoogleDrive.mockReturnValue({ driveService: mockDriveService });

      const { result } = renderHook(() => useStorage());
      const file = new File(['img'], 'bg.jpg', { type: 'image/jpeg' });
      const userId = 'user-123';

      let url;
      await act(async () => {
        url = await result.current.uploadBackgroundImage(userId, file);
      });

      expect(mockDriveService.uploadFile).toHaveBeenCalledWith(
        file,
        expect.stringContaining('background-'),
        'Assets/Backgrounds'
      );
      expect(mockDriveService.makePublic).toHaveBeenCalledWith('drive-file-id');
      expect(url).toBe('https://drive.google.com/file.jpg');

      // Should NOT call Firebase
      expect(mockUploadBytes).not.toHaveBeenCalled();
    });

    it('should handle Drive upload failure', async () => {
      mockUseAuth.mockReturnValue({ isAdmin: false });
      mockUseGoogleDrive.mockReturnValue({ driveService: mockDriveService });
      mockDriveService.uploadFile.mockRejectedValue(new Error('Drive error'));

      const { result } = renderHook(() => useStorage());
      const file = new File(['img'], 'bg.jpg', { type: 'image/jpeg' });

      await act(async () => {
        await expect(
          result.current.uploadBackgroundImage('u1', file)
        ).rejects.toThrow('Drive error');
      });
      expect(result.current.uploading).toBe(false);
    });
  });

  describe('deleteFile', () => {
    it('should delete from Firebase Storage if path is a standard path', async () => {
      const { result } = renderHook(() => useStorage());
      const path = 'users/123/image.jpg';

      await act(async () => {
        await result.current.deleteFile(path);
      });

      expect(mockRef).toHaveBeenCalledWith(expect.anything(), path);
      expect(mockDeleteObject).toHaveBeenCalled();
    });

    it('should warn and NOT delete if path is a Google Drive URL (and not implemented)', async () => {
      // Stub console.warn
      const consoleWarnSpy = vi
        .spyOn(console, 'warn')
        .mockImplementation(vi.fn());

      // Setup mock BEFORE renderHook
      mockUseGoogleDrive.mockReturnValue({ driveService: mockDriveService });

      const { result } = renderHook(() => useStorage());
      // A typical Drive URL
      const driveUrl = 'https://lh3.googleusercontent.com/some-id';

      await act(async () => {
        await result.current.deleteFile(driveUrl);
      });

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'Deletion of Drive assets by URL is not yet fully implemented'
        )
      );
      expect(mockDeleteObject).not.toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });
  });

  describe('uploadAdminBackground', () => {
    it('should always upload to Firebase', async () => {
      const { result } = renderHook(() => useStorage());
      const file = new File(['x'], 'admin-bg.png');
      const bgId = 'bg-001';

      await act(async () => {
        await result.current.uploadAdminBackground(bgId, file);
      });

      expect(mockRef).toHaveBeenCalledWith(
        expect.anything(),
        `admin_backgrounds/${bgId}/admin-bg.png`
      );
      expect(mockUploadBytes).toHaveBeenCalled();
    });
  });
});
