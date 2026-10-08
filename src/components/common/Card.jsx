import React from 'react';

export const Card = ({ children, className = '', title, subtitle, action, headerClassName = '', bodyClassName = '' }) => {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden transition-all duration-200 ${className}`}>
      {(title || subtitle || action) && (
        <div className={`p-5 border-b border-slate-100 flex items-center justify-between gap-4 ${headerClassName}`}>
          <div>
            {title && <h3 className="text-base font-extrabold text-slate-900 tracking-tight">{title}</h3>}
            {subtitle && <p className="text-xs font-medium text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className={`p-5 ${bodyClassName}`}>{children}</div>
    </div>
  );
};
