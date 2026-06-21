import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import {
  processVideoInterview,
  getVideoInterviews,
  getVideoInterview,
  deleteVideoInterview,
} from '../services/videoInterview.service.js';
import { AppError } from '../middleware/errorHandler.js';

export const videoUploadSchema = z.object({
  title: z.string().optional(),
  domain: z.string().default('general'),
});

export async function uploadVideo(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.file) throw new AppError('No video file uploaded', 400);

    const { title, domain } = req.body;

    const record = await processVideoInterview(
      req.user!.userId,
      req.file,
      title ?? 'Video Interview',
      domain ?? 'general'
    );

    res.status(201).json({ success: true, data: record });
  } catch (error) {
    next(error);
  }
}

export async function listVideos(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const videos = await getVideoInterviews(req.user!.userId);
    res.json({ success: true, data: videos });
  } catch (error) {
    next(error);
  }
}

export async function getVideo(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const video = await getVideoInterview(req.user!.userId, String(req.params.id));
    res.json({ success: true, data: video });
  } catch (error) {
    next(error);
  }
}

export async function removeVideo(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await deleteVideoInterview(req.user!.userId, String(req.params.id));
    res.json({ success: true, message: 'Video deleted' });
  } catch (error) {
    next(error);
  }
}
