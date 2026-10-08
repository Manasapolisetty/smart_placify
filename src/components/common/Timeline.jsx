import React from 'react';
import { Check, Clock, ChevronRight } from 'lucide-react';

export const ApplicationTimeline = ({ timeline = [], currentStatus = 'Applied' }) => {
  const defaultStages = [
    { stage: 'Applied', key: 'Applied' },
    { stage: 'Screening', key: 'Screening' },
    { stage: 'Shortlisted', key: 'Shortlisted' },
    { stage: 'Interview', key: 'Interview' },
    { stage: 'Selected', key: 'Selected' }
  ];

  const stagesToRender = timeline.length > 0 ? timeline : defaultStages;

  return (
    <div className="w-full py-3">
      <div className="flex items-center justify-between relative">
        {/* Connecting line */}
        <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-1 bg-slate-200 -z-0" />
        
        {stagesToRender.map((step, idx) => {
          const isCompleted = step.completed || step.status === 'Completed';
          const isCurrent = step.stage === currentStatus || step.status === 'In Progress' || step.status === 'Scheduled' || step.status === 'Under Review';

          return (
            <div key={idx} className="relative z-10 flex flex-col items-center group">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                  isCompleted
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200'
                    : isCurrent
                    ? 'bg-indigo-600 text-white ring-4 ring-indigo-100 shadow-md shadow-indigo-200 animate-pulse-subtle'
                    : 'bg-white text-slate-400 border-2 border-slate-200'
                }`}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5 stroke-[3]" />
                ) : isCurrent ? (
                  <Clock className="w-4 h-4 animate-spin-slow" />
                ) : (
                  idx + 1
                )}
              </div>
              <span
                className={`mt-2 text-xs font-semibold tracking-tight ${
                  isCompleted
                    ? 'text-emerald-700'
                    : isCurrent
                    ? 'text-indigo-600 font-bold'
                    : 'text-slate-400'
                }`}
              >
                {step.stage}
              </span>
              {step.date && step.date !== 'TBD' && (
                <span className="text-[10px] font-medium text-slate-400 mt-0.5">{step.date}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
