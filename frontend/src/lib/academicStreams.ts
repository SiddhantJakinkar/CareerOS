export const ACADEMIC_STREAMS = [
  { id: 'engineering', label: 'Engineering & Technology', defaultRole: 'Graduate Engineer Trainee' },
  { id: 'commerce', label: 'Commerce & Accounting', defaultRole: 'Accounts Executive' },
  { id: 'management', label: 'Management & MBA', defaultRole: 'Management Trainee' },
  { id: 'arts', label: 'Arts & Humanities', defaultRole: 'Content / Communications Executive' },
  { id: 'science', label: 'Science & Research', defaultRole: 'Research / Lab Associate' },
  { id: 'law', label: 'Law & Legal Studies', defaultRole: 'Legal Associate' },
  { id: 'healthcare', label: 'Healthcare & Nursing', defaultRole: 'Healthcare Associate' },
  { id: 'other', label: 'Other / Interdisciplinary', defaultRole: 'Graduate Trainee' },
] as const;

export type AcademicStreamId = (typeof ACADEMIC_STREAMS)[number]['id'];

export function getStreamLabel(stream?: string | null): string {
  return ACADEMIC_STREAMS.find((s) => s.id === stream)?.label ?? 'All Streams';
}

export function getDefaultTargetRole(stream?: string | null): string {
  return ACADEMIC_STREAMS.find((s) => s.id === stream)?.defaultRole ?? 'Graduate Trainee';
}

export function isTechStream(stream?: string | null): boolean {
  return stream === 'engineering';
}

export function getSkillFieldLabels(stream?: string | null) {
  switch (stream) {
    case 'engineering':
      return {
        languages: 'Programming Languages',
        frameworks: 'Frameworks & Libraries',
        databases: 'Databases',
        tools: 'Tools & Platforms',
      };
    case 'commerce':
      return {
        languages: 'Core Subjects (e.g. Accounting, Economics)',
        frameworks: 'Specializations (e.g. Taxation, Audit)',
        databases: 'Software / ERP (e.g. Tally, SAP)',
        tools: 'Certifications & Skills',
      };
    case 'management':
      return {
        languages: 'Business Skills (e.g. Strategy, Operations)',
        frameworks: 'Domain Knowledge (e.g. HR, Marketing)',
        databases: 'Analytics / BI Tools',
        tools: 'Certifications (e.g. Six Sigma, PMP)',
      };
    case 'arts':
      return {
        languages: 'Core Skills (e.g. Writing, Communication)',
        frameworks: 'Areas of Interest (e.g. Media, Design)',
        databases: 'Creative / Research Tools',
        tools: 'Certifications & Portfolios',
      };
    case 'science':
      return {
        languages: 'Core Subjects (e.g. Physics, Chemistry, Biology)',
        frameworks: 'Research / Lab Areas',
        databases: 'Lab & Analysis Tools',
        tools: 'Certifications & Techniques',
      };
    case 'law':
      return {
        languages: 'Legal Domains (e.g. Corporate, Criminal)',
        frameworks: 'Practice Areas',
        databases: 'Legal Research Tools',
        tools: 'Certifications & Moot Skills',
      };
    case 'healthcare':
      return {
        languages: 'Clinical / Core Skills',
        frameworks: 'Specializations',
        databases: 'Healthcare Systems / Tools',
        tools: 'Certifications & Licenses',
      };
    default:
      return {
        languages: 'Core Skills & Subjects',
        frameworks: 'Specializations',
        databases: 'Tools & Software',
        tools: 'Certifications',
      };
  }
}

export function getAssessmentScoreLabel(stream?: string | null): string {
  return isTechStream(stream) ? 'Coding Score' : 'Aptitude Score';
}

export function getReadinessFactors(stream?: string | null): string {
  if (isTechStream(stream)) {
    return 'ATS, coding, interview, and job match scores';
  }
  return 'ATS, aptitude, interview, and job match scores';
}

export function getAssessmentNavLabel(stream?: string | null): string {
  return isTechStream(stream) ? 'Coding Assessment' : 'Aptitude & Assessments';
}

export function getSuggestedPrompts(stream?: string | null): string[] {
  const roleHint = isTechStream(stream)
    ? 'backend role'
    : stream === 'commerce'
      ? 'accounts or finance role'
      : stream === 'management'
        ? 'management trainee role'
        : stream === 'law'
          ? 'legal associate role'
          : stream === 'healthcare'
            ? 'healthcare role'
            : 'my target role';

  return [
    'How can I improve my ATS score?',
    `What skills should I learn for a ${roleHint}?`,
    isTechStream(stream)
      ? 'Help me prepare for a technical interview'
      : 'Help me prepare for HR and domain interviews',
    'Review my placement readiness strategy',
    isTechStream(stream)
      ? 'How do I tailor my resume for top companies?'
      : 'How do I tailor my resume for campus placements?',
  ];
}

export function getAssessmentPageTitle(stream?: string | null): string {
  return isTechStream(stream) ? 'Coding Assessment' : 'Aptitude & Assessments';
}

export function getAssessmentPerformanceLabel(stream?: string | null): string {
  return isTechStream(stream) ? 'Coding Performance' : 'Assessment Performance';
}
