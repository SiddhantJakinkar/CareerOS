import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IAnswerSubmission {
  questionId: string;
  answer: string;
  isCorrect: boolean;
  pointsEarned: number;
  timeSpent: number;
}

export interface ICodingResult extends Document {
  userId: Types.ObjectId;
  testId: Types.ObjectId;
  category: string;
  score: number;
  maxScore: number;
  percentage: number;
  answers: IAnswerSubmission[];
  topicAnalysis: Record<string, { correct: number; total: number; percentage: number }>;
  weakAreas: string[];
  recommendations: string[];
  timeTaken: number;
  completedAt: Date;
  createdAt: Date;
}

const codingResultSchema = new Schema<ICodingResult>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    testId: { type: Schema.Types.ObjectId, ref: 'CodingTest', required: true },
    category: { type: String, required: true },
    score: { type: Number, default: 0 },
    maxScore: { type: Number, default: 100 },
    percentage: { type: Number, default: 0 },
    answers: [
      {
        questionId: String,
        answer: String,
        isCorrect: Boolean,
        pointsEarned: Number,
        timeSpent: Number,
      },
    ],
    topicAnalysis: { type: Map, of: Object, default: {} },
    weakAreas: { type: [String], default: [] },
    recommendations: { type: [String], default: [] },
    timeTaken: { type: Number, default: 0 },
    completedAt: { type: Date, default: Date.now },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

codingResultSchema.index({ userId: 1, completedAt: -1 });

export const CodingResult = mongoose.model<ICodingResult>('CodingResult', codingResultSchema);
