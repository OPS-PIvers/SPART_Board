import React from 'react';
import { WidgetData, StickerConfig } from '@/types';

interface Props {
  widget: WidgetData;
}

export const StickerWidget: React.FC<Props> = ({ widget }) => {
  if (widget.type !== 'sticker') {
    return null;
  }
  const config = widget.config as StickerConfig;

  return (
    <div className="w-full h-full flex items-center justify-center p-1 animate-in zoom-in duration-300">
      <img
        src={config.url}
        alt="Sticker"
        className="max-w-full max-h-full object-contain drop-shadow-md select-none pointer-events-none"
      />
    </div>
  );
};
