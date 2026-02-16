import React from 'react';

export const LoadingFallback: React.FC = () => {
  return (
    <div className="h-screen w-screen flex items-center justify-center bg-slate-900 text-white">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="font-black uppercase tracking-[0.3em] text-xs">
          Loading...
        </span>
      </div>
    </div>
  );
};
