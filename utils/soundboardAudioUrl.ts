import { extractGoogleFileId } from './urlHelpers';

const DRIVE_FILE_ID_REGEX = /^[a-zA-Z0-9_-]+$/;

const toParsableUrl = (url: string): string => {
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('drive.google.com/')) return `https://${trimmed}`;
  return trimmed;
};

/**
 * Normalizes Soundboard audio URLs to a canonical direct-playback format for
 * Google Drive links. Non-Drive links are returned unchanged (trimmed).
 */
export const normalizeSoundboardAudioUrl = (url: string): string => {
  const trimmed = url.trim();
  if (!trimmed) return '';

  const fileIdFromHelper = extractGoogleFileId(trimmed);
  if (fileIdFromHelper && DRIVE_FILE_ID_REGEX.test(fileIdFromHelper)) {
    return `https://drive.google.com/uc?export=download&id=${fileIdFromHelper}`;
  }

  try {
    const parsed = new URL(toParsableUrl(trimmed));
    if (parsed.hostname !== 'drive.google.com') {
      return trimmed;
    }

    const idParam = parsed.searchParams.get('id');
    if (idParam && DRIVE_FILE_ID_REGEX.test(idParam)) {
      return `https://drive.google.com/uc?export=download&id=${idParam}`;
    }
  } catch (_error) {
    return trimmed;
  }

  return trimmed;
};
