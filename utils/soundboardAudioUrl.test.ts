import { describe, expect, it } from 'vitest';
import { normalizeSoundboardAudioUrl } from './soundboardAudioUrl';

describe('normalizeSoundboardAudioUrl', () => {
  it('normalizes drive file view URLs', () => {
    expect(
      normalizeSoundboardAudioUrl(
        'https://drive.google.com/file/d/abc123_DEF-ghi/view'
      )
    ).toBe('https://drive.google.com/uc?export=download&id=abc123_DEF-ghi');
  });

  it('normalizes drive open links with extra query params', () => {
    expect(
      normalizeSoundboardAudioUrl(
        'https://drive.google.com/open?id=abc123_DEF-ghi&usp=sharing'
      )
    ).toBe('https://drive.google.com/uc?export=download&id=abc123_DEF-ghi');
  });

  it('normalizes drive uc links', () => {
    expect(
      normalizeSoundboardAudioUrl(
        'https://drive.google.com/uc?id=abc123_DEF-ghi&export=download'
      )
    ).toBe('https://drive.google.com/uc?export=download&id=abc123_DEF-ghi');
  });

  it('normalizes bare drive links without protocol', () => {
    expect(
      normalizeSoundboardAudioUrl('drive.google.com/open?id=abc123_DEF-ghi')
    ).toBe('https://drive.google.com/uc?export=download&id=abc123_DEF-ghi');
  });

  it('returns trimmed non-drive urls unchanged', () => {
    expect(
      normalizeSoundboardAudioUrl('  https://example.com/sound.mp3  ')
    ).toBe('https://example.com/sound.mp3');
  });
});
