import mongoose, { Document, Schema, Types } from 'mongoose';
import { INTERVIEW_DOMAIN_IDS } from '../constants/interviewDomains.js';

export type InterviewDomain = (typeof INTERVIEW_DOMAIN_IDS)[number];

export type InterviewType = 'mock' | 'voice' | 'video' | 'live';

export interface ILiveInterviewMeta {
  companyName?: string;
  jobTitle?: string;
  jobId?: Types.ObjectId;
  jobDescription?: string;
  jobSkills?: string[];
  inviteId?: Types.ObjectId;
  maxQuestions: number;
  questionTimeSeconds: number;
  silenceSeconds: number;
}

export interface IInterviewMetrics {
  technicalKnowledge: number;
  communication: number;
  confidence: number;
  problemSolving: number;
  clarity: number;
}

export interface IInterview extends Document {
  userId: Types.ObjectId;
  type: InterviewType;
  domain: InterviewDomain;
  status: 'in_progress' | 'completed' | 'abandoned';
  questions: string[];
  currentQuestionIndex: number;
  metrics: IInterviewMetrics;
  overallScore: number;
  feedback: string;
  suggestions: string[];
  strengths: string[];
  focusAreas: string[];
  liveMeta?: ILiveInterviewMeta;
  startedAt: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const interviewSchema = new Schema<IInterview>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['mock', 'voice', 'video', 'live'], required: true },
    domain: { type: String, enum: INTERVIEW_DOMAIN_IDS, required: true },
    status: { type: String, enum: ['in_progress', 'completed', 'abandoned'], default: 'in_progress' },
    questions: { type: [String], default: [] },
    currentQuestionIndex: { type: Number, default: 0 },
    metrics: {
      technicalKnowledge: { type: Number, default: 0 },
      communication: { type: Number, default: 0 },
      confidence: { type: Number, default: 0 },
      problemSolving: { type: Number, default: 0 },
      clarity: { type: Number, default: 0 },
    },
    overallScore: { type: Number, default: 0 },
    feedback: { type: String, default: '' },
    suggestions: { type: [String], default: [] },
    strengths: { type: [String], default: [] },
    focusAreas: { type: [String], default: [] },
    liveMeta: {
      companyName: String,
      jobTitle: String,
      jobId: { type: Schema.Types.ObjectId, ref: 'Job' },
      jobDescription: String,
      jobSkills: { type: [String], default: [] },
      inviteId: { type: Schema.Types.ObjectId, ref: 'InterviewInvite' },
      maxQuestions: { type: Number, default: 6 },
      questionTimeSeconds: { type: Number, default: 120 },
      silenceSeconds: { type: Number, default: 10 },
    },
    startedAt: { type: Date, default: Date.now },
    completedAt: Date,
  },
  { timestamps: true }
);

export const Interview = mongoose.model<IInterview>('Interview', interviewSchema);
