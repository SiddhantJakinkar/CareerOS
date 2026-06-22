import { LiveMockInterview } from '@/components/interview/LiveMockInterview';
import type { InterviewDomainsData } from '@/components/interview/DomainSelector';

interface VideoInterviewModeProps extends InterviewDomainsData {
  jobId?: string;
}

export function VideoInterviewMode({ jobId, ...props }: VideoInterviewModeProps) {
  return <LiveMockInterview {...props} jobId={jobId} />;
}
