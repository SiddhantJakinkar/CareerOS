import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Mail, Briefcase, Code, MessageSquare } from 'lucide-react';
import { placementApi } from '@/services/endpoints';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageSkeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/empty-state';
import { CircularProgress } from '@/components/ui/motion';
import { formatDate } from '@/lib/utils';
import { getAssessmentScoreLabel, getStreamLabel } from '@/lib/academicStreams';

export default function PlacementStudentPage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['placement-student', userId],
    queryFn: async () => (await placementApi.getStudent(userId!)).data.data,
    enabled: !!userId,
  });

  if (isLoading) return <PageSkeleton />;
  if (error || !data) return <ErrorState onRetry={() => refetch()} />;

  const { user, profile, applications, interviews, codingResults, resume } = data;
  const assessmentLabel = getAssessmentScoreLabel(profile.academicStream);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="secondary" size="sm" onClick={() => navigate('/placement-cell')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{user.name}</h1>
          <p className="flex items-center gap-2 text-text-muted">
            <Mail className="h-4 w-4" />
            {user.email}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-text-muted">Readiness</p>
            <CircularProgress value={profile.placementReadinessScore} size={72} className="mx-auto mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-text-muted">ATS</p>
            <p className="text-2xl font-bold text-primary">{profile.atsScore}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-text-muted">{assessmentLabel.replace(' Score', '')}</p>
            <p className="text-2xl font-bold text-secondary">{profile.codingScore}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-text-muted">Interview</p>
            <p className="text-2xl font-bold text-success">{profile.interviewScore}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-text-muted">Job Match</p>
            <p className="text-2xl font-bold text-warning">{profile.jobMatchScore}%</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-text-muted">Stream:</span>{' '}
              {getStreamLabel(profile.academicStream)}
            </p>
            <p>
              <span className="text-text-muted">College:</span> {profile.education?.collegeName || '—'}
            </p>
            <p>
              <span className="text-text-muted">Branch:</span> {profile.education?.branch || '—'}
            </p>
            <p>
              <span className="text-text-muted">Target Role:</span>{' '}
              {profile.careerPreferences?.targetRole || '—'}
            </p>
            {resume && (
              <p>
                <span className="text-text-muted">Resume ATS:</span>{' '}
                {resume.analysis?.atsScore ?? 0}%
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Applications ({applications.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="max-h-64 space-y-2 overflow-y-auto">
            {applications.length ? (
              applications.map((app: { _id: string; status: string; updatedAt: string; jobId?: { title?: string; company?: string } }) => (
                <div key={app._id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="font-medium">{app.jobId?.title ?? 'Unknown role'}</p>
                    <p className="text-xs text-text-muted">{app.jobId?.company}</p>
                  </div>
                  <Badge>{app.status}</Badge>
                </div>
              ))
            ) : (
              <p className="text-text-muted">No applications yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Recent Interviews
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {interviews.length ? (
              interviews.map((i: { _id: string; domain: string; type: string; overallScore: number; createdAt: string }) => (
                <div key={i._id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <Badge>{i.domain}</Badge>
                    <span className="ml-2 text-xs text-text-muted">{i.type}</span>
                  </div>
                  <span className="font-bold text-primary">{i.overallScore}%</span>
                </div>
              ))
            ) : (
              <p className="text-text-muted">No interviews yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              Assessment Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {codingResults.length ? (
              codingResults.map((r: { _id: string; score: number; percentage: number; completedAt: string; testId?: { title?: string; category?: string } }) => (
                <div key={r._id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="font-medium">{r.testId?.title ?? 'Assessment'}</p>
                    <p className="text-xs text-text-muted">
                      {r.testId?.category} · {formatDate(r.completedAt)}
                    </p>
                  </div>
                  <span className="font-bold text-primary">{r.percentage ?? r.score}%</span>
                </div>
              ))
            ) : (
              <p className="text-text-muted">No assessments completed</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
