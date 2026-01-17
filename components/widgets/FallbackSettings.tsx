import React from 'react';

export const DefaultSettings: React.FC = () => (
  <div className="text-slate-500 italic text-sm">
    Standard settings available.
  </div>
);

export const MiniAppSettings: React.FC = () => (
  <div className="text-slate-500 italic text-sm">
    Manage apps in the main view.
  </div>
);

export const StickerSettings: React.FC = () => (
  <div className="text-slate-500 italic text-sm">
    Manage stickers in the main view.
  </div>
);

export const StickerLibrarySettings: React.FC = () => (
  <div className="text-slate-500 italic text-sm">
    Upload and manage your custom stickers.
  </div>
);
