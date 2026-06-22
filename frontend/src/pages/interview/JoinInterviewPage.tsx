import { useParams, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { interviewApi } from '@/services/endpoints';
import { PageSkeleton } from '@/components/ui/skeleton';
import { LiveMockInterview } from '@/components/interview/LiveMockInterview';
import { Card, CardContent } from '@/components/ui/card';

export default function JoinInterviewPage() {
  const { token } = useParams<{ token: string }>();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['interview-invite', token],
    queryFn: async () => (await interviewApi.getInvitePublic(token!)).data.data,
    enabled: Boolean(token),
  });

  if (!token) return <Navigate to="/ai-interview?mode=video" replace />;
  if (isLoading) return <PageSkeleton />;

  if (isError || !data) {
    return (
      <Card className="mx-auto mt-12 max-w-lg">
        <CardContent className="py-8 text-center">
          <p className="text-lg font-semibold">Interview link invalid or expired</p>
          <p className="mt-2 text-sm text-text-muted">
            Ask the company to send a new link from CareerOS.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Screening Interview</h1>
        <p className="text-text-muted">
          {data.companyName} · {data.jobTitle}
        </p>
      </div>
      <LiveMockInterview
        domains={[{ id: data.domain, label: data.domainLabel, description: '' }]}
        recommended={data.domain}
        reason="Company screening interview"
        targetRole={data.jobTitle}
        inviteToken={token}
        inviteCompany={data.companyName}
        inviteJobTitle={data.jobTitle}
        inviteDomain={data.domain}
      />
    </div>
  );
}
