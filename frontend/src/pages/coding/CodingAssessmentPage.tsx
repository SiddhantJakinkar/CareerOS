import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Clock,
  CheckCircle2,
  Target,
  Sparkles,
  GraduationCap,
  ChevronRight,
  BarChart3,
  BookOpen,
  ArrowLeft,
  Trophy,
} from 'lucide-react';
import { codingApi } from '@/services/endpoints';
import { getErrorMessage } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { PageSkeleton } from '@/components/ui/skeleton';
import { CircularProgress } from '@/components/ui/motion';
import {
  getAssessmentPageTitle,
  getAssessmentScoreLabel,
  getAssessmentSubtitle,
} from '@/lib/academicStreams';

import type { AssessmentHub } from '@/types';

const HUB_STALE_MS = 10 * 60 * 1000;
const TEST_STALE_MS = 30 * 60 * 1000;

interface SubmitResult {
  percentage: number;
  score: number;
  maxScore: number;
  weakAreas: string[];
  recommendations: string[];
  topicAnalysis: Record<string, { correct: number; total: number; percentage: number }>;
}

const CATEGORY_COLORS: Record<string, string> = {
  personalized: 'bg-secondary/20 text-secondary border-secondary/30',
  dsa: 'bg-primary/15 text-primary border-primary/30',
  aptitude: 'bg-warning/15 text-warning border-warning/30',
};

function questionCount(test: { questionCount?: number; questions?: unknown[] }) {
  return test.questionCount ?? test.questions?.length ?? 0;
}

function categoryStyle(category: string) {
  return CATEGORY_COLORS[category] ?? 'bg-surface-hover text-text-secondary border-border';
}

