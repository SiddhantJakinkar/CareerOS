import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export interface JSearchJob {
  job_id: string;
  job_title: string;
  employer_name: string;
  job_city?: string;
  job_state?: string;
  job_country?: string;
  job_description: string;
  job_employment_type: string;
  job_is_remote?: boolean | null;
  job_apply_link: string;
  job_posted_at_datetime_utc: string;
  job_min_salary?: number;
  job_max_salary?: number;
  job_publisher?: string;
}

export interface JSearchSearchOptions {
  query: string;
  country?: string;
  numPages?: number;
  datePosted?: 'all' | 'today' | '3days' | 'week' | 'month';
  workFromHome?: boolean;
}

function isOpenWebNinjaKey(apiKey: string): boolean {
  return apiKey.startsWith('ak_');
}

export async function searchJSearchJobs(options: JSearchSearchOptions): Promise<JSearchJob[]> {
  const apiKey = env.JSEARCH_API_KEY;
  if (!apiKey) return [];

  const params = new URLSearchParams();
  params.set('query', options.query);
  params.set('page', '1');
  params.set('num_pages', String(options.numPages ?? 2));
  params.set('country', options.country ?? 'in');
  params.set('date_posted', options.datePosted ?? 'month');
  if (options.workFromHome === true) {
    params.set('work_from_home', 'true');
  } else if (options.workFromHome === false) {
    params.set('work_from_home', 'false');
  }

  try {
    if (isOpenWebNinjaKey(apiKey)) {
      const url = `https://api.openwebninja.com/jsearch/search?${params.toString()}`;
      const response = await fetch(url, { headers: { 'x-api-key': apiKey } });
      if (!response.ok) {
        const body = await response.text();
        logger.warn('OpenWeb Ninja JSearch request failed', { status: response.status, body: body.slice(0, 200) });
        return [];
      }
      const data = (await response.json()) as { data?: JSearchJob[] };
      return data.data ?? [];
    }

    const url = `https://jsearch.p.rapidapi.com/search?${params.toString()}`;
    const response = await fetch(url, {
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'jsearch.p.rapidapi.com',
      },
    });
    if (!response.ok) {
      const body = await response.text();
      logger.warn('RapidAPI JSearch request failed', { status: response.status, body: body.slice(0, 200) });
      return [];
    }
    const data = (await response.json()) as { data?: JSearchJob[] };
    return data.data ?? [];
  } catch (error) {
    logger.error('JSearch search failed', { error });
    return [];
  }
}
