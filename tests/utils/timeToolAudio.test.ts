import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { playTimerAlert, resumeAudio, getAudioCtx } from '../../utils/timeToolAudio';

describe('timeToolAudio', () => {
  let ctx: any;

  beforeEach(() => {
    // Ensure window.AudioContext exists and is constructible.
    // We use a class to ensure 'new window.AudioContext()' works.
    if (!(window as any).AudioContext) {
      (window as any).AudioContext = class MockAudioContext {
        state = 'suspended';
        currentTime = 100;
        destination = {};
        // Initial stub methods, will be overridden by spies on the instance
        createOscillator() { return {}; }
        createGain() { return {}; }
        resume() { return Promise.resolve(); }
      };
    }

    // Get the singleton instance (creating it if necessary)
    ctx = getAudioCtx();

    // Reset mocks on the instance methods to ensure clean state for each test.
    // We overwrite the methods with fresh spies.
    // Use Object.assign or direct assignment to ensure we update the existing instance.
    ctx.createOscillator = vi.fn().mockReturnValue({
      type: 'sine',
      frequency: { setValueAtTime: vi.fn() },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    });

    ctx.createGain = vi.fn().mockReturnValue({
      gain: {
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
    });

    ctx.resume = vi.fn().mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes AudioContext', () => {
    expect(ctx).toBeDefined();
  });

  it('resumes audio context if suspended', async () => {
    await resumeAudio();
    expect(ctx.resume).toHaveBeenCalled();
  });

  it('plays Chime sound', () => {
    playTimerAlert('Chime');
    // Chime plays 3 notes
    expect(ctx.createOscillator).toHaveBeenCalledTimes(3);
  });

  it('plays Gong sound', () => {
    playTimerAlert('Gong');
    // Gong plays fundamental + 5 harmonics = 6
    expect(ctx.createOscillator).toHaveBeenCalledTimes(6);
  });

  it('plays Blip sound', () => {
    playTimerAlert('Blip');
    expect(ctx.createOscillator).toHaveBeenCalledTimes(1);
  });

  it('plays Alert sound', () => {
    playTimerAlert('Alert');
    // Alert plays 4 beeps
    expect(ctx.createOscillator).toHaveBeenCalledTimes(4);
  });
});
