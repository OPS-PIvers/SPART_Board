import { Dashboard } from '../types';

const DRIVE_API_URL = 'https://www.googleapis.com/drive/v3';
const UPLOAD_API_URL = 'https://www.googleapis.com/upload/drive/v3';

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  webContentLink?: string;
  thumbnailLink?: string;
}

interface DriveFileListResponse {
  files?: DriveFile[];
}

interface DriveFileCreateResponse {
  id: string;
  name: string;
}

export class GoogleDriveService {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  private get headers() {
    return {
      Authorization: `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * List files in the user's Google Drive.
   * @param query Google Drive API Q parameter (e.g., "mimeType = 'image/jpeg'")
   */
  async listFiles(query?: string): Promise<DriveFile[]> {
    const url = new URL(`${DRIVE_API_URL}/files`);
    url.searchParams.append(
      'fields',
      'files(id, name, mimeType, webViewLink, webContentLink, thumbnailLink)'
    );
    if (query) {
      url.searchParams.append('q', query);
    }

    const response = await fetch(url.toString(), {
      headers: this.headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to list Drive files: ${response.statusText}`);
    }

    const data = (await response.json()) as DriveFileListResponse;
    return data.files ?? [];
  }

  /**
   * Search for the "School Boards" folder or create it.
   */
  async getOrCreateAppFolder(): Promise<string> {
    const folders = await this.listFiles(
      "name = 'School Boards' and mimeType = 'application/vnd.google-apps.folder' and trashed = false"
    );

    if (folders.length > 0) {
      return folders[0].id;
    }

    // Create folder
    const response = await fetch(`${DRIVE_API_URL}/files`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({
        name: 'School Boards',
        mimeType: 'application/vnd.google-apps.folder',
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create app folder in Drive');
    }

    const folder = (await response.json()) as DriveFileCreateResponse;
    return folder.id;
  }

  /**
   * Export a dashboard to Google Drive as a .spart file.
   */
  async exportDashboard(dashboard: Dashboard): Promise<string> {
    const folderId = await this.getOrCreateAppFolder();
    const fileName = `${dashboard.name}.spart`;

    // Check if file exists to update or create
    const existingFiles = await this.listFiles(
      `name = '${fileName}' and '${folderId}' in parents and trashed = false`
    );

    const metadata = {
      name: fileName,
      parents: [folderId],
      mimeType: 'application/json',
    };

    const fileContent = JSON.stringify(dashboard, null, 2);

    if (existingFiles.length > 0) {
      // Update existing
      const fileId = existingFiles[0].id;

      // Update metadata
      await fetch(`${DRIVE_API_URL}/files/${fileId}`, {
        method: 'PATCH',
        headers: this.headers,
        body: JSON.stringify({ name: fileName }),
      });

      // Update content
      const uploadResponse = await fetch(
        `${UPLOAD_API_URL}/files/${fileId}?uploadType=media`,
        {
          method: 'PATCH',
          headers: {
            ...this.headers,
            'Content-Type': 'application/json',
          },
          body: fileContent,
        }
      );

      if (!uploadResponse.ok)
        throw new Error('Failed to update dashboard in Drive');
      return fileId;
    } else {
      // Create new
      // Simple upload (multipart would be better but this is easier for now)
      // First create metadata
      const createResponse = await fetch(`${DRIVE_API_URL}/files`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(metadata),
      });

      if (!createResponse.ok)
        throw new Error('Failed to create dashboard metadata in Drive');
      const file = (await createResponse.json()) as DriveFileCreateResponse;

      // Then upload content
      const uploadResponse = await fetch(
        `${UPLOAD_API_URL}/files/${file.id}?uploadType=media`,
        {
          method: 'PATCH',
          headers: {
            ...this.headers,
            'Content-Type': 'application/json',
          },
          body: fileContent,
        }
      );

      if (!uploadResponse.ok)
        throw new Error('Failed to upload dashboard content to Drive');
      return file.id;
    }
  }

  /**
   * Import a dashboard from a Google Drive file.
   */
  async importDashboard(fileId: string): Promise<Dashboard> {
    const response = await fetch(`${DRIVE_API_URL}/files/${fileId}?alt=media`, {
      headers: this.headers,
    });

    if (!response.ok) {
      throw new Error('Failed to download dashboard from Drive');
    }

    return (await response.json()) as Dashboard;
  }

  /**
   * Download a file from Drive as a Blob.
   */
  async downloadFile(fileId: string): Promise<Blob> {
    const response = await fetch(`${DRIVE_API_URL}/files/${fileId}?alt=media`, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to download file from Drive');
    }

    return response.blob();
  }

  /**
   * Get image files from Drive for backgrounds.
   */
  async getBackgroundImages(): Promise<DriveFile[]> {
    return this.listFiles("mimeType contains 'image/' and trashed = false");
  }
}
