import type { IProfile } from '../models/Profile.js';
import {
  getAllSkillsFromProfile,
  getDefaultTargetRole,
  getDomainsForStream,
  getStreamLabel,
  type AcademicStreamId,
} from './academicStreams.js';

export const INTERVIEW_DOMAINS = [
  { id: 'hr', label: 'HR / Behavioral', description: 'Communication, teamwork, and situational questions', keywords: ['hr', 'behavioral', 'communication'], streams: ['all'] },
  { id: 'aptitude', label: 'Aptitude & Reasoning', description: 'Logical, quantitative, and verbal aptitude', keywords: ['aptitude', 'reasoning', 'quantitative', 'verbal'], streams: ['all'] },
  { id: 'general_knowledge', label: 'General Knowledge', description: 'Current affairs and domain fundamentals', keywords: ['general', 'gk', 'current affairs'], streams: ['science', 'healthcare', 'other'] },
  { id: 'communication', label: 'Communication Skills', description: 'Presentation, writing, and interpersonal skills', keywords: ['communication', 'presentation', 'writing'], streams: ['arts', 'other'] },
  { id: 'business', label: 'Business & Management', description: 'Case studies, operations, and management basics', keywords: ['business', 'management', 'mba', 'operations'], streams: ['management', 'commerce'] },
  { id: 'marketing', label: 'Marketing', description: 'Branding, digital marketing, and market analysis', keywords: ['marketing', 'brand', 'digital marketing', 'sales'], streams: ['commerce', 'management'] },
  { id: 'finance', label: 'Finance', description: 'Financial analysis, markets, and corporate finance', keywords: ['finance', 'investment', 'banking', 'financial'], streams: ['commerce', 'management'] },
  { id: 'accounts', label: 'Accounts & Taxation', description: 'Accounting principles, GST, audit, and compliance', keywords: ['account', 'tax', 'audit', 'gst', 'ca', 'bookkeeping'], streams: ['commerce'] },
  { id: 'legal', label: 'Legal Interview', description: 'Legal reasoning, case analysis, and statutes', keywords: ['legal', 'law', 'llb', 'litigation', 'corporate law'], streams: ['law'] },
  { id: 'research', label: 'Research & Science', description: 'Scientific method, lab work, and research aptitude', keywords: ['research', 'science', 'lab', 'biology', 'chemistry', 'physics'], streams: ['science'] },
  { id: 'healthcare', label: 'Healthcare & Nursing', description: 'Patient care, clinical knowledge, and ethics', keywords: ['nursing', 'healthcare', 'clinical', 'medical', 'patient'], streams: ['healthcare'] },
  { id: 'content', label: 'Content & Media', description: 'Writing, editing, journalism, and media skills', keywords: ['content', 'media', 'journalism', 'writing', 'editor'], streams: ['arts'] },
  { id: 'design', label: 'Design & Creative', description: 'Creative thinking, design principles, and portfolios', keywords: ['design', 'creative', 'ui', 'ux', 'graphic'], streams: ['arts'] },
  { id: 'civil', label: 'Civil Engineering', description: 'Structures, construction, and site fundamentals', keywords: ['civil', 'construction', 'structural', 'survey'], streams: ['engineering'] },
  { id: 'mechanical', label: 'Mechanical Engineering', description: 'Thermodynamics, machines, and manufacturing', keywords: ['mechanical', 'manufacturing', 'cad', 'automobile'], streams: ['engineering'] },
  { id: 'electrical', label: 'Electrical Engineering', description: 'Circuits, power systems, and electronics', keywords: ['electrical', 'electronics', 'power', 'circuit'], streams: ['engineering'] },
  { id: 'java', label: 'Java', description: 'OOP, collections, and backend fundamentals', keywords: ['java', 'spring', 'backend'], streams: ['engineering'] },
  { id: 'python', label: 'Python', description: 'Python syntax, libraries, and problem solving', keywords: ['python', 'django', 'data'], streams: ['engineering'] },
  { id: 'react', label: 'React', description: 'Components, hooks, and frontend patterns', keywords: ['react', 'frontend', 'javascript'], streams: ['engineering'] },
  { id: 'nodejs', label: 'Node.js', description: 'APIs, async patterns, and backend JS', keywords: ['node', 'nodejs', 'express'], streams: ['engineering'] },
  { id: 'spring_boot', label: 'Spring Boot', description: 'REST APIs and microservices', keywords: ['spring boot', 'springboot', 'microservice'], streams: ['engineering'] },
  { id: 'aiml', label: 'AI / ML', description: 'ML basics and data science concepts', keywords: ['machine learning', 'ai', 'ml', 'data science'], streams: ['engineering'] },
  { id: 'hr_advanced', label: 'HR (Advanced)', description: 'HR policies, recruitment, and organizational behavior', keywords: ['human resource', 'recruitment', 'hr manager'], streams: ['management'] },
] as const;

