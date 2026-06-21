import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import {
  searchJobs,
  getRecommendedJobs,
  getTrendingJobs,
  getLatestJobs,
  getJobById,
  syncOnlineJobs,
  getJobSyncStatusInfo,
} from '../services/job.service.js';
import { SavedJob } from '../models/SavedJob.js';
import { Profile } from '../models/Profile.js';
import { calculateJobMatch } from '../services/recommendation.service.js';
import { analyzeJobMatch } from '../ai/prompts/index.js';
import { AppError } from '../middleware/errorHandler.js';
import { logActivity } from '../services/recommendation.service.js';

export const jobSearchSchema = z.object({
  search: z.string().optional(),
  location: z.string().optional(),
  experience: z.string().optional(),
  jobType: z.string().optional(),
  workMode: z.string().optional(),
  remote: z.coerce.boolean().optional(),
  salaryMin: z.coerce.number().optional(),
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
  live: z.coerce.boolean().optional(),
  forceFetch: z.coerce.boolean().optional(),
});

export const jobSyncSchema = z.object({
  search: z.string().optional(),
  location: z.string().optional(),
  jobType: z.string().optional(),
  forceFetch: z.coerce.boolean().optional(),
});

export async function listJobs(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await searchJobs({
      ...(req.query as z.infer<typeof jobSearchSchema>),
      userId: req.user?.userId,
    });
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function syncJobsFromNetwork(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = req.body as z.infer<typeof jobSyncSchema>;
    const profile = req.user?.userId
      ? await Profile.findOne({ userId: req.user.userId })
      : null;

    const stats = await syncOnlineJobs(
      {
        search: body.search,
        location: body.location || profile?.location || profile?.careerPreferences?.preferredLocations?.[0] || 'India',
        jobType: body.jobType,
        academicStream: profile?.academicStream,
        targetRole: profile?.careerPreferences?.targetRole,
      },
      body.forceFetch ?? false
    );

    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
}

export async function getSyncStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const status = await getJobSyncStatusInfo();
    res.json({ success: true, data: status });
  } catch (error) {
    next(error);
  }
}

export async function getRecommended(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const jobs = await getRecommendedJobs(req.user!.userId);
    res.json({ success: true, data: jobs });
  } catch (error) {
    next(error);
  }
}

export async function getTrending(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const jobs = await getTrendingJobs();
    res.json({ success: true, data: jobs });
  } catch (error) {
    next(error);
  }
}

export async function getLatest(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const jobs = await getLatestJobs();
    res.json({ success: true, data: jobs });
  } catch (error) {
    next(error);
  }
}

export async function getJob(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const jobId = String(req.params.id);
    const job = await getJobById(jobId);
    if (!job) throw new AppError('Job not found', 404);

    let matchAnalysis = null;
    if (req.user) {
      const profile = await Profile.findOne({ userId: req.user.userId });
      if (profile) {
        const algorithmic = calculateJobMatch(
          profile,
          job.skills,
          job.title,
          job.location,
          job.jobType,
          job.workMode
        );
        matchAnalysis = { algorithmic };
      }
    }

    res.json({ success: true, data: { job, matchAnalysis } });
  } catch (error) {
    next(error);
  }
}

export async function getJobMatchAnalysis(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const jobId = String(req.params.id);
    const job = await getJobById(jobId);
    if (!job) throw new AppError('Job not found', 404);

    const profile = await Profile.findOne({ userId: req.user!.userId });
    if (!profile) throw new AppError('Profile not found', 404);

    const algorithmic = calculateJobMatch(
      profile,
      job.skills,
      job.title,
      job.location,
      job.jobType,
      job.workMode
    );

    const profileData = JSON.stringify({
      skills: [...profile.skills.languages, ...profile.skills.frameworks],
      education: profile.education,
      preferences: profile.careerPreferences,
    });

    const aiAnalysis = await analyzeJobMatch(req.user!.userId, profileData, job.description);

    res.json({ success: true, data: { algorithmic, ai: aiAnalysis } });
  } catch (error) {
    next(error);
  }
}

export async function saveJob(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const jobId = String(req.params.id);

    const saved = await SavedJob.findOneAndUpdate(
      { userId, jobId },
      { userId, jobId },
      { upsert: true, new: true }
    );

    await logActivity(userId, 'save', 'job', jobId);
    res.json({ success: true, data: saved });
  } catch (error) {
    next(error);
  }
}

export async function unsaveJob(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await SavedJob.deleteOne({ userId: req.user!.userId, jobId: req.params.id });
    res.json({ success: true, message: 'Job unsaved' });
  } catch (error) {
    next(error);
  }
}

export async function getSavedJobs(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const saved = await SavedJob.find({ userId: req.user!.userId }).populate('jobId');
    res.json({ success: true, data: saved });
  } catch (error) {
    next(error);
  }
}
