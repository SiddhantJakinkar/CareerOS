import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IVideoAnalysis {
  overallScore: number;
  communication: number;
  confidence: number;
  clarity: number;
  structure: number;
  fillerWordCount: number;
  fillerWords: string[];
  wordsPerMinute: number;
  strengths: string[];
  improvements: string[];
  feedback: string;
  transcript: string;
  durationSeconds: number;
}

export interface IVideoInterview extends Document {
  userId: Types.ObjectId;
  title: string;
  domain: string;
  videoUrl: string;
  publicId: string;
  fileName: string;
  fileSize: number;
  status: 'processing' | 'completed' | 'failed';
  analysis: IVideoAnalysis;
  createdAt: Date;
  updatedAt: Date;
}

const videoInterviewSchema = new Schema<IVideoInterview>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, default: 'Video Interview' },
    domain: { type: String, default: 'general' },
    videoUrl: { type: String, required: true },
    publicId: { type: String, required: true },
    fileName: { type: String, required: true },
    fileSize: { type: Number, default: 0 },
    status: { type: String, enum: ['processing', 'completed', 'failed'], default: 'processing' },
    analysis: {
      overallScore: { type: Number, default: 0 },
      communication: { type: Number, default: 0 },
      confidence: { type: Number, default: 0 },
      clarity: { type: Number, default: 0 },
      structure: { type: Number, default: 0 },
      fillerWordCount: { type: Number, default: 0 },
      fillerWords: { type: [String], default: [] },
      wordsPerMinute: { type: Number, default: 0 },
      strengths: { type: [String], default: [] },
      improvements: { type: [String], default: [] },
      feedback: { type: String, default: '' },
      transcript: { type: String, default: '' },
      durationSeconds: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

export const VideoInterview = mongoose.model<IVideoInterview>('VideoInterview', videoInterviewSchema);
