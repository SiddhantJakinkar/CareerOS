import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Briefcase, FileText, MessageSquare, Target, TrendingUp, Bot } from 'lucide-react';
import { dashboardApi } from '@/services/endpoints';
import { useAuthStore } from '@/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { PageSkeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/empty-state';
import { AnimatedCounter, CircularProgress, pageVariants } from '@/components/ui/motion';
import { formatDate } from '@/lib/utils';
import { getAssessmentScoreLabel, getReadinessFactors, getStreamLabel } from '@/lib/academicStreams';

export default function DashboardPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const stream = profile?.academicStream;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await dashboardApi.get();
      return res.data.data;
    },
  });

  if (isLoading) return <PageSkeleton />;
  if (error) return <ErrorState onRetry={() => refetch()} />;

  const stats = [
    { label: 'ATS Score', value: data?.scores.ats ?? 0, icon: FileText, color: 'text-primary' },
    { label: getAssessmentScoreLabel(stream), value: data?.scores.coding ?? 0, icon: Target, color: 'text-secondary' },
    { label: 'Interview Score', value: data?.scores.interview ?? 0, icon: MessageSquare, color: 'text-success' },
    { label: 'Job Match', value: data?.scores.jobMatch ?? 0, icon: TrendingUp, color: 'text-warning' },
  ];

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {user?.name?.split(' ')[0]}</h1>
          <p className="text-text-muted">
            Your placement readiness overview
            {stream && stream !== 'other' && (
              <span> · {getStreamLabel(stream)}</span>
            )}
          </p>
        </div>
        <Button onClick={() => navigate('/career-chat')}>
          <Bot className="mr-2 h-4 w-4" /> Ask Career Copilot
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Placement Readiness</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <CircularProgress value={data?.placementReadiness ?? 0} />
            <p className="mt-4 text-center text-sm text-text-muted">
              Based on {getReadinessFactors(stream)}
            </p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4 lg:col-span-2">
          {stats.map((stat) => (
            <motion.div key={stat.label} whileHover={{ scale: 1.02, y: -2 }}>
              <Card>
                <CardContent className="flex items-center gap-4 pt-6">
                  <div className={`rounded-xl bg-surface-hover p-3 ${stat.color}`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm text-text-muted">{stat.label}</p>
                    <p className="text-2xl font-bold">
                      <AnimatedCounter value={stat.value} suffix="%" />
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recommended Jobs</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/jobs')}>View All</Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {data?.recommendedJobs?.slice(0, 4).map((job) => (
              <div
                key={job._id}
                className="flex cursor-pointer items-center justify-between rounded-xl border border-border bg-surface-hover/50 p-4 transition-colors hover:bg-surface-hover"
                onClick={() => navigate(`/jobs/${job._id}`)}
              >
                <div>
                  <p className="font-medium">{job.title}</p>
                  <p className="text-sm text-text-muted">{job.company} · {job.location}</p>
                </div>
                {job.matchScore && (
                  <Badge variant="success">{job.matchScore.totalScore}% Match</Badge>
                )}
              </div>
            )) ?? <p className="text-text-muted">No recommendations yet</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Skill Gaps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {data?.skillGaps?.length ? (
                data.skillGaps.map((skill) => (
                  <Badge key={skill} variant="warning">{skill}</Badge>
                ))
              ) : (
                <p className="text-text-muted">Complete skill gap analysis</p>
              )}
            </div>
            <Button className="mt-4" variant="secondary" onClick={() => navigate('/skill-gap')}>
              Analyze Skills
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Applications</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between"><span className="text-text-muted">Total</span><span className="font-bold">{data?.applicationStats.total ?? 0}</span></div>
            <div className="flex justify-between"><span className="text-text-muted">Applied</span><span className="font-bold">{data?.applicationStats.applied ?? 0}</span></div>
            <div className="flex justify-between"><span className="text-text-muted">Interviews</span><span className="font-bold">{data?.applicationStats.interviews ?? 0}</span></div>
            <Button className="mt-4 w-full" variant="secondary" onClick={() => navigate('/applications')}>
              <Briefcase className="mr-2 h-4 w-4" /> Track Applications
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {data?.recentActivities?.slice(0, 5).map((activity, i) => (
              <div key={i} className="flex items-center justify-between border-b border-border pb-2 last:border-0">
                <span className="text-sm">{activity.action} {activity.entity}</span>
                <span className="text-xs text-text-muted">{formatDate(activity.createdAt)}</span>
              </div>
            )) ?? <p className="text-text-muted">No recent activity</p>}
          </CardContent>
        </Card>
      </div>

      {data?.resume && (
        <Card>
          <CardHeader><CardTitle>Resume Overview</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div>
                <p className="text-sm text-text-muted">ATS Score</p>
                <p className="text-3xl font-bold text-primary">{data.resume.atsScore}%</p>
              </div>
              <div className="flex-1">
                <Progress value={data.resume.atsScore} className="h-3" />
              </div>
              <div className="flex flex-wrap gap-2">
                {data.resume.topSkills.map((s) => <Badge key={s}>{s}</Badge>)}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
