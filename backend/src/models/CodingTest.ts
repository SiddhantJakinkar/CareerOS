import mongoose, { Document, Schema, Types } from 'mongoose';

export type TestCategory =
  | 'dsa'
  | 'java'
  | 'python'
  | 'sql'
  | 'javascript'
  | 'aptitude'
  | 'verbal'
  | 'quantitative'
  | 'business'
  | 'finance'
  | 'legal'
  | 'healthcare'
  | 'research'
  | 'communication'
  | 'personalized';

export type QuestionType = 'mcq' | 'coding';

export interface ITestQuestion {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
}

export interface ICodingTest extends Document {
  category: TestCategory;
  title: string;
  description: string;
  duration: number;
  questions: ITestQuestion[];
  totalPoints: number;
  isActive: boolean;
  isPersonalized?: boolean;
  personalizedFor?: {
    userId?: Types.ObjectId;
    academicStream?: string;
    targetRole?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const codingTestSchema = new Schema<ICodingTest>(
  {
    category: {
      type: String,
      enum: [
        'dsa',
        'java',
        'python',
        'sql',
        'javascript',
        'aptitude',
        'verbal',
        'quantitative',
        'business',
        'finance',
        'legal',
        'healthcare',
        'research',
        'communication',
        'personalized',
      ],
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    duration: { type: Number, default: 30 },
    questions: [
      {
        id: String,
        type: { type: String, enum: ['mcq', 'coding'] },
        question: String,
        options: [String],
        correctAnswer: String,
        explanation: String,
        topic: String,
        difficulty: { type: String, enum: ['easy', 'medium', 'hard'] },
        points: { type: Number, default: 10 },
      },
    ],
    totalPoints: { type: Number, default: 100 },
    isActive: { type: Boolean, default: true },
    isPersonalized: { type: Boolean, default: false },
    personalizedFor: {
      userId: { type: Schema.Types.ObjectId, ref: 'User' },
      academicStream: String,
      targetRole: String,
    },
  },
  { timestamps: true }
);

export const CodingTest = mongoose.model<ICodingTest>('CodingTest', codingTestSchema);
