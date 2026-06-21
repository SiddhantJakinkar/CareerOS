import { useEffect, useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import { interviewApi, voiceApi } from '@/services/endpoints';
import { getErrorMessage } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { DomainSelector } from '@/components/interview/DomainSelector';
import type { InterviewDomainsData } from '@/components/interview/DomainSelector';

export function VoiceInterviewMode({ domains, recommended, reason, targetRole, academicStream }: InterviewDomainsData) {
  const [domain, setDomain] = useState(recommended);
  const [interviewId, setInterviewId] = useState('');
  const [question, setQuestion] = useState('');
  const [transcript, setTranscript] = useState('');
  const [feedback, setFeedback] = useState('');
  const [textAnswer, setTextAnswer] = useState('');
  const [recording, setRecording] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);

  useEffect(() => {
    setDomain(recommended);
  }, [recommended]);

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      speechSynthesis.speak(utterance);
    }
  };

  const startMutation = useMutation({
    mutationFn: () => interviewApi.start(domain, 'voice'),
    onSuccess: (res) => {
      const data = res.data.data;
      setInterviewId(data.interview._id);
      setQuestion(data.currentQuestion);
      speak(data.currentQuestion);
      toast.success('Voice interview started');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const submitAnswer = async (blob?: Blob, answerText?: string) => {
    try {
      const res = await voiceApi.evaluate(interviewId, blob, answerText);
      const data = res.data.data;
      setTranscript(data.transcript);
      setFeedback(data.evaluation.feedback);
      setTextAnswer('');
      if (data.isComplete) {
        setIsComplete(true);
        toast.success('Interview complete!');
      } else {
        setQuestion(data.nextQuestion);
        speak(data.nextQuestion);
      }
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      chunks.current = [];

      mediaRecorder.current.ondataavailable = (e) => chunks.current.push(e.data);
      mediaRecorder.current.onstop = async () => {
        const blob = new Blob(chunks.current, { type: 'audio/webm' });
        await submitAnswer(blob);
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.current.start();
      setRecording(true);
    } catch {
      toast.error('Microphone access denied');
    }
  };

  const stopRecording = () => {
    mediaRecorder.current?.stop();
    setRecording(false);
  };

  useEffect(() => () => speechSynthesis.cancel(), []);

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
              Start Voice Interview
            </Button>
          </CardContent>
        </Card>
      )}

      {interviewId && !isComplete && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Volume2 className="h-5 w-5 text-primary" /> AI Question
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg">{question}</p>
              <div className="mt-8 flex flex-col items-center">
                <motion.div
                  animate={recording ? { scale: [1, 1.2, 1] } : {}}
                  transition={{ repeat: recording ? Infinity : 0, duration: 1 }}
                  className={`rounded-full p-8 ${recording ? 'bg-error/20 shadow-lg shadow-error/30' : 'bg-primary/20'}`}
                >
                  <Button
                    size="icon"
                    variant={recording ? 'destructive' : 'default'}
                    className="h-16 w-16 rounded-full"
                    onClick={recording ? stopRecording : startRecording}
                  >
                    {recording ? <MicOff className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
                  </Button>
                </motion.div>
                <p className="mt-4 text-sm text-text-muted">
                  {recording ? 'Recording... Click to stop' : 'Click to answer'}
                </p>
              </div>
              <div className="mt-6 space-y-3 border-t border-border pt-4">
                <p className="text-xs text-text-muted">Or type your answer if the microphone is unavailable:</p>
                <Input
                  value={textAnswer}
                  onChange={(e) => setTextAnswer(e.target.value)}
                  placeholder="Type your answer here..."
                />
                <Button
                  variant="secondary"
                  className="w-full"
                  disabled={!textAnswer.trim()}
                  onClick={() => submitAnswer(undefined, textAnswer.trim())}
                >
                  Submit Text Answer
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Live Transcript</CardTitle></CardHeader>
            <CardContent>
              <div className="min-h-[100px] rounded-xl bg-surface-hover p-4 text-sm">
                {transcript || 'Your answer will appear here...'}
              </div>
              {feedback && (
                <div className="mt-4 rounded-xl border border-primary/30 bg-primary/5 p-4">
                  <Badge className="mb-2">AI Feedback</Badge>
                  <p className="text-sm text-text-secondary">{feedback}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {isComplete && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-2xl font-bold text-success">Interview Complete!</p>
            <Button className="mt-4" onClick={() => { setInterviewId(''); setIsComplete(false); setTranscript(''); }}>
              Start New Interview
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
