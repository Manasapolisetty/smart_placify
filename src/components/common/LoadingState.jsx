import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingState = ({ message = 'Loading placement data...', type = 'spinner', count = 3 }) => {
  if (type === 'skeleton') {
    return (
      <div className="space-y-4 w-full animate-pulse">
        {Array.from({ length: count }).map((_, idx) => (
          <div key={idx} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-1/3 h-5 bg-slate-200 rounded-md" />
              <div className="w-16 h-5 bg-slate-200 rounded-full" />
            </div>
            <div className="w-2/3 h-4 bg-slate-100 rounded-md" />
            <div className="w-1/2 h-4 bg-slate-100 rounded-md" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 ring-8 ring-indigo-50/50">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
      <p className="text-xs font-bold text-slate-700">{message}</p>
      <span className="text-[11px] text-slate-400 mt-0.5">Please wait a moment...</span>
    </div>
  );
};
