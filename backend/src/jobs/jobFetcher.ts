import { env } from '../config/env.js';
import { Job } from '../models/Job.js';
import { JobSyncLog } from '../models/JobSyncLog.js';
import { logger } from '../utils/logger.js';
import { sanitizeForAI } from '../utils/sanitize.js';
import { getDefaultTargetRole } from '../constants/academicStreams.js';
import {
  isIndiaJob,
  normalizeIndiaLocation,
} from '../constants/indiaJobs.js';
import {
  buildScheduledSearchQueries,
  SYNC_BATCH_SIZE,
} from '../constants/jobCategories.js';
import { inferJobPublisher } from './jobPublisher.js';
import { searchJSearchJobs } from './jsearchClient.js';
import { acceptIndiaJob, resolveIndiaLocation } from './indiaJobFilter.js';
import { inferWorkMode } from './workMode.js';

export interface NetworkFetchOptions {
  search?: string;
  location?: string;
  jobType?: string;
  academicStream?: string;
  targetRole?: string;
  /** When false, skips Remotive (remote-only board) during scheduled sync. */
  includeRemoteBoards?: boolean;
}

export interface NetworkFetchStats {
  remotive: number;
  arbeitnow: number;
  jsearch: number;
  remoteok: number;
  adzuna: number;
  skipped?: boolean;
}

interface RemotiveJob {
  id: number;
  title: string;
  company_name: string;
  candidate_required_location: string;
  salary?: string;
  job_type: string;
  description: string;
  publication_date: string;
  url: string;
}

const FETCH_COOLDOWN_MS = 3 * 60 * 1000;
let lastFetchKey = '';
let lastFetchTime = 0;
let syncQueryOffset = 0;
let syncInProgress = false;

const ALL_SCHEDULED_QUERIES = buildScheduledSearchQueries();

function defaultJobLocation(options: NetworkFetchOptions): string {
  return options.location?.trim() || env.DEFAULT_JOB_COUNTRY || 'India';
}

function mustBeIndiaJob(location: string, description: string, country?: string): boolean {
  return acceptIndiaJob(location, description, country);
}

function extractSkillsFromText(text: string): string[] {
  const commonSkills = [
    'Java', 'Python', 'JavaScript', 'TypeScript', 'React', 'Node.js', 'Spring Boot',
    'MongoDB', 'PostgreSQL', 'AWS', 'Docker', 'Kubernetes', 'SQL', 'Git',
    'Angular', 'Vue', 'Django', 'Flask', 'Express', 'GraphQL', 'REST', 'CI/CD',
    'Machine Learning', 'AI', 'Data Science', 'TensorFlow', 'PyTorch',
    'Accounting', 'Finance', 'Marketing', 'Sales', 'HR', 'Legal', 'Nursing',
    'Communication', 'Excel', 'Tally', 'SAP', 'Research', 'Content Writing',
  ];
  const lower = text.toLowerCase();
  return commonSkills.filter((skill) => lower.includes(skill.toLowerCase()));
}

function normalizeJobType(raw?: string): string {
  const value = (raw ?? 'full-time').toLowerCase();
  if (value.includes('intern')) return 'internship';
  if (value.includes('part')) return 'part-time';
  if (value.includes('contract')) return 'contract';
  if (value.includes('full')) return 'full-time';
  return value;
}

function matchesJobTypeFilter(jobType: string, filter?: string): boolean {
  if (!filter) return true;
  const normalized = normalizeJobType(jobType);
  if (filter === 'internship') return normalized === 'internship';
  if (filter === 'full-time') return normalized === 'full-time';
  if (filter === 'part-time') return normalized === 'part-time';
  if (filter === 'contract') return normalized === 'contract';
  return normalized.includes(filter);
}

function matchesLocationFilter(location: string, filter?: string): boolean {
  if (!filter?.trim()) return isIndiaJob(location);
  const normalizedFilter = filter.trim().toLowerCase();
  if (normalizedFilter === 'india') return isIndiaJob(location);
  return location.toLowerCase().includes(normalizedFilter);
}

export function buildNetworkSearchQuery(options: NetworkFetchOptions): string {
  const location = defaultJobLocation(options);

  if (options.search?.trim()) {
    const search = options.search.trim();
    if (location.toLowerCase().includes('india') && !search.toLowerCase().includes('india')) {
      return `${search} in ${location}`;
    }
    return search;
  }

  const role = options.targetRole || getDefaultTargetRole(options.academicStream);
  const typePrefix =
    options.jobType === 'internship'
      ? 'internship'
      : options.jobType === 'part-time'
        ? 'part time'
        : '';

  return [typePrefix, role, location].filter(Boolean).join(' ').trim() || `graduate jobs in ${location}`;
}

