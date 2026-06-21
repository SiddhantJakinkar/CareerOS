import { useQuery, useMutation } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import { notificationApi } from '@/services/endpoints';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageSkeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { formatDate } from '@/lib/utils';

export default function NotificationsPage() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => (await notificationApi.getAll()).data.data,
  });

  const markAllMutation = useMutation({
    mutationFn: () => notificationApi.markAllRead(),
    onSuccess: () => refetch(),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationApi.markRead(id),
    onSuccess: () => refetch(),
  });

  if (isLoading) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-text-muted">Stay updated on your placement journey</p>
        </div>
        <Button variant="secondary" onClick={() => markAllMutation.mutate()}>Mark All Read</Button>
      </div>

      {!data?.length ? (
        <EmptyState icon={<Bell className="h-8 w-8" />} title="No notifications" description="You're all caught up!" />
      ) : (
        <div className="space-y-3">
          {data.map((n: { _id: string; title: string; message: string; type: string; isRead: boolean; createdAt: string }) => (
            <Card key={n._id} className={!n.isRead ? 'border-primary/30' : ''}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{n.title}</p>
                    {!n.isRead && <Badge variant="default">New</Badge>}
                  </div>
                  <p className="mt-1 text-sm text-text-muted">{n.message}</p>
                  <p className="mt-1 text-xs text-text-muted">{formatDate(n.createdAt)}</p>
                </div>
                {!n.isRead && (
                  <Button variant="ghost" size="sm" onClick={() => markReadMutation.mutate(n._id)}>Mark Read</Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
