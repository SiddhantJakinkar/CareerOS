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

/** Min gap between JSearch calls (OpenWeb Ninja free tier is strict on RPM). */
const MIN_REQUEST_INTERVAL_MS = 3_000;
/** After a 429, pause all JSearch calls for this long. */
const RATE_LIMIT_COOLDOWN_MS = 15 * 60 * 1000;

let lastRequestAt = 0;
let cooldownUntil = 0;
let cooldownLogged = false;

function isOpenWebNinjaKey(apiKey: string): boolean {
  return apiKey.startsWith('ak_');
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isJSearchRateLimited(): boolean {
  return Date.now() < cooldownUntil;
}

function enterRateLimitCooldown(retryAfterSeconds?: number): void {
  const cooldownMs = retryAfterSeconds
    ? Math.max(retryAfterSeconds * 1000, MIN_REQUEST_INTERVAL_MS)
    : RATE_LIMIT_COOLDOWN_MS;
  cooldownUntil = Date.now() + cooldownMs;
  if (!cooldownLogged) {
    cooldownLogged = true;
    logger.warn('JSearch rate limit hit — pausing JSearch fetches', {
      cooldownMinutes: Math.round(cooldownMs / 60_000),
    });
  }
}

async function throttleJSearch(): Promise<void> {
  if (isJSearchRateLimited()) return;

  const now = Date.now();
  const waitMs = MIN_REQUEST_INTERVAL_MS - (now - lastRequestAt);
  if (waitMs > 0) {
    await delay(waitMs);
  }
  lastRequestAt = Date.now();
}

export async function searchJSearchJobs(options: JSearchSearchOptions): Promise<JSearchJob[]> {
  const apiKey = env.JSEARCH_API_KEY;
  if (!apiKey) return [];

  if (isJSearchRateLimited()) {
    return [];
  }

  const params = new URLSearchParams();
  params.set('query', options.query);
  params.set('page', '1');
  params.set('num_pages', String(options.numPages ?? 1));
  params.set('country', options.country ?? 'in');
  params.set('date_posted', options.datePosted ?? 'month');
  if (options.workFromHome === true) {
    params.set('work_from_home', 'true');
  } else if (options.workFromHome === false) {
    params.set('work_from_home', 'false');
  }

  try {
    await throttleJSearch();

    if (isOpenWebNinjaKey(apiKey)) {
      const url = `https://api.openwebninja.com/jsearch/search?${params.toString()}`;
      const response = await fetch(url, { headers: { 'x-api-key': apiKey } });
      if (response.status === 429) {
        const retryAfter = Number(response.headers.get('retry-after'));
        enterRateLimitCooldown(Number.isFinite(retryAfter) ? retryAfter : undefined);
        return [];
      }
      if (!response.ok) {
        const body = await response.text();
        logger.warn('OpenWeb Ninja JSearch request failed', {
          status: response.status,
          body: body.slice(0, 200),
        });
        return [];
      }
      cooldownLogged = false;
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
    if (response.status === 429) {
      const retryAfter = Number(response.headers.get('retry-after'));
      enterRateLimitCooldown(Number.isFinite(retryAfter) ? retryAfter : undefined);
      return [];
    }
    if (!response.ok) {
      const body = await response.text();
      logger.warn('RapidAPI JSearch request failed', { status: response.status, body: body.slice(0, 200) });
      return [];
    }
    cooldownLogged = false;
    const data = (await response.json()) as { data?: JSearchJob[] };
    return data.data ?? [];
  } catch (error) {
    logger.error('JSearch search failed', { error });
    return [];
  }
}
