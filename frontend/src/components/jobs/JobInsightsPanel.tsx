import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Building2,
  DollarSign,
  ClipboardCheck,
  ChevronDown,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Circle,
} from 'lucide-react';
import { insightsApi } from '@/services/endpoints';
import { getErrorMessage } from '@/services/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { Job } from '@/types';

interface JobInsightsPanelProps {
  job: Job;
}

function Section({
  title,
  icon: Icon,
  open,
  onToggle,
  children,
}: {
  title: string;
  icon: React.ElementType;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <button
        className="flex w-full items-center justify-between p-4 text-left"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <span className="font-semibold">{title}</span>
        </div>
        <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <CardContent className="border-t border-border pt-4">{children}</CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

export function JobInsightsPanel({ job }: JobInsightsPanelProps) {
  const queryClient = useQueryClient();
  const [openSection, setOpenSection] = useState<string | null>('research');

  const { data: existingResearch } = useQuery({
    queryKey: ['company-research', job._id],
    queryFn: async () => {
      try {
        const res = await insightsApi.getCompanyResearch(job._id);
        const report = res.data.data as { data?: Record<string, unknown> } | null;
        return report?.data ?? null;
      } catch {
        return null;
      }
    },
  });

  const researchMutation = useMutation({
    mutationFn: () => insightsApi.researchCompany(job._id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-research', job._id] });
      toast.success('Company research generated!');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const salaryMutation = useMutation({
    mutationFn: () => insightsApi.predictSalary({ jobId: job._id }),
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const autoApplyMutation = useMutation({
    mutationFn: () => insightsApi.prepareAutoApply(job._id),
    onSuccess: () => toast.success('Application prep checklist ready!'),
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const research = researchMutation.data?.data.data.research ?? existingResearch;
  const salary = salaryMutation.data?.data.data.prediction;
  const autoApply = autoApplyMutation.data?.data.data.checklist;

  const toggle = (id: string) => setOpenSection(openSection === id ? null : id);

  const statusIcon = (status: string) => {
    if (status === 'ready') return <CheckCircle2 className="h-4 w-4 text-success" />;
    if (status === 'missing') return <AlertCircle className="h-4 w-4 text-error" />;
    return <Circle className="h-4 w-4 text-warning" />;
  };

  return (
    <div className="space-y-4">
      <Section
        title="Company Research"
        icon={Building2}
        open={openSection === 'research'}
        onToggle={() => toggle('research')}
      >
        {!research ? (
          <Button
            onClick={() => researchMutation.mutate()}
            loading={researchMutation.isPending}
            className="w-full"
          >
            Research {job.company}
          </Button>
        ) : (
          <div className="space-y-4 text-sm">
            <div className="flex items-center justify-between">
              <Badge variant="success">Fit Score: {research.fitScore}%</Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => researchMutation.mutate()}
                disabled={researchMutation.isPending}
              >
                {researchMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Refresh'}
              </Button>
            </div>
            <p className="text-text-secondary">{research.overview}</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div><span className="text-text-muted">Industry:</span> {research.industry}</div>
              <div><span className="text-text-muted">Size:</span> {research.companySize}</div>
            </div>
            <div>
              <p className="mb-2 font-medium">Tech Stack</p>
              <div className="flex flex-wrap gap-1">
                {research.techStack?.map((t: string) => <Badge key={t} variant="secondary">{t}</Badge>)}
              </div>
            </div>
            <div>
              <p className="mb-2 font-medium">Interview Process</p>
              <ul className="list-inside list-disc text-text-secondary">
                {research.interviewProcess?.map((s: string, i: number) => <li key={i}>{s}</li>)}
              </ul>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <p className="mb-1 font-medium text-success">Pros</p>
                <ul className="text-text-secondary">{research.pros?.map((p: string, i: number) => <li key={i}>• {p}</li>)}</ul>
              </div>
              <div>
                <p className="mb-1 font-medium text-warning">Cons</p>
                <ul className="text-text-secondary">{research.cons?.map((c: string, i: number) => <li key={i}>• {c}</li>)}</ul>
              </div>
            </div>
            <p className="text-text-muted italic">{research.fitReason}</p>
          </div>
        )}
      </Section>

      <Section
        title="Salary Prediction"
        icon={DollarSign}
        open={openSection === 'salary'}
        onToggle={() => toggle('salary')}
      >
        {!salary ? (
          <Button
            onClick={() => salaryMutation.mutate()}
            loading={salaryMutation.isPending}
            className="w-full"
          >
            Predict Salary for This Role
          </Button>
        ) : (
          <div className="space-y-4 text-sm">
            <div className="rounded-xl bg-surface-hover p-4 text-center">
              <p className="text-2xl font-bold text-primary">
                {salary.currency} {salary.predictedMin?.toLocaleString()} – {salary.predictedMax?.toLocaleString()}
              </p>
              <p className="text-text-muted">Median: {salary.currency} {salary.predictedMedian?.toLocaleString()}</p>
              <Badge className="mt-2" variant="secondary">Confidence: {salary.confidenceLevel}</Badge>
            </div>
            <p className="text-text-secondary">{salary.comparisonToProfile}</p>
            <div>
              <p className="mb-2 font-medium">Negotiation Tips</p>
              <ul className="text-text-secondary">
                {salary.negotiationTips?.map((t: string, i: number) => <li key={i}>• {t}</li>)}
              </ul>
            </div>
            <Button variant="ghost" size="sm" onClick={() => salaryMutation.mutate()} disabled={salaryMutation.isPending}>
              Recalculate
            </Button>
          </div>
        )}
      </Section>

      <Section
        title="Auto Apply Assistant"
        icon={ClipboardCheck}
        open={openSection === 'apply'}
        onToggle={() => toggle('apply')}
      >
        {!autoApply ? (
          <div className="space-y-3">
            <p className="text-sm text-text-muted">
              Get a readiness checklist before applying. We prepare your application — you submit when ready.
            </p>
            <Button
              onClick={() => autoApplyMutation.mutate()}
              loading={autoApplyMutation.isPending}
              className="w-full"
            >
              Prepare Application
            </Button>
          </div>
        ) : (
          <div className="space-y-4 text-sm">
            <div>
              <div className="mb-2 flex justify-between">
                <span className="font-medium">Readiness</span>
                <span className="font-bold text-primary">{autoApply.readinessScore}%</span>
              </div>
              <Progress value={autoApply.readinessScore} className="h-2" />
            </div>
            <p className="text-text-secondary">{autoApply.summary}</p>
            <div className="space-y-2">
              {autoApply.checklist?.map((item: { item: string; status: string; action: string }, i: number) => (
                <div key={i} className="flex items-start gap-3 rounded-lg border border-border p-3">
                  {statusIcon(item.status)}
                  <div>
                    <p className="font-medium">{item.item}</p>
                    <p className="text-xs text-text-muted">{item.action}</p>
                  </div>
                </div>
              ))}
            </div>
            <div>
              <p className="mb-2 font-medium">Recommended Steps</p>
              <ol className="list-inside list-decimal text-text-secondary">
                {autoApply.recommendedSteps?.map((s: string, i: number) => <li key={i}>{s}</li>)}
              </ol>
              <p className="mt-2 text-xs text-text-muted">Est. time: {autoApply.estimatedTimeMinutes} min</p>
            </div>
          </div>
        )}
      </Section>
    </div>
  );
}
