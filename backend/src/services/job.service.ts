import { Job, IJob } from '../models/Job.js';
import { Profile, type IProfile } from '../models/Profile.js';
import { calculateJobMatch, MatchScoreBreakdown } from './recommendation.service.js';
import { sanitizeMongoQuery } from '../utils/sanitize.js';
import {
  fetchJobsFromNetwork,
  getJobSyncStatus,
  type NetworkFetchOptions,
  type NetworkFetchStats,
} from '../jobs/jobFetcher.js';
import { env } from '../config/env.js';
import {
  buildIndiaLocationMongoQuery,
} from '../constants/indiaJobs.js';

export interface JobWithMatch extends IJob {
  matchScore?: MatchScoreBreakdown;
}

export interface JobSearchFilters {
  search?: string;
  location?: string;
  experience?: string;
  jobType?: string;
  workMode?: string;
  remote?: boolean;
  salaryMin?: number;
  page?: number;
  limit?: number;
  live?: boolean;
  forceFetch?: boolean;
  userId?: string;
}

export interface JobSearchResult {
  jobs: IJob[];
  total: number;
  fetchedFromNetwork?: NetworkFetchStats;
}

function resolveSearchLocation(filters: JobSearchFilters, profile: IProfile | null): string {
  if (filters.location?.trim()) {
    const loc = filters.location.trim();
    return loc === 'India (All)' ? 'India' : loc;
  }
  if (profile?.careerPreferences?.preferredLocations?.[0]) return profile.careerPreferences.preferredLocations[0];
  if (profile?.location?.trim()) return profile.location.trim();
  return env.DEFAULT_JOB_COUNTRY || 'India';
}

function applyIndiaOnlyLocation(query: Record<string, unknown>, cityFilter?: string): void {
  const filter = cityFilter?.trim() === 'India (All)' ? 'India' : cityFilter;
  Object.assign(query, buildIndiaLocationMongoQuery(filter || 'India'));
}

async function runJobQuery(
  filters: JobSearchFilters
): Promise<{ jobs: IJob[]; total: number }> {
  const page = filters.page ?? 1;
  const limit = Math.min(filters.limit ?? 20, 50);
  const skip = (page - 1) * limit;

  const query: Record<string, unknown> = {};

  if (filters.search) {
    const sanitized = sanitizeMongoQuery(filters.search);
    query.$text = { $search: sanitized };
  }
  // CareerOS is India-only — always restrict to Indian locations
  applyIndiaOnlyLocation(query, filters.location || 'India');
  if (filters.experience) {
    query.experience = { $regex: sanitizeMongoQuery(filters.experience), $options: 'i' };
  }
  if (filters.jobType) {
    const jobTypePatterns: Record<string, RegExp> = {
      internship: /intern(ship)?/i,
      'full-time': /full[- ]?time|fulltime/i,
      'part-time': /part[- ]?time|parttime/i,
      contract: /contract(or)?/i,
    };
    const pattern = jobTypePatterns[filters.jobType];
    query.jobType = pattern ? { $regex: pattern } : filters.jobType;
  }
  if (filters.workMode) query.workMode = filters.workMode;
  if (filters.remote) query.workMode = 'remote';
  if (filters.salaryMin) query.salaryMin = { $gte: filters.salaryMin };

  let [jobs, total] = await Promise.all([
    Job.find(query).sort({ postedAt: -1 }).skip(skip).limit(limit).lean(),
    Job.countDocuments(query),
  ]);

  if (filters.search && total === 0) {
    const sanitized = sanitizeMongoQuery(filters.search);
    const regexQuery: Record<string, unknown> = {
      ...query,
      $or: [
        { title: { $regex: sanitized, $options: 'i' } },
        { company: { $regex: sanitized, $options: 'i' } },
        { description: { $regex: sanitized, $options: 'i' } },
      ],
    };
    delete regexQuery.$text;

    [jobs, total] = await Promise.all([
      Job.find(regexQuery).sort({ postedAt: -1 }).skip(skip).limit(limit).lean(),
      Job.countDocuments(regexQuery),
    ]);
  }

  // After live fetch, show newest online jobs when filters match nothing
  if (total === 0) {
    const fallbackQuery: Record<string, unknown> = {};
    applyIndiaOnlyLocation(fallbackQuery, filters.location || 'India');
    if (filters.workMode) fallbackQuery.workMode = filters.workMode;
    if (filters.jobType) {
      const jobTypePatterns: Record<string, RegExp> = {
        internship: /intern(ship)?/i,
        'full-time': /full[- ]?time|fulltime/i,
        'part-time': /part[- ]?time|parttime/i,
        contract: /contract(or)?/i,
      };
      const pattern = jobTypePatterns[filters.jobType];
      fallbackQuery.jobType = pattern ? { $regex: pattern } : filters.jobType;
    }
    [jobs, total] = await Promise.all([
      Job.find(fallbackQuery).sort({ postedAt: -1 }).skip(skip).limit(limit).lean(),
      Job.countDocuments(fallbackQuery),
    ]);
  }

  return { jobs: jobs as unknown as IJob[], total };
}

