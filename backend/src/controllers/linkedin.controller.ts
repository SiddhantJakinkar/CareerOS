import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { analyzeLinkedIn } from '../ai/prompts/index.js';
import { Report } from '../models/Report.js';
import { AppError } from '../middleware/errorHandler.js';
import { logActivity } from '../services/recommendation.service.js';

export const linkedinSchema = z.object({
  linkedinUrl: z.string().url(),
  profileContent: z.string().min(50).optional(),
});

export async function analyzeLinkedInProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { linkedinUrl, profileContent } = req.body;

    if (!profileContent) {
      throw new AppError(
        'Please paste your LinkedIn profile content (headline, about, experience, skills) for analysis.',
        400
      );
    }

    const analysis = await analyzeLinkedIn(userId, profileContent);

    await Report.create({
      userId,
      type: 'linkedin',
      title: 'LinkedIn Profile Analysis',
      data: { ...analysis, linkedinUrl },
      score: analysis.profileScore,
    });

    await logActivity(userId, 'analyze', 'linkedin');
    res.json({ success: true, data: analysis });
  } catch (error) {
    next(error);
  }
}
