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
    id: 'chalk-talk',
    name: 'Chalk Talk',
    grades: '3-5',
    gradeLevels: ['3-5'],
    description: 'Silent, written discussion to share ideas.',
    icon: 'MessagesSquare',
    steps: [
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
    description: 'Whole group oral reading for fluency.',
    icon: 'Users',
    steps: [
      'Read the text together in one voice.',
      'Listen to stay at the same speed.',
    ],
  },
  {
    id: 'echo-reading',
    name: 'Echo Reading',
    grades: 'K-5',
    gradeLevels: ['k-2', '3-5'],
    description: 'Teacher models reading and students repeat.',
    icon: 'Volume2',
    steps: [
      'Listen to the teacher read.',
      'Read the same part back exactly the same way.',
    ],
  },
  {
    id: 'fishbowl',
    name: 'Fishbowl',
    grades: '3-5',
    gradeLevels: ['3-5'],
    description: 'Inner circle practices while outer circle observes.',
    icon: 'Eye',
    steps: [
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
    description: 'Exploring posted student work.',
    icon: 'Image',
    steps: [
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
    description: 'Trading ideas with partners.',
    icon: 'ArrowRightLeft',
    steps: [
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
    description: 'Becoming an expert to teach others.',
    icon: 'Puzzle',
    steps: [
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
    description: 'Write, share with partner, then class.',
    icon: 'PencilLine',
    steps: [
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
    description: 'Moving around to discuss text aspects.',
    icon: 'Users2',
    steps: [
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
    description: 'Moving to corners to answer tasks.',
    icon: 'Signpost',
    steps: [
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
    description: 'Performing text in groups.',
    icon: 'Smile',
    steps: [
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
    description: 'Reading multiple times for fluency.',
    icon: 'Repeat2',
    steps: [
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
    description: 'Creating a silent frozen scene.',
    icon: 'Pause',
    steps: [
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
    description: 'Voicing opinions by moving.',
    icon: 'Vote',
    steps: [
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
    description: 'Think, reflect with partner, then group.',
    icon: 'Brain',
    steps: [
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
    description: 'Hearing, saying, and defining words.',
    icon: 'BookOpenCheck',
    steps: [
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
    description: 'Quickly sharing key ideas.',
    icon: 'Zap',
    steps: [
      'Listen to the prompt.',
      'Quickly share your answer one by one.',
      "Listen to everyone's ideas.",
    ],
  },
];
