import React from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export const Toast = ({ id, message, type = 'info', onClose }) => {
  const typeStyles = {
    success: 'bg-emerald-50 text-emerald-900 border-emerald-200',
    error: 'bg-rose-50 text-rose-900 border-rose-200',
    warning: 'bg-amber-50 text-amber-900 border-amber-200',
    info: 'bg-indigo-50 text-indigo-900 border-indigo-200',
  };

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />,
    error: <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />,
    info: <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />,
  };

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-lg border text-xs font-semibold transition-all duration-300 ${typeStyles[type] || typeStyles.info}`}
    >
      {icons[type]}
      <div className="flex-1 leading-relaxed">{message}</div>
      {onClose && (
        <button
          onClick={() => onClose(id)}
          className="text-slate-400 hover:text-slate-700 p-0.5 rounded-lg hover:bg-black/5"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
