import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { Profile } from '../models/Profile.js';
import { Roadmap } from '../models/Roadmap.js';
import { Report } from '../models/Report.js';
import { analyzeSkillGap, generateRoadmap } from '../ai/prompts/index.js';
import { getAllSkills, logActivity, createNotification } from '../services/recommendation.service.js';
import { AppError } from '../middleware/errorHandler.js';
import { getDefaultTargetRole, getStreamLabel } from '../constants/academicStreams.js';

export const skillGapSchema = z.object({
  targetRole: z.string().optional(),
});

export const roadmapSchema = z.object({
  targetRole: z.string().min(1),
});

export async function getSkillGap(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const profile = await Profile.findOne({ userId });
    if (!profile) throw new AppError('Profile not found', 404);

    const targetRole =
      (req.query.targetRole as string) ||
      profile.careerPreferences.targetRole ||
      getDefaultTargetRole(profile.academicStream);
    const currentSkills = getAllSkills(profile);
    const streamContext = {
      academicStream: profile.academicStream,
      streamLabel: getStreamLabel(profile.academicStream),
      branch: profile.education?.branch,
      targetRole,
    };

    const analysis = await analyzeSkillGap(userId, currentSkills, targetRole, streamContext);

    await Report.create({
      userId,
      type: 'skill_gap',
      title: `Skill Gap: ${targetRole}`,
      data: analysis,
      score: analysis.matchPercentage,
    });

    res.json({ success: true, data: analysis });
  } catch (error) {
    next(error);
  }
}

export async function generateRoadmapHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { targetRole } = req.body;

    const profile = await Profile.findOne({ userId });
    if (!profile) throw new AppError('Profile not found', 404);

    const currentSkills = getAllSkills(profile);
    const streamContext = {
      academicStream: profile.academicStream,
      streamLabel: getStreamLabel(profile.academicStream),
      branch: profile.education?.branch,
      targetRole,
    };
    const gapAnalysis = await analyzeSkillGap(userId, currentSkills, targetRole, streamContext);

    const roadmapData = await generateRoadmap(
      userId,
      targetRole,
      currentSkills,
      gapAnalysis.missingSkills,
      streamContext
    );

    const roadmap = await Roadmap.findOneAndUpdate(
      { userId, targetRole },
      {
        userId,
        targetRole,
        weeks: roadmapData.weeks.map((w) => ({ ...w, completed: false })),
        totalWeeks: roadmapData.weeks.length,
        skillGaps: roadmapData.skillGaps,
        progress: 0,
      },
      { upsert: true, new: true }
    );

    await createNotification(
      userId,
      'Roadmap Generated',
      `Your ${targetRole} learning roadmap is ready`,
      'roadmap',
      '/roadmap'
    );

    await logActivity(userId, 'generate', 'roadmap', roadmap!._id.toString());
    res.json({ success: true, data: roadmap });
  } catch (error) {
    next(error);
  }
}

export async function getRoadmaps(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const roadmaps = await Roadmap.find({ userId: req.user!.userId }).sort({ createdAt: -1 });
    res.json({ success: true, data: roadmaps });
  } catch (error) {
    next(error);
  }
}

export async function updateRoadmapProgress(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { weekIndex, completed } = req.body;
    const roadmap = await Roadmap.findOne({ _id: req.params.id, userId: req.user!.userId });
    if (!roadmap) throw new AppError('Roadmap not found', 404);

    if (roadmap.weeks[weekIndex]) {
      roadmap.weeks[weekIndex].completed = completed;
    }

    const completedWeeks = roadmap.weeks.filter((w) => w.completed).length;
    roadmap.progress = Math.round((completedWeeks / roadmap.totalWeeks) * 100);
    await roadmap.save();

    res.json({ success: true, data: roadmap });
  } catch (error) {
    next(error);
  }
}
