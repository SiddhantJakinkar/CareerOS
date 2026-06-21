import { INDIA_CITIES } from './indiaJobs.js';

/** Job categories searched on every sync cycle (India-focused, all streams). */
export const JOB_CATEGORIES = [
  { category: 'internship', queries: ['internship', 'summer internship', 'winter internship'] },
  { category: 'engineering', queries: ['software engineer', 'full stack developer', 'backend developer', 'frontend developer', 'devops engineer', 'data engineer'] },
  { category: 'data', queries: ['data analyst', 'data scientist', 'business analyst', 'machine learning engineer'] },
  { category: 'finance', queries: ['accounts executive', 'finance analyst', 'chartered accountant', 'banking jobs'] },
  { category: 'marketing', queries: ['digital marketing', 'marketing executive', 'content marketing', 'SEO specialist'] },
  { category: 'sales', queries: ['sales executive', 'business development', 'inside sales', 'field sales'] },
  { category: 'hr', queries: ['HR executive', 'recruiter', 'talent acquisition'] },
  { category: 'legal', queries: ['legal associate', 'corporate lawyer', 'legal intern'] },
  { category: 'healthcare', queries: ['nursing jobs', 'pharmacist', 'medical officer', 'healthcare assistant'] },
  { category: 'design', queries: ['UI UX designer', 'graphic designer', 'product designer'] },
  { category: 'operations', queries: ['operations executive', 'supply chain', 'logistics coordinator'] },
  { category: 'fresher', queries: ['fresher graduate', 'graduate trainee', 'campus placement', 'entry level jobs'] },
  { category: 'management', queries: ['management trainee', 'MBA fresher', 'project manager'] },
  { category: 'civil', queries: ['civil engineer', 'site engineer', 'structural engineer'] },
  { category: 'mechanical', queries: ['mechanical engineer', 'production engineer', 'maintenance engineer'] },
  { category: 'electrical', queries: ['electrical engineer', 'electronics engineer'] },
  { category: 'content', queries: ['content writer', 'copywriter', 'technical writer'] },
  { category: 'customer', queries: ['customer support', 'call center', 'customer success'] },
] as const;

export const PRIMARY_SYNC_CITIES = [
  'Bangalore',
  'Mumbai',
  'Delhi',
  'Hyderabad',
  'Pune',
  'Chennai',
  'Kolkata',
  'Gurgaon',
  'Noida',
  'Ahmedabad',
] as const;

/** Queries processed per 30-min cron run (rotating batch to respect API limits). */
export const SYNC_BATCH_SIZE = 12;

/** Work-mode focused queries rotated into each sync batch. */
export const WORK_MODE_SYNC_QUERIES = [
  'onsite jobs Bangalore',
  'hybrid jobs Mumbai',
  'office jobs Delhi',
  'onsite internship Hyderabad',
  'hybrid software engineer Pune',
  'onsite marketing executive Chennai',
  'office jobs Gurgaon',
  'hybrid data analyst Noida',
  'onsite fresher jobs Ahmedabad',
  'hybrid HR executive Kolkata',
] as const;

export function buildScheduledSearchQueries(): string[] {
  const queries = new Set<string>();

  for (const { queries: roleQueries } of JOB_CATEGORIES) {
    for (const role of roleQueries) {
      queries.add(`${role} India`);
      for (const city of PRIMARY_SYNC_CITIES) {
        queries.add(`${role} ${city}`);
        queries.add(`onsite ${role} ${city}`);
        queries.add(`hybrid ${role} ${city}`);
      }
    }
  }

  for (const city of INDIA_CITIES.slice(0, 15)) {
    queries.add(`jobs ${city}`);
    queries.add(`onsite jobs ${city}`);
    queries.add(`hybrid jobs ${city}`);
  }

  for (const query of WORK_MODE_SYNC_QUERIES) {
    queries.add(query);
  }

  return [...queries];
}
