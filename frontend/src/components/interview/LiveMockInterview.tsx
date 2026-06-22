import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Mic, Bot, Clock, CheckCircle2, Loader2, Volume2, Target, Lightbulb, TrendingUp, Sparkles, Briefcase, MapPin } from 'lucide-react';
import { interviewApi, jobApi } from '@/services/endpoints';
import { getErrorMessage } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CircularProgress } from '@/components/ui/motion';
import { DomainSelector } from '@/components/interview/DomainSelector';
import type { InterviewDomainsData } from '@/components/interview/DomainSelector';

const QUESTION_TIME = 120;
const SILENCE_TIME = 10;
const POST_SPEECH_SILENCE = 4;

type Phase =
  | 'welcome'
  | 'systemCheck'
  | 'asking'
  | 'listening'
  | 'processing'
  | 'feedback'
  | 'complete';

interface LiveConfig {
  maxQuestions: number;
  questionTimeSeconds: number;
  silenceSeconds: number;
  postSpeechSilenceSeconds?: number;
}

interface ReportData {
  interview: {
    _id: string;
    overallScore: number;
    feedback: string;
    suggestions: string[];
    strengths?: string[];
    focusAreas?: string[];
    metrics: Record<string, number>;
    liveMeta?: { companyName?: string; jobTitle?: string; jobId?: string };
  };
  answers: Array<{
    question: string;
    answer: string;
    transcript?: string;
    evaluation: { score: number; feedback: string; strengths?: string[]; improvements?: string[] };
  }>;
}

const METRIC_LABELS: Record<string, string> = {
  technicalKnowledge: 'Technical Knowledge',
  communication: 'Communication',
  confidence: 'Confidence',
  problemSolving: 'Problem Solving',
  clarity: 'Clarity',
};

interface LiveMockInterviewProps extends InterviewDomainsData {
  jobId?: string;
  inviteToken?: string;
  inviteCompany?: string;
  inviteJobTitle?: string;
  inviteDomain?: string;
}

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

function getSpeechRecognition(): SpeechRecognition | null {
  const w = window as Window & {
    SpeechRecognition?: typeof SpeechRecognition;
    webkitSpeechRecognition?: typeof SpeechRecognition;
  };
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  return Ctor ? new Ctor() : null;
}

function hasMeaningfulSpeech(text: string) {
  return text.trim().length > 8;
}

