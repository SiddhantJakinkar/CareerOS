import { AlertCircle, Inbox } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 text-center', className)}>
      <div className="mb-4 rounded-full bg-surface p-4 text-text-muted">
        {icon || <Inbox className="h-8 w-8" />}
      </div>
      <h3 className="mb-2 text-lg font-semibold text-text-primary">{title}</h3>
      {description && <p className="mb-6 max-w-sm text-sm text-text-muted">{description}</p>}
      {action && <Button onClick={action.onClick}>{action.label}</Button>}
    </div>
  );
}

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message = 'Something went wrong.', onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 rounded-full bg-error/10 p-4 text-error">
        <AlertCircle className="h-8 w-8" />
      </div>
      <h3 className="mb-2 text-lg font-semibold">Error</h3>
      <p className="mb-6 text-sm text-text-muted">{message}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  );
}
