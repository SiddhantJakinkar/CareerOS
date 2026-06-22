import { Interview } from '../models/Interview.js';
import { Report } from '../models/Report.js';
import { Profile } from '../models/Profile.js';
import {
  createNotification,
  updatePlacementReadiness,
} from '../services/recommendation.service.js';
import {
  DOMAIN_LABELS,
  type InterviewDomainId,
} from '../constants/interviewDomains.js';

const DOMAIN_LABELS_MAP = DOMAIN_LABELS;

export async function finalizeInterview(
  userId: string,
  interview: InstanceType<typeof Interview>,
  notificationTitle = 'Interview Complete'
): Promise<void> {
  const domainLabel =
    DOMAIN_LABELS_MAP[interview.domain as InterviewDomainId] ?? interview.domain;
  const title =
    interview.type === 'live' && interview.liveMeta?.jobTitle
      ? interview.liveMeta.companyName
        ? `${interview.liveMeta.companyName} — ${interview.liveMeta.jobTitle}`
        : interview.liveMeta.jobTitle
      : interview.type === 'live' && interview.liveMeta?.companyName
        ? `${interview.liveMeta.companyName} — ${domainLabel} Interview`
        : `${domainLabel} Interview Report`;

  await Report.create({
    userId,
    type: 'interview',
    title,
    data: {
      metrics: interview.metrics,
      overallScore: interview.overallScore,
      interviewId: interview._id,
      interviewType: interview.type,
      companyName: interview.liveMeta?.companyName,
      jobTitle: interview.liveMeta?.jobTitle,
    },
    score: interview.overallScore,
  });

  await Profile.findOneAndUpdate({ userId }, { interviewScore: interview.overallScore });
  await updatePlacementReadiness(userId);
  await createNotification(
    userId,
    notificationTitle,
    `Your score: ${interview.overallScore}%`,
    'interview',
    '/ai-interview?mode=video'
  );
}
