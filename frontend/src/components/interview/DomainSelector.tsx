import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getStreamLabel } from '@/lib/academicStreams';

export interface InterviewDomainOption {
  id: string;
  label: string;
  description: string;
}

export interface InterviewDomainsData {
  domains: InterviewDomainOption[];
  recommended: string;
  reason: string;
  targetRole: string | null;
  academicStream?: string;
  defaultTargetRole?: string;
}

interface DomainSelectorProps {
  domains: InterviewDomainOption[];
  value: string;
  recommended: string;
  reason: string;
  targetRole?: string | null;
  academicStream?: string;
  onChange: (domainId: string) => void;
  className?: string;
}

export function DomainSelector({
  domains,
  value,
  recommended,
  reason,
  targetRole,
  academicStream,
  onChange,
  className,
}: DomainSelectorProps) {
  return (
    <div className={cn('space-y-4', className)}>
      <div className="rounded-xl border border-border bg-surface-hover/50 p-4 text-sm">
        <p className="font-medium text-text-primary">How domain is chosen</p>
        <p className="mt-1 text-text-muted">{reason}</p>
        {academicStream && (
          <p className="mt-2 text-xs text-text-muted">
            Your stream: <span className="text-text-secondary">{getStreamLabel(academicStream)}</span>
          </p>
        )}
        {targetRole && (
          <p className="mt-1 text-xs text-text-muted">
            Target role: <span className="text-text-secondary">{targetRole}</span>
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {domains.map((domain) => {
          const isSelected = value === domain.id;
          const isRecommended = recommended === domain.id;
          return (
            <Button
              key={domain.id}
              type="button"
              variant={isSelected ? 'default' : 'secondary'}
              className="h-auto flex-col items-start gap-1 px-4 py-3 text-left"
              onClick={() => onChange(domain.id)}
            >
              <span className="flex items-center gap-2 font-semibold">
                {domain.label}
                {isRecommended && <Badge variant="success" className="text-[10px]">Recommended</Badge>}
              </span>
              <span className={cn('text-xs font-normal', isSelected ? 'text-primary-foreground/80' : 'text-text-muted')}>
                {domain.description}
              </span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
