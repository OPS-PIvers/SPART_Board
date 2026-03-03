import { TalkingToolCategory } from '@/types';

export const DEFAULT_TALKING_TOOL_CATEGORIES: TalkingToolCategory[] = [
  {
    id: 'listen',
    label: 'Listen Closely',
    color: '#008ab6',
    icon: 'Ear',
    stems: [
      'What do you mean by ________?',
      'Can you tell me more about ________?',
      'What evidence supports your idea?',
      'How does your idea relate to ________?',
    ],
  },
  {
    id: 'share',
    label: 'Share What You Think',
    color: '#009cc3',
    icon: 'MessageCircle',
    stems: [
      'I think ________ because ________.',
      'First, ________. Also, ________. Finally, ________.',
      'I agree and I will add that ________.',
      'I disagree because ________.',
      'I hear you say that ________. This makes me think that ________.',
      'I hear you say that ________. However, ________.',
    ],
  },
  {
    id: 'support',
    label: 'Support What You Say',
    color: '#5aafd1',
    icon: 'BookOpen',
    stems: [
      'In the text, ________.',
      'For example, ________.',
      'One reason is ________. Another reason is ________.',
      'This evidence shows ________.',
      'This evidence means ________.',
      'This evidence is important because ________.',
    ],
  },
];
