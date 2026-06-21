import { Request, Response, NextFunction } from 'express';
import { Resume } from '../models/Resume.js';
import { Profile } from '../models/Profile.js';
import { Report } from '../models/Report.js';
import { uploadToCloudinary } from '../config/cloudinary.js';
import { extractTextFromPdf } from '../utils/pdfParser.js';
import { analyzeResume, generateResume as aiGenerateResume } from '../ai/prompts/index.js';
import { AppError } from '../middleware/errorHandler.js';
import {
  logActivity,
  createNotification,
  updatePlacementReadiness,
} from '../services/recommendation.service.js';
import { Job } from '../models/Job.js';
import { z } from 'zod';

export const generateResumeSchema = z.object({
  jobId: z.string().min(1),
});

export async function uploadResume(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.file) throw new AppError('No file uploaded', 400);

    const userId = req.user!.userId;
    const { url, publicId } = await uploadToCloudinary(req.file.buffer, 'resumes');

    let rawText = '';
    if (req.file.mimetype === 'application/pdf') {
      rawText = await extractTextFromPdf(req.file.buffer);
    }

    await Resume.updateMany({ userId, isActive: true }, { isActive: false });

    const resume = await Resume.create({
      userId,
      fileName: req.file.originalname,
      fileUrl: url,
      publicId,
      rawText,
    });

    await Profile.findOneAndUpdate({ userId }, { resumeUrl: url, resumePublicId: publicId });

    await logActivity(userId, 'upload', 'resume', resume._id.toString());
    res.status(201).json({ success: true, data: resume });
  } catch (error) {
    next(error);
  }
}

export async function analyzeResumeHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const resume = await Resume.findOne({ userId, isActive: true }).sort({ createdAt: -1 });
    if (!resume) throw new AppError('No resume found. Please upload first.', 404);

    if (!resume.rawText) {
      throw new AppError('Could not extract text from resume', 400);
    }

    const analysis = await analyzeResume(userId, resume.rawText);
    resume.analysis = analysis;
    await resume.save();

    // Merge extracted skills into profile (dedup, preserve existing)
    const profile = await Profile.findOne({ userId });
    if (profile && analysis.extractedSkills?.length) {
      const existing = [
        ...profile.skills.languages,
        ...profile.skills.frameworks,
        ...profile.skills.databases,
        ...profile.skills.tools,
        ...profile.skills.certifications,
      ].map((s) => s.toLowerCase());

      const newSkills = analysis.extractedSkills.filter(
        (s) => s.trim() && !existing.includes(s.trim().toLowerCase())
      );

      await Profile.findOneAndUpdate(
        { userId },
        {
          atsScore: analysis.atsScore,
          $push: { 'skills.languages': { $each: newSkills } },
        }
      );
    } else {
      await Profile.findOneAndUpdate({ userId }, { atsScore: analysis.atsScore });
    }

    await updatePlacementReadiness(userId);

    await Report.create({
      userId,
      type: 'ats',
      title: 'ATS Resume Analysis',
      data: analysis,
      score: analysis.atsScore,
    });

    await createNotification(
      userId,
      'Resume Analysis Complete',
      `Your ATS score is ${analysis.atsScore}%`,
      'resume_analysis',
      '/resume-analyzer'
    );

    await logActivity(userId, 'analyze', 'resume', resume._id.toString());
    res.json({ success: true, data: { resume, analysis } });
  } catch (error) {
    next(error);
  }
}

export async function getResumeReport(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const resume = await Resume.findOne({ userId: req.user!.userId, isActive: true }).sort({ createdAt: -1 });
    if (!resume) throw new AppError('No resume found', 404);
    res.json({ success: true, data: resume });
  } catch (error) {
    next(error);
  }
}

export async function generateResumeHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { jobId } = req.body;

    const [resume, job] = await Promise.all([
      Resume.findOne({ userId, isActive: true }).sort({ createdAt: -1 }),
      Job.findById(jobId),
    ]);

    if (!resume?.rawText) throw new AppError('No resume found', 404);
    if (!job) throw new AppError('Job not found', 404);

    const generated = await aiGenerateResume(userId, resume.rawText, job.description);

    const buffer = Buffer.from(generated.content, 'utf-8');
    const { url, publicId } = await uploadToCloudinary(buffer, 'generated-resumes');

    const newResume = await Resume.create({
      userId,
      fileName: `resume-${job.company}-${job.title}.txt`,
      fileUrl: url,
      publicId,
      rawText: generated.content,
      generatedForJobId: job._id,
      analysis: {
        atsScore: generated.matchScore,
        missingKeywords: [],
        weakSections: [],
        suggestions: generated.optimizations,
        extractedSkills: generated.keywordCoverage,
        extractedEducation: [],
        extractedProjects: [],
        extractedExperience: [],
        summary: generated.content.slice(0, 200),
      },
    });

    await logActivity(userId, 'generate', 'resume', newResume._id.toString(), { jobId });
    res.json({ success: true, data: { resume: newResume, generated } });
  } catch (error) {
    next(error);
  }
}

export async function getResumes(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const resumes = await Resume.find({ userId: req.user!.userId }).sort({ createdAt: -1 });
    res.json({ success: true, data: resumes });
  } catch (error) {
    next(error);
  }
}
