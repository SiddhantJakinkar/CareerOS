import mongoose, { Document, Schema, Types } from 'mongoose';
import { ACADEMIC_STREAM_IDS, type AcademicStreamId } from '../constants/academicStreams.js';

export interface IEducation {
  collegeName: string;
  degree: string;
  branch: string;
  currentYear?: number;
  graduationYear: number;
  cgpa?: number;
}

export interface ICareerPreferences {
  targetRole: string;
  preferredLocations: string[];
  jobType: 'internship' | 'full-time' | 'part-time' | 'contract';
  workMode: 'remote' | 'hybrid' | 'onsite';
  expectedSalary?: { min: number; max: number; currency: string };
}

export interface ISkills {
  languages: string[];
  frameworks: string[];
  databases: string[];
  tools: string[];
  certifications: string[];
}

export interface IProfile extends Document {
  userId: Types.ObjectId;
  academicStream: AcademicStreamId;
  phone?: string;
  location?: string;
  education: IEducation;
  careerPreferences: ICareerPreferences;
  skills: ISkills;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  resumeUrl?: string;
  resumePublicId?: string;
  avatarUrl?: string;
  placementReadinessScore: number;
  atsScore: number;
  codingScore: number;
  interviewScore: number;
  jobMatchScore: number;
  createdAt: Date;
  updatedAt: Date;
}

const profileSchema = new Schema<IProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    academicStream: { type: String, enum: ACADEMIC_STREAM_IDS, default: 'other' },
    phone: String,
    location: String,
    education: {
      collegeName: { type: String, default: '' },
      degree: { type: String, default: '' },
      branch: { type: String, default: '' },
      currentYear: Number,
      graduationYear: { type: Number, default: new Date().getFullYear() },
      cgpa: Number,
    },
    careerPreferences: {
      targetRole: { type: String, default: '' },
      preferredLocations: { type: [String], default: [] },
      jobType: { type: String, enum: ['internship', 'full-time', 'part-time', 'contract'], default: 'full-time' },
      workMode: { type: String, enum: ['remote', 'hybrid', 'onsite'], default: 'hybrid' },
      expectedSalary: {
        min: Number,
        max: Number,
        currency: { type: String, default: 'INR' },
      },
    },
    skills: {
      languages: { type: [String], default: [] },
      frameworks: { type: [String], default: [] },
      databases: { type: [String], default: [] },
      tools: { type: [String], default: [] },
      certifications: { type: [String], default: [] },
    },
    linkedinUrl: String,
    githubUrl: String,
    portfolioUrl: String,
    resumeUrl: String,
    resumePublicId: String,
    avatarUrl: String,
    placementReadinessScore: { type: Number, default: 0 },
    atsScore: { type: Number, default: 0 },
    codingScore: { type: Number, default: 0 },
    interviewScore: { type: Number, default: 0 },
    jobMatchScore: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Profile = mongoose.model<IProfile>('Profile', profileSchema);
