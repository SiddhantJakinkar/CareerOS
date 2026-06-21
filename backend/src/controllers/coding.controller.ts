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
import { isTechStream } from '../constants/academicStreams.js';

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

const SEED_TESTS = [
  {
    category: 'dsa' as const,
    title: 'DSA Fundamentals',
    description: 'Test your data structures and algorithms knowledge',
    duration: 30,
    questions: [
      {
        id: 'dsa-1',
        type: 'mcq' as const,
        question: 'What is the time complexity of binary search?',
        options: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'],
        correctAnswer: 'O(log n)',
        explanation: 'Binary search halves the search space each iteration.',
        topic: 'Algorithms',
        difficulty: 'easy' as const,
        points: 10,
      },
      {
        id: 'dsa-2',
        type: 'mcq' as const,
        question: 'Which data structure uses LIFO principle?',
        options: ['Queue', 'Stack', 'Tree', 'Graph'],
        correctAnswer: 'Stack',
        explanation: 'Stack follows Last In First Out.',
        topic: 'Data Structures',
        difficulty: 'easy' as const,
        points: 10,
      },
      {
        id: 'dsa-3',
        type: 'mcq' as const,
        question: 'What is the worst-case time complexity of Quick Sort?',
        options: ['O(n log n)', 'O(n²)', 'O(n)', 'O(log n)'],
        correctAnswer: 'O(n²)',
        explanation: 'Quick Sort degrades to O(n²) with poor pivot selection.',
        topic: 'Sorting',
        difficulty: 'medium' as const,
        points: 15,
      },
    ],
    totalPoints: 35,
  },
  {
    category: 'java' as const,
    title: 'Java Core Concepts',
    description: 'Test your Java programming fundamentals',
    duration: 25,
    questions: [
      {
        id: 'java-1',
        type: 'mcq' as const,
        question: 'Which keyword is used for inheritance in Java?',
        options: ['implements', 'extends', 'inherits', 'super'],
        correctAnswer: 'extends',
        explanation: 'Java uses extends for class inheritance.',
        topic: 'OOP',
        difficulty: 'easy' as const,
        points: 10,
      },
      {
        id: 'java-2',
        type: 'mcq' as const,
        question: 'What is the default value of an int in Java?',
        options: ['null', '0', 'undefined', '-1'],
        correctAnswer: '0',
        explanation: 'Primitive int defaults to 0.',
        topic: 'Primitives',
        difficulty: 'easy' as const,
        points: 10,
      },
    ],
    totalPoints: 20,
  },
  {
    category: 'python' as const,
    title: 'Python Essentials',
    description: 'Test your Python programming skills',
    duration: 25,
    questions: [
      {
        id: 'py-1',
        type: 'mcq' as const,
        question: 'Which of these is mutable in Python?',
        options: ['tuple', 'string', 'list', 'frozenset'],
        correctAnswer: 'list',
        explanation: 'Lists are mutable in Python.',
        topic: 'Data Types',
        difficulty: 'easy' as const,
        points: 10,
      },
    ],
    totalPoints: 10,
  },
  {
    category: 'sql' as const,
    title: 'SQL Queries',
    description: 'Test your SQL knowledge',
    duration: 20,
    questions: [
      {
        id: 'sql-1',
        type: 'mcq' as const,
        question: 'Which clause is used to filter groups in SQL?',
        options: ['WHERE', 'HAVING', 'GROUP BY', 'ORDER BY'],
        correctAnswer: 'HAVING',
        explanation: 'HAVING filters grouped results.',
        topic: 'Aggregation',
        difficulty: 'medium' as const,
        points: 15,
      },
    ],
    totalPoints: 15,
  },
  {
    category: 'javascript' as const,
    title: 'JavaScript Fundamentals',
    description: 'Test your JavaScript skills',
    duration: 25,
    questions: [
      {
        id: 'js-1',
        type: 'mcq' as const,
        question: 'What does === check in JavaScript?',
        options: ['Value only', 'Type only', 'Value and type', 'Reference'],
        correctAnswer: 'Value and type',
        explanation: 'Strict equality checks both value and type.',
        topic: 'Operators',
        difficulty: 'easy' as const,
        points: 10,
      },
    ],
    totalPoints: 10,
  },
  {
    category: 'aptitude' as const,
    title: 'Aptitude Test',
    description: 'Logical reasoning and aptitude',
    duration: 30,
    questions: [
      {
        id: 'apt-1',
        type: 'mcq' as const,
        question: 'If 5 machines take 5 minutes to make 5 widgets, how long for 100 machines to make 100 widgets?',
        options: ['100 minutes', '5 minutes', '20 minutes', '1 minute'],
        correctAnswer: '5 minutes',
        explanation: 'Each machine makes 1 widget in 5 minutes.',
        topic: 'Logic',
        difficulty: 'medium' as const,
        points: 15,
      },
    ],
    totalPoints: 15,
  },
  {
    category: 'verbal' as const,
    title: 'Verbal Ability',
    description: 'Reading comprehension, grammar, and vocabulary',
    duration: 25,
    questions: [
      {
        id: 'verb-1',
        type: 'mcq' as const,
        question: 'Choose the word closest in meaning to "Benevolent":',
        options: ['Cruel', 'Kind', 'Neutral', 'Strict'],
        correctAnswer: 'Kind',
        explanation: 'Benevolent means kind and generous.',
        topic: 'Vocabulary',
        difficulty: 'easy' as const,
        points: 10,
      },
      {
        id: 'verb-2',
        type: 'mcq' as const,
        question: 'Identify the grammatically correct sentence:',
        options: ['He don\'t know', 'He doesn\'t knows', 'He doesn\'t know', 'He not know'],
        correctAnswer: 'He doesn\'t know',
        explanation: 'Third person singular uses "doesn\'t" + base verb.',
        topic: 'Grammar',
        difficulty: 'easy' as const,
        points: 10,
      },
    ],
    totalPoints: 20,
  },
  {
    category: 'quantitative' as const,
    title: 'Quantitative Aptitude',
    description: 'Numbers, percentages, and data interpretation',
    duration: 30,
    questions: [
      {
        id: 'quant-1',
        type: 'mcq' as const,
        question: 'If a shirt priced at ₹800 is sold at 25% discount, what is the sale price?',
        options: ['₹600', '₹620', '₹640', '₹700'],
        correctAnswer: '₹600',
        explanation: '25% off ₹800 = ₹200 discount → ₹600.',
        topic: 'Percentages',
        difficulty: 'easy' as const,
        points: 10,
      },
      {
        id: 'quant-2',
        type: 'mcq' as const,
        question: 'A train 120m long passes a pole in 6 seconds. Speed in km/h?',
        options: ['60', '72', '80', '90'],
        correctAnswer: '72',
        explanation: 'Speed = 120/6 = 20 m/s = 72 km/h.',
        topic: 'Speed & Distance',
        difficulty: 'medium' as const,
        points: 15,
      },
    ],
    totalPoints: 25,
  },
];