export async function syncOnlineJobs(
  options: NetworkFetchOptions,
  force = false
): Promise<NetworkFetchStats> {
  return fetchJobsFromNetwork(options, force);
}

export async function searchJobs(filters: JobSearchFilters): Promise<JobSearchResult> {
  let fetchedFromNetwork: NetworkFetchStats | undefined;
  let profile: IProfile | null = null;

  if (filters.userId) {
    profile = await Profile.findOne({ userId: filters.userId });
  }

  const resolvedLocation = resolveSearchLocation(filters, profile);

  if (filters.live === true) {
    const networkOptions: NetworkFetchOptions = {
      search: filters.search,
      location: resolvedLocation,
      jobType: filters.jobType,
      academicStream: profile?.academicStream,
      targetRole: profile?.careerPreferences?.targetRole,
    };

    fetchedFromNetwork = await fetchJobsFromNetwork(networkOptions, filters.forceFetch ?? false);
  }

  const { jobs, total } = await runJobQuery({
    ...filters,
    location: filters.location || resolvedLocation,
  });
  return { jobs, total, fetchedFromNetwork };
}

export async function getRecommendedJobs(userId: string, limit = 10): Promise<JobWithMatch[]> {
  const profile = await Profile.findOne({ userId });
  if (!profile) return [];

  const indiaQuery = buildIndiaLocationMongoQuery('India');
  const jobs = await Job.find(indiaQuery).sort({ postedAt: -1 }).limit(100).lean();

  const scored = jobs.map((job) => {
    const matchScore = calculateJobMatch(
      profile,
      job.skills ?? [],
      job.title,
      job.location,
      job.jobType,
      job.workMode
    );
    return { ...job, matchScore };
  });

  scored.sort((a, b) => (b.matchScore?.totalScore ?? 0) - (a.matchScore?.totalScore ?? 0));

  const topScore = scored[0]?.matchScore?.totalScore ?? 0;
  if (topScore > 0) {
    profile.jobMatchScore = topScore;
    await profile.save();
  }

  return scored.slice(0, limit) as unknown as JobWithMatch[];
}

export async function getTrendingJobs(limit = 10): Promise<IJob[]> {
  const indiaQuery = buildIndiaLocationMongoQuery('India');
  const jobs = await Job.find({ ...indiaQuery, isTrending: true }).sort({ viewCount: -1 }).limit(limit).lean();
  return jobs as unknown as IJob[];
}

export async function getLatestJobs(limit = 20): Promise<IJob[]> {
  const indiaQuery = buildIndiaLocationMongoQuery('India');
  const jobs = await Job.find(indiaQuery).sort({ postedAt: -1 }).limit(limit).lean();
  return jobs as unknown as IJob[];
}

export async function getJobSyncStatusInfo() {
  return getJobSyncStatus();
}

export async function getJobById(jobId: string): Promise<IJob | null> {
  const job = await Job.findById(jobId);
  if (job) {
    job.viewCount += 1;
    await job.save();
  }
  return job;
}
