import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { INTERVIEW_DOMAIN_IDS } from '../constants/interviewDomains.js';
import {
  generateInviteToken,
  InterviewInvite,
} from '../models/InterviewInvite.js';
import {
  startLiveInterview,
  processLiveTurn,
  resolveInvite,
} from '../services/liveInterview.service.js';
import { LIVE_INTERVIEW_CONFIG } from '../constants/liveInterview.js';
import { logActivity } from '../services/recommendation.service.js';
import { finalizeInterview } from './interview.controller.helpers.js';
import { DOMAIN_LABELS, type InterviewDomainId } from '../constants/interviewDomains.js';
import { env } from '../config/env.js';

export const createInviteSchema = z.object({
  domain: z.enum(INTERVIEW_DOMAIN_IDS),
  jobTitle: z.string().min(2).max(120),
  companyName: z.string().min(2).max(120),
  targetRole: z.string().optional(),
  expiresInDays: z.coerce.number().min(1).max(30).default(7),
  maxQuestions: z.coerce.number().min(3).max(10).default(6),
});

export const startLiveSchema = z.object({
  domain: z.enum(INTERVIEW_DOMAIN_IDS).optional(),
  inviteToken: z.string().optional(),
  jobId: z.string().optional(),
  jobTitle: z.string().optional(),
  companyName: z.string().optional(),
});

export const liveTurnSchema = z.object({
  interviewId: z.string().min(1),
  transcript: z.string().optional(),
  skipped: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((v) => v === true || v === 'true'),
  silenceTimeout: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((v) => v === true || v === 'true'),
  afterRetry: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((v) => v === true || v === 'true'),
  durationSeconds: z.coerce.number().optional(),
});

export async function createInterviewInvite(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const body = req.body as z.infer<typeof createInviteSchema>;

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + body.expiresInDays);

    const token = generateInviteToken();
    const invite = await InterviewInvite.create({
      token,
      createdBy: userId,
      domain: body.domain,
      jobTitle: body.jobTitle,
      companyName: body.companyName,
      targetRole: body.targetRole,
      expiresAt,
      maxQuestions: body.maxQuestions,
    });

    const baseUrl = env.FRONTEND_URL;
    const joinUrl = `${baseUrl}/interview/join/${token}`;

    await logActivity(userId, 'create', 'interview_invite', invite._id.toString());

    res.status(201).json({
      success: true,
      data: {
        invite,
        joinUrl,
        expiresAt,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getInterviewInvitePublic(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const invite = await resolveInvite(String(req.params.token));
    res.json({
      success: true,
      data: {
        companyName: invite.companyName,
        jobTitle: invite.jobTitle,
        domain: invite.domain,
        domainLabel: DOMAIN_LABELS[invite.domain as InterviewDomainId] ?? invite.domain,
        expiresAt: invite.expiresAt,
        maxQuestions: invite.maxQuestions,
        config: LIVE_INTERVIEW_CONFIG,
        status: invite.status,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function listMyInvites(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const invites = await InterviewInvite.find({ createdBy: req.user!.userId })
      .sort({ createdAt: -1 })
      .limit(50);
    const baseUrl = env.FRONTEND_URL;
    res.json({
      success: true,
      data: invites.map((inv) => ({
        ...inv.toObject(),
        joinUrl: `${baseUrl}/interview/join/${inv.token}`,
      })),
    });
  } catch (error) {
    next(error);
  }
}

export async function startLive(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { domain, inviteToken, jobId, jobTitle, companyName } = req.body as z.infer<
      typeof startLiveSchema
    >;

    if (!inviteToken && !jobId && !domain) {
      res.status(400).json({ success: false, message: 'domain, jobId, or inviteToken required' });
      return;
    }

    const result = await startLiveInterview(userId, {
      domain: domain as InterviewDomainId | undefined,
      inviteToken,
      jobId,
      jobTitle,
      companyName,
    });

    await logActivity(userId, 'start', 'live_interview', result.interview._id.toString());

    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function liveTurn(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const body = req.body as z.infer<typeof liveTurnSchema>;

    const result = await processLiveTurn(userId, body.interviewId, {
      transcript: body.transcript,
      skipped: body.skipped,
      silenceTimeout: body.silenceTimeout,
      afterRetry: body.afterRetry,
      durationSeconds: body.durationSeconds,
      audioBuffer: req.file?.buffer,
      audioMime: req.file?.mimetype,
    });

    if (result.isComplete) {
      await finalizeInterview(userId, result.interview as Parameters<typeof finalizeInterview>[1]);
    }

    res.json({
      success: true,
      data: {
        evaluation: result.evaluation,
        transcript: result.transcript,
        nextQuestion: result.nextQuestion,
        isComplete: result.isComplete,
        questionNumber: result.questionNumber,
        totalQuestions: result.interview.liveMeta?.maxQuestions ?? LIVE_INTERVIEW_CONFIG.maxQuestions,
        wasSkipped: result.wasSkipped,
        interview: result.interview,
      },
    });
  } catch (error) {
    next(error);
  }
}
