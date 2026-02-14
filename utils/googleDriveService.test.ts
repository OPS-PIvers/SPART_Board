/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GoogleDriveService, DriveFile } from './googleDriveService';
import { Dashboard } from '../types';

// Mock URL.createObjectURL/revokeObjectURL for any potential side effects
global.URL.createObjectURL = vi.fn();
global.URL.revokeObjectURL = vi.fn();

describe('GoogleDriveService', () => {
  const mockAccessToken = 'mock-access-token';
  let service: GoogleDriveService;

  beforeEach(() => {
    service = new GoogleDriveService(mockAccessToken);
    // Reset mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('listFiles', () => {
    it('should list files successfully', async () => {
      const mockFiles = [{ id: '1', name: 'file1', mimeType: 'text/plain' }];
      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ files: mockFiles }),
      } as Response);

      const files = await service.listFiles("mimeType = 'image/jpeg'");

      expect(files).toEqual(mockFiles);
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('https://www.googleapis.com/drive/v3/files'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockAccessToken}`,
          }),
        })
      );
    });

    it('should return empty list if no files found', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ files: [] }),
      } as Response);

      const files = await service.listFiles();

      expect(files).toEqual([]);
    });

    it('should handle missing files property', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      } as Response);

      const files = await service.listFiles();

      expect(files).toEqual([]);
    });

    it('should throw error if response is not ok', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: false,
        statusText: 'Unauthorized',
      } as Response);

      await expect(service.listFiles()).rejects.toThrow(
        'Failed to list Drive files: Unauthorized'
      );
    });
  });

  describe('getOrCreateFolder', () => {
    it('should return existing folder id', async () => {
      const mockFolder = { id: 'folder-1', name: 'TestFolder' } as DriveFile;
      // Mock listFiles to return the folder
      vi.spyOn(service, 'listFiles').mockResolvedValueOnce([mockFolder]);

      const folderId = await service.getOrCreateFolder('TestFolder');
      expect(folderId).toBe('folder-1');
      expect(service.listFiles).toHaveBeenCalledWith(
        expect.stringContaining("name = 'TestFolder'")
      );
    });

    it('should create folder if not exists', async () => {
      // Mock listFiles to return empty
      vi.spyOn(service, 'listFiles').mockResolvedValueOnce([]);

      const mockNewFolder = { id: 'new-folder-1', name: 'TestFolder' };
      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockNewFolder),
      } as Response);

      const folderId = await service.getOrCreateFolder('TestFolder');

      expect(folderId).toBe('new-folder-1');
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('https://www.googleapis.com/drive/v3/files'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"name":"TestFolder"'),
        })
      );
    });

    it('should create folder inside parent', async () => {
      vi.spyOn(service, 'listFiles').mockResolvedValueOnce([]);
      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 'new-folder' }),
      } as Response);

      await service.getOrCreateFolder('ChildFolder', 'parent-id');

      expect(service.listFiles).toHaveBeenCalledWith(
        expect.stringContaining("'parent-id' in parents")
      );
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          body: expect.stringContaining('"parents":["parent-id"]'),
        })
      );
    });

    it('should throw error if folder creation fails', async () => {
      vi.spyOn(service, 'listFiles').mockResolvedValueOnce([]);
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: false,
      } as Response);

      await expect(service.getOrCreateFolder('FailFolder')).rejects.toThrow(
        'Failed to create folder FailFolder in Drive'
      );
    });
  });

  describe('getAppFolder', () => {
    it('should call getOrCreateFolder with APP_NAME', async () => {
      const spy = vi
        .spyOn(service, 'getOrCreateFolder')
        .mockResolvedValue('app-folder-id');

      const id = await service.getAppFolder();

      expect(id).toBe('app-folder-id');
      // Verify with regex since constant is from real code now (mock removed)
      expect(spy).toHaveBeenCalledWith(expect.any(String));
    });
  });

  describe('getFolderPath', () => {
    it('should traverse path creating folders', async () => {
      const getOrCreateSpy = vi.spyOn(service, 'getOrCreateFolder');
      getOrCreateSpy
        .mockResolvedValueOnce('app-folder-id') // getAppFolder call
        .mockResolvedValueOnce('assets-id')
        .mockResolvedValueOnce('backgrounds-id');

      const path = 'Assets/Backgrounds';
      const result = await service.getFolderPath(path);

      expect(result).toBe('backgrounds-id');
      expect(getOrCreateSpy).toHaveBeenCalledTimes(3);
      // First call uses app name
      expect(getOrCreateSpy).toHaveBeenNthCalledWith(1, expect.any(String));
      expect(getOrCreateSpy).toHaveBeenNthCalledWith(
        2,
        'Assets',
        'app-folder-id'
      );
      expect(getOrCreateSpy).toHaveBeenNthCalledWith(
        3,
        'Backgrounds',
        'assets-id'
      );
    });
  });

  describe('exportDashboard', () => {
    const mockDashboard: Dashboard = {
      id: 'dash-1',
      name: 'My Dashboard',
      widgets: [],
      createdAt: Date.now(),
      background: '#fff',
    };

    it('should try direct update if driveFileId exists', async () => {
      const dashboardWithId = { ...mockDashboard, driveFileId: 'existing-id' };
      vi.spyOn(service, 'getFolderPath').mockResolvedValue(
        'dashboards-folder-id'
      );

      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
      } as Response);

      const result = await service.exportDashboard(dashboardWithId);

      expect(result).toBe('existing-id');
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/files/existing-id'),
        expect.objectContaining({ method: 'PATCH' })
      );
    });

    it('should fallback to search/create if direct update fails with 404', async () => {
      const dashboardWithId = { ...mockDashboard, driveFileId: 'missing-id' };
      vi.spyOn(service, 'getFolderPath').mockResolvedValue(
        'dashboards-folder-id'
      );

      // First fetch (direct update) fails with 404
      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as Response);

      // Second fetch (listFiles - search) returns empty
      vi.spyOn(service, 'listFiles').mockResolvedValueOnce([]);

      // Third fetch (create metadata)
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 'new-file-id' }),
      } as Response);

      // Fourth fetch (upload content)
      fetchSpy.mockResolvedValueOnce({
        ok: true,
      } as Response);

      const result = await service.exportDashboard(dashboardWithId);

      expect(result).toBe('new-file-id');
      expect(service.listFiles).toHaveBeenCalled();
    });

    it('should update existing file if found by name', async () => {
      const dashboardNoId = { ...mockDashboard };
      vi.spyOn(service, 'getFolderPath').mockResolvedValue(
        'dashboards-folder-id'
      );

      // Mock listFiles to find existing file
      vi.spyOn(service, 'listFiles').mockResolvedValueOnce([
        { id: 'found-id', name: 'My Dashboard.spart' } as DriveFile,
      ]);

      const fetchSpy = vi.spyOn(global, 'fetch');

      // Mock metadata update
      fetchSpy.mockResolvedValueOnce({ ok: true } as Response);

      // Mock content update
      fetchSpy.mockResolvedValueOnce({ ok: true } as Response);

      const result = await service.exportDashboard(dashboardNoId);

      expect(result).toBe('found-id');
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/files/found-id'),
        expect.objectContaining({ method: 'PATCH' })
      );
    });

    it('should create new file if not found', async () => {
      const dashboardNoId = { ...mockDashboard };
      vi.spyOn(service, 'getFolderPath').mockResolvedValue(
        'dashboards-folder-id'
      );

      // Mock listFiles to verify not found
      vi.spyOn(service, 'listFiles').mockResolvedValueOnce([]);

      const fetchSpy = vi.spyOn(global, 'fetch');

      // Mock create metadata
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 'new-created-id' }),
      } as Response);

      // Mock content upload
      fetchSpy.mockResolvedValueOnce({ ok: true } as Response);

      const result = await service.exportDashboard(dashboardNoId);

      expect(result).toBe('new-created-id');
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/files'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should fallback to search/create if direct update fails (non-404)', async () => {
      const dashboardWithId = { ...mockDashboard, driveFileId: 'existing-id' };
      vi.spyOn(service, 'getFolderPath').mockResolvedValue(
        'dashboards-folder-id'
      );

      const consoleWarnSpy = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => undefined);
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);

      const fetchSpy = vi.spyOn(global, 'fetch');

      // Direct update fails
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Error details'),
      } as Response);

      // Fallback: listFiles (mocked to find nothing)
      const listFilesSpy = vi
        .spyOn(service, 'listFiles')
        .mockResolvedValueOnce([]);

      // Fallback: create metadata
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 'new-id' }),
      } as Response);

      // Fallback: upload content
      fetchSpy.mockResolvedValueOnce({
        ok: true,
      } as Response);

      const result = await service.exportDashboard(dashboardWithId);

      expect(result).toBe('new-id');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Drive API Error (Update Content):',
        'Error details'
      );
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Direct Drive update failed, falling back to search:',
        expect.any(Error)
      );
      expect(listFilesSpy).toHaveBeenCalled();
    });

    it('should throw error if update existing fails', async () => {
      const dashboardNoId = { ...mockDashboard };
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);
      vi.spyOn(service, 'getFolderPath').mockResolvedValue(
        'dashboards-folder-id'
      );
      vi.spyOn(service, 'listFiles').mockResolvedValueOnce([
        { id: 'found-id', name: 'My Dashboard.spart' } as DriveFile,
      ]);

      const fetchSpy = vi.spyOn(global, 'fetch');

      // Mock metadata update
      fetchSpy.mockResolvedValueOnce({ ok: true } as Response);

      // Mock content update failure
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        text: () => Promise.resolve('Error details'),
      } as Response);

      await expect(service.exportDashboard(dashboardNoId)).rejects.toThrow(
        'Failed to update dashboard in Drive'
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Drive API Error (Update Content):',
        'Error details'
      );
    });

    it('should throw error if create new fails (upload content)', async () => {
      const dashboardNoId = { ...mockDashboard };
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);
      vi.spyOn(service, 'getFolderPath').mockResolvedValue(
        'dashboards-folder-id'
      );
      vi.spyOn(service, 'listFiles').mockResolvedValueOnce([]);

      const fetchSpy = vi.spyOn(global, 'fetch');

      // Mock create metadata
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 'new-created-id' }),
      } as Response);

      // Mock content upload failure
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        text: () => Promise.resolve('Error details'),
      } as Response);

      await expect(service.exportDashboard(dashboardNoId)).rejects.toThrow(
        'Failed to upload dashboard content to Drive'
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Drive API Error (Upload Content):',
        'Error details'
      );
    });

    it('should throw error if create new fails (create metadata)', async () => {
      const dashboardNoId = { ...mockDashboard };
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);
      vi.spyOn(service, 'getFolderPath').mockResolvedValue(
        'dashboards-folder-id'
      );
      vi.spyOn(service, 'listFiles').mockResolvedValueOnce([]);

      const fetchSpy = vi.spyOn(global, 'fetch');

      // Mock create metadata failure
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        text: () => Promise.resolve('Error details'),
      } as Response);

      await expect(service.exportDashboard(dashboardNoId)).rejects.toThrow(
        'Failed to create dashboard metadata in Drive'
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Drive API Error (Create Metadata):',
        'Error details'
      );
    });
  });

  describe('uploadFile', () => {
    it('should upload file successfully', async () => {
      const file = new File(['content'], 'test.png', { type: 'image/png' });
      vi.spyOn(service, 'getFolderPath').mockResolvedValue('folder-id');

      const fetchSpy = vi.spyOn(global, 'fetch');

      // Mock create metadata
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 'file-id' }),
      } as Response);

      // Mock content upload
      fetchSpy.mockResolvedValueOnce({
        ok: true,
      } as Response);

      // Mock detail retrieval
      const finalFile = {
        id: 'file-id',
        name: 'test.png',
        webViewLink: 'link',
      };
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(finalFile),
      } as Response);

      const result = await service.uploadFile(file, 'test.png');

      expect(result).toEqual(finalFile);
      expect(fetchSpy).toHaveBeenCalledTimes(3);
    });

    it('should default content type to octet-stream if file type missing', async () => {
      // Mock File with empty type
      const file = new File(['content'], 'test.bin');
      Object.defineProperty(file, 'type', { value: '' });

      vi.spyOn(service, 'getFolderPath').mockResolvedValue('folder-id');

      const fetchSpy = vi.spyOn(global, 'fetch');

      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 'file-id' }),
      } as Response);

      fetchSpy.mockResolvedValueOnce({ ok: true } as Response);

      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 'file-id', name: 'test.bin' }),
      } as Response);

      await service.uploadFile(file, 'test.bin');

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('uploadType=media'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/octet-stream',
          }),
        })
      );
    });

    it('should throw error if metadata creation fails', async () => {
      const file = new File(['content'], 'test.png', { type: 'image/png' });
      vi.spyOn(service, 'getFolderPath').mockResolvedValue('folder-id');

      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: false,
      } as Response);

      await expect(service.uploadFile(file, 'test.png')).rejects.toThrow(
        'Failed to create file metadata in Drive'
      );
    });

    it('should throw error if content upload fails', async () => {
      const file = new File(['content'], 'test.png', { type: 'image/png' });
      vi.spyOn(service, 'getFolderPath').mockResolvedValue('folder-id');

      const fetchSpy = vi.spyOn(global, 'fetch');

      // Mock create metadata
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 'file-id' }),
      } as Response);

      // Mock content upload failure
      fetchSpy.mockResolvedValueOnce({
        ok: false,
      } as Response);

      await expect(service.uploadFile(file, 'test.png')).rejects.toThrow(
        'Failed to upload file content to Drive'
      );
    });
  });

  describe('makePublic', () => {
    it('should make file public', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
      } as Response);

      await service.makePublic('file-id');

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/files/file-id/permissions'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"role":"reader"'),
        })
      );
    });

    it('should throw error if fails', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: false,
        statusText: 'Error',
        text: () => Promise.resolve('Error details'),
      } as Response);

      await expect(service.makePublic('file-id')).rejects.toThrow(
        'Failed to make file public in Drive'
      );
    });
  });

  describe('deleteFile', () => {
    it('should delete file', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
      } as Response);

      await service.deleteFile('file-id');

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/files/file-id'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('should ignore 404', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as Response);

      await expect(service.deleteFile('file-id')).resolves.not.toThrow();
    });

    it('should throw error if delete fails', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Error details'),
      } as Response);

      await expect(service.deleteFile('file-id')).rejects.toThrow(
        'Failed to delete file from Google Drive'
      );
    });
  });

  describe('importDashboard', () => {
    it('should import dashboard', async () => {
      const mockDashboard = { id: 'dash-1', name: 'Imported' };
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockDashboard),
      } as Response);

      const result = await service.importDashboard('file-id');

      expect(result).toEqual(mockDashboard);
    });

    it('should throw error if import fails', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: false,
      } as Response);

      await expect(service.importDashboard('file-id')).rejects.toThrow(
        'Failed to download dashboard from Drive'
      );
    });
  });

  describe('downloadFile', () => {
    it('should download file as blob', async () => {
      const mockBlob = new Blob(['content']);
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(mockBlob),
      } as Response);

      const result = await service.downloadFile('file-id');

      expect(result).toEqual(mockBlob);
    });

    it('should throw error if download fails', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: false,
      } as Response);

      await expect(service.downloadFile('file-id')).rejects.toThrow(
        'Failed to download file from Drive'
      );
    });
  });

  describe('getBackgroundImages', () => {
    it('should list image files', async () => {
      const spy = vi.spyOn(service, 'listFiles').mockResolvedValue([]);

      await service.getBackgroundImages();

      expect(spy).toHaveBeenCalledWith(
        "mimeType contains 'image/' and trashed = false"
      );
    });
  });
});
