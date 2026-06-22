import mongoose, { Document, Schema, Types } from 'mongoose';
import { INTERVIEW_DOMAIN_IDS } from '../constants/interviewDomains.js';
import type { InterviewDomainId } from '../constants/interviewDomains.js';
import crypto from 'crypto';

export interface IInterviewInvite extends Document {
  token: string;
  createdBy: Types.ObjectId;
  domain: InterviewDomainId;
  jobTitle: string;
  companyName: string;
  targetRole?: string;
  expiresAt: Date;
  maxQuestions: number;
  usedBy?: Types.ObjectId;
  interviewId?: Types.ObjectId;
  status: 'active' | 'used' | 'expired';
  createdAt: Date;
  updatedAt: Date;
}

const inviteSchema = new Schema<IInterviewInvite>(
  {
    token: { type: String, required: true, unique: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    domain: { type: String, enum: INTERVIEW_DOMAIN_IDS, required: true },
    jobTitle: { type: String, required: true },
    companyName: { type: String, required: true },
    targetRole: String,
    expiresAt: { type: Date, required: true },
    maxQuestions: { type: Number, default: 6 },
    usedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    interviewId: { type: Schema.Types.ObjectId, ref: 'Interview' },
    status: { type: String, enum: ['active', 'used', 'expired'], default: 'active' },
  },
  { timestamps: true }
);

export function generateInviteToken(): string {
  return crypto.randomBytes(24).toString('hex');
}

export const InterviewInvite = mongoose.model<IInterviewInvite>('InterviewInvite', inviteSchema);
