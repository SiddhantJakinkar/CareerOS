import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { Profile } from '../models/Profile.js';
import { User } from '../models/User.js';
import { AppError } from '../middleware/errorHandler.js';
import { logActivity } from '../services/recommendation.service.js';
import { ACADEMIC_STREAM_IDS } from '../constants/academicStreams.js';

export const profileUpdateSchema = z.object({
  academicStream: z.enum(ACADEMIC_STREAM_IDS).optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  education: z
    .object({
      collegeName: z.string().optional(),
      degree: z.string().optional(),
      branch: z.string().optional(),
      currentYear: z.number().optional(),
      graduationYear: z.number().optional(),
      cgpa: z.number().optional(),
    })
    .optional(),
  careerPreferences: z
    .object({
      targetRole: z.string().optional(),
      preferredLocations: z.array(z.string()).optional(),
      jobType: z.enum(['internship', 'full-time', 'part-time', 'contract']).optional(),
      workMode: z.enum(['remote', 'hybrid', 'onsite']).optional(),
      expectedSalary: z
        .object({
          min: z.number().optional(),
          max: z.number().optional(),
          currency: z.string().default('INR'),
        })
        .optional()
        .nullable(),
    })
    .optional(),
  skills: z
    .object({
      languages: z.array(z.string()).optional(),
      frameworks: z.array(z.string()).optional(),
      databases: z.array(z.string()).optional(),
      tools: z.array(z.string()).optional(),
      certifications: z.array(z.string()).optional(),
    })
    .optional(),
  linkedinUrl: z.string().url().optional().or(z.literal('')),
  githubUrl: z.string().url().optional().or(z.literal('')),
  portfolioUrl: z.string().url().optional().or(z.literal('')),
});

export const onboardingSchema = profileUpdateSchema.extend({
  name: z.string().min(2).optional(),
});

export async function getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const profile = await Profile.findOne({ userId: req.user!.userId });
    if (!profile) throw new AppError('Profile not found', 404);
    res.json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
}

export async function updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const updates = req.body;

    if (updates.name) {
      await User.findByIdAndUpdate(userId, { name: updates.name });
    }

    const profile = await Profile.findOneAndUpdate(
      { userId },
      { $set: updates },
      { new: true, upsert: true }
    );

    await logActivity(userId, 'update', 'profile', profile!._id.toString());
    res.json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
}

export async function completeOnboarding(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const updates = req.body;

    if (updates.name) {
      await User.findByIdAndUpdate(userId, { name: updates.name });
    }

    const profile = await Profile.findOneAndUpdate(
      { userId },
      { $set: updates },
      { new: true, upsert: true }
    );

    await User.findByIdAndUpdate(userId, { onboardingCompleted: true });
    await logActivity(userId, 'complete', 'onboarding');

    res.json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
}
