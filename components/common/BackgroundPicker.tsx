import React, { useState } from 'react';
import { CheckSquare, Grid } from 'lucide-react';
import { useBackgrounds } from '../../hooks/useBackgrounds';

interface BackgroundPickerProps {
  selectedBackground?: string;
  onSelect: (bg: string) => void;
}

export const BackgroundPicker: React.FC<BackgroundPickerProps> = ({
  selectedBackground,
  onSelect,
}) => {
  const { presets, colors, gradients } = useBackgrounds();
  const [activeTab, setActiveTab] = useState<
    'presets' | 'colors' | 'gradients'
  >('presets');

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-4">
        <button
          onClick={() => setActiveTab('presets')}
          className={`flex-1 pb-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'presets'
              ? 'border-brand-blue-primary text-brand-blue-primary'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Presets
        </button>
        <button
          onClick={() => setActiveTab('colors')}
          className={`flex-1 pb-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'colors'
              ? 'border-brand-blue-primary text-brand-blue-primary'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Colors
        </button>
        <button
          onClick={() => setActiveTab('gradients')}
          className={`flex-1 pb-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'gradients'
              ? 'border-brand-blue-primary text-brand-blue-primary'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Gradients
        </button>
      </div>

      {/* Content */}
      <div className="h-[300px] overflow-y-auto custom-scrollbar pr-1">
        {activeTab === 'presets' && (
          <div className="grid grid-cols-2 gap-2">
            {presets.map((bg) => (
              <button
                key={bg.id}
                onClick={() => onSelect(bg.id)}
                className={`group relative aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                  selectedBackground === bg.id
                    ? 'border-brand-blue-primary ring-2 ring-brand-blue-lighter ring-offset-1'
                    : 'border-transparent hover:scale-[1.02]'
                }`}
              >
                <img
                  src={bg.id}
                  alt={bg.label}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white text-xs font-bold uppercase tracking-wider">
                    {bg.label}
                  </span>
                </div>
                {selectedBackground === bg.id && (
                  <div className="absolute top-1 right-1 bg-brand-blue-primary text-white p-0.5 rounded-full">
                    <CheckSquare className="w-3 h-3" />
                  </div>
                )}
              </button>
            ))}
            {presets.length === 0 && (
              <div className="col-span-2 text-center text-slate-400 text-xs py-4">
                No presets available.
              </div>
            )}
          </div>
        )}

        {activeTab === 'colors' && (
          <div className="grid grid-cols-3 gap-2">
            {colors.map((bg) => (
              <button
                key={bg.id}
                onClick={() => onSelect(bg.id)}
                className={`aspect-square rounded-lg border-2 transition-all relative ${
                  bg.id
                } ${
                  selectedBackground === bg.id
                    ? 'border-brand-blue-primary ring-2 ring-brand-blue-lighter ring-offset-1'
                    : 'border-slate-100 hover:border-slate-300'
                }`}
              >
                {bg.id.includes('radial') && (
                  <div className={`w-full h-full ${bg.id}`} />
                )}
                {bg.label === 'Dot Grid' && (
                  <Grid className="w-4 h-4 absolute inset-0 m-auto text-slate-300" />
                )}
                {selectedBackground === bg.id && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-white/20 backdrop-blur-sm p-1 rounded-full">
                      <CheckSquare className="w-3 h-3 text-white drop-shadow-md" />
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        {activeTab === 'gradients' && (
          <div className="grid grid-cols-2 gap-2">
            {gradients.map((bg) => (
              <button
                key={bg.id}
                onClick={() => onSelect(bg.id)}
                className={`aspect-video rounded-lg border-2 transition-all relative ${
                  selectedBackground === bg.id
                    ? 'border-brand-blue-primary ring-2 ring-brand-blue-lighter ring-offset-1'
                    : 'border-transparent hover:scale-[1.02]'
                }`}
              >
                <div className={`w-full h-full rounded-md ${bg.id}`} />
                <div className="absolute bottom-2 left-2 text-[10px] font-bold uppercase text-white/90 drop-shadow-md">
                  {bg.label}
                </div>
                {selectedBackground === bg.id && (
                  <div className="absolute top-1 right-1 bg-white/20 backdrop-blur-md p-0.5 rounded-full">
                    <CheckSquare className="w-3 h-3 text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
