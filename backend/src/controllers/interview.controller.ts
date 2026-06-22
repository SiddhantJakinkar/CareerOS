import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { Interview } from '../models/Interview.js';
import { InterviewAnswer } from '../models/InterviewAnswer.js';
import { Report } from '../models/Report.js';
import {
  generateInterviewQuestions,
  evaluateInterviewAnswer,
} from '../ai/prompts/index.js';
import { AppError } from '../middleware/errorHandler.js';
import {
  logActivity,
  updatePlacementReadiness,
} from '../services/recommendation.service.js';
import { Profile, type IProfile } from '../models/Profile.js';
import {
  DOMAIN_LABELS,
  INTERVIEW_DOMAIN_IDS,
  getInterviewDomainsPayload,
  type InterviewDomainId,
} from '../constants/interviewDomains.js';
import { VIDEO_INTERVIEW_CONFIG } from '../constants/videoInterview.js';
import { getStreamLabel } from '../constants/academicStreams.js';
import { uploadVideoToCloudinary } from '../config/cloudinary.js';
import { transcribeAudio } from '../ai/whisper.service.js';
import { finalizeInterview } from './interview.controller.helpers.js';
import { cacheGetOrSet, CacheKey, CacheTTL } from '../utils/cache.js';

export const startInterviewSchema = z.object({
  domain: z.enum(INTERVIEW_DOMAIN_IDS),
  type: z.enum(['mock', 'voice', 'video']).default('mock'),
});

export const answerSchema = z.object({
  interviewId: z.string().min(1),
  answer: z.string().min(1),
});

export const videoAnswerSchema = z.object({
  interviewId: z.string().min(1),
  durationSeconds: z.coerce.number().optional(),
});

const DOMAIN_LABELS_MAP = DOMAIN_LABELS;

function averageMetric(current: number, next: number): number {
  return Math.round((current + next) / 2) || next;
}

async function applyAnswerEvaluation(
  interview: InstanceType<typeof Interview>,
  evaluation: Awaited<ReturnType<typeof evaluateInterviewAnswer>>
): Promise<boolean> {
  interview.metrics.technicalKnowledge = averageMetric(
    interview.metrics.technicalKnowledge,
    evaluation.technicalKnowledge
  );
  interview.metrics.communication = averageMetric(
    interview.metrics.communication,
    evaluation.communication
  );
  interview.metrics.confidence = averageMetric(
    interview.metrics.confidence,
    evaluation.confidence
  );
  interview.metrics.problemSolving = averageMetric(
    interview.metrics.problemSolving,
    evaluation.problemSolving
  );
  interview.metrics.clarity = averageMetric(interview.metrics.clarity, evaluation.clarity);

  interview.currentQuestionIndex += 1;
  const isComplete = interview.currentQuestionIndex >= interview.questions.length;

  if (isComplete) {
    interview.status = 'completed';
    interview.completedAt = new Date();
    interview.overallScore = Math.round(
      (interview.metrics.technicalKnowledge +
        interview.metrics.communication +
        interview.metrics.confidence +
        interview.metrics.problemSolving +
        interview.metrics.clarity) /
        5
    );
    interview.feedback = evaluation.feedback;
    interview.suggestions = evaluation.improvements;
  }

  return isComplete;
}

