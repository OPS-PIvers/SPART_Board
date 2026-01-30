import { QUICK_TOOLS } from './constants';

export interface IntentRule {
  regex: RegExp;
  toolLabel: string; // Must match a label in QUICK_TOOLS
}

export const INTENT_RULES: IntentRule[] = [
  // Timers
  { regex: /\b1\s*(?:min|minute)/i, toolLabel: 'Timer (1 min)' },
  { regex: /\b2\s*(?:min|minute)/i, toolLabel: 'Timer (2 min)' },
  { regex: /\b5\s*(?:min|minute)/i, toolLabel: 'Timer (5 min)' },
  // Stopwatch
  { regex: /stopwatch/i, toolLabel: 'Stopwatch' },
  { regex: /count\s*up/i, toolLabel: 'Stopwatch' },
  // Sound
  { regex: /noise/i, toolLabel: 'Noise Meter' },
  { regex: /volume/i, toolLabel: 'Noise Meter' },
  { regex: /quiet/i, toolLabel: 'Noise Meter' },
  { regex: /loud/i, toolLabel: 'Noise Meter' },
  // Traffic
  { regex: /traffic/i, toolLabel: 'Traffic Light' },
  { regex: /signal/i, toolLabel: 'Traffic Light' },
  // Random
  { regex: /random/i, toolLabel: 'Random Picker' },
  { regex: /pick/i, toolLabel: 'Random Picker' },
  { regex: /student/i, toolLabel: 'Random Picker' },
  { regex: /spinner/i, toolLabel: 'Random Picker' },
  // Poll
  { regex: /vote/i, toolLabel: 'Poll' },
  { regex: /poll/i, toolLabel: 'Poll' },
  { regex: /survey/i, toolLabel: 'Poll' },
];

export function detectIntent(text: string): { toolLabel: string } | null {
  if (!text) return null;

  for (const rule of INTENT_RULES) {
    if (rule.regex.test(text)) {
      // Verify tool exists in QUICK_TOOLS
      const toolExists = QUICK_TOOLS.some((t) => t.label === rule.toolLabel);
      if (toolExists) {
        return { toolLabel: rule.toolLabel };
      }
    }
  }
  return null;
}
