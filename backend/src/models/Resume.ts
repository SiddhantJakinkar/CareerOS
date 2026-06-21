import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IResumeAnalysis {
  atsScore: number;
  missingKeywords: string[];
  weakSections: string[];
  suggestions: string[];
  extractedSkills: string[];
  extractedEducation: string[];
  extractedProjects: string[];
  extractedExperience: string[];
  summary: string;
}

export interface IResume extends Document {
  userId: Types.ObjectId;
  fileName: string;
  fileUrl: string;
  publicId: string;
  rawText: string;
  analysis: IResumeAnalysis;
  isActive: boolean;
  generatedForJobId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const resumeSchema = new Schema<IResume>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    publicId: { type: String, required: true },
    rawText: { type: String, default: '' },
    analysis: {
      atsScore: { type: Number, default: 0 },
      missingKeywords: { type: [String], default: [] },
      weakSections: { type: [String], default: [] },
      suggestions: { type: [String], default: [] },
      extractedSkills: { type: [String], default: [] },
      extractedEducation: { type: [String], default: [] },
      extractedProjects: { type: [String], default: [] },
      extractedExperience: { type: [String], default: [] },
      summary: { type: String, default: '' },
    },
    isActive: { type: Boolean, default: true },
    generatedForJobId: { type: Schema.Types.ObjectId, ref: 'Job' },
  },
  { timestamps: true }
);

export const Resume = mongoose.model<IResume>('Resume', resumeSchema);
