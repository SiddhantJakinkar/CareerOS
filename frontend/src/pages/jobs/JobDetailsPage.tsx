import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { MapPin, ExternalLink, FileText, Mail, Bookmark, Send } from 'lucide-react';
import { jobApi, applicationApi, resumeApi } from '@/services/endpoints';
import { getErrorMessage } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageSkeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/empty-state';
import { JobInsightsPanel } from '@/components/jobs/JobInsightsPanel';
import { CircularProgress } from '@/components/ui/motion';

export default function JobDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [generating, setGenerating] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['job', id],
    queryFn: async () => (await jobApi.getById(id!)).data.data,
    enabled: !!id,
  });

  const { data: matchData } = useQuery({
    queryKey: ['job-match', id],
    queryFn: async () => (await jobApi.getMatch(id!)).data.data,
    enabled: !!id,
  });

  const applyMutation = useMutation({
    mutationFn: () => applicationApi.create({ jobId: id!, status: 'applied' }),
    onSuccess: () => toast.success('Application tracked!'),
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const saveMutation = useMutation({
    mutationFn: () => jobApi.save(id!),
    onSuccess: () => toast.success('Job saved!'),
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const handleGenerateResume = async () => {
    setGenerating(true);
    try {
      await resumeApi.generate(id!);
      toast.success('Resume generated!');
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setGenerating(false);
    }
  };

  const handleCoverLetter = async () => {
    try {
      await applicationApi.generateCoverLetter(id!);
      toast.success('Cover letter generated!');
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  if (isLoading) return <PageSkeleton />;
  if (error || !data?.job) return <ErrorState onRetry={() => refetch()} />;

  const job = data.job;
  const matchAnalysis = data.matchAnalysis as { algorithmic?: { totalScore: number; missingSkills: string[]; reason: string } } | null;
  const match = matchData?.algorithmic ?? matchAnalysis?.algorithmic;
  const aiMatch = matchData?.ai as { matchPercentage?: number; missingSkills?: string[] } | undefined;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{job.title}</h1>
          <p className="mt-2 text-lg text-text-muted">{job.company}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge><MapPin className="mr-1 h-3 w-3" />{job.location}</Badge>
            <Badge variant="secondary">{job.workMode}</Badge>
            <Badge variant="secondary">{job.jobType}</Badge>
            {job.experience && <Badge>{job.experience}</Badge>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => saveMutation.mutate()}><Bookmark className="mr-2 h-4 w-4" />Save</Button>
          <Button variant="secondary" onClick={handleGenerateResume} loading={generating}><FileText className="mr-2 h-4 w-4" />Resume</Button>
          <Button variant="secondary" onClick={handleCoverLetter}><Mail className="mr-2 h-4 w-4" />Cover Letter</Button>
          <Button onClick={() => applyMutation.mutate()}><Send className="mr-2 h-4 w-4" />Apply</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader><CardTitle>Job Description</CardTitle></CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-text-secondary">{job.description}</p>
            </CardContent>
          </Card>

          {job.skills?.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Required Skills</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((s) => <Badge key={s}>{s}</Badge>)}
                </div>
              </CardContent>
            </Card>
          )}

          <JobInsightsPanel job={job} />
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>AI Match Analysis</CardTitle></CardHeader>
            <CardContent className="flex flex-col items-center">
              <CircularProgress value={match?.totalScore ?? aiMatch?.matchPercentage ?? 0} />
              {match?.reason && <p className="mt-4 text-center text-sm text-text-muted">{match.reason}</p>}
              {(match?.missingSkills?.length ?? aiMatch?.missingSkills?.length) ? (
                <div className="mt-4 w-full">
                  <p className="mb-2 text-sm font-medium">Missing Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {(match?.missingSkills ?? aiMatch?.missingSkills ?? []).map((s: string) => (
                      <Badge key={s} variant="warning">{s}</Badge>
                    ))}
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {job.applyUrl && (
            <Button className="w-full" variant="secondary" onClick={() => window.open(job.applyUrl, '_blank')}>
              <ExternalLink className="mr-2 h-4 w-4" /> Apply on Company Site
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
