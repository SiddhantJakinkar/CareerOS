import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { Application } from '../models/Application.js';
import { CoverLetter } from '../models/CoverLetter.js';
import { Job } from '../models/Job.js';
import { Profile } from '../models/Profile.js';
import { Resume } from '../models/Resume.js';
import { generateCoverLetter } from '../ai/prompts/index.js';
import { AppError } from '../middleware/errorHandler.js';
import { logActivity, createNotification } from '../services/recommendation.service.js';

export const applicationSchema = z.object({
  jobId: z.string().min(1),
  status: z
    .enum(['saved', 'applied', 'interview_scheduled', 'technical_round', 'hr_round', 'rejected', 'selected', 'offer_received'])
    .optional(),
  notes: z.string().optional(),
});

export const updateApplicationSchema = z.object({
  status: z
    .enum(['saved', 'applied', 'interview_scheduled', 'technical_round', 'hr_round', 'rejected', 'selected', 'offer_received'])
    .optional(),
  notes: z.string().optional(),
});

export const coverLetterSchema = z.object({
  jobId: z.string().min(1),
});

export async function createApplication(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { jobId, status = 'saved', notes } = req.body;

    const job = await Job.findById(jobId);
    if (!job) throw new AppError('Job not found', 404);

    const application = await Application.findOneAndUpdate(
      { userId, jobId },
      {
        userId,
        jobId,
        status,
        notes: notes ?? '',
        $push: { timeline: { status, note: notes, date: new Date() } },
        ...(status === 'applied' ? { appliedAt: new Date() } : {}),
      },
      { upsert: true, new: true }
    );

    await logActivity(userId, 'create', 'application', application!._id.toString());
    res.status(201).json({ success: true, data: application });
  } catch (error) {
    next(error);
  }
}

export async function getApplications(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const applications = await Application.find({ userId: req.user!.userId })
      .populate('jobId')
      .sort({ updatedAt: -1 });
    res.json({ success: true, data: applications });
  } catch (error) {
    next(error);
  }
}

export async function updateApplication(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { status, notes } = req.body;

    const application = await Application.findOne({ _id: req.params.id, userId });
    if (!application) throw new AppError('Application not found', 404);

    if (status) {
      application.status = status;
      application.timeline.push({ status, note: notes, date: new Date() });
      if (status === 'applied' && !application.appliedAt) {
        application.appliedAt = new Date();
      }
    }
    if (notes !== undefined) application.notes = notes;
    await application.save();

    await createNotification(
      userId,
      'Application Updated',
      `Status changed to ${status ?? application.status}`,
      'application',
      '/applications'
    );

    res.json({ success: true, data: application });
  } catch (error) {
    next(error);
  }
}

export async function generateCoverLetterHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { jobId } = req.body;

    const [job, profile, resume] = await Promise.all([
      Job.findById(jobId),
      Profile.findOne({ userId }),
      Resume.findOne({ userId, isActive: true }).sort({ createdAt: -1 }),
    ]);

    if (!job) throw new AppError('Job not found', 404);
    if (!profile) throw new AppError('Profile not found', 404);

    const profileData = JSON.stringify(profile);
    const resumeText = resume?.rawText ?? '';

    const result = await generateCoverLetter(
      userId,
      profileData,
      resumeText,
      job.description,
      job.company
    );

    const coverLetter = await CoverLetter.findOneAndUpdate(
      { userId, jobId },
      {
        userId,
        jobId,
        content: result.content,
        companyName: job.company,
        jobTitle: job.title,
      },
      { upsert: true, new: true }
    );

    await logActivity(userId, 'generate', 'cover_letter', coverLetter!._id.toString());
    res.json({ success: true, data: coverLetter });
  } catch (error) {
    next(error);
  }
}

export async function getCoverLetter(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const coverLetter = await CoverLetter.findOne({
      userId: req.user!.userId,
      jobId: req.params.jobId,
    });
    if (!coverLetter) throw new AppError('Cover letter not found', 404);
    res.json({ success: true, data: coverLetter });
  } catch (error) {
    next(error);
  }
}
