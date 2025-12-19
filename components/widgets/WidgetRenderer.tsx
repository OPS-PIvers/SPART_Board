
import React from 'react';
import { WidgetData } from '../../types';
import { DraggableWindow } from '../common/DraggableWindow';
import { ClockWidget, ClockSettings } from './ClockWidget';
import { TimerWidget, TimerSettings } from './TimerWidget';
import { TrafficLightWidget } from './TrafficLightWidget';
import { TextWidget, TextSettings } from './TextWidget';
import { SoundWidget, SoundSettings } from './SoundWidget';
import { WebcamWidget } from './WebcamWidget';
import { EmbedWidget, EmbedSettings } from './EmbedWidget';
import { ChecklistWidget, ChecklistSettings } from './ChecklistWidget';
import { RandomWidget, RandomSettings } from './RandomWidget';
import { DiceWidget, DiceSettings } from './DiceWidget';
import { DrawingWidget, DrawingSettings } from './DrawingWidget';

export const WidgetRenderer: React.FC<{ widget: WidgetData }> = ({ widget }) => {
  const getWidgetContent = () => {
    switch (widget.type) {
      case 'clock': return <ClockWidget widget={widget} />;
      case 'timer': return <TimerWidget widget={widget} />;
      case 'traffic': return <TrafficLightWidget widget={widget} />;
      case 'text': return <TextWidget widget={widget} />;
      case 'checklist': return <ChecklistWidget widget={widget} />;
      case 'random': return <RandomWidget widget={widget} />;
      case 'dice': return <DiceWidget widget={widget} />;
      case 'sound': return <SoundWidget widget={widget} />;
      case 'webcam': return <WebcamWidget widget={widget} />;
      case 'embed': return <EmbedWidget widget={widget} />;
      case 'drawing': return <DrawingWidget widget={widget} />;
      default: return <div className="p-4 text-center text-slate-400 text-sm">Widget {widget.type} under construction</div>;
    }
  };

  const getWidgetSettings = () => {
    switch (widget.type) {
      case 'clock': return <ClockSettings widget={widget} />;
      case 'timer': return <TimerSettings widget={widget} />;
      case 'text': return <TextSettings widget={widget} />;
      case 'checklist': return <ChecklistSettings widget={widget} />;
      case 'random': return <RandomSettings widget={widget} />;
      case 'dice': return <DiceSettings widget={widget} />;
      case 'sound': return <SoundSettings widget={widget} />;
      case 'embed': return <EmbedSettings widget={widget} />;
      case 'drawing': return <DrawingSettings widget={widget} />;
      default: return <div className="text-slate-500 italic text-sm">No settings for this widget.</div>;
    }
  };

  const getTitle = () => {
    if (widget.type === 'sound') return 'Noise Meter';
    if (widget.type === 'checklist') return 'Task List';
    if (widget.type === 'random') return 'Random Selector';
    if (widget.type === 'drawing') return 'Drawing Board';
    return widget.type.charAt(0).toUpperCase() + widget.type.slice(1);
  };

  // If this is a drawing widget in overlay mode, we need to ensure it sits ABOVE the overlay portal
  // The portal is at z-9990, so we set this window to z-9995.
  const isDrawingOverlay = widget.type === 'drawing' && widget.config.mode === 'overlay';
  const customStyle: React.CSSProperties = isDrawingOverlay ? { zIndex: 9995 } : {};

  return (
    <DraggableWindow 
      widget={widget} 
      title={getTitle()}
      settings={getWidgetSettings()}
      style={customStyle}
    >
      {getWidgetContent()}
    </DraggableWindow>
  );
};
