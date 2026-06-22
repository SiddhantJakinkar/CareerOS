import { Request, Response, NextFunction } from 'express';
import { Profile } from '../models/Profile.js';
import { Resume } from '../models/Resume.js';
import { Application } from '../models/Application.js';
import { Interview } from '../models/Interview.js';
import { CodingResult } from '../models/CodingResult.js';
import { ActivityLog } from '../models/ActivityLog.js';
import { Report } from '../models/Report.js';
import { getRecommendedJobs } from '../services/job.service.js';
import { getAllSkills } from '../services/recommendation.service.js';
import { analyzeSkillGap } from '../ai/prompts/index.js';
import { getDefaultTargetRole } from '../constants/academicStreams.js';
import { AppError } from '../middleware/errorHandler.js';
import { cacheGetOrSet, CacheKey, CacheTTL } from '../utils/cache.js';

async function loadDashboard(userId: string) {
  const [profile, resume, applications, interviews, codingResults, activities, recommendedJobs] =
    await Promise.all([
      Profile.findOne({ userId }),
      Resume.findOne({ userId, isActive: true }).sort({ createdAt: -1 }).lean(),
      Application.find({ userId }).populate('jobId').sort({ updatedAt: -1 }).limit(10).lean(),
      Interview.find({ userId }).sort({ createdAt: -1 }).limit(5).lean(),
      CodingResult.find({ userId }).sort({ completedAt: -1 }).limit(5).lean(),
      ActivityLog.find({ userId }).sort({ createdAt: -1 }).limit(10).lean(),
      getRecommendedJobs(userId, 5),
    ]);

  if (!profile) throw new AppError('Profile not found', 404);

  const targetRole =
    profile.careerPreferences?.targetRole || getDefaultTargetRole(profile.academicStream);
  let skillGaps: string[] = [];
  try {
    const gap = await analyzeSkillGap(userId, getAllSkills(profile), targetRole);
    skillGaps = gap.missingSkills.slice(0, 5);
  } catch {
    skillGaps = [];
  }

  const applicationStats = {
    total: await Application.countDocuments({ userId }),
    applied: await Application.countDocuments({ userId, status: 'applied' }),
    interviews: await Application.countDocuments({
      userId,
      status: { $in: ['interview_scheduled', 'technical_round', 'hr_round'] },
    }),
    selected: await Application.countDocuments({ userId, status: { $in: ['selected', 'offer_received'] } }),
    rejected: await Application.countDocuments({ userId, status: 'rejected' }),
  };

  return {
    placementReadiness: profile.placementReadinessScore,
    scores: {
      ats: profile.atsScore,
      coding: profile.codingScore,
      interview: profile.interviewScore,
      jobMatch: profile.jobMatchScore,
    },
    resume: resume?.analysis
      ? {
          atsScore: resume.analysis.atsScore ?? 0,
          status: 'analyzed',
          topSkills: (resume.analysis.extractedSkills ?? []).slice(0, 5),
        }
      : { atsScore: 0, status: resume ? 'pending' : 'not_uploaded', topSkills: [] },
    recommendedJobs,
    skillGaps,
    academicStream: profile.academicStream,
    codingProgress: codingResults,
    interviewProgress: interviews,
    applications,
    applicationStats,
    recentActivities: activities,
  };
}

export async function getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const data = await cacheGetOrSet(CacheKey.dashboard(userId), CacheTTL.MEDIUM, () =>
      loadDashboard(userId)
    );

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function getReports(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const reports = await Report.find({ userId: req.user!.userId }).sort({ createdAt: -1 });
    res.json({ success: true, data: reports });
  } catch (error) {
    next(error);
  }
}

export async function getAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;

    const [reports, codingResults, interviews, profile] = await Promise.all([
      Report.find({ userId }).sort({ createdAt: -1 }).limit(50),
      CodingResult.find({ userId }).sort({ completedAt: -1 }),
      Interview.find({ userId, status: 'completed' }).sort({ completedAt: -1 }),
      Profile.findOne({ userId }),
    ]);

    const placementTrend = reports
      .filter((r) => r.type === 'placement_readiness' || r.score !== undefined)
      .map((r) => ({ date: r.createdAt, score: r.score }));

    res.json({
      success: true,
      data: {
        placementReadiness: profile?.placementReadinessScore ?? 0,
        scores: {
          ats: profile?.atsScore ?? 0,
          coding: profile?.codingScore ?? 0,
          interview: profile?.interviewScore ?? 0,
          jobMatch: profile?.jobMatchScore ?? 0,
        },
        codingHistory: codingResults.map((r) => ({
          date: r.completedAt,
          score: r.percentage,
          category: r.category,
        })),
        interviewHistory: interviews.map((i) => ({
          date: i.completedAt,
          score: i.overallScore,
          domain: i.domain,
        })),
        placementTrend,
        reports,
      },
    });
  } catch (error) {
    next(error);
  }
}
