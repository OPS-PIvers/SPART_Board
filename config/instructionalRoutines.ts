import { GradeLevel } from '../types';

export interface InstructionalRoutine {
  id: string;
  name: string;
  grades: string;
  gradeLevels: GradeLevel[];
  description: string;
  icon: string;
  steps: string[];
}

export const ROUTINES: InstructionalRoutine[] = [
  {
    id: 'choral-reading',
    name: 'Choral Reading',
    grades: 'K-8',
    gradeLevels: ['k-2', '3-5', '6-8'],
    description:
      'Students strengthen fluency through whole group oral reading.',
    icon: 'Users',
    steps: [
      'Read the text together in one voice.',
      'Listen to stay at the same speed.',
    ],
  },
  {
    id: 'think-pair-share',
    name: 'Think-Pair-Share',
    grades: 'K-8',
    gradeLevels: ['k-2', '3-5', '6-8'],
    description:
      'Individual thinking and partner reflection before whole group discussion.',
    icon: 'MessagesSquare',
    steps: [
      'Think silently about the question.',
      'Share your thoughts with a partner.',
      'Join the class discussion.',
    ],
  },
  {
    id: 'jigsaw',
    name: 'Jigsaw',
    grades: '2-8',
    gradeLevels: ['k-2', '3-5', '6-8'],
    description: 'Become an expert on one section and teach your peers.',
    icon: 'Puzzle',
    steps: [
      'Work with your expert group to learn your section.',
      'Return to your home group.',
      'Teach your section to your teammates.',
    ],
  },
];
