import { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Video,
  Upload,
  Play,
  Trash2,
  Mic,
  BarChart3,
  Volume2,
  Radio,
  Square,
} from 'lucide-react';
import { videoInterviewApi, interviewApi, voiceApi } from '@/services/endpoints';
import { getErrorMessage } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { PageSkeleton } from '@/components/ui/skeleton';
import { CircularProgress } from '@/components/ui/motion';
import { DomainSelector } from '@/components/interview/DomainSelector';
import type { InterviewDomainsData } from '@/components/interview/DomainSelector';

type Tab = 'live' | 'upload';

interface VideoRecord {
  _id: string;
  title: string;
  domain: string;
  videoUrl: string;
  status: string;
  fileName: string;
  analysis: {
    overallScore: number;
    communication: number;
    confidence: number;
    clarity: number;
    structure: number;
    fillerWordCount: number;
    fillerWords: string[];
    wordsPerMinute: number;
    strengths: string[];
    improvements: string[];
    feedback: string;
    transcript: string;
    durationSeconds: number;
  };
  createdAt: string;
}

interface LiveSummary {
  overallScore: number;
  metrics: {
    communication: number;
    confidence: number;
    clarity: number;
    technicalKnowledge: number;
    problemSolving: number;
  };
  feedback: string;
  suggestions: string[];
  videoAnalysis?: VideoRecord['analysis'];
}

function getSupportedMimeType(): string {
  const types = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4'];
  return types.find((type) => MediaRecorder.isTypeSupported(type)) ?? 'video/webm';
}

