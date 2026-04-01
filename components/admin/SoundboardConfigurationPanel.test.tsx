import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, beforeEach, afterAll, vi } from 'vitest';
import { SoundboardConfigurationPanel } from './SoundboardConfigurationPanel';
import { SoundboardGlobalConfig } from '@/types';

const mockPlay = vi
  .fn<() => Promise<void>>()
  .mockResolvedValue(undefined as unknown as void);

const mockPause = vi.fn<() => void>();
const mockAudioConstructor = vi.fn<(src?: string) => void>();

vi.stubGlobal(
  'Audio',
  class {
    constructor(src?: string) {
      mockAudioConstructor(src);
    }

    play(): Promise<void> {
      return mockPlay();
    }

    pause(): void {
      mockPause();
    }
  }
);

describe('SoundboardConfigurationPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  it('normalizes Google Drive share links before test playback', () => {
    const config: SoundboardGlobalConfig = {
      buildingDefaults: {
        'schumann-elementary': {
          availableSounds: [
            {
              id: 'drive-sound-1',
              label: 'Drive Chime',
              url: 'https://drive.google.com/file/d/1EjE5Dnmrx2H8um03srzcoMm1LCdtO8Xp/view?usp=sharing',
              color: '#6366f1',
            },
          ],
          enabledLibrarySoundIds: [],
        },
      },
    };

    render(<SoundboardConfigurationPanel config={config} onChange={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /test/i }));

    expect(mockAudioConstructor).toHaveBeenCalledWith(
      'https://drive.google.com/uc?id=1EjE5Dnmrx2H8um03srzcoMm1LCdtO8Xp&export=download'
    );
    expect(mockPlay).toHaveBeenCalled();
  });
});
