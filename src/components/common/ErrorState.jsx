import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

export const ErrorState = ({
  title = 'Failed to load data',
  message = 'An unexpected error occurred while communicating with the server.',
  onRetry
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-rose-50/50 rounded-2xl border border-rose-200/80">
      <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-3 ring-8 ring-rose-100/50">
        <AlertCircle className="w-7 h-7" />
      </div>
      <h3 className="text-base font-bold text-rose-950">{title}</h3>
      <p className="mt-1 text-xs text-rose-700/80 max-w-md">{message}</p>
      {onRetry && (
        <div className="mt-5">
          <Button variant="danger" size="sm" icon={RefreshCw} onClick={onRetry}>
            Try Again
          </Button>
        </div>
      )}
    </div>
  );
};
