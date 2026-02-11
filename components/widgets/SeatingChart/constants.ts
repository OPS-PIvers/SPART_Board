import { FurnitureItem } from '../../../types';
import {
  Armchair,
  LayoutGrid,
  Monitor,
  User,
} from 'lucide-react';
import React from 'react';

// Furniture definitions for palette
export const FURNITURE_TYPES: {
  type: FurnitureItem['type'];
  label: string;
  w: number;
  h: number;
  icon: React.ElementType;
}[] = [
  { type: 'desk', label: 'Desk', w: 60, h: 50, icon: Monitor },
  {
    type: 'table-rect',
    label: 'Table (Rect)',
    w: 120,
    h: 80,
    icon: LayoutGrid,
  },
  {
    type: 'table-round',
    label: 'Table (Round)',
    w: 100,
    h: 100,
    icon: LayoutGrid,
  }, // Using css radius
  { type: 'rug', label: 'Rug', w: 150, h: 100, icon: Armchair },
  { type: 'teacher-desk', label: 'Teacher', w: 100, h: 60, icon: User },
];
