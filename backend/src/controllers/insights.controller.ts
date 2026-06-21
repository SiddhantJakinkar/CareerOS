import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import {
  runCompanyResearch,
  runSalaryPrediction,
  prepareAutoApply,
  getCompanyResearchHistory,
  getSalaryPredictionHistory,
} from '../services/insights.service.js';
import { logActivity, createNotification } from '../services/recommendation.service.js';

export const jobIdSchema = z.object({
  jobId: z.string().min(1),
});

export const salarySchema = z.object({
  jobId: z.string().optional(),
  role: z.string().optional(),
  location: z.string().optional(),
});

export async function companyResearch(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { jobId } = req.body;

    const result = await runCompanyResearch(userId, jobId);
    await logActivity(userId, 'research', 'company', jobId);
    await createNotification(
      userId,
      'Company Research Ready',
      `Research report for ${result.job.company} is ready`,
      'system',
      `/jobs/${jobId}`
    );

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function getCompanyResearch(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const report = await getCompanyResearchHistory(req.user!.userId, String(req.params.jobId));
    if (!report) {
      res.json({ success: true, data: null });
      return;
    }
    res.json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
}

export async function salaryPrediction(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { jobId, role, location } = req.body;

    const result = await runSalaryPrediction(userId, jobId, role, location);
    await logActivity(userId, 'predict', 'salary', jobId);

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function getSalaryPrediction(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const jobId = req.query.jobId as string | undefined;
    const report = await getSalaryPredictionHistory(req.user!.userId, jobId);
    res.json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
}

export async function autoApplyPrepare(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const jobId = String(req.params.jobId);

    const result = await prepareAutoApply(userId, jobId);
    await logActivity(userId, 'prepare', 'auto_apply', jobId);
    await createNotification(
      userId,
      'Application Prep Ready',
      `Readiness score: ${result.checklist.readinessScore}% for ${result.job.company}`,
      'application',
      `/jobs/${jobId}`
    );

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}
