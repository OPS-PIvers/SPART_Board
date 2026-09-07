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

/** First grapheme cluster of the text, so a pasted string collapses to one emoji. */
export function firstGrapheme(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return '';
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    const segmenter = new Intl.Segmenter(undefined, {
      granularity: 'grapheme',
    });
    const first = segmenter.segment(trimmed)[Symbol.iterator]().next();
    return first.done ? '' : first.value.segment;
  }
  return Array.from(trimmed)[0] ?? '';
}
