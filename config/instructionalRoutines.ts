import { GradeLevel } from '../types';

export interface InstructionalStep {
  text: string;
  icon?: string;
  color?: string;
}

export interface InstructionalRoutine {
  id: string;
  name: string;
  grades: string;
  gradeLevels: GradeLevel[];
  icon: string;
  steps: InstructionalStep[];
}

export const ROUTINES: InstructionalRoutine[] = [
  {
    id: 'chalk-talk',
    name: 'Chalk Talk',
    grades: '3-5',
    gradeLevels: ['3-5'],
    icon: 'MessagesSquare',
    steps: [
      { text: 'Read the question on the board.', icon: 'Eye', color: 'blue' },
      { text: 'Write your answer quietly.', icon: 'Pencil', color: 'slate' },
      {
        text: 'Read and answer what your friends wrote.',
        icon: 'MessageSquare',
        color: 'indigo',
      },
    ],
  },
  {
    id: 'choral-reading',
    name: 'Choral Reading',
    grades: 'K-5',
    gradeLevels: ['k-2', '3-5'],
    icon: 'Users',
    steps: [
      {
        text: 'Read the text together in one voice.',
        icon: 'Volume2',
        color: 'blue',
      },
      {
        text: 'Listen to stay at the same speed.',
        icon: 'Ear',
        color: 'indigo',
      },
    ],
  },
  {
    id: 'echo-reading',
    name: 'Echo Reading',
    grades: 'K-5',
    gradeLevels: ['k-2', '3-5'],
    icon: 'Volume2',
    steps: [
      { text: 'Listen to the teacher read.', icon: 'Ear', color: 'blue' },
      {
        text: 'Read the same part back exactly the same way.',
        icon: 'Volume2',
        color: 'indigo',
      },
    ],
  },
  {
    id: 'fishbowl',
    name: 'Fishbowl',
    grades: '3-5',
    gradeLevels: ['3-5'],
    icon: 'Eye',
    steps: [
      {
        text: 'Inside group: Practice the skill.',
        icon: 'Users',
        color: 'blue',
      },
      { text: 'Outside group: Watch and learn.', icon: 'Eye', color: 'amber' },
      {
        text: 'Class: Talk about what we saw.',
        icon: 'MessageSquare',
        color: 'indigo',
      },
    ],
  },
  {
    id: 'gallery-walk',
    name: 'Gallery Walk',
    grades: 'K-5',
    gradeLevels: ['k-2', '3-5'],
    icon: 'Image',
    steps: [
      {
        text: 'Walk quietly around the room.',
        icon: 'Footprints',
        color: 'slate',
      },
      {
        text: 'Look closely at the work on the walls.',
        icon: 'Eye',
        color: 'blue',
      },
      {
        text: 'Think about what you learned.',
        icon: 'Lightbulb',
        color: 'amber',
      },
    ],
  },
  {
    id: 'give-one-get-one',
    name: 'Give One-Get One-Move One',
    grades: '3-5',
    gradeLevels: ['3-5'],
    icon: 'ArrowRightLeft',
    steps: [
      { text: 'Write your idea on a card.', icon: 'Pencil', color: 'blue' },
      {
        text: 'Trade ideas with a partner.',
        icon: 'RefreshCw',
        color: 'indigo',
      },
      {
        text: 'Find a new partner and share the new idea.',
        icon: 'Users',
        color: 'green',
      },
    ],
  },
  {
    id: 'jigsaw',
    name: 'Jigsaw',
    grades: '2-5',
    gradeLevels: ['k-2', '3-5'],
    icon: 'Puzzle',
    steps: [
      {
        text: 'Learn your part with your expert group.',
        icon: 'Search',
        color: 'blue',
      },
      {
        text: 'Teach your part to your home group.',
        icon: 'Users',
        color: 'indigo',
      },
      {
        text: 'Listen to learn all the other parts.',
        icon: 'Ear',
        color: 'amber',
      },
    ],
  },
  {
    id: 'jot-pair-share',
    name: 'Jot-Pair-Share',
    grades: 'K-5',
    gradeLevels: ['k-2', '3-5'],
    icon: 'PencilLine',
    steps: [
      { text: 'Quickly write your answer.', icon: 'Pencil', color: 'blue' },
      {
        text: 'Share your writing with a partner.',
        icon: 'Users',
        color: 'indigo',
      },
      {
        text: 'Share your ideas with the class.',
        icon: 'Share2',
        color: 'green',
      },
    ],
  },
  {
    id: 'mix-and-mingle',
    name: 'Mix and Mingle',
    grades: 'K-5',
    gradeLevels: ['k-2', '3-5'],
    icon: 'Users2',
    steps: [
      { text: 'Think about the question.', icon: 'Lightbulb', color: 'blue' },
      {
        text: 'Find a partner and share your answer.',
        icon: 'Users',
        color: 'indigo',
      },
      {
        text: 'When told, move to find a new partner.',
        icon: 'ArrowRightLeft',
        color: 'green',
      },
    ],
  },
  {
    id: 'question-corners',
    name: 'Question Corners',
    grades: 'K-2',
    gradeLevels: ['k-2'],
    icon: 'Signpost',
    steps: [
      {
        text: 'Pick the corner you want to answer.',
        icon: 'MapPin',
        color: 'blue',
      },
      { text: 'Walk to that corner.', icon: 'Footprints', color: 'indigo' },
      {
        text: 'Talk with the friends in your corner.',
        icon: 'Users',
        color: 'green',
      },
    ],
  },
  {
    id: 'readers-theater',
    name: "Readers' Theater",
    grades: '2-5',
    gradeLevels: ['k-2', '3-5'],
    icon: 'Smile',
    steps: [
      {
        text: 'Get your group and your parts.',
        icon: 'Users',
        color: 'blue',
      },
      { text: 'Practice reading your lines.', icon: 'Book', color: 'indigo' },
      {
        text: 'Perform the story for the class!',
        icon: 'Mic2',
        color: 'green',
      },
    ],
  },
  {
    id: 'repeated-reading',
    name: 'Repeated Reading',
    grades: '2-5',
    gradeLevels: ['k-2', '3-5'],
    icon: 'Repeat2',
    steps: [
      { text: 'Read with the teacher.', icon: 'Users', color: 'blue' },
      { text: 'Read with a partner.', icon: 'User', color: 'indigo' },
      { text: 'Read it quietly by yourself.', icon: 'Book', color: 'green' },
    ],
  },
  {
    id: 'tableau',
    name: 'Tableau',
    grades: 'K-5',
    gradeLevels: ['k-2', '3-5'],
    icon: 'Pause',
    steps: [
      { text: 'Work with your group.', icon: 'Users', color: 'blue' },
      {
        text: 'Make a statue scene from the story.',
        icon: 'Smile',
        color: 'indigo',
      },
      { text: 'Stay very still and quiet.', icon: 'Pause', color: 'green' },
    ],
  },
  {
    id: 'take-a-stand',
    name: 'Take a Stand',
    grades: '3-5',
    gradeLevels: ['3-5'],
    icon: 'Vote',
    steps: [
      { text: 'Listen to the question.', icon: 'Ear', color: 'blue' },
      {
        text: 'Move to the area that matches your choice.',
        icon: 'Footprints',
        color: 'indigo',
      },
      {
        text: 'Explain why you chose that spot.',
        icon: 'MessageSquare',
        color: 'green',
      },
    ],
  },
  {
    id: 'think-pair-share',
    name: 'Think-Pair-Share',
    grades: 'K-5',
    gradeLevels: ['k-2', '3-5'],
    icon: 'Brain',
    steps: [
      {
        text: 'Think silently about the question.',
        icon: 'Lightbulb',
        color: 'blue',
      },
      {
        text: 'Share your thoughts with a partner.',
        icon: 'Users',
        color: 'indigo',
      },
      { text: 'Join the class discussion.', icon: 'Share2', color: 'green' },
    ],
  },
  {
    id: 'vocabulary-exploration',
    name: 'Vocabulary Exploration',
    grades: 'K-5',
    gradeLevels: ['k-2', '3-5'],
    icon: 'BookOpenCheck',
    steps: [
      { text: 'Listen to the word.', icon: 'Ear', color: 'blue' },
      {
        text: 'Say the word and clap the beats.',
        icon: 'Music',
        color: 'indigo',
      },
      { text: 'Learn what the word means.', icon: 'Book', color: 'green' },
    ],
  },
  {
    id: 'whip-around',
    name: 'Whip Around',
    grades: '3-5',
    gradeLevels: ['3-5'],
    icon: 'Zap',
    steps: [
      { text: 'Listen to the prompt.', icon: 'Ear', color: 'blue' },
      {
        text: 'Quickly share your answer one by one.',
        icon: 'Users',
        color: 'indigo',
      },
      { text: "Listen to everyone's ideas.", icon: 'Users2', color: 'green' },
    ],
  },
  {
    id: 'blooms-taxonomy',
    name: "Bloom's Taxonomy",
    grades: '9-12',
    gradeLevels: ['9-12'],
    icon: 'Brain',
    steps: [
      {
        text: 'Remember: Recall facts and basic concepts.',
        icon: 'Archive',
        color: 'slate',
      },
      {
        text: 'Understand: Explain ideas or concepts.',
        icon: 'Book',
        color: 'blue',
      },
      {
        text: 'Apply: Use information in new situations.',
        icon: 'Play',
        color: 'indigo',
      },
      {
        text: 'Analyze: Draw connections among ideas.',
        icon: 'Brain',
        color: 'purple',
      },
      {
        text: 'Evaluate: Justify a stand or decision.',
        icon: 'Award',
        color: 'amber',
      },
      {
        text: 'Create: Produce new or original work.',
        icon: 'Lightbulb',
        color: 'green',
      },
    ],
  },
];