export default function CodingAssessmentPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams();
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [started, setStarted] = useState(false);
  const [startTime, setStartTime] = useState(Date.now());
  const [currentQ, setCurrentQ] = useState(0);
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);

  const pageTitle = getAssessmentPageTitle();

  const { data: hub, isLoading } = useQuery({
    queryKey: ['assessment-hub'],
    queryFn: async () => (await codingApi.getHub()).data.data,
    enabled: !id,
    staleTime: HUB_STALE_MS,
    gcTime: HUB_STALE_MS * 2,
  });

  const { data: test, isLoading: testLoading } = useQuery({
    queryKey: ['coding-test', id],
    queryFn: async () => (await codingApi.getTest(id!)).data.data,
    enabled: !!id,
    staleTime: TEST_STALE_MS,
    gcTime: TEST_STALE_MS * 2,
  });

  const goToHub = () => navigate('/coding');

  const generateMutation = useMutation({
    mutationFn: () => codingApi.generatePersonalized(),
    onSuccess: (res) => {
      const created = res.data.data;
      queryClient.setQueryData<AssessmentHub>(['assessment-hub'], (old) => {
        if (!old) return old;
        const entry = {
          _id: created.id,
          category: 'personalized',
          title: created.title,
          description: created.description ?? '',
          duration: created.duration ?? 30,
          totalPoints: created.totalPoints ?? 0,
          isPersonalized: true,
          questionCount: 15,
        };
        return {
          ...old,
          tests: [entry, ...old.tests.filter((t) => t._id !== created.id)],
          meta: {
            ...old.meta,
            recommendedTestId: created.id,
            categories: old.meta.categories.some((c) => c.id === 'personalized')
              ? old.meta.categories.map((c) =>
                  c.id === 'personalized' ? { ...c, count: c.count + 1 } : c
                )
              : [...old.meta.categories, { id: 'personalized', label: 'Personalized', count: 1 }],
          },
        };
      });
      toast.success('Personalized assessment ready!');
      navigate(`/coding/${created.id}`);
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const submitMutation = useMutation({
    mutationFn: () =>
      codingApi.submit({
        testId: id!,
        answers: Object.entries(answers).map(([questionId, answer]) => ({
          questionId,
          answer,
          timeSpent: 0,
        })),
        timeTaken: Math.round((Date.now() - startTime) / 1000),
      }),
    onSuccess: (res) => {
      const data = res.data.data;
      setSubmitResult({
        percentage: data.percentage,
        score: data.score,
        maxScore: data.maxScore,
        weakAreas: data.weakAreas ?? [],
        recommendations: data.recommendations ?? [],
        topicAnalysis: data.topicAnalysis ?? {},
      });
      queryClient.setQueryData<AssessmentHub>(['assessment-hub'], (old) => {
        if (!old) return old;
        return {
          ...old,
          meta: {
            ...old.meta,
            assessmentScore: data.percentage,
            recentWeakAreas: data.weakAreas?.length ? data.weakAreas : old.meta.recentWeakAreas,
          },
        };
      });
      toast.success(`Score: ${data.percentage}%`);
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  useEffect(() => {
    if (!test || !started || submitResult) return;
    setTimeLeft(test.duration * 60);
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          submitMutation.mutate();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [test, started, submitResult]);

  const meta = hub?.meta;
  const tests = hub?.tests ?? [];
  const recommended = tests.find((t) => t._id === meta?.recommendedTestId);
  const answeredCount = Object.keys(answers).length;
  const progressPct = test?.questions?.length
    ? Math.round((answeredCount / test.questions.length) * 100)
    : 0;

  const filteredTests = useMemo(() => {
    if (!categoryFilter) return tests;
    return tests.filter((t) => t.category === categoryFilter);
  }, [tests, categoryFilter]);

  if (!id) {
    if (isLoading) return <PageSkeleton />;

    return (
      <div className="space-y-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">{pageTitle}</h1>
            <p className="mt-2 max-w-2xl text-text-muted">
              {getAssessmentSubtitle(meta?.academicStream, meta?.targetRole)}
            </p>
          </div>
          <Button
            loading={generateMutation.isPending}
            onClick={() => generateMutation.mutate()}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Generate AI Assessment
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2 overflow-hidden border-primary/20">
            <CardHeader className="border-b border-border bg-gradient-to-r from-primary/10 to-transparent">
              <CardTitle className="flex items-center gap-2 text-lg">
                <GraduationCap className="h-5 w-5 text-primary" />
                Your assessment profile
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 p-6 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase text-text-muted">Academic stream</p>
                <p className="mt-1 text-lg font-semibold">{meta?.streamLabel}</p>
                {meta?.degree && (
                  <p className="text-sm text-text-secondary">
                    {meta.degree}
                    {meta.branch ? ` · ${meta.branch}` : ''}
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-text-muted">Target role</p>
                <p className="mt-1 text-lg font-semibold">{meta?.targetRole}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="mb-2 text-xs font-medium uppercase text-text-muted">Focus areas</p>
                <div className="flex flex-wrap gap-2">
                  {meta?.focusAreas.map((area) => (
                    <Badge key={area} variant="secondary">
                      {area}
                    </Badge>
                  ))}
                </div>
              </div>
              {meta?.recentWeakAreas && meta.recentWeakAreas.length > 0 && (
                <div className="sm:col-span-2 rounded-xl border border-warning/30 bg-warning/5 p-4">
                  <p className="text-sm font-medium text-warning">Practice more on</p>
                  <p className="mt-1 text-sm text-text-secondary">
                    {meta.recentWeakAreas.join(', ')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{getAssessmentScoreLabel(meta?.academicStream)}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center py-4">
              <CircularProgress value={meta?.assessmentScore ?? 0} size={120} />
              <p className="mt-4 text-center text-sm text-text-muted">
                Contributes to your placement readiness score
              </p>
            </CardContent>
          </Card>
        </div>

        {recommended && (
          <Card
            className="cursor-pointer border-primary/40 bg-primary/5 transition-colors hover:border-primary"
            onClick={() => navigate(`/coding/${recommended._id}`)}
          >
            <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
              <div>
                <Badge className="mb-2">Recommended for you</Badge>
                <h2 className="text-xl font-bold">{recommended.title}</h2>
                <p className="mt-1 text-sm text-text-secondary">{recommended.description}</p>
                <div className="mt-3 flex gap-3 text-sm text-text-muted">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {recommended.duration} min
                  </span>
                  <span>{questionCount(recommended)} questions</span>
                </div>
              </div>
              <Button>
                Start now
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        <div>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-text-muted">Filter:</span>
            <Button
              size="sm"
              variant={categoryFilter === null ? 'default' : 'secondary'}
              onClick={() => setCategoryFilter(null)}
            >
              All
            </Button>
            {meta?.categories.map((cat) => (
              <Button
                key={cat.id}
                size="sm"
                variant={categoryFilter === cat.id ? 'default' : 'secondary'}
                onClick={() => setCategoryFilter(cat.id)}
              >
                {cat.label} ({cat.count})
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredTests.map((t) => (
              <Card
                key={t._id}
                className="cursor-pointer transition-all hover:-translate-y-0.5 hover:border-primary/50"
                onClick={() => navigate(`/coding/${t._id}`)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <Badge className={categoryStyle(t.category)}>{t.category.toUpperCase()}</Badge>
                    {t.isPersonalized && <Badge variant="secondary">AI Generated</Badge>}
                  </div>
                  <CardTitle className="mt-2 text-lg">{t.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="line-clamp-2 text-sm text-text-muted">{t.description}</p>
                  <div className="mt-4 flex items-center gap-4 text-sm text-text-muted">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {t.duration} min
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4" />
                      {questionCount(t)} Qs
                    </span>
                    <span className="flex items-center gap-1">
                      <Target className="h-4 w-4" />
                      {t.totalPoints} pts
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredTests.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center text-text-muted">
                No assessments in this category. Try generating a personalized one.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  if (testLoading || !test) return <PageSkeleton />;

  const questions = test.questions ?? [];

  if (submitResult) {
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-2xl space-y-6">
        <Card className="border-success/30 bg-success/5">
          <CardContent className="py-10 text-center">
            <Trophy className="mx-auto h-12 w-12 text-success" />
            <h1 className="mt-4 text-2xl font-bold">Assessment Complete</h1>
            <CircularProgress value={submitResult.percentage} size={110} className="mx-auto mt-6" />
            <p className="mt-2 text-lg font-semibold text-primary">
              {submitResult.score} / {submitResult.maxScore} points ({submitResult.percentage}%)
            </p>
          </CardContent>
        </Card>

        {Object.keys(submitResult.topicAnalysis).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="h-4 w-4" />
                Topic breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(submitResult.topicAnalysis).map(([topic, stats]) => (
                <div key={topic}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>{topic}</span>
                    <span>{stats.percentage}%</span>
                  </div>
                  <Progress value={stats.percentage} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {submitResult.weakAreas.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Areas to improve</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-text-secondary">
                {submitResult.recommendations.map((r, i) => (
                  <li key={i}>→ {r}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={goToHub}>
            Back to assessments
          </Button>
          <Button className="flex-1" onClick={() => generateMutation.mutate()} loading={generateMutation.isPending}>
            <Sparkles className="mr-2 h-4 w-4" />
            New personalized test
          </Button>
        </div>
      </motion.div>
    );
  }

  if (!started) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Button variant="ghost" size="sm" onClick={goToHub}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          All assessments
        </Button>
        <Card>
          <CardHeader>
            <div className="flex flex-wrap gap-2">
              <Badge className={categoryStyle(test.category)}>{test.category}</Badge>
              {test.isPersonalized && <Badge variant="secondary">AI Personalized</Badge>}
            </div>
            <CardTitle className="mt-3 text-2xl">{test.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <p className="text-text-secondary">{test.description}</p>
            <div className="grid grid-cols-3 gap-3 rounded-xl bg-surface-hover p-4 text-center text-sm">
              <div>
                <p className="font-bold text-primary">{test.duration}</p>
                <p className="text-text-muted">minutes</p>
              </div>
              <div>
                <p className="font-bold text-primary">{questions.length || questionCount(test)}</p>
                <p className="text-text-muted">questions</p>
              </div>
              <div>
                <p className="font-bold text-primary">{test.totalPoints}</p>
                <p className="text-text-muted">points</p>
              </div>
            </div>
            <ul className="space-y-2 text-sm text-text-secondary">
              <li>• Answer all questions before the timer ends</li>
              <li>• Use the question navigator to jump between items</li>
              <li>• You will get topic-wise feedback after submission</li>
            </ul>
            <Button
              className="w-full"
              size="lg"
              onClick={() => {
                setStartTime(Date.now());
                setStarted(true);
              }}
            >
              Start Assessment
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const q = questions[currentQ];

  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-10 rounded-xl border border-border bg-background/95 p-4 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-bold">{test.title}</h1>
            <p className="text-sm text-text-muted">
              Question {currentQ + 1} of {questions.length}
            </p>
          </div>
          <Badge variant={timeLeft < 60 ? 'error' : 'default'} className="text-base">
            <Clock className="mr-1 h-4 w-4" />
            {mins}:{secs.toString().padStart(2, '0')}
          </Badge>
        </div>
        <Progress value={progressPct} className="mt-3 h-2" />
        <p className="mt-1 text-xs text-text-muted">{answeredCount} of {questions.length} answered</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        <Card className="h-fit lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Navigator</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-2">
              {questions.map((item, idx) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setCurrentQ(idx)}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                    currentQ === idx
                      ? 'bg-primary text-white'
                      : answers[item.id]
                        ? 'bg-success/20 text-success'
                        : 'bg-surface-hover text-text-muted hover:bg-surface'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4 lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <Badge>Q{currentQ + 1}</Badge>
                <Badge variant="secondary">{q.difficulty}</Badge>
                <Badge variant="secondary">{q.topic}</Badge>
                <Badge variant="secondary">{q.points} pts</Badge>
              </div>
              <CardTitle className="mt-3 text-lg leading-relaxed">{q.question}</CardTitle>
            </CardHeader>
            <CardContent>
              {q.options ? (
                <div className="space-y-2">
                  {q.options.map((opt) => (
                    <label
                      key={opt}
                      className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-colors ${
                        answers[q.id] === opt
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:bg-surface-hover'
                      }`}
                    >
                      <input
                        type="radio"
                        name={q.id}
                        value={opt}
                        checked={answers[q.id] === opt}
                        onChange={() => setAnswers((a) => ({ ...a, [q.id]: opt }))}
                        className="accent-primary"
                      />
                      <span className="text-sm">{opt}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <textarea
                  className="min-h-[140px] w-full rounded-xl border border-border bg-surface p-4 text-sm"
                  placeholder="Type your answer..."
                  value={answers[q.id] ?? ''}
                  onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                />
              )}
            </CardContent>
          </Card>

          <div className="flex flex-wrap gap-3">
            <Button
              variant="secondary"
              disabled={currentQ === 0}
              onClick={() => setCurrentQ((c) => c - 1)}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              disabled={currentQ >= questions.length - 1}
              onClick={() => setCurrentQ((c) => c + 1)}
            >
              Next
            </Button>
            <Button
              className="ml-auto"
              size="lg"
              onClick={() => submitMutation.mutate()}
              loading={submitMutation.isPending}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Submit assessment
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
