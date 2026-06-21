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
  createNotification,
  updatePlacementReadiness,
} from '../services/recommendation.service.js';
import { Profile } from '../models/Profile.js';
import {
  DOMAIN_LABELS,
  INTERVIEW_DOMAIN_IDS,
  getInterviewDomainsPayload,
  type InterviewDomainId,
} from '../constants/interviewDomains.js';

export const startInterviewSchema = z.object({
  domain: z.enum(INTERVIEW_DOMAIN_IDS),
  type: z.enum(['mock', 'voice', 'video']).default('mock'),
});

export const answerSchema = z.object({
  interviewId: z.string().min(1),
  answer: z.string().min(1),
});

const DOMAIN_LABELS_MAP = DOMAIN_LABELS;

export async function getInterviewDomains(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const profile = await Profile.findOne({ userId: req.user!.userId });
    res.json({ success: true, data: getInterviewDomainsPayload(profile) });
  } catch (error) {
    next(error);
  }
}

export async function startInterview(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { domain, type } = req.body as { domain: InterviewDomainId; type: string };

    const questions = await generateInterviewQuestions(userId, DOMAIN_LABELS_MAP[domain] ?? domain, 5);

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

    interview.metrics.technicalKnowledge = Math.round(
      (interview.metrics.technicalKnowledge + evaluation.technicalKnowledge) / 2 || evaluation.technicalKnowledge
    );
    interview.metrics.communication = Math.round(
      (interview.metrics.communication + evaluation.communication) / 2 || evaluation.communication
    );
    interview.metrics.confidence = Math.round(
      (interview.metrics.confidence + evaluation.confidence) / 2 || evaluation.confidence
    );
    interview.metrics.problemSolving = Math.round(
      (interview.metrics.problemSolving + evaluation.problemSolving) / 2 || evaluation.problemSolving
    );
    interview.metrics.clarity = Math.round(
      (interview.metrics.clarity + evaluation.clarity) / 2 || evaluation.clarity
    );

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
      interview.feedback = `Overall performance score: ${interview.overallScore}%`;
      interview.suggestions = evaluation.improvements;

      await Report.create({
        userId,
        type: 'interview',
        title: `${DOMAIN_LABELS_MAP[interview.domain]} Interview Report`,
        data: { metrics: interview.metrics, overallScore: interview.overallScore },
        score: interview.overallScore,
      });

      await updatePlacementReadiness(userId);
      await createNotification(
        userId,
        'Interview Complete',
        `Your score: ${interview.overallScore}%`,
        'interview',
        '/ai-interview'
      );
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
