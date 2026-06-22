import { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { MessageSquare, Send, CheckCircle2, TrendingUp } from 'lucide-react';
import { interviewApi } from '@/services/endpoints';
import { getErrorMessage } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CircularProgress } from '@/components/ui/motion';
import { DomainSelector } from '@/components/interview/DomainSelector';
import type { InterviewDomainsData } from '@/components/interview/DomainSelector';

interface InterviewReport {
  interview: {
    overallScore: number;
    feedback?: string;
    metrics: Record<string, number>;
    strengths?: string[];
    focusAreas?: string[];
    suggestions?: string[];
  };
  answers: Array<{
    question: string;
    answer: string;
    score: number;
    feedback?: string;
  }>;
}

function domainLabel(domains: InterviewDomainsData['domains'], id: string): string {
  return domains.find((d) => d.id === id)?.label ?? id;
}

export function TextInterviewMode({ domains, recommended, reason, targetRole, academicStream }: InterviewDomainsData) {
  const [domain, setDomain] = useState(recommended);
  const [interviewId, setInterviewId] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<Record<string, unknown> | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [metrics, setMetrics] = useState<Record<string, number>>({});
  const [report, setReport] = useState<InterviewReport | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);

  useEffect(() => {
    setDomain(recommended);
  }, [recommended]);

  const { data: pastInterviews } = useQuery({
    queryKey: ['interviews'],
    queryFn: async () => (await interviewApi.getAll()).data.data,
  });

  const startMutation = useMutation({
    mutationFn: () => interviewApi.start(domain, 'mock'),
    onSuccess: (res) => {
      const data = res.data.data;
      setInterviewId(data.interview._id);
      setCurrentQuestion(data.currentQuestion);
      setFeedback(null);
      setIsComplete(false);
      toast.success('Text interview started!');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const answerMutation = useMutation({
    mutationFn: () => interviewApi.answer(interviewId, answer),
    onSuccess: (res) => {
      const data = res.data.data;
      setFeedback(data.evaluation);
      setMetrics(data.interview.metrics);
      setAnswer('');
      if (data.isComplete) {
        setIsComplete(true);
        setCurrentQuestion('');
        toast.success(`Interview complete! Score: ${data.interview.overallScore}%`);
        setLoadingReport(true);
        const completedId = data.interview._id ?? interviewId;
        interviewApi.getReport(completedId).then((res) => {
          setReport(res.data.data as InterviewReport);
        }).catch((e) => {
          toast.error(getErrorMessage(e));
        }).finally(() => setLoadingReport(false));
      } else {
        setCurrentQuestion(data.nextQuestion);
      }
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  return (
    <div className="space-y-6">
      {!interviewId && (
        <Card>
          <CardHeader><CardTitle>Select Interview Domain</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <DomainSelector
              domains={domains}
              value={domain}
              recommended={recommended}
              reason={reason}
              targetRole={targetRole}
              academicStream={academicStream}
              onChange={setDomain}
            />
            <Button loading={startMutation.isPending} onClick={() => startMutation.mutate()}>
              <MessageSquare className="mr-2 h-4 w-4" /> Start Text Interview
            </Button>
          </CardContent>
        </Card>
      )}

      {interviewId && !isComplete && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Question</CardTitle></CardHeader>
            <CardContent>
              <Badge className="mb-3">{domainLabel(domains, domain)}</Badge>
              <p className="text-lg">{currentQuestion}</p>
              <textarea
                className="mt-4 min-h-[150px] w-full rounded-xl border border-border bg-surface p-4 text-sm focus:border-primary focus:outline-none"
                placeholder="Type your answer..."
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
              />
              <Button
                className="mt-4"
                disabled={!answer.trim()}
                loading={answerMutation.isPending}
                onClick={() => answerMutation.mutate()}
              >
                <Send className="mr-2 h-4 w-4" /> Submit Answer
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Live Feedback</CardTitle></CardHeader>
            <CardContent>
              {feedback ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <div className="text-center">
                    <p className="text-4xl font-bold text-primary">{(feedback as { score: number }).score}%</p>
                    <p className="text-sm text-text-muted">Answer Score</p>
                  </div>
                  <p className="text-sm text-text-secondary">{(feedback as { feedback: string }).feedback}</p>
                  <div className="space-y-2">
                    {Object.entries(metrics).map(([key, val]) => (
                      <div key={key}>
                        <div className="flex justify-between text-xs">
                          <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                          <span>{val}%</span>
                        </div>
                        <Progress value={val} className="h-1.5" />
                      </div>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <p className="text-text-muted">Submit an answer to see feedback</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {isComplete && (
        <div className="space-y-6">
          {loadingReport ? (
            <Card>
              <CardContent className="py-12 text-center text-text-muted">Loading your report...</CardContent>
            </Card>
          ) : report ? (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <Card className="border-success/30 bg-success/5">
                <CardContent className="py-8 text-center">
                  <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-success" />
                  <h2 className="text-2xl font-bold">Interview Complete</h2>
                  <CircularProgress value={report.interview.overallScore} size={100} className="mx-auto mt-4" />
                  <p className="mt-2 text-lg font-semibold text-primary">{report.interview.overallScore}% Overall</p>
                </CardContent>
              </Card>

              {report.interview.feedback && (
                <Card>
                  <CardHeader><CardTitle>Overall Review</CardTitle></CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-line text-sm leading-relaxed text-text-secondary">
                      {report.interview.feedback}
                    </p>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    Performance Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {Object.entries(report.interview.metrics).map(([key, val]) => (
                    <div key={key}>
                      <div className="flex justify-between text-xs">
                        <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                        <span>{val}%</span>
                      </div>
                      <Progress value={val} className="h-1.5" />
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Answer-by-Answer Review</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {report.answers.map((a, i) => (
                    <div key={i} className="rounded-xl border border-border p-4">
                      <p className="text-sm font-medium">Q{i + 1}: {a.question}</p>
                      <p className="mt-2 text-sm text-text-muted">{a.answer}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs text-text-secondary">{a.feedback}</span>
                        <Badge variant="success">{a.score}%</Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-2xl font-bold text-success">Interview Complete!</p>
              </CardContent>
            </Card>
          )}

          <div className="text-center">
            <Button onClick={() => {
              setInterviewId('');
              setIsComplete(false);
              setReport(null);
            }}>
              Start New Interview
            </Button>
          </div>
        </div>
      )}

      {pastInterviews && pastInterviews.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Past Interviews</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {pastInterviews.slice(0, 5).map((i) => (
              <div key={i._id} className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <Badge>{domainLabel(domains, i.domain)}</Badge>
                  <span className="ml-2 text-sm text-text-muted">{i.type} · {i.status}</span>
                </div>
                <span className="font-bold text-primary">{i.overallScore}%</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
