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
  const { presets, colors, gradients, loading } = useBackgrounds();
  const [activeTab, setActiveTab] = useState<
    'presets' | 'colors' | 'gradients'
  >('presets');

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-4" role="tablist">
        <button
          onClick={() => setActiveTab('presets')}
          role="tab"
          aria-selected={activeTab === 'presets'}
          aria-controls="presets-panel"
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
          role="tab"
          aria-selected={activeTab === 'colors'}
          aria-controls="colors-panel"
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
          role="tab"
          aria-selected={activeTab === 'gradients'}
          aria-controls="gradients-panel"
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
      <div className="h-[300px] overflow-y-auto pr-1">
        {activeTab === 'presets' && (
          <div
            id="presets-panel"
            role="tabpanel"
            className="grid grid-cols-2 gap-2"
          >
            {/* Clear/None button */}
            <button
              onClick={() => onSelect('')}
              aria-label="Clear background"
              className={`group relative aspect-video rounded-lg overflow-hidden border-2 transition-all flex items-center justify-center bg-white ${
                !selectedBackground || selectedBackground === ''
                  ? 'border-brand-blue-primary ring-2 ring-brand-blue-lighter ring-offset-1'
                  : 'border-slate-200 hover:scale-[1.02] hover:border-slate-300'
              }`}
            >
              <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                None
              </div>
              {(!selectedBackground || selectedBackground === '') && (
                <div className="absolute top-1 right-1 bg-brand-blue-primary text-white p-0.5 rounded-full">
                  <CheckSquare className="w-3 h-3" />
                </div>
              )}
            </button>
            {loading ? (
              <div className="col-span-2 text-center text-slate-400 text-xs py-8">
                <div className="animate-spin mx-auto mb-2 h-6 w-6 border-2 border-slate-300 border-t-brand-blue-primary rounded-full" />
                Loading presets...
              </div>
            ) : (
              <>
                {presets.map((bg) => (
                  <button
                    key={bg.id}
                    onClick={() => onSelect(bg.id)}
                    aria-label={`Select ${bg.label} background`}
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
              </>
            )}
          </div>
        )}

        {activeTab === 'colors' && (
          <div
            id="colors-panel"
            role="tabpanel"
            className="grid grid-cols-3 gap-2"
          >
            {colors.map((bg) => {
              // Generate descriptive label from class name
              const colorLabel =
                bg.label ??
                bg.id
                  .replace(/^bg-/, '')
                  .replace(/-/g, ' ')
                  .replace(/\[.*\]/, 'pattern')
                  .trim();

              return (
                <button
                  key={bg.id}
                  onClick={() => onSelect(bg.id)}
                  aria-label={`Select ${colorLabel} background`}
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
              );
            })}
          </div>
        )}

        {activeTab === 'gradients' && (
          <div
            id="gradients-panel"
            role="tabpanel"
            className="grid grid-cols-2 gap-2"
          >
            {gradients.map((bg) => (
              <button
                key={bg.id}
                onClick={() => onSelect(bg.id)}
                aria-label={`Select ${bg.label} gradient background`}
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
