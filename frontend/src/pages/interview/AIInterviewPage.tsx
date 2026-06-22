import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MessageSquare, Mic, Video } from 'lucide-react';
import { interviewApi } from '@/services/endpoints';
import { Button } from '@/components/ui/button';
import { PageSkeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { getStreamLabel, isTechStream } from '@/lib/academicStreams';
import { TextInterviewMode } from '@/components/interview/TextInterviewMode';
import { VoiceInterviewMode } from '@/components/interview/VoiceInterviewMode';
import { VideoInterviewMode } from '@/components/interview/VideoInterviewMode';

type InterviewMode = 'text' | 'voice' | 'video';

const MODES: Array<{ id: InterviewMode; label: string; icon: React.ElementType; description: string }> = [
  { id: 'text', label: 'Text', icon: MessageSquare, description: 'Type answers to AI questions' },
  { id: 'voice', label: 'Voice', icon: Mic, description: 'Speak your answers with live feedback' },
  { id: 'video', label: 'Video', icon: Video, description: 'Live AI mock interview with camera — like Internshala screening' },
];

export default function AIInterviewPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const modeParam = searchParams.get('mode') as InterviewMode | null;
  const [mode, setMode] = useState<InterviewMode>(
    modeParam && MODES.some((m) => m.id === modeParam) ? modeParam : 'text'
  );

  const { data: domainData, isLoading } = useQuery({
    queryKey: ['interview-domains'],
    queryFn: async () => (await interviewApi.getDomains()).data.data,
  });

  useEffect(() => {
    if (modeParam && MODES.some((m) => m.id === modeParam)) {
      setMode(modeParam);
    }
  }, [modeParam]);

  const selectMode = (next: InterviewMode) => {
    setMode(next);
    setSearchParams({ mode: next }, { replace: true });
  };

  if (isLoading || !domainData) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">AI Interview</h1>
        <p className="text-text-muted">
          Practice {isTechStream(domainData.academicStream) ? 'technical and HR' : 'domain-specific and HR'} interviews via text, voice, or video
          {domainData.academicStream && (
            <span> · {getStreamLabel(domainData.academicStream)}</span>
          )}
        </p>
      </div>

      <div className="flex flex-wrap gap-2 rounded-xl border border-border p-1">
        {MODES.map((item) => (
          <Button
            key={item.id}
            variant={mode === item.id ? 'default' : 'ghost'}
            size="sm"
            className={cn('min-w-[120px] flex-1')}
            onClick={() => selectMode(item.id)}
          >
            <item.icon className="mr-2 h-4 w-4" />
            {item.label}
          </Button>
        ))}
      </div>

      <p className="text-sm text-text-muted">{MODES.find((m) => m.id === mode)?.description}</p>

      {mode === 'text' && <TextInterviewMode {...domainData} />}
      {mode === 'voice' && <VoiceInterviewMode {...domainData} />}
      {mode === 'video' && (
        <VideoInterviewMode {...domainData} jobId={searchParams.get('jobId') ?? undefined} />
      )}
    </div>
  );
}
