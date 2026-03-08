import React from 'react';
import {
  Columns,
  Grid2x2,
  Sidebar,
  LayoutColumns,
  SquareSplitVertical,
  Layout,
} from 'lucide-react';

export interface SnapZone {
  id: string;
  x: number; // 0.0 to 1.0 (Percentage of safe width)
  y: number; // 0.0 to 1.0 (Percentage of safe height)
  w: number; // 0.0 to 1.0 (Percentage of safe width)
  h: number; // 0.0 to 1.0 (Percentage of safe height)
}

export interface SnapLayout {
  id: string;
  name: string;
  icon: React.ReactNode;
  zones: SnapZone[];
}

export const SNAP_LAYOUTS: SnapLayout[] = [
  {
    id: 'split-half',
    name: 'Split Screen',
    icon: <Columns className="w-5 h-5" />,
    zones: [
      { id: 'left-half', x: 0, y: 0, w: 0.5, h: 1 },
      { id: 'right-half', x: 0.5, y: 0, w: 0.5, h: 1 },
    ],
  },
  {
    id: 'grid-2x2',
    name: 'Four Grid',
    icon: <Grid2x2 className="w-5 h-5" />,
    zones: [
      { id: 'top-left', x: 0, y: 0, w: 0.5, h: 0.5 },
      { id: 'top-right', x: 0.5, y: 0, w: 0.5, h: 0.5 },
      { id: 'bottom-left', x: 0, y: 0.5, w: 0.5, h: 0.5 },
      { id: 'bottom-right', x: 0.5, y: 0.5, w: 0.5, h: 0.5 },
    ],
  },
  {
    id: 'sidebar-left',
    name: 'Sidebar Left',
    icon: <Sidebar className="w-5 h-5" />,
    zones: [
      { id: 'side', x: 0, y: 0, w: 0.34, h: 1 },
      { id: 'main', x: 0.34, y: 0, w: 0.66, h: 1 },
    ],
  },
  {
    id: 'sidebar-right',
    name: 'Sidebar Right',
    icon: <Sidebar className="w-5 h-5 rotate-180" />,
    zones: [
      { id: 'main', x: 0, y: 0, w: 0.66, h: 1 },
      { id: 'side', x: 0.66, y: 0, w: 0.34, h: 1 },
    ],
  },
  {
    id: 'three-columns',
    name: 'Three Columns',
    icon: <LayoutColumns className="w-5 h-5" />,
    zones: [
      { id: 'left', x: 0, y: 0, w: 0.33, h: 1 },
      { id: 'center', x: 0.33, y: 0, w: 0.34, h: 1 },
      { id: 'right', x: 0.67, y: 0, w: 0.33, h: 1 },
    ],
  },
  {
    id: 'split-vertical',
    name: 'Top/Bottom',
    icon: <SquareSplitVertical className="w-5 h-5" />,
    zones: [
      { id: 'top', x: 0, y: 0, w: 1, h: 0.5 },
      { id: 'bottom', x: 0, y: 0.5, w: 1, h: 0.5 },
    ],
  },
  {
    id: 'priority-left',
    name: 'Priority Left',
    icon: <Layout className="w-5 h-5" />,
    zones: [
      { id: 'main', x: 0, y: 0, w: 0.5, h: 1 },
      { id: 'top-side', x: 0.5, y: 0, w: 0.5, h: 0.5 },
      { id: 'bottom-side', x: 0.5, y: 0.5, w: 0.5, h: 0.5 },
    ],
  },
  {
    id: 'priority-right',
    name: 'Priority Right',
    icon: <Layout className="w-5 h-5 rotate-180" />,
    zones: [
      { id: 'top-side', x: 0, y: 0, w: 0.5, h: 0.5 },
      { id: 'bottom-side', x: 0, y: 0.5, w: 0.5, h: 0.5 },
      { id: 'main', x: 0.5, y: 0, w: 0.5, h: 1 },
    ],
  },
];
