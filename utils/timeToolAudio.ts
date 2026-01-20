// Singleton-like Audio Manager to prevent performance issues and ensure SSR safety
let audioCtx: AudioContext | null = null;

// Add type definition for webkitAudioContext
interface CustomWindow extends Window {
  webkitAudioContext: typeof AudioContext;
}

export const getAudioCtx = () => {
  if (typeof window === 'undefined') return null; // Guard against SSR/non-browser env
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as CustomWindow).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  return audioCtx;
};

export const resumeAudio = async () => {
  const ctx = getAudioCtx();
  if (ctx && ctx.state === 'suspended') {
    await ctx.resume();
  }
};

export type TimerSound = 'Chime' | 'Gong' | 'Blip' | 'Alert';

export const playTimerAlert = (sound: string) => {
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;

    // Ensure context is running (though resumeAudio should be called on interaction)
    if (ctx.state === 'suspended') {
      // We can't await here easily without making this async, but the oscillator start might fail or be silent.
      // Usually resume is called on user interaction beforehand.
    }

    const now = ctx.currentTime;

    if (sound === 'Chime') {
      [523.25, 659.25, 783.99].forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + i * 0.05);
        gain.gain.setValueAtTime(0, now + i * 0.05);
        gain.gain.linearRampToValueAtTime(0.2, now + i * 0.05 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5 + i * 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.05);
        osc.stop(now + 2);
      });
    } else if (sound === 'Gong') {
      const fund = ctx.createOscillator();
      const fundGain = ctx.createGain();
      fund.type = 'sine';
      fund.frequency.setValueAtTime(55, now);
      fundGain.gain.setValueAtTime(0, now);
      fundGain.gain.linearRampToValueAtTime(0.8, now + 0.08);
      fundGain.gain.exponentialRampToValueAtTime(0.001, now + 5);
      fund.connect(fundGain);
      fundGain.connect(ctx.destination);
      fund.start(now);
      fund.stop(now + 5);
      [113, 167, 223, 317, 449].forEach((f) => {
        const pOsc = ctx.createOscillator();
        const pGain = ctx.createGain();
        pOsc.type = 'sine';
        pOsc.frequency.setValueAtTime(f, now);
        pGain.gain.setValueAtTime(0, now);
        pGain.gain.linearRampToValueAtTime(0.2, now + 0.01);
        pGain.gain.exponentialRampToValueAtTime(0.001, now + 3);
        pOsc.connect(pGain);
        pGain.connect(ctx.destination);
        pOsc.start(now);
        pOsc.stop(now + 3);
      });
    } else if (sound === 'Blip') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.3, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (sound === 'Alert') {
      [440, 880, 440, 880].forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(f, now + i * 0.2);
        gain.gain.setValueAtTime(0, now + i * 0.2);
        gain.gain.linearRampToValueAtTime(0.1, now + i * 0.2 + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.2 + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.2);
        osc.stop(now + i * 0.2 + 0.2);
      });
    }
  } catch (e) {
    console.warn('Audio play failed', e);
  }
};