export async function seedTests(): Promise<void> {
  for (const test of SEED_TESTS) {
    await CodingTest.findOneAndUpdate({ title: test.title }, test, { upsert: true });
  }
}

export async function getTests(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await seedTests();
    const profile = req.user?.userId
      ? await Profile.findOne({ userId: req.user.userId })
      : null;
    const techStream = isTechStream(profile?.academicStream);

    const universal = ['aptitude', 'verbal', 'quantitative'];
    const techOnly = ['dsa', 'java', 'python', 'sql', 'javascript'];
    const allowedCategories = techStream ? [...universal, ...techOnly] : universal;

    const filter: Record<string, unknown> = { isActive: true, category: { $in: allowedCategories } };
    if (req.query.category) {
      const category = String(req.query.category);
      if (allowedCategories.includes(category)) {
        filter.category = category;
      }
    }

    const tests = await CodingTest.find(filter);
    res.json({ success: true, data: tests });
  } catch (error) {
    next(error);
  }
}

export async function getTest(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const test = await CodingTest.findById(req.params.id);
    if (!test) throw new AppError('Test not found', 404);

    const questionsForClient = test.questions.map((q) => ({
      id: q.id,
      type: q.type,
      question: q.question,
      options: q.options,
      topic: q.topic,
      difficulty: q.difficulty,
      points: q.points,
    }));

    res.json({
      success: true,
      data: {
        id: test._id,
        category: test.category,
        title: test.title,
        description: test.description,
        duration: test.duration,
        totalPoints: test.totalPoints,
        questions: questionsForClient,
      },
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
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function getResults(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const results = await CodingResult.find({ userId: req.user!.userId })
      .populate('testId')
      .sort({ completedAt: -1 });
    res.json({ success: true, data: results });
  } catch (error) {
    next(error);
  }
}
