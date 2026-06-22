import type { IProfile } from '../models/Profile.js';

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

export const ACADEMIC_STREAM_IDS = ACADEMIC_STREAMS.map((s) => s.id) as [
  AcademicStreamId,
  ...AcademicStreamId[],
];

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

export function getAllSkillsFromProfile(profile: IProfile | null): string[] {
  if (!profile?.skills) return [];
  return [
    ...profile.skills.languages,
    ...profile.skills.frameworks,
    ...profile.skills.databases,
    ...profile.skills.tools,
    ...profile.skills.certifications,
  ];
}

export function getReadinessFactors(stream?: string | null): string {
  if (isTechStream(stream)) {
    return 'ATS, coding, interview, and job match scores';
  }
  return 'ATS, aptitude, interview, and job match scores';
}

/** Weights for placement readiness: ats, assessment (codingScore field), interview, jobMatch */
export function getReadinessWeights(stream?: string | null) {
  if (isTechStream(stream)) {
    return { ats: 0.3, assessment: 0.25, interview: 0.25, jobMatch: 0.2 };
  }
  return { ats: 0.35, assessment: 0.2, interview: 0.25, jobMatch: 0.2 };
}

export function getAssessmentCategoriesForStream(stream?: string | null): string[] {
  const universal = ['aptitude', 'verbal', 'quantitative'];
  switch (stream) {
    case 'engineering':
      return [...universal, 'dsa', 'java', 'python', 'sql', 'javascript'];
    case 'commerce':
      return [...universal, 'business', 'finance'];
    case 'management':
      return [...universal, 'business', 'finance'];
    case 'arts':
      return [...universal, 'communication', 'verbal'];
    case 'science':
      return [...universal, 'research', 'quantitative'];
    case 'law':
      return [...universal, 'legal', 'verbal'];
    case 'healthcare':
      return [...universal, 'healthcare', 'verbal'];
    default:
      return [...universal, 'business', 'dsa', 'java', 'python'];
  }
}

export function getAssessmentFocusAreas(stream?: string | null, targetRole?: string | null): string[] {
  const role = targetRole?.trim() || getDefaultTargetRole(stream);
  switch (stream) {
    case 'engineering':
      return ['Data structures & algorithms', 'Programming fundamentals', 'Aptitude & logic', role];
    case 'commerce':
      return ['Quantitative aptitude', 'Accounts & finance basics', 'Business reasoning', role];
    case 'management':
      return ['Case-style reasoning', 'Business aptitude', 'Verbal ability', role];
    case 'arts':
      return ['Verbal & communication', 'Reading comprehension', 'General aptitude', role];
    case 'science':
      return ['Scientific reasoning', 'Quantitative analysis', 'Research aptitude', role];
    case 'law':
      return ['Legal reasoning', 'Reading comprehension', 'Analytical aptitude', role];
    case 'healthcare':
      return ['Clinical knowledge basics', 'Ethics & communication', 'Aptitude', role];
    default:
      return ['Aptitude', 'Verbal ability', 'Domain fundamentals', role];
  }
}

export function getDomainsForStream(stream?: string | null): string[] {
  const universal = ['hr', 'aptitude'];
  switch (stream) {
    case 'engineering':
      return [...universal, 'java', 'python', 'react', 'nodejs', 'spring_boot', 'aiml', 'civil', 'mechanical', 'electrical'];
    case 'commerce':
      return [...universal, 'finance', 'accounts', 'marketing', 'business'];
    case 'management':
      return [...universal, 'business', 'marketing', 'finance', 'hr_advanced'];
    case 'arts':
      return [...universal, 'content', 'design', 'communication'];
    case 'science':
      return [...universal, 'research', 'general_knowledge'];
    case 'law':
      return [...universal, 'legal'];
    case 'healthcare':
      return [...universal, 'healthcare', 'general_knowledge'];
    default:
      return [
        ...universal,
        'business',
        'finance',
        'marketing',
        'general_knowledge',
        'communication',
        'java',
        'python',
      ];
  }
}
