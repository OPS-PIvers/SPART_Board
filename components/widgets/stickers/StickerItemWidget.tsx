import React from 'react';
import { WidgetData, StickerConfig } from '../../../types';
import { DraggableSticker } from './DraggableSticker';

interface StickerItemWidgetProps {
  widget: WidgetData;
}

export const StickerItemWidget: React.FC<StickerItemWidgetProps> = ({
  widget,
}) => {
  const config = widget.config as StickerConfig;

  return (
    <DraggableSticker widget={widget}>
      {config.url ? (
        <img
          src={config.url}
          alt="Sticker"
          className="w-full h-full object-contain pointer-events-none"
          style={{
            filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.15))',
          }}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-pink-100/50 rounded-lg border-2 border-dashed border-pink-300">
          <span className="text-xs text-pink-500 font-bold">No Image</span>
        </div>
      )}
    </DraggableSticker>
  );
};