export async function getInterviewDomains(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const data = await cacheGetOrSet(CacheKey.interviewDomains(userId), CacheTTL.MEDIUM, async () => {
      const profile = await Profile.findOne({ userId }).lean();
      return getInterviewDomainsPayload(profile as IProfile | null);
    });
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function startInterview(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { domain, type } = req.body as { domain: InterviewDomainId; type: string };

    const profile = await Profile.findOne({ userId }).lean();
    const streamContext = profile
      ? {
          academicStream: profile.academicStream,
          streamLabel: getStreamLabel(profile.academicStream),
          branch: profile.education?.branch,
          targetRole: profile.careerPreferences?.targetRole,
        }
      : undefined;

    const questions = await generateInterviewQuestions(
      userId,
      DOMAIN_LABELS_MAP[domain] ?? domain,
      5,
      streamContext
    );

    const interview = await Interview.create({
      userId,
      type,
      domain,
      questions,
      currentQuestionIndex: 0,
      status: 'in_progress',
    });

    await logActivity(userId, 'start', 'interview', interview._id.toString());
    res.status(201).json({
      success: true,
      data: {
        interview,
        currentQuestion: questions[0],
        ...(type === 'video' ? { config: VIDEO_INTERVIEW_CONFIG } : {}),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function submitAnswer(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { interviewId, answer } = req.body;

    const interview = await Interview.findOne({ _id: interviewId, userId });
    if (!interview) throw new AppError('Interview not found', 404);
    if (interview.status !== 'in_progress') throw new AppError('Interview not active', 400);

    const question = interview.questions[interview.currentQuestionIndex];
    const evaluation = await evaluateInterviewAnswer(
      userId,
      question,
      answer,
      DOMAIN_LABELS_MAP[interview.domain] ?? interview.domain
    );

    await InterviewAnswer.create({
      interviewId: interview._id,
      userId,
      questionIndex: interview.currentQuestionIndex,
      question,
      answer,
      evaluation: {
        score: evaluation.score,
        feedback: evaluation.feedback,
        strengths: evaluation.strengths,
        improvements: evaluation.improvements,
      },
    });

    const isComplete = await applyAnswerEvaluation(interview, evaluation);

    if (isComplete) {
      await finalizeInterview(userId, interview);
    }

    await interview.save();

    res.json({
      success: true,
      data: {
        evaluation,
        interview,
        nextQuestion: isComplete ? null : interview.questions[interview.currentQuestionIndex],
        isComplete,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function submitVideoAnswer(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { interviewId, durationSeconds } = req.body as {
      interviewId: string;
      durationSeconds?: number;
    };

    if (!req.file) throw new AppError('No video recording uploaded', 400);

    const interview = await Interview.findOne({
      _id: interviewId,
      userId,
      type: 'video',
      status: 'in_progress',
    });
    if (!interview) throw new AppError('Video interview not found or already completed', 404);

    const question = interview.questions[interview.currentQuestionIndex];
    const domainLabel = DOMAIN_LABELS_MAP[interview.domain as InterviewDomainId] ?? interview.domain;

    const { url, publicId, duration } = await uploadVideoToCloudinary(
      req.file.buffer,
      'interview-answers'
    );

    let transcript = '';
    try {
      transcript = await transcribeAudio(req.file.buffer, req.file.mimetype);
    } catch {
      transcript = '(Could not transcribe — answer recorded on video only)';
    }

    const evaluation = await evaluateInterviewAnswer(
      userId,
      question,
      transcript || 'Video answer recorded without transcript.',
      domainLabel
    );

    await InterviewAnswer.create({
      interviewId: interview._id,
      userId,
      questionIndex: interview.currentQuestionIndex,
      question,
      answer: transcript || 'Video answer',
      transcript,
      videoUrl: url,
      videoPublicId: publicId,
      durationSeconds: durationSeconds ?? duration ?? 0,
      evaluation: {
        score: evaluation.score,
        feedback: evaluation.feedback,
        strengths: evaluation.strengths,
        improvements: evaluation.improvements,
      },
    });

    const isComplete = await applyAnswerEvaluation(interview, evaluation);

    if (isComplete) {
      await finalizeInterview(userId, interview);
    }

    await interview.save();

    res.json({
      success: true,
      data: {
        evaluation,
        transcript,
        videoUrl: url,
        interview,
        nextQuestion: isComplete ? null : interview.questions[interview.currentQuestionIndex],
        isComplete,
        questionNumber: interview.currentQuestionIndex,
        totalQuestions: interview.questions.length,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getInterviewReport(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const interview = await Interview.findOne({
      _id: req.params.id,
      userId: req.user!.userId,
    });
    if (!interview) throw new AppError('Interview not found', 404);

    const answers = await InterviewAnswer.find({ interviewId: interview._id }).sort({ questionIndex: 1 });
    res.json({ success: true, data: { interview, answers } });
  } catch (error) {
    next(error);
  }
}

export async function getInterviews(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const interviews = await Interview.find({ userId: req.user!.userId }).sort({ createdAt: -1 });
    res.json({ success: true, data: interviews });
  } catch (error) {
    next(error);
  }
}