async function upsertJob(
  externalId: string,
  source: 'remotive' | 'arbeitnow' | 'jsearch' | 'remoteok' | 'adzuna',
  payload: Record<string, unknown>
): Promise<void> {
  await Job.findOneAndUpdate({ externalId, source }, payload, { upsert: true, new: true });
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchRemotiveJobs(options: NetworkFetchOptions): Promise<number> {
  try {
    const query = buildNetworkSearchQuery(options);
    const url = new URL('https://remotive.com/api/remote-jobs');
    url.searchParams.set('limit', '50');
    if (query) url.searchParams.set('search', query);

    const response = await fetch(url.toString());
    if (!response.ok) return 0;

    const data = (await response.json()) as { jobs: RemotiveJob[] };
    let count = 0;

    for (const job of data.jobs ?? []) {
      if (!matchesJobTypeFilter(job.job_type, options.jobType)) continue;
      const sanitized = sanitizeForAI(job.description, 5000);
      const jobLocation = normalizeIndiaLocation(job.candidate_required_location || '', 'India');
      if (!acceptIndiaJob(jobLocation, sanitized)) continue;
      if (options.location?.trim() && !matchesLocationFilter(jobLocation, options.location)) continue;

      await upsertJob(String(job.id), 'remotive', {
        externalId: String(job.id),
        title: job.title,
        company: job.company_name,
        location: jobLocation,
        salary: job.salary,
        jobType: normalizeJobType(job.job_type),
        workMode: 'remote',
        description: sanitized,
        requirements: [],
        responsibilities: [],
        benefits: [],
        skills: extractSkillsFromText(sanitized),
        source: 'remotive',
        publisher: inferJobPublisher(job.url, 'Remotive'),
        applyUrl: job.url,
        postedAt: new Date(job.publication_date),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });
      count++;
    }
    return count;
  } catch (error) {
    logger.error('Failed to fetch Remotive jobs', { error });
    return 0;
  }
}

async function fetchArbeitnowJobs(_options: NetworkFetchOptions): Promise<number> {
  return 0;
}

async function fetchRemoteOkJobs(_options: NetworkFetchOptions): Promise<number> {
  return 0;
}

async function fetchJSearchJobs(options: NetworkFetchOptions): Promise<number> {
  if (!env.JSEARCH_API_KEY) return 0;

  try {
    const query = buildNetworkSearchQuery(options);
    const searchLower = query.toLowerCase();
    const wantsRemote = /\bremote\b|\bwfh\b|work from home/.test(searchLower);
    const wantsOnsite = /\bonsite\b|on-site|office jobs|\boffice\b/.test(searchLower);
    const wantsHybrid = /\bhybrid\b/.test(searchLower);

    const passes: Array<{ workFromHome?: boolean }> = [{ }];
    if (!wantsRemote && !wantsOnsite && !wantsHybrid) {
      passes.push({ workFromHome: false });
    }

    const seenIds = new Set<string>();
    let count = 0;

    for (const pass of passes) {
      const jobs = await searchJSearchJobs({
        query,
        country: 'in',
        numPages: 2,
        datePosted: 'month',
        workFromHome: pass.workFromHome,
      });

      for (const job of jobs) {
        if (seenIds.has(job.job_id)) continue;
        seenIds.add(job.job_id);

        const jobType = normalizeJobType(job.job_employment_type);
        if (!matchesJobTypeFilter(jobType, options.jobType)) continue;

        const sanitized = sanitizeForAI(job.job_description, 5000);
        const jobLocation = resolveIndiaLocation(job.job_city, job.job_state, job.job_country);
        if (!mustBeIndiaJob(jobLocation, sanitized, job.job_country)) continue;
        if (options.location?.trim() && !matchesLocationFilter(jobLocation, options.location)) continue;

        const workMode = inferWorkMode(sanitized, job.job_is_remote, job.job_title);
        if (wantsOnsite && workMode === 'remote') continue;
        if (wantsHybrid && workMode === 'remote') continue;
        if (wantsRemote && workMode === 'onsite') continue;

        await upsertJob(job.job_id, 'jsearch', {
          externalId: job.job_id,
          title: job.job_title,
          company: job.employer_name,
          location: jobLocation,
          salaryMin: job.job_min_salary,
          salaryMax: job.job_max_salary,
          jobType,
          workMode,
          description: sanitized,
          requirements: [],
          responsibilities: [],
          benefits: [],
          skills: extractSkillsFromText(sanitized),
          source: 'jsearch',
          publisher: inferJobPublisher(job.job_apply_link, job.job_publisher),
          applyUrl: job.job_apply_link,
          postedAt: new Date(job.job_posted_at_datetime_utc),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        });
        count++;
      }
    }

    return count;
  } catch (error) {
    logger.error('Failed to fetch JSearch jobs', { error });
    return 0;
  }
}

async function fetchAdzunaIndiaJobs(options: NetworkFetchOptions): Promise<number> {
  if (!env.ADZUNA_APP_ID || !env.ADZUNA_APP_KEY) return 0;

  try {
    const location = defaultJobLocation(options);
    const what = options.search?.trim() || options.targetRole || getDefaultTargetRole(options.academicStream);
    let count = 0;

    for (let page = 1; page <= 2; page++) {
      const url = new URL(`https://api.adzuna.com/v1/api/jobs/in/search/${page}`);
      url.searchParams.set('app_id', env.ADZUNA_APP_ID);
      url.searchParams.set('app_key', env.ADZUNA_APP_KEY);
      url.searchParams.set('results_per_page', '50');
      url.searchParams.set('what', what);
      if (location && !location.toLowerCase().includes('india')) {
        url.searchParams.set('where', location);
      } else if (options.location?.trim()) {
        url.searchParams.set('where', options.location.trim());
      }

      const response = await fetch(url.toString());
      if (!response.ok) break;

      const data = (await response.json()) as {
        results: Array<{
          id: string;
          title: string;
          company: { display_name: string };
          location: { display_name: string; area?: string[] };
          description: string;
          redirect_url: string;
          created: string;
          contract_type?: string;
          salary_min?: number;
          salary_max?: number;
        }>;
      };

      if (!data.results?.length) break;

      for (const job of data.results) {
        const jobType = normalizeJobType(job.contract_type);
        if (!matchesJobTypeFilter(jobType, options.jobType)) continue;

        const jobLocation =
          job.location.display_name ||
          job.location.area?.join(', ') ||
          location ||
          'India';
        const sanitized = sanitizeForAI(job.description, 5000);
        if (!acceptIndiaJob(jobLocation, sanitized, 'India')) continue;
        if (options.location?.trim() && !matchesLocationFilter(jobLocation, options.location)) continue;

        const workMode = inferWorkMode(sanitized, null, job.title);

        await upsertJob(String(job.id), 'adzuna', {
          externalId: String(job.id),
          title: job.title,
          company: job.company.display_name,
          location: jobLocation,
          salaryMin: job.salary_min,
          salaryMax: job.salary_max,
          jobType,
          workMode,
          description: sanitized,
          requirements: [],
          responsibilities: [],
          benefits: [],
          skills: extractSkillsFromText(sanitized),
          source: 'adzuna',
          publisher: inferJobPublisher(job.redirect_url, 'Adzuna'),
          applyUrl: job.redirect_url,
          postedAt: new Date(job.created),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        });
        count++;
      }
    }

    return count;
  } catch (error) {
    logger.error('Failed to fetch Adzuna India jobs', { error });
    return 0;
  }
}

export async function fetchJobsFromNetwork(
  options: NetworkFetchOptions = {},
  force = false
): Promise<NetworkFetchStats> {
  const fetchKey = JSON.stringify(options);
  if (!force && fetchKey === lastFetchKey && Date.now() - lastFetchTime < FETCH_COOLDOWN_MS) {
    return { remotive: 0, arbeitnow: 0, jsearch: 0, remoteok: 0, adzuna: 0, skipped: true };
  }

  const resolvedOptions: NetworkFetchOptions = {
    ...options,
    location: defaultJobLocation(options),
  };

  const includeRemoteBoards = options.includeRemoteBoards !== false;

  const [remotive, arbeitnow, jsearch, remoteok, adzuna] = await Promise.all([
    includeRemoteBoards ? fetchRemotiveJobs(resolvedOptions) : Promise.resolve(0),
    fetchArbeitnowJobs(resolvedOptions),
    fetchJSearchJobs(resolvedOptions),
    fetchRemoteOkJobs(resolvedOptions),
    fetchAdzunaIndiaJobs(resolvedOptions),
  ]);

  lastFetchKey = fetchKey;
  lastFetchTime = Date.now();

  logger.info('Job fetch completed', {
    query: buildNetworkSearchQuery(resolvedOptions),
    location: resolvedOptions.location,
    remotive,
    jsearch,
    adzuna,
  });

  return { remotive, arbeitnow, jsearch, remoteok, adzuna };
}

function getNextQueryBatch(): string[] {
  const batch: string[] = [];
  for (let i = 0; i < SYNC_BATCH_SIZE; i++) {
    batch.push(ALL_SCHEDULED_QUERIES[(syncQueryOffset + i) % ALL_SCHEDULED_QUERIES.length]);
  }
  syncQueryOffset = (syncQueryOffset + SYNC_BATCH_SIZE) % ALL_SCHEDULED_QUERIES.length;
  return batch;
}

export async function fetchAllJobs(): Promise<NetworkFetchStats> {
  if (syncInProgress) {
    logger.warn('Job sync already in progress, skipping');
    return { remotive: 0, arbeitnow: 0, jsearch: 0, remoteok: 0, adzuna: 0, skipped: true };
  }

  syncInProgress = true;
  const syncLog = await JobSyncLog.create({
    startedAt: new Date(),
    status: 'running',
    queriesRun: 0,
    stats: { remotive: 0, jsearch: 0, adzuna: 0, totalUpserted: 0 },
  });

  const queries = getNextQueryBatch();
  let totals: NetworkFetchStats = { remotive: 0, arbeitnow: 0, jsearch: 0, remoteok: 0, adzuna: 0 };

  try {
    for (const search of queries) {
      const result = await fetchJobsFromNetwork(
        { search, location: 'India', includeRemoteBoards: false },
        true
      );
      totals = {
        remotive: totals.remotive + result.remotive,
        arbeitnow: totals.arbeitnow + result.arbeitnow,
        jsearch: totals.jsearch + result.jsearch,
        remoteok: totals.remoteok + result.remoteok,
        adzuna: totals.adzuna + result.adzuna,
      };
      await delay(env.JSEARCH_API_KEY ? 1200 : 400);
    }

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    await Job.updateMany({ isTrending: true }, { isTrending: false });
    const trending = await Job.find({ postedAt: { $gte: weekAgo } })
      .sort({ viewCount: -1 })
      .limit(20);

    for (const job of trending) {
      job.isTrending = true;
      await job.save();
    }

    await Job.deleteMany({ expiresAt: { $lt: new Date() } });

    const totalUpserted = totals.remotive + totals.jsearch + totals.adzuna;
    syncLog.status = 'completed';
    syncLog.completedAt = new Date();
    syncLog.queriesRun = queries.length;
    syncLog.stats = {
      remotive: totals.remotive,
      jsearch: totals.jsearch,
      adzuna: totals.adzuna,
      totalUpserted,
    };
    await syncLog.save();

    logger.info('Scheduled job sync completed', {
      queriesRun: queries.length,
      queryOffset: syncQueryOffset,
      totalQueries: ALL_SCHEDULED_QUERIES.length,
      ...totals,
      totalUpserted,
    });
  } catch (error) {
    syncLog.status = 'failed';
    syncLog.completedAt = new Date();
    syncLog.error = error instanceof Error ? error.message : 'Unknown error';
    await syncLog.save();
    logger.error('Scheduled job sync failed', { error });
    throw error;
  } finally {
    syncInProgress = false;
  }

  return totals;
}

export async function getJobSyncStatus() {
  const latest = await JobSyncLog.findOne().sort({ startedAt: -1 }).lean();
  const totalJobs = await Job.countDocuments();
  const publisherCounts = await Job.aggregate([
    { $group: { _id: '$publisher', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 15 },
  ]);

  return {
    lastSync: latest,
    totalJobs,
    publisherCounts: publisherCounts.map((p) => ({ publisher: p._id ?? 'Unknown', count: p.count })),
    nextBatchSize: SYNC_BATCH_SIZE,
    totalScheduledQueries: ALL_SCHEDULED_QUERIES.length,
    syncIntervalMinutes: 30,
    sources: ['JSearch (LinkedIn, Indeed, Naukri, Internshala, Apna, Foundit)', 'Adzuna India', 'Remotive'],
  };
}

export function isJobSyncRunning(): boolean {
  return syncInProgress;
}
