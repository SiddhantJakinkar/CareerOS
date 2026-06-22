import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { MapPin, ExternalLink, FileText, Mail, Bookmark, Send, Video } from 'lucide-react';
import { jobApi, applicationApi, resumeApi } from '@/services/endpoints';
import { getErrorMessage } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageSkeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/empty-state';
import { JobInsightsPanel } from '@/components/jobs/JobInsightsPanel';
import { GeneratedArtifactModal } from '@/components/jobs/GeneratedArtifactModal';
import { CircularProgress } from '@/components/ui/motion';

interface ArtifactState {
  title: string;
  subtitle?: string;
  content: string;
  downloadFileName?: string;
  downloadUrl?: string;
}

export default function JobDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [generatingResume, setGeneratingResume] = useState(false);
  const [generatingCover, setGeneratingCover] = useState(false);
  const [artifact, setArtifact] = useState<ArtifactState | null>(null);

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

  const { data: savedJobs } = useQuery({
    queryKey: ['saved-jobs'],
    queryFn: async () => (await jobApi.saved()).data.data as Array<{ jobId: string | { _id: string } }>,
  });

  const isSaved = savedJobs?.some((s) => {
    const jobRef = s.jobId;
    const savedId = typeof jobRef === 'object' ? jobRef._id : jobRef;
    return savedId === id;
  });

  const applyMutation = useMutation({
    mutationFn: () => applicationApi.create({ jobId: id!, status: 'applied' }),
    onSuccess: () => {
      toast.success('Application tracked!');
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const saveMutation = useMutation({
    mutationFn: () => (isSaved ? jobApi.unsave(id!) : jobApi.save(id!)),
    onSuccess: () => {
      toast.success(isSaved ? 'Job removed from saved' : 'Job saved!');
      queryClient.invalidateQueries({ queryKey: ['saved-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const handleApply = async () => {
    try {
      await applyMutation.mutateAsync();
      const applyUrl = data?.job?.applyUrl;
      if (applyUrl) {
        window.open(applyUrl, '_blank');
      }
    } catch {
      // error handled by mutation
    }
  };

  const handleGenerateResume = async () => {
    setGeneratingResume(true);
    try {
      const res = await resumeApi.generate(id!);
      const payload = res.data.data as {
        resume?: { rawText?: string; fileUrl?: string; fileName?: string };
        generated?: { content?: string };
      };
      const job = data?.job;
      setArtifact({
        title: 'Tailored Resume',
        subtitle: job ? `${job.company} · ${job.title}` : undefined,
        content: payload.generated?.content ?? payload.resume?.rawText ?? '',
        downloadUrl: payload.resume?.fileUrl,
        downloadFileName: payload.resume?.fileName,
      });
      toast.success('Resume generated!');
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setGeneratingResume(false);
    }
  };

  const handleCoverLetter = async () => {
    setGeneratingCover(true);
    try {
      let content = '';
      const job = data?.job;
      try {
        const existing = await applicationApi.getCoverLetter(id!);
        content = (existing.data.data as { content: string }).content;
      } catch {
        const res = await applicationApi.generateCoverLetter(id!);
        content = (res.data.data as { content: string }).content;
      }
      setArtifact({
        title: 'Cover Letter',
        subtitle: job ? `${job.company} · ${job.title}` : undefined,
        content,
        downloadFileName: job ? `cover-letter-${job.company}.txt` : 'cover-letter.txt',
      });
      toast.success('Cover letter ready!');
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setGeneratingCover(false);
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
      <GeneratedArtifactModal
        open={!!artifact}
        onClose={() => setArtifact(null)}
        title={artifact?.title ?? ''}
        subtitle={artifact?.subtitle}
        content={artifact?.content ?? ''}
        downloadFileName={artifact?.downloadFileName}
        downloadUrl={artifact?.downloadUrl}
      />

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
          <Button
            variant="secondary"
            onClick={() => navigate(`/ai-interview?mode=video&jobId=${job._id}`)}
          >
            <Video className="mr-2 h-4 w-4" />
            Practice Interview
          </Button>
          <Button variant="secondary" onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>
            <Bookmark className={`mr-2 h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
            {isSaved ? 'Saved' : 'Save'}
          </Button>
          <Button variant="secondary" onClick={handleGenerateResume} loading={generatingResume}>
            <FileText className="mr-2 h-4 w-4" />
            Resume
          </Button>
          <Button variant="secondary" onClick={handleCoverLetter} loading={generatingCover}>
            <Mail className="mr-2 h-4 w-4" />
            Cover Letter
          </Button>
          <Button onClick={handleApply} loading={applyMutation.isPending}>
            <Send className="mr-2 h-4 w-4" />
            Apply
          </Button>
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

          <Card>
            <CardHeader><CardTitle>Prepare for This Role</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-text-muted">
                Take a live AI mock interview tailored to this job — questions based on the role,
                company, and required skills.
              </p>
              <Button
                className="w-full"
                onClick={() => navigate(`/ai-interview?mode=video&jobId=${job._id}`)}
              >
                <Video className="mr-2 h-4 w-4" />
                Start Job-Specific Practice
              </Button>
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
