import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IInterviewAnswer extends Document {
  interviewId: Types.ObjectId;
  userId: Types.ObjectId;
  questionIndex: number;
  question: string;
  answer: string;
  transcript?: string;
  audioUrl?: string;
  videoUrl?: string;
  videoPublicId?: string;
  durationSeconds?: number;
  evaluation: {
    score: number;
    feedback: string;
    strengths: string[];
    improvements: string[];
  };
  createdAt: Date;
}

const interviewAnswerSchema = new Schema<IInterviewAnswer>(
  {
    interviewId: { type: Schema.Types.ObjectId, ref: 'Interview', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    questionIndex: { type: Number, required: true },
    question: { type: String, required: true },
    answer: { type: String, required: true },
    transcript: String,
    audioUrl: String,
    videoUrl: String,
    videoPublicId: String,
    durationSeconds: Number,
    evaluation: {
      score: { type: Number, default: 0 },
      feedback: { type: String, default: '' },
      strengths: { type: [String], default: [] },
      improvements: { type: [String], default: [] },
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const InterviewAnswer = mongoose.model<IInterviewAnswer>('InterviewAnswer', interviewAnswerSchema);
