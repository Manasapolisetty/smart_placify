import React from 'react';

export const PageHeader = ({ title, subtitle, breadcrumb, actions }) => {
  return (
    <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        {breadcrumb && (
          <nav className="text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1.5">
            <span>{breadcrumb}</span>
          </nav>
        )}
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-xs font-medium text-slate-500">{subtitle}</p>}
      </div>

      {actions && <div className="flex items-center gap-2.5 shrink-0">{actions}</div>}
    </div>
  );
};
