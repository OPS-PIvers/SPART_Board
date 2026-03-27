import { CustomBlockType } from '@/types';

export function buildDefaultConfig(
  type: CustomBlockType
): Record<string, unknown> {
  switch (type) {
    case 'text':
      return { text: 'Enter text here', fontSize: 16, align: 'left' };
    case 'heading':
      return { text: 'Heading', size: 'md' };
    case 'image':
      return { url: '', alt: '', objectFit: 'contain' };
    case 'cb-button':
      return { label: 'Click Me', style: 'primary' };
    case 'counter':
      return { label: 'Count', startValue: 0, step: 1 };
    case 'toggle':
      return { label: 'Toggle', onLabel: 'ON', offLabel: 'OFF' };
    case 'stars':
      return { maxStars: 5, label: 'Rating' };
    case 'progress':
      return { min: 0, max: 100, startValue: 0, label: 'Progress' };
    case 'timer':
      return { durationSeconds: 60, autoStart: false, showControls: true };
    case 'score':
      return { label: 'Score', startValue: 0 };
    case 'checklist':
      return { items: ['Item 1', 'Item 2', 'Item 3'] };
    case 'poll':
      return { question: 'Vote:', options: ['Yes', 'No'] };
    case 'multiple-choice':
      return {
        question: 'Question?',
        options: ['A', 'B', 'C', 'D'],
        correctIndex: 0,
      };
    case 'text-input':
      return { placeholder: 'Type here...', label: '' };
    case 'reveal':
      return { contentType: 'text', content: 'Hidden content' };
    case 'flip-card':
      return {
        frontType: 'text',
        frontContent: 'Front',
        backType: 'text',
        backContent: 'Back',
      };
    case 'conditional-label':
      return { initialText: 'State A' };
    case 'badge':
      return { label: 'Badge', icon: '⭐', earned: false };
    case 'traffic-light':
      return { initialColor: 'green' };
    case 'match-pair':
      return {
        leftItems: ['Term 1'],
        rightItems: ['Definition 1'],
        correctPairs: [0],
      };
    case 'hotspot':
      return { imageUrl: '', spots: [] };
    case 'sort-bin':
      return { bins: ['Bin A', 'Bin B'], items: [] };
    default:
      return {};
  }
}