export function VideoInterviewMode({ domains, recommended, reason, targetRole, academicStream }: InterviewDomainsData) {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const liveStreamRef = useRef<MediaStream | null>(null);
  const sessionRecorderRef = useRef<MediaRecorder | null>(null);
  const answerRecorderRef = useRef<MediaRecorder | null>(null);
  const sessionChunksRef = useRef<Blob[]>([]);
  const answerChunksRef = useRef<Blob[]>([]);

  const [tab, setTab] = useState<Tab>('live');
  const [title, setTitle] = useState('Mock Interview Recording');
  const [domain, setDomain] = useState(recommended);
  const [selected, setSelected] = useState<VideoRecord | null>(null);

  // Live interview state
  const [interviewId, setInterviewId] = useState('');
  const [question, setQuestion] = useState('');
  const [questionNumber, setQuestionNumber] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [feedback, setFeedback] = useState('');
  const [textAnswer, setTextAnswer] = useState('');
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [isAnswering, setIsAnswering] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [liveSummary, setLiveSummary] = useState<LiveSummary | null>(null);
  const [startingLive, setStartingLive] = useState(false);

  useEffect(() => {
    setDomain(recommended);
  }, [recommended]);

  const { data: videos, isLoading } = useQuery({
    queryKey: ['video-interviews'],
    queryFn: async () => (await videoInterviewApi.getAll()).data.data as VideoRecord[],
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => {
      const form = new FormData();
      form.append('video', file);
      form.append('title', title);
      form.append('domain', domain);
      return videoInterviewApi.upload(form);
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['video-interviews'] });
      setSelected(res.data.data);
      toast.success('Video analyzed successfully!');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => videoInterviewApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['video-interviews'] });
      setSelected(null);
      toast.success('Deleted');
    },
  });

  const speak = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      speechSynthesis.speak(utterance);
    }
  }, []);

  const stopLiveStream = useCallback(() => {
    liveStreamRef.current?.getTracks().forEach((track) => track.stop());
    liveStreamRef.current = null;
    if (videoPreviewRef.current) {
      videoPreviewRef.current.srcObject = null;
    }
  }, []);

  const resetLiveInterview = useCallback(() => {
    stopLiveStream();
    sessionRecorderRef.current = null;
    answerRecorderRef.current = null;
    sessionChunksRef.current = [];
    answerChunksRef.current = [];
    setInterviewId('');
    setQuestion('');
    setQuestionNumber(0);
    setTotalQuestions(0);
    setTranscript('');
    setFeedback('');
    setTextAnswer('');
    setIsLiveActive(false);
    setIsAnswering(false);
    setIsSubmitting(false);
    setIsComplete(false);
    setLiveSummary(null);
    setStartingLive(false);
  }, [stopLiveStream]);

  useEffect(() => {
    return () => {
      speechSynthesis.cancel();
      stopLiveStream();
    };
  }, [stopLiveStream]);

  const startLiveInterview = async () => {
    setStartingLive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });

      liveStreamRef.current = stream;
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
        await videoPreviewRef.current.play();
      }

      const mimeType = getSupportedMimeType();
      sessionChunksRef.current = [];
      sessionRecorderRef.current = new MediaRecorder(stream, { mimeType });
      sessionRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) sessionChunksRef.current.push(event.data);
      };
      sessionRecorderRef.current.start(1000);

      const res = await interviewApi.start(domain, 'video');
      const data = res.data.data;
      const interview = data.interview;

      setInterviewId(interview._id);
      setQuestion(data.currentQuestion);
      setQuestionNumber(1);
      setTotalQuestions(interview.questions.length);
      setIsLiveActive(true);
      speak(data.currentQuestion);
      toast.success('Live video interview started');
    } catch (error) {
      stopLiveStream();
      toast.error(getErrorMessage(error));
    } finally {
      setStartingLive(false);
    }
  };

  const finishLiveSession = async (completedInterviewId: string) => {
    setIsSubmitting(true);
    try {
      let sessionBlob: Blob | null = null;

      if (sessionRecorderRef.current && sessionRecorderRef.current.state !== 'inactive') {
        sessionBlob = await new Promise<Blob>((resolve) => {
          const recorder = sessionRecorderRef.current!;
          recorder.onstop = () => {
            resolve(new Blob(sessionChunksRef.current, { type: recorder.mimeType || 'video/webm' }));
          };
          recorder.stop();
        });
      }

      stopLiveStream();

      const reportRes = await interviewApi.getReport(completedInterviewId);
      const report = reportRes.data.data;
      const interview = report.interview;

      let videoAnalysis: VideoRecord['analysis'] | undefined;
      if (sessionBlob && sessionBlob.size > 0) {
        try {
          const form = new FormData();
          const file = new File([sessionBlob], `live-interview-${Date.now()}.webm`, {
            type: sessionBlob.type || 'video/webm',
          });
          form.append('video', file);
          form.append('title', `Live Interview - ${domain.toUpperCase()}`);
          form.append('domain', domain);
          const uploadRes = await videoInterviewApi.upload(form);
          videoAnalysis = uploadRes.data.data.analysis;
          queryClient.invalidateQueries({ queryKey: ['video-interviews'] });
        } catch {
          toast.message('Session saved locally; full video analysis could not run.');
        }
      }

      setLiveSummary({
        overallScore: interview.overallScore,
        metrics: interview.metrics,
        feedback: interview.feedback,
        suggestions: interview.suggestions ?? [],
        videoAnalysis,
      });
      setIsComplete(true);
      toast.success('Live interview complete!');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitAnswer = async (audioBlob?: Blob, typedAnswer?: string) => {
    if (!interviewId) return;
    setIsSubmitting(true);
    try {
      const res = await voiceApi.evaluate(interviewId, audioBlob, typedAnswer);
      const data = res.data.data;
      setTranscript(data.transcript);
      setFeedback(data.evaluation.feedback);
      setTextAnswer('');

      if (data.isComplete) {
        setIsLiveActive(false);
        await finishLiveSession(interviewId);
      } else {
        setQuestion(data.nextQuestion);
        setQuestionNumber((n) => n + 1);
        speak(data.nextQuestion);
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const startAnswerRecording = () => {
    if (!liveStreamRef.current) {
      toast.error('Camera is not active');
      return;
    }

    const audioTracks = liveStreamRef.current.getAudioTracks();
    if (audioTracks.length === 0) {
      toast.error('No microphone detected. Use text answer instead.');
      return;
    }

    try {
      const audioStream = new MediaStream(audioTracks);
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      answerChunksRef.current = [];
      answerRecorderRef.current = new MediaRecorder(audioStream, { mimeType });
      answerRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) answerChunksRef.current.push(event.data);
      };
      answerRecorderRef.current.onstop = async () => {
        const blob = new Blob(answerChunksRef.current, { type: mimeType });
        await submitAnswer(blob);
        setIsAnswering(false);
      };
      answerRecorderRef.current.start();
      setIsAnswering(true);
    } catch {
      toast.error('Could not start recording. Use text answer instead.');
    }
  };

  const stopAnswerRecording = () => {
    if (answerRecorderRef.current?.state === 'recording') {
      answerRecorderRef.current.stop();
    }
  };

  const handleFileUpload = (file: File) => {
    uploadMutation.mutate(file);
  };

  if (isLoading) return <PageSkeleton />;

  const analysis = selected?.analysis;
  const displayAnalysis = liveSummary?.videoAnalysis ?? analysis;

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <div className="flex gap-2 rounded-xl border border-border p-1">
          <Button variant={tab === 'live' ? 'default' : 'ghost'} size="sm" onClick={() => setTab('live')}>
            <Radio className="mr-2 h-4 w-4" /> Live on Camera
          </Button>
          <Button variant={tab === 'upload' ? 'default' : 'ghost'} size="sm" onClick={() => setTab('upload')}>
            <Upload className="mr-2 h-4 w-4" /> Upload Recording
          </Button>
        </div>
      </div>

      {tab === 'live' && !isLiveActive && !isComplete && (
        <Card>
          <CardHeader>
            <CardTitle>Start Live Video Interview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-text-muted">
              The AI will ask you questions on camera. Your full session is recorded and analyzed when you finish.
            </p>
            <DomainSelector
              domains={domains}
              value={domain}
              recommended={recommended}
              reason={reason}
              targetRole={targetRole}
              academicStream={academicStream}
              onChange={setDomain}
            />
            <Button loading={startingLive} onClick={startLiveInterview} size="lg">
              <Video className="mr-2 h-4 w-4" /> Start Live Interview
            </Button>
          </CardContent>
        </Card>
      )}

      {tab === 'live' && isLiveActive && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <Card className="xl:col-span-2 overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-error opacity-75" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-error" />
                </span>
                Live Camera
              </CardTitle>
              <Badge variant="secondary">
                Question {questionNumber} of {totalQuestions}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative aspect-video overflow-hidden rounded-xl bg-black">
                <video
                  ref={videoPreviewRef}
                  autoPlay
                  muted
                  playsInline
                  className="h-full w-full object-cover mirror"
                  style={{ transform: 'scaleX(-1)' }}
                />
                {isAnswering && (
                  <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-error/90 px-3 py-1 text-xs font-medium text-white">
                    <Mic className="h-3 w-3" /> Recording answer...
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
                <p className="mb-1 flex items-center gap-2 text-sm font-medium text-primary">
                  <Volume2 className="h-4 w-4" /> AI Question
                </p>
                <p className="text-lg">{question}</p>
              </div>

              <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <motion.div
                  animate={isAnswering ? { scale: [1, 1.05, 1] } : {}}
                  transition={{ repeat: isAnswering ? Infinity : 0, duration: 1 }}
                >
                  <Button
                    size="lg"
                    variant={isAnswering ? 'destructive' : 'default'}
                    disabled={isSubmitting}
                    onClick={isAnswering ? stopAnswerRecording : startAnswerRecording}
                    className="min-w-[200px]"
                  >
                    {isAnswering ? (
                      <>
                        <Square className="mr-2 h-4 w-4" /> Stop & Submit Answer
                      </>
                    ) : (
                      <>
                        <Mic className="mr-2 h-4 w-4" /> Record Answer
                      </>
                    )}
                  </Button>
                </motion.div>
              </div>

              <div className="space-y-3 border-t border-border pt-4">
                <p className="text-xs text-text-muted">Or type your answer if audio is unavailable:</p>
                <Input
                  value={textAnswer}
                  onChange={(e) => setTextAnswer(e.target.value)}
                  placeholder="Type your answer here..."
                  disabled={isSubmitting || isAnswering}
                />
                <Button
                  variant="secondary"
                  className="w-full"
                  disabled={!textAnswer.trim() || isSubmitting || isAnswering}
                  onClick={() => submitAnswer(undefined, textAnswer.trim())}
                >
                  Submit Text Answer
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Live Feedback</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="mb-2 text-sm font-medium">Your Answer</p>
                <div className="min-h-[120px] rounded-xl bg-surface-hover p-4 text-sm text-text-secondary">
                  {transcript || 'Your transcript will appear here after each answer...'}
                </div>
              </div>
              {feedback && (
                <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
                  <Badge className="mb-2">AI Feedback</Badge>
                  <p className="text-sm text-text-secondary">{feedback}</p>
                </div>
              )}
              {isSubmitting && (
                <p className="text-center text-sm text-text-muted">Analyzing your answer...</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {tab === 'live' && isComplete && liveSummary && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-2xl font-bold text-success">Live Interview Complete!</p>
              <p className="mt-2 text-text-muted">Overall score: {liveSummary.overallScore}%</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Interview Performance</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-6">
                <CircularProgress value={liveSummary.overallScore} size={120} />
                <div className="flex-1 space-y-2">
                  {[
                    { label: 'Communication', value: liveSummary.metrics.communication },
                    { label: 'Confidence', value: liveSummary.metrics.confidence },
                    { label: 'Clarity', value: liveSummary.metrics.clarity },
                    { label: 'Technical', value: liveSummary.metrics.technicalKnowledge },
                  ].map((m) => (
                    <div key={m.label}>
                      <div className="flex justify-between text-xs">
                        <span>{m.label}</span>
                        <span>{m.value}%</span>
                      </div>
                      <Progress value={m.value} className="h-1.5" />
                    </div>
                  ))}
                </div>
              </div>
              <p className="mt-4 text-sm text-text-secondary">{liveSummary.feedback}</p>
              {liveSummary.suggestions.length > 0 && (
                <ul className="mt-3 space-y-1 text-sm text-text-secondary">
                  {liveSummary.suggestions.map((s, i) => (
                    <li key={i}>• {s}</li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {liveSummary.videoAnalysis && (
            <Card>
              <CardHeader><CardTitle>Video Delivery Analysis</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center text-sm">
                  <div className="rounded-xl bg-surface-hover p-3">
                    <p className="text-text-muted">WPM</p>
                    <p className="text-xl font-bold">{liveSummary.videoAnalysis.wordsPerMinute}</p>
                  </div>
                  <div className="rounded-xl bg-surface-hover p-3">
                    <p className="text-text-muted">Filler Words</p>
                    <p className="text-xl font-bold">{liveSummary.videoAnalysis.fillerWordCount}</p>
                  </div>
                  <div className="rounded-xl bg-surface-hover p-3">
                    <p className="text-text-muted">Duration</p>
                    <p className="text-xl font-bold">{Math.round(liveSummary.videoAnalysis.durationSeconds)}s</p>
                  </div>
                </div>
                <p className="text-sm text-text-secondary">{liveSummary.videoAnalysis.feedback}</p>
              </CardContent>
            </Card>
          )}

          <Button onClick={resetLiveInterview}>Start New Live Interview</Button>
        </motion.div>
      )}

      {tab === 'upload' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader><CardTitle>Upload Recording</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
              <div>
                <label className="text-sm text-text-secondary">Domain</label>
                <select
                  className="mt-2 h-12 w-full rounded-xl border border-border bg-surface px-4 text-sm"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                >
                  {domains.map((d) => (
                    <option key={d.id} value={d.id}>{d.label}</option>
                  ))}
                </select>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
              />
              <Button
                className="w-full"
                loading={uploadMutation.isPending}
                onClick={() => fileRef.current?.click()}
              >
                <Upload className="mr-2 h-4 w-4" /> Upload Video
              </Button>
              <p className="text-xs text-text-muted">MP4, WebM, MOV · Max 50MB</p>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>Analysis Results</CardTitle></CardHeader>
            <CardContent>
              {!displayAnalysis ? (
                <div className="flex h-64 flex-col items-center justify-center text-text-muted">
                  <BarChart3 className="mb-4 h-12 w-12 opacity-30" />
                  <p>Upload a recording to see AI analysis</p>
                </div>
              ) : (
                <AnimatePresence>
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                    <div className="flex flex-wrap items-center gap-6">
                      <CircularProgress value={displayAnalysis.overallScore} size={120} />
                      <div className="flex-1 space-y-2">
                        {[
                          { label: 'Communication', value: displayAnalysis.communication },
                          { label: 'Confidence', value: displayAnalysis.confidence },
                          { label: 'Clarity', value: displayAnalysis.clarity },
                          { label: 'Structure', value: displayAnalysis.structure },
                        ].map((m) => (
                          <div key={m.label}>
                            <div className="flex justify-between text-xs">
                              <span>{m.label}</span>
                              <span>{m.value}%</span>
                            </div>
                            <Progress value={m.value} className="h-1.5" />
                          </div>
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-text-secondary">{displayAnalysis.feedback}</p>
                    <div>
                      <p className="mb-2 flex items-center gap-2 text-sm font-medium">
                        <Mic className="h-4 w-4" /> Transcript
                      </p>
                      <div className="max-h-40 overflow-y-auto rounded-xl bg-surface-hover p-4 text-sm text-text-secondary">
                        {displayAnalysis.transcript}
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {videos && videos.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Past Recordings</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {videos.map((v) => (
              <div
                key={v._id}
                className="flex cursor-pointer items-center justify-between rounded-xl border border-border p-3 hover:bg-surface-hover"
                onClick={() => { setTab('upload'); setSelected(v); }}
              >
                <div className="flex items-center gap-3">
                  <Play className="h-4 w-4 text-primary" />
                  <div>
                    <p className="font-medium">{v.title}</p>
                    <p className="text-xs text-text-muted">{v.domain} · {v.status}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {v.status === 'completed' && (
                    <Badge variant="success">{v.analysis.overallScore}%</Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(v._id); }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
