import { Types } from 'mongoose';
import { CodingTest } from '../models/CodingTest.js';
import { CodingResult } from '../models/CodingResult.js';
import { Profile, type IProfile } from '../models/Profile.js';
import { generatePersonalizedAssessment } from '../ai/prompts/index.js';
import {
  getAllSkillsFromProfile,
  getAssessmentCategoriesForStream,
  getAssessmentFocusAreas,
  getDefaultTargetRole,
  getStreamLabel,
  type AcademicStreamId,
} from '../constants/academicStreams.js';
import { AppError } from '../middleware/errorHandler.js';
import {
  cacheDel,
  cacheGetOrSet,
  CacheKey,
  CacheTTL,
} from '../utils/cache.js';

export const CATEGORY_LABELS: Record<string, string> = {
  dsa: 'DSA & Algorithms',
  java: 'Java',
  python: 'Python',
  sql: 'SQL',
  javascript: 'JavaScript',
  aptitude: 'Aptitude',
  verbal: 'Verbal Ability',
  quantitative: 'Quantitative',
  business: 'Business & Management',
  finance: 'Finance & Accounts',
  legal: 'Legal Reasoning',
  healthcare: 'Healthcare',
  research: 'Research & Science',
  communication: 'Communication',
  personalized: 'Personalized',
};

function primaryCategoryForStream(stream?: string | null): string {
  switch (stream) {
    case 'engineering':
      return 'dsa';
    case 'commerce':
      return 'finance';
    case 'management':
      return 'business';
    case 'law':
      return 'legal';
    case 'healthcare':
      return 'healthcare';
    case 'science':
      return 'research';
    case 'arts':
      return 'communication';
    default:
      return 'aptitude';
  }
}

function normalizeGeneratedQuestions(
  questions: Awaited<ReturnType<typeof generatePersonalizedAssessment>>['questions']
) {
  return questions.map((q, i) => ({
    id: q.id || `p-${i + 1}`,
    type: 'mcq' as const,
    question: q.question,
    options: q.options,
    correctAnswer: q.correctAnswer,
    explanation: q.explanation || '',
    topic: q.topic || 'General',
    difficulty: q.difficulty || ('medium' as const),
    points: q.points || (q.difficulty === 'hard' ? 15 : q.difficulty === 'easy' ? 10 : 12),
  }));
}

const TEST_LIST_PROJECTION = [
  {
    $addFields: {
      questionCount: { $size: { $ifNull: ['$questions', []] } },
    },
  },
  { $project: { questions: 0 } },
  { $sort: { updatedAt: -1 } },
] as const;

async function getStandardTestsCatalog() {
  return cacheGetOrSet(CacheKey.assessmentCatalog(), CacheTTL.LONG, async () =>
    CodingTest.aggregate([
      { $match: { isActive: true, isPersonalized: { $ne: true } } },
      ...TEST_LIST_PROJECTION,
    ])
  );
}

async function getPersonalizedTestsForUser(userId: string) {
  return CodingTest.aggregate([
    {
      $match: {
        isActive: true,
        isPersonalized: true,
        'personalizedFor.userId': new Types.ObjectId(userId),
      },
    },
    ...TEST_LIST_PROJECTION,
  ]);
}

async function buildAssessmentHubUncached(userId: string) {
  const [profile, catalog, personalizedTests, results] = await Promise.all([
    Profile.findOne({ userId }).lean(),
    getStandardTestsCatalog(),
    getPersonalizedTestsForUser(userId),
    CodingResult.find({ userId }).sort({ completedAt: -1 }).limit(8).lean(),
  ]);

  const stream = (profile?.academicStream ?? 'other') as AcademicStreamId;
  const targetRole = profile?.careerPreferences?.targetRole || getDefaultTargetRole(stream);
  const allowedCategories = getAssessmentCategoriesForStream(stream);

  const standardForStream = catalog.filter((t) => allowedCategories.includes(t.category));
  const tests = [...personalizedTests, ...standardForStream];
  const latestWeak = results[0]?.weakAreas ?? [];

  const primary = primaryCategoryForStream(stream);
  const recommended =
    tests.find(
      (t) => t.isPersonalized && String(t.personalizedFor?.userId) === String(userId)
    ) ??
    tests.find((t) => t.category === primary) ??
    tests.find((t) => t.category === 'aptitude') ??
    tests[0];

  const categories = [...new Set(tests.map((t) => t.category))].map((id) => ({
    id,
    label: CATEGORY_LABELS[id] ?? id,
    count: tests.filter((t) => t.category === id).length,
  }));

  return {
    tests,
    meta: {
      academicStream: stream,
      streamLabel: getStreamLabel(stream),
      targetRole,
      assessmentScore: profile?.codingScore ?? 0,
      focusAreas: getAssessmentFocusAreas(stream, targetRole),
      allowedCategories,
      categories,
      recommendedTestId: recommended?._id?.toString() ?? null,
      recentWeakAreas: latestWeak,
      skills: getAllSkillsFromProfile(profile as IProfile | null),
      branch: profile?.education?.branch ?? null,
      degree: profile?.education?.degree ?? null,
    },
  };
}

