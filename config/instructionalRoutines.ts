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
  {
    id: 'fishbowl',
    name: 'Fishbowl',
    grades: '3-12',
    gradeLevels: ['3-5', '6-8', '9-12'],
    description:
      'A small group discusses while the rest of the class observes.',
    icon: 'Circle',
    steps: [
      'Outer circle observes the inner circle.',
      'Inner circle discusses the topic.',
      'Switch roles halfway through.',
    ],
  },
  {
    id: 'socratic-seminar',
    name: 'Socratic Seminar',
    grades: '6-12',
    gradeLevels: ['6-8', '9-12'],
    description:
      'Collaborative group discussion focused on a text or big idea.',
    icon: 'Users',
    steps: [
      'Ask open-ended questions.',
      'Use evidence to support your ideas.',
      'Listen and respond to others.',
    ],
  },
  {
    id: 'gallery-walk',
    name: 'Gallery Walk',
    grades: 'K-12',
    gradeLevels: ['k-2', '3-5', '6-8', '9-12'],
    description:
      'Students explore multiple stations to view work or information.',
    icon: 'Image',
    steps: [
      'Walk around the room to view work.',
      'Leave constructive feedback.',
      'Identify common themes or patterns.',
    ],
  },
  {
    id: 'stations',
    name: 'Stations',
    grades: 'K-8',
    gradeLevels: ['k-2', '3-5', '6-8'],
    description: 'Small groups rotate through different learning activities.',
    icon: 'LayoutGrid',
    steps: [
      'Work in small groups at one station.',
      'Complete the assigned task.',
      'Rotate when the timer goes off.',
    ],
  },
  {
    id: 'three-step-interview',
    name: 'Three-Step Interview',
    grades: '3-12',
    gradeLevels: ['3-5', '6-8', '9-12'],
    description: 'Partners interview each other and share with a larger group.',
    icon: 'Mic',
    steps: [
      'Partner A interviews Partner B.',
      'Partner B interviews Partner A.',
      'Partners share their responses with another pair.',
    ],
  },
  {
    id: 'four-corners',
    name: 'Four Corners',
    grades: 'K-12',
    gradeLevels: ['k-2', '3-5', '6-8', '9-12'],
    description: 'Students choose a corner based on their opinion or answer.',
    icon: 'Square',
    steps: [
      'Go to the corner that matches your opinion.',
      'Discuss your choice with others in your corner.',
      "One person from each corner shares their group's ideas.",
    ],
  },
  {
    id: 'round-robin',
    name: 'Round Robin',
    grades: 'K-12',
    gradeLevels: ['k-2', '3-5', '6-8', '9-12'],
    description: 'Brainstorming technique where everyone shares in turn.',
    icon: 'RotateCw',
    steps: [
      'One person at a time shares an idea.',
      'Listen without interrupting.',
      'Continue around the circle.',
    ],
  },
  {
    id: 'give-one-get-one',
    name: 'Give One, Get One',
    grades: '3-12',
    gradeLevels: ['3-5', '6-8', '9-12'],
    description: 'Active movement activity to share and collect ideas.',
    icon: 'ArrowLeftRight',
    steps: [
      'Write down three things you learned.',
      'Walk around and share one idea with a peer.',
      'Get one new idea from them and add it to your list.',
    ],
  },
  {
    id: 'agree-disagree',
    name: 'Agree/Disagree',
    grades: 'K-12',
    gradeLevels: ['k-2', '3-5', '6-8', '9-12'],
    description: 'Movement-based activity to explore differing viewpoints.',
    icon: 'ThumbsUp',
    steps: [
      'Listen to the statement.',
      'Move to the side of the room that matches your opinion.',
      'Discuss your reasoning with someone on the opposite side.',
    ],
  },
  {
    id: 'kwl-chart',
    name: 'KWL Chart',
    grades: 'K-12',
    gradeLevels: ['k-2', '3-5', '6-8', '9-12'],
    description:
      'Graphic organizer to track what students Know, Want, and Learn.',
    icon: 'ClipboardList',
    steps: [
      'Know: What do you already know?',
      'Want: What do you want to learn?',
      'Learn: What did you learn?',
    ],
  },
  {
    id: 'frayer-model',
    name: 'Frayer Model',
    grades: '3-12',
    gradeLevels: ['3-5', '6-8', '9-12'],
    description: 'Vocabulary routine to explore word meanings deeply.',
    icon: 'Box',
    steps: [
      'Definition: What is it?',
      'Characteristics: What are its traits?',
      'Examples: What are some examples?',
      'Non-examples: What is it NOT?',
    ],
  },
  {
    id: 'snowball-discussion',
    name: 'Snowball Discussion',
    grades: 'K-8',
    gradeLevels: ['k-2', '3-5', '6-8'],
    description: 'Playful routine to share ideas and spark discussion.',
    icon: 'Snowflake',
    steps: [
      'Write your idea on a piece of paper.',
      'Crumple it up and "toss" it into the center.',
      'Pick up a "snowball" and share the idea on it.',
    ],
  },
  {
    id: 'silent-discussion',
    name: 'Silent Discussion',
    grades: '6-12',
    gradeLevels: ['6-8', '9-12'],
    description:
      'Written discussion where students respond to prompts on paper.',
    icon: 'MessageSquare',
    steps: [
      'Read the prompt on the paper.',
      'Write your thoughts silently.',
      "Read others' comments and add your responses.",
    ],
  },
  {
    id: 'exit-ticket',
    name: 'Exit Ticket',
    grades: 'K-12',
    gradeLevels: ['k-2', '3-5', '6-8', '9-12'],
    description: 'Quick assessment tool used at the end of a lesson.',
    icon: 'LogOut',
    steps: [
      'Reflect on what you learned today.',
      'Answer the closing question.',
      'Turn it in before you leave.',
    ],
  },
];
