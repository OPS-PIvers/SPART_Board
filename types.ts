
export type WidgetType = 
  | 'clock' | 'timer' | 'traffic' | 'text' | 'checklist' 
  | 'random' | 'dice' | 'sound' | 'drawing' | 'qr' 
  | 'embed' | 'poll' | 'webcam';

export interface WidgetData {
  id: string;
  type: WidgetType;
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
  flipped: boolean;
  minimized?: boolean;
  config: Record<string, any>;
}

export interface Dashboard {
  id: string;
  name: string;
  background: string;
  widgets: WidgetData[];
  createdAt: number;
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}
