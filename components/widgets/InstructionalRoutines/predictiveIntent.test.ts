import { describe, it, expect } from 'vitest';
import { detectIntent } from './predictiveIntent';

describe('detectIntent', () => {
  it('detects timers', () => {
    expect(detectIntent('Talk for 1 minute')).toEqual({
      toolLabel: 'Timer (1 min)',
    });
    expect(detectIntent('You have 2 mins to discuss')).toEqual({
      toolLabel: 'Timer (2 min)',
    });
    expect(detectIntent('Take 5 minutes')).toEqual({
      toolLabel: 'Timer (5 min)',
    });
  });

  it('detects stopwatch', () => {
    expect(detectIntent('Use the stopwatch')).toEqual({
      toolLabel: 'Stopwatch',
    });
    expect(detectIntent('Count up time')).toEqual({ toolLabel: 'Stopwatch' });
  });

  it('detects noise meter', () => {
    expect(detectIntent('Keep volume low')).toEqual({
      toolLabel: 'Noise Meter',
    });
    expect(detectIntent('Monitor noise level')).toEqual({
      toolLabel: 'Noise Meter',
    });
  });

  it('detects traffic light', () => {
    expect(detectIntent('Watch the traffic light')).toEqual({
      toolLabel: 'Traffic Light',
    });
    expect(detectIntent('Wait for the signal')).toEqual({
      toolLabel: 'Traffic Light',
    });
  });

  it('detects random picker', () => {
    expect(detectIntent('Pick a random student')).toEqual({
      toolLabel: 'Random Picker',
    });
    expect(detectIntent('Use the spinner')).toEqual({
      toolLabel: 'Random Picker',
    });
  });

  it('detects poll', () => {
    expect(detectIntent('Vote on the answer')).toEqual({ toolLabel: 'Poll' });
    expect(detectIntent('Take a quick poll')).toEqual({ toolLabel: 'Poll' });
  });

  it('returns null for no match', () => {
    expect(detectIntent('Just do some work')).toBeNull();
    expect(detectIntent('')).toBeNull();
  });

  it('handles case insensitivity', () => {
    expect(detectIntent('NOISE')).toEqual({ toolLabel: 'Noise Meter' });
  });
});
