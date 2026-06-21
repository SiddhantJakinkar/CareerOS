import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Clock, CheckCircle } from 'lucide-react';
import { codingApi } from '@/services/endpoints';
import { getErrorMessage } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageSkeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/store';
import { getAssessmentPageTitle } from '@/lib/academicStreams';

export default function CodingAssessmentPage() {
  const navigate = useNavigate();
  const profile = useAuthStore((s) => s.profile);
  const pageTitle = getAssessmentPageTitle(profile?.academicStream);
  const { id } = useParams();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [started, setStarted] = useState(false);
  const [startTime] = useState(Date.now());

  const { data: tests, isLoading } = useQuery({
    queryKey: ['coding-tests'],
    queryFn: async () => (await codingApi.getTests()).data.data,
  });

  const { data: test, isLoading: testLoading } = useQuery({
    queryKey: ['coding-test', id],
    queryFn: async () => (await codingApi.getTest(id!)).data.data,
    enabled: !!id,
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
      toast.success(`Score: ${res.data.data.percentage}%`);
      navigate('/coding');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  useEffect(() => {
    if (test && started) {
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
    }
  }, [test, started]);

  if (!id) {
    if (isLoading) return <PageSkeleton />;
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">{pageTitle}</h1>
        <p className="text-text-muted">Practice assessments tailored to your field of study</p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tests?.map((t) => (
            <Card key={t._id} className="cursor-pointer hover:border-primary/50" onClick={() => navigate(`/coding/${t._id}`)}>
              <CardHeader>
                <Badge>{t.category.toUpperCase()}</Badge>
                <CardTitle className="mt-2">{t.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-text-muted">{t.description}</p>
                <div className="mt-4 flex items-center gap-4 text-sm text-text-muted">
                  <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{t.duration} min</span>
                  <span>{t.questions?.length ?? 0} questions</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (testLoading || !test) return <PageSkeleton />;

  if (!started) {
    return (
      <Card className="mx-auto max-w-lg">
        <CardHeader>
          <CardTitle>{test.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-text-muted">{test.description}</p>
          <p>Duration: {test.duration} minutes | Questions: {test.questions.length}</p>
          <Button className="w-full" onClick={() => setStarted(true)}>Start Test</Button>
        </CardContent>
      </Card>
    );
  }

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{test.title}</h1>
        <Badge variant={timeLeft < 60 ? 'error' : 'default'}>
          <Clock className="mr-1 h-3 w-3" />{mins}:{secs.toString().padStart(2, '0')}
        </Badge>
      </div>

      <div className="space-y-6">
        {test.questions.map((q, idx) => (
          <Card key={q.id}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Badge>Q{idx + 1}</Badge>
                <Badge variant="secondary">{q.difficulty}</Badge>
                <Badge variant="secondary">{q.topic}</Badge>
              </div>
              <CardTitle className="mt-2 text-base">{q.question}</CardTitle>
            </CardHeader>
            <CardContent>
              {q.options ? (
                <div className="space-y-2">
                  {q.options.map((opt) => (
                    <label key={opt} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors ${answers[q.id] === opt ? 'border-primary bg-primary/10' : 'border-border hover:bg-surface-hover'}`}>
                      <input
                        type="radio"
                        name={q.id}
                        value={opt}
                        checked={answers[q.id] === opt}
                        onChange={() => setAnswers((a) => ({ ...a, [q.id]: opt }))}
                        className="accent-primary"
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              ) : (
                <textarea
                  className="w-full rounded-xl border border-border bg-surface p-4 text-sm"
                  placeholder="Your answer..."
                  value={answers[q.id] ?? ''}
                  onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                />
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Button className="w-full" size="lg" onClick={() => submitMutation.mutate()} loading={submitMutation.isPending}>
        <CheckCircle className="mr-2 h-4 w-4" /> Submit Test
      </Button>
    </div>
  );
}
