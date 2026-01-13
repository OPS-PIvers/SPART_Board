import { GradeLevel } from '../types';

export interface InstructionalRoutine {
  id: string;
  name: string;
  grades: string;
  gradeLevels: GradeLevel[];
  icon: string;
  defaultSteps: string[];
}

export const ROUTINES: InstructionalRoutine[] = [
  {
    id: 'chalk-talk',
    name: 'Chalk Talk',
    grades: '3-5',
    gradeLevels: ['3-5'],
    icon: 'MessagesSquare',
    defaultSteps: [
      'Read the question on the board.',
      'Write your answer quietly.',
      'Read and answer what your friends wrote.',
    ],
  },
  {
    id: 'choral-reading',
    name: 'Choral Reading',
    grades: 'K-5',
    gradeLevels: ['k-2', '3-5'],
    icon: 'Users',
    defaultSteps: [
      'Read the text together in one voice.',
      'Listen to stay at the same speed.',
    ],
  },
  {
    id: 'echo-reading',
    name: 'Echo Reading',
    grades: 'K-5',
    gradeLevels: ['k-2', '3-5'],
    icon: 'Volume2',
    defaultSteps: [
      'Listen to the teacher read.',
      'Read the same part back exactly the same way.',
    ],
  },
  {
    id: 'fishbowl',
    name: 'Fishbowl',
    grades: '3-5',
    gradeLevels: ['3-5'],
    icon: 'Eye',
    defaultSteps: [
      'Inside group: Practice the skill.',
      'Outside group: Watch and learn.',
      'Class: Talk about what we saw.',
    ],
  },
  {
    id: 'gallery-walk',
    name: 'Gallery Walk',
    grades: 'K-5',
    gradeLevels: ['k-2', '3-5'],
    icon: 'Image',
    defaultSteps: [
      'Walk quietly around the room.',
      'Look closely at the work on the walls.',
      'Think about what you learned.',
    ],
  },
  {
    id: 'give-one-get-one',
    name: 'Give One-Get One-Move One',
    grades: '3-5',
    gradeLevels: ['3-5'],
    icon: 'ArrowRightLeft',
    defaultSteps: [
      'Write your idea on a card.',
      'Trade ideas with a partner.',
      'Find a new partner and share the new idea.',
    ],
  },
  {
    id: 'jigsaw',
    name: 'Jigsaw',
    grades: '2-5',
    gradeLevels: ['k-2', '3-5'],
    icon: 'Puzzle',
    defaultSteps: [
      'Learn your part with your expert group.',
      'Teach your part to your home group.',
      'Listen to learn all the other parts.',
    ],
  },
  {
    id: 'jot-pair-share',
    name: 'Jot-Pair-Share',
    grades: 'K-5',
    gradeLevels: ['k-2', '3-5'],
    icon: 'PencilLine',
    defaultSteps: [
      'Quickly write your answer.',
      'Share your writing with a partner.',
      'Share your ideas with the class.',
    ],
  },
  {
    id: 'mix-and-mingle',
    name: 'Mix and Mingle',
    grades: 'K-5',
    gradeLevels: ['k-2', '3-5'],
    icon: 'Users2',
    defaultSteps: [
      'Think about the question.',
      'Find a partner and share your answer.',
      'When told, move to find a new partner.',
    ],
  },
  {
    id: 'question-corners',
    name: 'Question Corners',
    grades: 'K-2',
    gradeLevels: ['k-2'],
    icon: 'Signpost',
    defaultSteps: [
      'Pick the corner you want to answer.',
      'Walk to that corner.',
      'Talk with the friends in your corner.',
    ],
  },
  {
    id: 'readers-theater',
    name: "Readers' Theater",
    grades: '2-5',
    gradeLevels: ['k-2', '3-5'],
    icon: 'Smile',
    defaultSteps: [
      'Get your group and your parts.',
      'Practice reading your lines.',
      'Perform the story for the class!',
    ],
  },
  {
    id: 'repeated-reading',
    name: 'Repeated Reading',
    grades: '2-5',
    gradeLevels: ['k-2', '3-5'],
    icon: 'Repeat2',
    defaultSteps: [
      'Read with the teacher.',
      'Read with a partner.',
      'Read it quietly by yourself.',
    ],
  },
  {
    id: 'tableau',
    name: 'Tableau',
    grades: 'K-5',
    gradeLevels: ['k-2', '3-5'],
    icon: 'Pause',
    defaultSteps: [
      'Work with your group.',
      'Make a statue scene from the story.',
      'Stay very still and quiet.',
    ],
  },
  {
    id: 'take-a-stand',
    name: 'Take a Stand',
    grades: '3-5',
    gradeLevels: ['3-5'],
    icon: 'Vote',
    defaultSteps: [
      'Listen to the question.',
      'Move to the area that matches your choice.',
      'Explain why you chose that spot.',
    ],
  },
  {
    id: 'think-pair-share',
    name: 'Think-Pair-Share',
    grades: 'K-5',
    gradeLevels: ['k-2', '3-5'],
    icon: 'Brain',
    defaultSteps: [
      'Think silently about the question.',
      'Share your thoughts with a partner.',
      'Join the class discussion.',
    ],
  },
  {
    id: 'vocabulary-exploration',
    name: 'Vocabulary Exploration',
    grades: 'K-5',
    gradeLevels: ['k-2', '3-5'],
    icon: 'BookOpenCheck',
    defaultSteps: [
      'Listen to the word.',
      'Say the word and clap the beats.',
      'Learn what the word means.',
    ],
  },
  {
    id: 'whip-around',
    name: 'Whip Around',
    grades: '3-5',
    gradeLevels: ['3-5'],
    icon: 'Zap',
    defaultSteps: [
      'Listen to the prompt.',
      'Quickly share your answer one by one.',
      "Listen to everyone's ideas.",
    ],
  },
];
