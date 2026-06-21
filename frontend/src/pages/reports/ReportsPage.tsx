import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { dashboardApi } from '@/services/endpoints';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageSkeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/empty-state';
import { AnimatedCounter } from '@/components/ui/motion';
import { formatDate } from '@/lib/utils';
import { useAuthStore } from '@/store';
import { getAssessmentPerformanceLabel, getAssessmentScoreLabel } from '@/lib/academicStreams';

export default function ReportsPage() {
  const profile = useAuthStore((s) => s.profile);
  const assessmentLabel = getAssessmentScoreLabel(profile?.academicStream);
  const performanceLabel = getAssessmentPerformanceLabel(profile?.academicStream);
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['analytics'],
    queryFn: async () => (await dashboardApi.getAnalytics()).data.data,
  });

  const { data: reports } = useQuery({
    queryKey: ['reports'],
    queryFn: async () => (await dashboardApi.getReports()).data.data,
  });

  if (isLoading) return <PageSkeleton />;
  if (error) return <ErrorState onRetry={() => refetch()} />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reports & Analytics</h1>
        <p className="text-text-muted">Track your placement preparation progress</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {[
          { label: 'Placement Ready', value: data?.placementReadiness ?? 0 },
          { label: 'ATS', value: data?.scores?.ats ?? 0 },
          { label: assessmentLabel.replace(' Score', ''), value: data?.scores?.coding ?? 0 },
          { label: 'Interview', value: data?.scores?.interview ?? 0 },
          { label: 'Job Match', value: data?.scores?.jobMatch ?? 0 },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-text-muted">{s.label}</p>
              <p className="text-2xl font-bold text-primary">
                <AnimatedCounter value={s.value} suffix="%" />
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>{performanceLabel}</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data?.codingHistory ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#252833" />
                <XAxis dataKey="category" stroke="#7d8394" fontSize={12} />
                <YAxis stroke="#7d8394" fontSize={12} />
                <Tooltip contentStyle={{ background: '#16181d', border: '1px solid #252833' }} />
                <Bar dataKey="score" fill="#4f7cff" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Interview Progress</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={data?.interviewHistory ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#252833" />
                <XAxis dataKey="domain" stroke="#7d8394" fontSize={12} />
                <YAxis stroke="#7d8394" fontSize={12} domain={[0, 100]} />
                <Tooltip contentStyle={{ background: '#16181d', border: '1px solid #252833' }} />
                <Line type="monotone" dataKey="score" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: '#8b5cf6' }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>All Reports</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {reports?.length ? (
            reports.map((report: { _id: string; type: string; title: string; score?: number; createdAt: string }) => (
              <div key={report._id} className="flex items-center justify-between rounded-xl border border-border p-4">
                <div>
                  <p className="font-medium">{report.title}</p>
                  <p className="text-xs text-text-muted">{formatDate(report.createdAt)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge>{report.type}</Badge>
                  {report.score !== undefined && <span className="font-bold text-primary">{report.score}%</span>}
                </div>
              </div>
            ))
          ) : (
            <p className="text-text-muted">No reports generated yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