export async function buildAssessmentHub(userId: string) {
  return cacheGetOrSet(CacheKey.assessmentHub(userId), CacheTTL.MEDIUM, () =>
    buildAssessmentHubUncached(userId)
  );
}

export function assertUserCanAccessTest(
  test: {
    isPersonalized?: boolean;
    isActive?: boolean;
    personalizedFor?: { userId?: Types.ObjectId | string };
  } | null,
  userId: string
): void {
  if (!test) throw new AppError('Test not found', 404);
  if (test.isActive === false) throw new AppError('Test not available', 404);
  if (test.isPersonalized) {
    const ownerId = test.personalizedFor?.userId?.toString();
    if (!ownerId || ownerId !== userId) {
      throw new AppError('Forbidden', 403);
    }
  }
}

function assessmentTestCacheKey(testId: string, userId: string, isPersonalized?: boolean): string {
  return isPersonalized ? `${testId}:${userId}` : testId;
}

export async function getAssessmentTestForClient(testId: string, userId: string) {
  const accessMeta = await CodingTest.findById(testId)
    .select('isPersonalized personalizedFor isActive')
    .lean();
  assertUserCanAccessTest(accessMeta, userId);

  const cacheKey = CacheKey.assessmentTest(
    assessmentTestCacheKey(testId, userId, accessMeta?.isPersonalized)
  );

  return cacheGetOrSet(cacheKey, CacheTTL.LONG, async () => {
    const test = await CodingTest.findById(testId).lean();
    if (!test) return null;

    const questionsForClient = test.questions.map((q) => ({
      id: q.id,
      type: q.type,
      question: q.question,
      options: q.options,
      topic: q.topic,
      difficulty: q.difficulty,
      points: q.points,
    }));

    return {
      _id: test._id,
      id: test._id,
      category: test.category,
      title: test.title,
      description: test.description,
      duration: test.duration,
      totalPoints: test.totalPoints,
      isPersonalized: test.isPersonalized,
      questions: questionsForClient,
    };
  });
}

export async function generatePersonalizedTest(userId: string) {
  const profile = await Profile.findOne({ userId });
  if (!profile) throw new AppError('Complete your profile before generating an assessment', 400);

  const stream = (profile.academicStream ?? 'other') as AcademicStreamId;
  const targetRole = profile.careerPreferences?.targetRole || getDefaultTargetRole(stream);
  const recentResults = await CodingResult.find({ userId }).sort({ completedAt: -1 }).limit(3);
  const weakAreas = [...new Set(recentResults.flatMap((r) => r.weakAreas))];

  const generated = await generatePersonalizedAssessment(userId, {
    academicStream: stream,
    streamLabel: getStreamLabel(stream),
    targetRole,
    branch: profile.education?.branch,
    degree: profile.education?.degree,
    skills: getAllSkillsFromProfile(profile),
    weakAreas,
  });

  const questions = normalizeGeneratedQuestions(generated.questions);
  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

  await CodingTest.updateMany(
    { isPersonalized: true, 'personalizedFor.userId': userId },
    { isActive: false }
  );

  const test = await CodingTest.create({
    category: 'personalized',
    title: generated.title,
    description: generated.description,
    duration: generated.duration || 30,
    questions,
    totalPoints,
    isPersonalized: true,
    personalizedFor: {
      userId,
      academicStream: stream,
      targetRole,
    },
  });

  cacheDel(CacheKey.assessmentHub(userId));

  return test;
}
