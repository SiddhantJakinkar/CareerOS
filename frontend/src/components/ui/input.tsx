import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s/g, '-');
    return (
      <div className="space-y-2">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-text-secondary">
            {label}
          </label>
        )}
        <input
          type={type}
          id={inputId}
          className={cn(
            'flex h-12 w-full rounded-[14px] border border-border bg-surface px-4 py-2 text-sm text-text-primary placeholder:text-text-muted transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20',
            error && 'border-error focus:ring-error/20',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <p className="text-xs text-error">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input };