export type InterviewDomainId = (typeof INTERVIEW_DOMAINS)[number]['id'];

export const INTERVIEW_DOMAIN_IDS = INTERVIEW_DOMAINS.map((d) => d.id) as [
  InterviewDomainId,
  ...InterviewDomainId[],
];

export const DOMAIN_LABELS: Record<InterviewDomainId, string> = Object.fromEntries(
  INTERVIEW_DOMAINS.map((d) => [d.id, d.label])
) as Record<InterviewDomainId, string>;

function profileHaystack(profile: IProfile | null): string {
  const targetRole = profile?.careerPreferences?.targetRole?.trim() ?? '';
  const branch = profile?.education?.branch?.trim() ?? '';
  const degree = profile?.education?.degree?.trim() ?? '';
  const skillText = getAllSkillsFromProfile(profile).join(' ').toLowerCase();
  return `${targetRole} ${branch} ${degree} ${skillText}`.toLowerCase();
}

export function getDomainsForProfile(profile: IProfile | null) {
  const stream = (profile?.academicStream ?? 'other') as AcademicStreamId;
  const allowedIds = new Set(getDomainsForStream(stream));

  return INTERVIEW_DOMAINS.filter((d) => allowedIds.has(d.id)).map(({ id, label, description }) => ({
    id,
    label,
    description,
  }));
}

export function inferInterviewDomain(profile: IProfile | null): {
  domain: InterviewDomainId;
  reason: string;
} {
  const haystack = profileHaystack(profile);
  const stream = profile?.academicStream ?? 'other';
  const allowedIds = new Set(getDomainsForStream(stream));
  const candidates = INTERVIEW_DOMAINS.filter((d) => allowedIds.has(d.id) && d.id !== 'hr');

  for (const domain of candidates) {
    for (const keyword of domain.keywords) {
      if (haystack.includes(keyword)) {
        return {
          domain: domain.id,
          reason: profile?.careerPreferences?.targetRole
            ? `Matched to your target role "${profile.careerPreferences.targetRole}" and ${getStreamLabel(stream)} background`
            : `Matched to your ${getStreamLabel(stream)} profile and skills`,
        };
      }
    }
  }

  const streamDefault = getDomainsForStream(stream).find((id) => id !== 'hr') ?? 'aptitude';
  return {
    domain: streamDefault as InterviewDomainId,
    reason: profile?.careerPreferences?.targetRole
      ? `Recommended for ${getStreamLabel(stream)} students targeting "${profile.careerPreferences.targetRole}"`
      : `Recommended starting domain for ${getStreamLabel(stream)} students`,
  };
}

export function getInterviewDomainsPayload(profile: IProfile | null) {
  const { domain, reason } = inferInterviewDomain(profile);
  return {
    domains: getDomainsForProfile(profile),
    recommended: domain,
    reason,
    targetRole: profile?.careerPreferences?.targetRole ?? null,
    academicStream: profile?.academicStream ?? 'other',
    defaultTargetRole: getDefaultTargetRole(profile?.academicStream),
  };
}

/** Pick the best interview domain from a job posting's title, description, and skills. */
export function inferInterviewDomainFromJob(job: {
  title: string;
  description: string;
  skills?: string[];
}): InterviewDomainId {
  const haystack = `${job.title} ${job.description} ${(job.skills ?? []).join(' ')}`.toLowerCase();

  let best: InterviewDomainId = 'hr';
  let bestScore = 0;

  for (const domain of INTERVIEW_DOMAINS) {
    let score = 0;
    for (const keyword of domain.keywords) {
      if (haystack.includes(keyword)) score += 1;
    }
    if (score > bestScore) {
      bestScore = score;
      best = domain.id;
    }
  }

  if (bestScore > 0) return best;

  if (/software|developer|engineer|programmer|full[\s-]?stack|frontend|backend|devops|sde|intern/i.test(haystack)) {
    if (haystack.includes('python') || haystack.includes('django')) return 'python';
    if (haystack.includes('java') || haystack.includes('spring')) return 'java';
    if (haystack.includes('react') || haystack.includes('frontend')) return 'react';
    if (haystack.includes('node')) return 'nodejs';
    return 'python';
  }

  return 'hr';
}
