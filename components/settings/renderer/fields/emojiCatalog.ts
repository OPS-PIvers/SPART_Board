export type EmojiGroup = { leaf: string; emoji: ReadonlyArray<string> };

/** Curated classroom-appropriate set; screen readers announce each emoji by its Unicode name. */
export const CURATED_EMOJI_GROUPS: ReadonlyArray<EmojiGroup> = [
  {
    leaf: 'emojiFaces',
    emoji: [
      '😀',
      '😊',
      '😎',
      '🤔',
      '😴',
      '🤩',
      '😇',
      '🥳',
      '🙂',
      '😮',
      '🤓',
      '😌',
      '🤗',
      '🙃',
      '😋',
    ],
  },
  {
    leaf: 'emojiObjects',
    emoji: [
      '📚',
      '✏️',
      '📝',
      '🎒',
      '🧪',
      '🔬',
      '🎨',
      '🎵',
      '⏰',
      '💡',
      '🧩',
      '🏆',
      '🎯',
      '📐',
      '🖍️',
      '🧮',
      '🎓',
      '🍎',
    ],
  },
  {
    leaf: 'emojiNature',
    emoji: [
      '🌟',
      '🌈',
      '☀️',
      '🌙',
      '🌱',
      '🌻',
      '🍀',
      '🌊',
      '🔥',
      '❄️',
      '🐝',
      '🦋',
      '🐢',
      '🦉',
      '🐸',
    ],
  },
  {
    leaf: 'emojiSymbols',
    emoji: [
      '⭐',
      '❤️',
      '✅',
      '❌',
      '❓',
      '❗',
      '💯',
      '🔔',
      '🚀',
      '🎉',
      '👍',
      '👏',
      '🙌',
      '✨',
      '🔑',
    ],
  },
];

const ZWJ = 0x200d;
const KEYCAP = 0x20e3;
const isVariationSelector = (cp: number) => cp === 0xfe0f || cp === 0xfe0e;
const isSkinTone = (cp: number) => cp >= 0x1f3fb && cp <= 0x1f3ff;
const isRegionalIndicator = (cp: number) => cp >= 0x1f1e6 && cp <= 0x1f1ff;
const isTagChar = (cp: number) => cp >= 0xe0020 && cp <= 0xe007f;

// Manual emoji cluster walk for engines without Intl.Segmenter: base + VS16/VS15 + skin tone + ZWJ joins + keycap + flag pairs + tag sequences.
function walkEmojiCluster(codePoints: number[]): string {
  let end = 1;
  if (
    isRegionalIndicator(codePoints[0]) &&
    isRegionalIndicator(codePoints[1])
  ) {
    end = 2;
  }
  for (;;) {
    const cp = codePoints[end];
    if (cp === undefined) break;
    if (
      isVariationSelector(cp) ||
      isSkinTone(cp) ||
      cp === KEYCAP ||
      isTagChar(cp)
    ) {
      end += 1;
      continue;
    }
    if (cp === ZWJ && codePoints[end + 1] !== undefined) {
      end += 2;
      continue;
    }
    break;
  }
  return String.fromCodePoint(...codePoints.slice(0, end));
}

/** First grapheme cluster of the text, so a pasted string collapses to one emoji. */
export function firstGrapheme(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return '';
  if (typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function') {
    const segmenter = new Intl.Segmenter(undefined, {
      granularity: 'grapheme',
    });
    const first = segmenter.segment(trimmed)[Symbol.iterator]().next();
    return first.done ? '' : first.value.segment;
  }
  const codePoints = Array.from(trimmed, (ch) => ch.codePointAt(0) ?? 0);
  return walkEmojiCluster(codePoints);
}
