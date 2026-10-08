import React from 'react';

export const ProgressBar = ({ label, score, maxScore = 20, color = '#4F46E5', showValues = true }) => {
  const percentage = Math.min(100, (score / maxScore) * 100);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
        <span>{label}</span>
        {showValues && (
          <span className="text-slate-500">
            <strong className="text-slate-900 font-bold">{score}</strong> / {maxScore}
          </span>
        )}
      </div>
      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
};
