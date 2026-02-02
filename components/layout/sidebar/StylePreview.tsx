import React from 'react';
import { GlobalStyle } from '../../../types';
import { GlassCard } from '../../common/GlassCard';

export const StylePreview = ({
  pendingStyle,
  background,
  className = '',
}: {
  pendingStyle: GlobalStyle;
  background?: string;
  className?: string;
}) => {
  return (
    <div
      className={`relative aspect-[16/9] rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-2xl flex flex-col items-center justify-center p-6 gap-6 transition-all duration-500 ${className}`}
    >
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: background?.startsWith('http')
            ? `url(${background})`
            : undefined,
          backgroundColor: background?.startsWith('bg-')
            ? undefined
            : background,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      {/* Window Preview */}
      <GlassCard
        globalStyle={pendingStyle}
        transparency={pendingStyle.windowTransparency}
        cornerRadius={pendingStyle.windowBorderRadius}
        allowInvisible={true}
        className="relative z-10 w-full p-4 transition-all duration-300"
      >
        <div
          className={`text-center space-y-1 font-${pendingStyle.fontFamily}`}
        >
          <div className="text-xxs font-black uppercase text-slate-400 tracking-widest leading-none mb-1">
            Window Preview
          </div>
          <div className="text-sm leading-tight text-slate-800">
            The quick brown fox jumps over the lazy dog.
          </div>
        </div>
      </GlassCard>

      {/* Dock Preview */}
      <GlassCard
        globalStyle={pendingStyle}
        transparency={pendingStyle.dockTransparency}
        cornerRadius={pendingStyle.dockBorderRadius}
        allowInvisible={true}
        className="relative z-10 px-6 py-2 flex flex-col items-center gap-2 transition-all duration-300"
      >
        <div className="text-xxs font-black uppercase text-slate-400 tracking-widest leading-none">
          Dock Preview
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center gap-1">
            <div className="w-6 h-6 bg-brand-blue-primary rounded-lg shadow-sm" />
            <span
              className={`text-xxxs uppercase tracking-tighter whitespace-nowrap transition-all duration-300 font-${pendingStyle.fontFamily}`}
              style={{
                color: pendingStyle.dockTextColor,
                textShadow: pendingStyle.dockTextShadow
                  ? '0 1px 2px rgba(0,0,0,0.5)'
                  : 'none',
              }}
            >
              Icon
            </span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="w-6 h-6 bg-brand-red-primary rounded-lg shadow-sm" />
            <span
              className={`text-xxxs uppercase tracking-tighter whitespace-nowrap transition-all duration-300 font-${pendingStyle.fontFamily}`}
              style={{
                color: pendingStyle.dockTextColor,
                textShadow: pendingStyle.dockTextShadow
                  ? '0 1px 2px rgba(0,0,0,0.5)'
                  : 'none',
              }}
            >
              Label
            </span>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};