import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { CodingTest } from '../models/CodingTest.js';
import { CodingResult } from '../models/CodingResult.js';
import { Profile } from '../models/Profile.js';
import { Report } from '../models/Report.js';
import { AppError } from '../middleware/errorHandler.js';
import {
  logActivity,
  updatePlacementReadiness,
} from '../services/recommendation.service.js';
import {
  buildAssessmentHub,
  generatePersonalizedTest,
  getAssessmentTestForClient,
  assertUserCanAccessTest,
} from '../services/assessment.service.js';
import { ASSESSMENT_SEED_TESTS } from '../data/assessmentSeedTests.js';
import { invalidateAssessmentCatalog, cacheDel, CacheKey } from '../utils/cache.js';

export const startTestSchema = z.object({
  testId: z.string().min(1),
});

export const submitTestSchema = z.object({
  testId: z.string().min(1),
  answers: z.array(
    z.object({
      questionId: z.string(),
      answer: z.string(),
      timeSpent: z.number().default(0),
    })
  ),
  timeTaken: z.number().default(0),
});

const SEED_TESTS = ASSESSMENT_SEED_TESTS;

let assessmentTestsSeeded = false;

export async function seedAssessmentTestsIfNeeded(): Promise<void> {
  if (assessmentTestsSeeded) return;

  for (const test of SEED_TESTS) {
    await CodingTest.findOneAndUpdate(
      { title: test.title, isPersonalized: { $ne: true } },
      { ...test, isActive: true },
      { upsert: true }
    );
  }
  invalidateAssessmentCatalog();
  assessmentTestsSeeded = true;
}

/** @deprecated Use seedAssessmentTestsIfNeeded — kept for compatibility */
export async function seedTests(): Promise<void> {
  await seedAssessmentTestsIfNeeded();
}

export async function getTests(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const hub = await buildAssessmentHub(userId);

    res.json({
      success: true,
      data: hub,
    });
  } catch (error) {
    next(error);
  }
}

export async function generatePersonalized(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const test = await generatePersonalizedTest(userId);
    res.status(201).json({
      success: true,
      data: {
        id: test._id,
        category: test.category,
        title: test.title,
        description: test.description,
        duration: test.duration,
        totalPoints: test.totalPoints,
        isPersonalized: true,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getTest(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const test = await getAssessmentTestForClient(String(req.params.id), userId);
    if (!test) throw new AppError('Test not found', 404);

    res.json({
      success: true,
      data: test,
    });
  } catch (error) {
    next(error);
  }
}

export async function submitTest(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { testId, answers, timeTaken } = req.body;

    const test = await CodingTest.findById(testId);
    if (!test) throw new AppError('Test not found', 404);
    assertUserCanAccessTest(test, userId);

    const topicAnalysis: Record<string, { correct: number; total: number; percentage: number }> = {};
    const answerSubmissions = [];
    let score = 0;

    for (const submission of answers) {
      const question = test.questions.find((q) => q.id === submission.questionId);
      if (!question) continue;

      const isCorrect =
        submission.answer.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase();
      const pointsEarned = isCorrect ? question.points : 0;
      score += pointsEarned;

      if (!topicAnalysis[question.topic]) {
        topicAnalysis[question.topic] = { correct: 0, total: 0, percentage: 0 };
      }
      topicAnalysis[question.topic].total += 1;
      if (isCorrect) topicAnalysis[question.topic].correct += 1;

      answerSubmissions.push({
        questionId: submission.questionId,
        answer: submission.answer,
        isCorrect,
        pointsEarned,
        timeSpent: submission.timeSpent,
      });
    }

    for (const topic of Object.keys(topicAnalysis)) {
      const t = topicAnalysis[topic];
      t.percentage = Math.round((t.correct / t.total) * 100);
    }

    const percentage = Math.round((score / test.totalPoints) * 100);
    const weakAreas = Object.entries(topicAnalysis)
      .filter(([, v]) => v.percentage < 60)
      .map(([topic]) => topic);

    const result = await CodingResult.create({
      userId,
      testId,
      category: test.category,
      score,
      maxScore: test.totalPoints,
      percentage,
      answers: answerSubmissions,
      topicAnalysis,
      weakAreas,
      recommendations: weakAreas.map((t) => `Practice more ${t} problems`),
      timeTaken,
    });

    await Profile.findOneAndUpdate({ userId }, { codingScore: percentage });
    await updatePlacementReadiness(userId);

    await Report.create({
      userId,
      type: 'coding',
      title: `${test.title} Results`,
      data: { result, topicAnalysis },
      score: percentage,
    });

    await logActivity(userId, 'complete', 'coding_test', result._id.toString());
    cacheDel(CacheKey.assessmentTest(testId));
    if (test.isPersonalized) {
      cacheDel(CacheKey.assessmentTest(`${testId}:${userId}`));
    }
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function getResults(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const results = await CodingResult.find({ userId: req.user!.userId })
      .populate('testId', 'title category description duration totalPoints isPersonalized')
      .sort({ completedAt: -1 })
      .lean();
    res.json({ success: true, data: results });
  } catch (error) {
    next(error);
  }
}
