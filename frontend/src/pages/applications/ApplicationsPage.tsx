import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Briefcase } from 'lucide-react';
import { applicationApi } from '@/services/endpoints';
import { getErrorMessage } from '@/services/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageSkeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { formatDate } from '@/lib/utils';
import type { Application } from '@/types';

const STATUS_COLORS: Record<string, 'default' | 'success' | 'warning' | 'error' | 'secondary'> = {
  saved: 'secondary',
  applied: 'default',
  interview_scheduled: 'warning',
  technical_round: 'warning',
  hr_round: 'warning',
  rejected: 'error',
  selected: 'success',
  offer_received: 'success',
};

const STATUSES = ['saved', 'applied', 'interview_scheduled', 'technical_round', 'hr_round', 'rejected', 'selected', 'offer_received'];

export default function ApplicationsPage() {
  const navigate = useNavigate();

  const { data: applications, isLoading, refetch } = useQuery({
    queryKey: ['applications'],
    queryFn: async () => (await applicationApi.getAll()).data.data,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => applicationApi.update(id, { status }),
    onSuccess: () => {
      toast.success('Status updated');
      refetch();
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  if (isLoading) return <PageSkeleton />;

  const grouped = STATUSES.reduce((acc, status) => {
    acc[status] = applications?.filter((a) => a.status === status) ?? [];
    return acc;
  }, {} as Record<string, Application[]>);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Application Tracker</h1>
        <p className="text-text-muted">Track your complete job application journey</p>
      </div>

      {!applications?.length ? (
        <EmptyState
          icon={<Briefcase className="h-8 w-8" />}
          title="No applications yet"
          description="Start applying to jobs to track your progress"
          action={{ label: 'Browse Jobs', onClick: () => navigate('/jobs') }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 overflow-x-auto lg:grid-cols-4">
          {STATUSES.map((status) => (
            <div key={status} className="min-w-[250px]">
              <div className="mb-3 flex items-center gap-2">
                <Badge variant={STATUS_COLORS[status]}>{status.replace(/_/g, ' ')}</Badge>
                <span className="text-sm text-text-muted">({grouped[status].length})</span>
              </div>
              <div className="space-y-3">
                {grouped[status].map((app) => (
                  <Card key={app._id} className="cursor-pointer" onClick={() => navigate(`/jobs/${(app.jobId as { _id: string })._id}`)}>
                    <CardContent className="p-4">
                      <p className="font-medium text-sm">{(app.jobId as { title: string }).title}</p>
                      <p className="text-xs text-text-muted">{(app.jobId as { company: string }).company}</p>
                      {app.appliedAt && <p className="mt-2 text-xs text-text-muted">{formatDate(app.appliedAt)}</p>}
                      <select
                        className="mt-2 w-full rounded-lg border border-border bg-surface px-2 py-1 text-xs"
                        value={app.status}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => updateMutation.mutate({ id: app._id, status: e.target.value })}
                      >
                        {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                      </select>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