export function LiveMockInterview({
  domains,
  recommended,
  reason,
  targetRole,
  academicStream,
  jobId,
  inviteToken,
  inviteCompany,
  inviteJobTitle,
  inviteDomain,
}: LiveMockInterviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const transcriptRef = useRef('');
  const questionRef = useRef('');
  const lastSpeechRef = useRef(Date.now());
  const timersRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const submittingRef = useRef(false);
  const retryCountRef = useRef(0);

  const [domain, setDomain] = useState(inviteDomain ?? recommended);
  const [phase, setPhase] = useState<Phase>('welcome');
  const [consent, setConsent] = useState(false);
  const [interviewId, setInterviewId] = useState('');
  const [question, setQuestion] = useState('');
  const [questionNum, setQuestionNum] = useState(1);
  const [maxQuestions, setMaxQuestions] = useState(6);
  const [config, setConfig] = useState<LiveConfig | null>(null);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
  const [feedback, setFeedback] = useState('');
  const [report, setReport] = useState<ReportData | null>(null);
  const [isCompletingInterview, setIsCompletingInterview] = useState(false);

  const { data: practiceJob, isLoading: jobLoading } = useQuery({
    queryKey: ['job-practice', jobId],
    queryFn: async () => (await jobApi.getById(jobId!)).data.data.job,
    enabled: !!jobId,
  });

  const isJobPractice = !!jobId && !!practiceJob;

  useEffect(() => {
    questionRef.current = question;
  }, [question]);

  useEffect(() => {
    if (inviteDomain) setDomain(inviteDomain);
    else setDomain(recommended);
  }, [recommended, inviteDomain]);

  const clearTimers = useCallback(() => {
    if (timersRef.current) {
      clearInterval(timersRef.current);
      timersRef.current = null;
    }
  }, []);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    clearTimers();
  }, [clearTimers]);

  useEffect(
    () => () => {
      speechSynthesis.cancel();
      stopStream();
    },
    [stopStream]
  );

  const speak = useCallback(
    (text: string): Promise<void> =>
      new Promise((resolve) => {
        if (!('speechSynthesis' in window)) {
          resolve();
          return;
        }
        speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.rate = 0.92;
        u.onend = () => resolve();
        u.onerror = () => resolve();
        speechSynthesis.speak(u);
      }),
    []
  );

  const setupMedia = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: true,
    });
    streamRef.current = stream;
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
    }
    return stream;
  };

  const submitTurnRef = useRef<
    (opts: { skipped?: boolean; silenceTimeout?: boolean; afterRetry?: boolean }) => Promise<void>
  >(async () => {});
  const beginListeningRef = useRef<() => void>(() => {});
  const reAskCurrentQuestionRef = useRef<() => Promise<void>>(async () => {});
  const startListeningPhaseRef = useRef<() => void>(() => {});

  const startMutation = useMutation({
    mutationFn: () =>
      interviewApi.startLive({
        domain: inviteToken || jobId ? undefined : domain,
        inviteToken,
        jobId,
        companyName: inviteCompany,
        jobTitle: inviteJobTitle,
      }),
    onSuccess: async (res) => {
      const data = res.data.data;
      setInterviewId(data.interview._id);
      setQuestion(data.currentQuestion);
      setQuestionNum(1);
      setMaxQuestions(data.interview.liveMeta?.maxQuestions ?? data.config.maxQuestions);
      setConfig(data.config);
      setPhase('systemCheck');
      try {
        await setupMedia();
        setPhase('asking');
        await speak(data.currentQuestion);
        setTimeout(() => startListeningPhaseRef.current(), 100);
      } catch {
        toast.error('Camera/microphone access required');
        setPhase('welcome');
      }
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const stopRecording = useCallback(async () => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;

    if (recorderRef.current?.state === 'recording') {
      await new Promise<void>((resolve) => {
        const rec = recorderRef.current!;
        rec.onstop = () => resolve();
        rec.stop();
      });
    }
  }, []);

  const beginListening = useCallback(() => {
    if (!streamRef.current) return;

    setPhase('listening');
    setTimeLeft(config?.questionTimeSeconds ?? QUESTION_TIME);
    transcriptRef.current = '';
    setLiveTranscript('');
    lastSpeechRef.current = Date.now();
    chunksRef.current = [];

    const mimeType = MediaRecorder.isTypeSupported('video/webm') ? 'video/webm' : 'video/mp4';
    recorderRef.current = new MediaRecorder(streamRef.current, { mimeType });
    recorderRef.current.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorderRef.current.start(500);

    const recognition = getSpeechRecognition();
    if (recognition) {
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-IN';
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let text = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          text += event.results[i][0].transcript;
        }
        if (text.trim()) {
          lastSpeechRef.current = Date.now();
          transcriptRef.current = `${transcriptRef.current} ${text}`.trim();
          setLiveTranscript(transcriptRef.current);
        }
      };
      recognition.onerror = () => {};
      recognition.start();
      recognitionRef.current = recognition;
    }

    const silenceMs = (config?.silenceSeconds ?? SILENCE_TIME) * 1000;
    const postSpeechMs =
      (config?.postSpeechSilenceSeconds ?? POST_SPEECH_SILENCE) * 1000;

    clearTimers();
    timersRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        const silenceElapsed = Date.now() - lastSpeechRef.current;
        const hasSpeech = hasMeaningfulSpeech(transcriptRef.current);

        if (!hasSpeech && silenceElapsed >= silenceMs) {
          if (retryCountRef.current === 0) {
            clearTimers();
            void reAskCurrentQuestionRef.current();
            return prev;
          }
          clearTimers();
          void submitTurnRef.current({ silenceTimeout: true, afterRetry: true });
          return prev;
        }

        if (hasSpeech && silenceElapsed >= postSpeechMs) {
          clearTimers();
          void submitTurnRef.current({});
          return prev;
        }

        if (prev <= 1) {
          clearTimers();
          if (hasSpeech) {
            void submitTurnRef.current({});
          } else if (retryCountRef.current === 0) {
            void reAskCurrentQuestionRef.current();
          } else {
            void submitTurnRef.current({ silenceTimeout: true, afterRetry: true });
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [config, clearTimers]);

  const startListeningPhase = useCallback(() => {
    retryCountRef.current = 0;
    beginListening();
  }, [beginListening]);

  const reAskCurrentQuestion = useCallback(async () => {
    if (submittingRef.current) return;
    clearTimers();
    await stopRecording();
    transcriptRef.current = '';
    setLiveTranscript('');
    lastSpeechRef.current = Date.now();
    retryCountRef.current = 1;
    setPhase('asking');
    await speak("I didn't hear your response. Let me ask that question again.");
    await speak(questionRef.current);
    beginListening();
  }, [clearTimers, stopRecording, speak, beginListening]);

  const submitTurn = useCallback(
    async (opts: { skipped?: boolean; silenceTimeout?: boolean; afterRetry?: boolean }) => {
      if (submittingRef.current || !interviewId) return;
      submittingRef.current = true;
      clearTimers();
      const isLastQuestion = questionNum >= maxQuestions;
      setIsCompletingInterview(isLastQuestion);
      setPhase('processing');

      let audioBlob: Blob | undefined;
      if (recorderRef.current?.state === 'recording') {
        audioBlob = await new Promise<Blob | undefined>((resolve) => {
          const rec = recorderRef.current!;
          rec.onstop = () => {
            const blob = new Blob(chunksRef.current, { type: rec.mimeType || 'audio/webm' });
            resolve(blob.size > 0 ? blob : undefined);
          };
          rec.stop();
        });
      } else {
        recognitionRef.current?.stop();
        recognitionRef.current = null;
      }

      const transcript = transcriptRef.current.trim();
      const duration = (config?.questionTimeSeconds ?? QUESTION_TIME) - timeLeft;

      try {
        const res = await interviewApi.liveTurn(interviewId, {
          transcript,
          skipped: opts.skipped,
          silenceTimeout: opts.silenceTimeout,
          afterRetry: opts.afterRetry,
          durationSeconds: Math.max(1, duration),
          audio: audioBlob,
        });
        const data = res.data.data;
        const evalFeedback = data.evaluation?.feedback ?? '';
        setFeedback(evalFeedback);
        transcriptRef.current = '';
        setLiveTranscript('');

        let spoken = '';
        if (data.wasSkipped) {
          spoken =
            'I did not get a clear response to that question, even after repeating it.';
        } else {
          spoken = evalFeedback;
          if (spoken && !spoken.endsWith('.')) spoken += '.';
          spoken += ' Thank you for your answer.';
        }

        if (!data.isComplete && data.nextQuestion) {
          setIsCompletingInterview(false);
          setPhase('feedback');
          spoken += ' Let me move on to the next question.';
          await speak(spoken);
          setQuestion(data.nextQuestion);
          setQuestionNum(data.questionNumber + 1);
          setTimeLeft(config?.questionTimeSeconds ?? QUESTION_TIME);
          setPhase('asking');
          await speak(data.nextQuestion);
          startListeningPhase();
        } else {
          spoken += ' That wraps up our interview. Thank you for your time.';
          setPhase('feedback');
          await speak(spoken);
          setPhase('processing');
          setIsCompletingInterview(true);
          await speak(
            'I am preparing your overall interview review with personalized suggestions. Please check the summary on your screen.'
          );
          stopStream();
          const reportRes = await interviewApi.getReport(interviewId);
          setReport(reportRes.data.data);
          setIsCompletingInterview(false);
          setPhase('complete');
          toast.success('Interview complete!');
        }
      } catch (e) {
        toast.error(getErrorMessage(e));
        setIsCompletingInterview(false);
        setPhase('listening');
      } finally {
        submittingRef.current = false;
      }
    },
    [interviewId, timeLeft, config, questionNum, maxQuestions, clearTimers, speak, stopStream, startListeningPhase]
  );

  submitTurnRef.current = submitTurn;
  beginListeningRef.current = beginListening;
  reAskCurrentQuestionRef.current = reAskCurrentQuestion;
  startListeningPhaseRef.current = startListeningPhase;

  const companyLabel = inviteCompany ?? practiceJob?.company;
  const jobLabel = inviteJobTitle ?? practiceJob?.title;

  const isLive =
    phase === 'systemCheck' ||
    phase === 'asking' ||
    phase === 'listening' ||
    phase === 'processing' ||
    phase === 'feedback';

  return (
    <div className="space-y-6">
      {phase === 'welcome' && (
        <Card className="overflow-hidden border-primary/20">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent">
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-6 w-6 text-primary" />
              {isJobPractice
                ? 'Job-Specific Interview Practice'
                : inviteToken
                  ? 'AI Screening Interview'
                  : 'Live AI Mock Interview'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 pt-6">
            {jobId && jobLoading && (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}

            {isJobPractice && (
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary">
                  <Briefcase className="h-4 w-4" />
                  Practicing for this job
                </div>
                <p className="text-lg font-semibold">{practiceJob.title}</p>
                <p className="text-text-muted">{practiceJob.company}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant="secondary">
                    <MapPin className="mr-1 h-3 w-3" />
                    {practiceJob.location}
                  </Badge>
                  {practiceJob.workMode && <Badge variant="secondary">{practiceJob.workMode}</Badge>}
                </div>
                {practiceJob.skills?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {practiceJob.skills.slice(0, 8).map((s) => (
                      <Badge key={s}>{s}</Badge>
                    ))}
                  </div>
                )}
              </div>
            )}

            {inviteToken && companyLabel && (
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
                <p className="text-sm text-text-muted">Company</p>
                <p className="text-lg font-semibold">{companyLabel}</p>
                {jobLabel && (
                  <>
                    <p className="mt-2 text-sm text-text-muted">Role</p>
                    <p className="font-medium">{jobLabel}</p>
                  </>
                )}
              </div>
            )}

            <p className="text-sm text-text-secondary">
              {isJobPractice
                ? 'Live mock interview tailored to this job — AI asks questions based on the role description, company, and required skills, just like a real screening.'
                : 'Real-time mock interview — AI asks questions live, listens to your answers on camera, gives brief feedback, and automatically moves to the next question like a real interviewer.'}
            </p>

            <ul className="space-y-2 text-sm text-text-secondary">
              <li>• AI interviewer speaks each question aloud</li>
              <li>• Live camera + microphone during your answer</li>
              <li>• {SILENCE_TIME}s silence → question repeated once, then moves on</li>
              <li>• After you speak, a short pause auto-submits your answer</li>
              <li>• Feedback on your answer, then next question automatically</li>
              <li>• {QUESTION_TIME}s max per question</li>
              <li>• Up to {maxQuestions} dynamic questions</li>
            </ul>

            {!inviteToken && !jobId && (
              <DomainSelector
                domains={domains}
                value={domain}
                recommended={recommended}
                reason={reason}
                targetRole={targetRole}
                academicStream={academicStream}
                onChange={setDomain}
              />
            )}

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-4">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-1"
              />
              <span className="text-sm text-text-secondary">
                I agree this session will be recorded and evaluated by AI. I will not cheat or use
                external help.
              </span>
            </label>

            <Button
              size="lg"
              className="w-full"
              disabled={!consent || (!!jobId && jobLoading)}
              loading={startMutation.isPending}
              onClick={() => startMutation.mutate()}
            >
              {isJobPractice ? 'Start Job Practice Interview' : "I'm ready — Start Interview"}
            </Button>
          </CardContent>
        </Card>
      )}

      {isLive && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <Card className="xl:col-span-2 overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                <span className="font-semibold">
                  {isJobPractice ? 'Job Practice Interviewer' : 'AI Interviewer'}
                </span>
              </div>
              <Badge variant={phase === 'listening' ? 'error' : 'secondary'}>
                Q{questionNum}/{maxQuestions}
                {phase === 'listening' && ` · ${formatTime(timeLeft)}`}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              <Progress value={((questionNum - 1) / maxQuestions) * 100} className="h-1.5" />

              <div className="relative aspect-video overflow-hidden rounded-xl bg-black">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="h-full w-full object-cover"
                  style={{ transform: 'scaleX(-1)' }}
                />
                {(phase === 'asking' || phase === 'feedback') && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <Volume2 className="h-12 w-12 animate-pulse text-white" />
                  </div>
                )}
                {phase === 'listening' && (
                  <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-error px-3 py-1 text-xs font-semibold text-white">
                    <Mic className="h-3 w-3 animate-pulse" /> Listening
                  </div>
                )}
                {phase === 'processing' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="mt-2 text-sm text-white">
                      {isCompletingInterview
                        ? 'Evaluating and preparing your overall review...'
                        : 'Evaluating your answer...'}
                    </p>
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
                <p className="mb-1 text-xs font-medium uppercase text-primary">Current question</p>
                <p className="text-lg leading-relaxed">{question}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Your live answer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="min-h-[140px] rounded-xl bg-surface-hover p-4 text-sm text-text-secondary">
                {liveTranscript || (
                  <span className="text-text-muted">
                    {phase === 'asking' || phase === 'feedback'
                      ? 'Listen to the interviewer...'
                      : phase === 'processing'
                        ? isCompletingInterview
                          ? 'Preparing your overall interview review...'
                          : 'Evaluating your answer...'
                        : 'Speak your answer — transcript appears here live'}
                  </span>
                )}
              </div>
              {feedback && (
                <div className="rounded-xl border border-border p-3 text-sm text-text-secondary">
                  <Badge className="mb-2" variant="secondary">
                    Last feedback
                  </Badge>
                  <p>{feedback}</p>
                </div>
              )}
              <p className="text-xs text-text-muted">
                <Clock className="mr-1 inline h-3 w-3" />
                {phase === 'feedback' && !isCompletingInterview
                  ? 'Interviewer is giving feedback and moving to the next question...'
                  : phase === 'processing' && isCompletingInterview
                    ? 'Generating your overall review, suggestions, and focus areas...'
                    : `Stay silent ${config?.silenceSeconds ?? SILENCE_TIME}s to get the question repeated once`}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {phase === 'complete' && report && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <Card className="border-success/30 bg-success/5">
            <CardContent className="py-8 text-center">
              <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-success" />
              <h2 className="text-2xl font-bold">Interview Complete</h2>
              {(report.interview.liveMeta?.jobTitle || jobLabel) && (
                <p className="mt-2 text-sm text-text-muted">
                  {report.interview.liveMeta?.companyName ?? companyLabel} ·{' '}
                  {report.interview.liveMeta?.jobTitle ?? jobLabel}
                </p>
              )}
              <p className="mt-2 text-sm text-text-muted">Here is your overall performance review</p>
              <CircularProgress value={report.interview.overallScore} size={100} className="mx-auto mt-4" />
              <p className="mt-2 text-lg font-semibold text-primary">{report.interview.overallScore}% Overall</p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Overall Review
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line text-sm leading-relaxed text-text-secondary">
                  {report.interview.feedback || 'Review your answers below for detailed feedback.'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Performance Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(report.interview.metrics).map(([key, val]) => (
                  <div key={key}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span>{METRIC_LABELS[key] ?? key}</span>
                      <span className="font-medium">{val}%</span>
                    </div>
                    <Progress value={val} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {(report.interview.strengths?.length ?? 0) > 0 && (
              <Card className="border-success/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base text-success">
                    <CheckCircle2 className="h-4 w-4" />
                    What You Did Well
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-text-secondary">
                    {report.interview.strengths!.map((s, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-success">•</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Target className="h-4 w-4 text-primary" />
                  Areas to Focus On
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(report.interview.focusAreas?.length ?? 0) > 0 ? (
                  <ul className="space-y-2 text-sm text-text-secondary">
                    {report.interview.focusAreas!.map((area, i) => (
                      <li key={i} className="flex gap-2">
                        <Badge variant="secondary" className="shrink-0">
                          {i + 1}
                        </Badge>
                        <span>{area}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-text-muted">
                    Practice consistently across all skill areas shown in the breakdown.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="border-warning/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Lightbulb className="h-4 w-4 text-warning" />
                  Suggestions to Improve
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-text-secondary">
                  {(report.interview.suggestions?.length
                    ? report.interview.suggestions
                    : ['Review each question feedback and practice stronger sample answers']
                  ).map((s, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-warning">→</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Question-by-Question Review</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {report.answers.map((a, i) => (
                <div key={i} className="rounded-xl border border-border p-4">
                  <p className="text-xs font-medium text-primary">Question {i + 1}</p>
                  <p className="mb-2 font-medium">{a.question}</p>
                  <p className="text-sm text-text-secondary">
                    {a.transcript || a.answer || '(no answer)'}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Badge variant={a.evaluation.score > 0 ? 'success' : 'secondary'}>
                      {a.evaluation.score}%
                    </Badge>
                    <span className="text-xs text-text-muted">{a.evaluation.feedback}</span>
                  </div>
                  {a.evaluation.improvements && a.evaluation.improvements.length > 0 && (
                    <p className="mt-2 text-xs text-text-muted">
                      Tip: {a.evaluation.improvements[0]}
                    </p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <Button size="lg" onClick={() => window.location.reload()}>
            Start New Interview
          </Button>
        </motion.div>
      )}
    </div>
  );
}
