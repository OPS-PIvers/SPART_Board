import {
  Laptop,
  Pencil,
  Book,
  FileText,
  Smartphone,
  BookOpen,
  Tablet,
  Headphones,
  Scissors,
  Highlighter,
  Calculator,
  Droplet,
} from 'lucide-react';

export interface MaterialItem {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  textColor?: string;
}

export const MATERIAL_ITEMS: MaterialItem[] = [
  {
    id: 'computer',
    label: 'Computer',
    icon: Laptop,
    color: 'bg-blue-500',
    textColor: 'text-white',
  },
  {
    id: 'pencil',
    label: 'Pencil',
    icon: Pencil,
    color: 'bg-yellow-400',
    textColor: 'text-slate-900',
  },
  {
    id: 'notebook',
    label: 'Notebook',
    icon: Book,
    color: 'bg-red-500',
    textColor: 'text-white',
  },
  {
    id: 'paper',
    label: 'Paper',
    icon: FileText,
    color: 'bg-slate-200',
    textColor: 'text-slate-900',
  },
  {
    id: 'phone',
    label: 'Phone',
    icon: Smartphone,
    color: 'bg-indigo-500',
    textColor: 'text-white',
  },
  {
    id: 'textbook',
    label: 'Textbook',
    icon: BookOpen,
    color: 'bg-emerald-600',
    textColor: 'text-white',
  },
  {
    id: 'ipad',
    label: 'iPad',
    icon: Tablet,
    color: 'bg-sky-500',
    textColor: 'text-white',
  },
  {
    id: 'headphones',
    label: 'Headphones',
    icon: Headphones,
    color: 'bg-pink-500',
    textColor: 'text-white',
  },
  {
    id: 'water',
    label: 'Water Bottle',
    icon: Droplet,
    color: 'bg-cyan-400',
    textColor: 'text-slate-900',
  },
  {
    id: 'scissors',
    label: 'Scissors',
    icon: Scissors,
    color: 'bg-orange-500',
    textColor: 'text-white',
  },
  {
    id: 'markers',
    label: 'Markers',
    icon: Highlighter,
    color: 'bg-purple-500',
    textColor: 'text-white',
  },
  {
    id: 'calculator',
    label: 'Calculator',
    icon: Calculator,
    color: 'bg-gray-600',
    textColor: 'text-white',
  },
];
