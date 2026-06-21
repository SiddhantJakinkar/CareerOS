import mongoose, { Document, Schema, Types } from 'mongoose';

export type ReportType =
  | 'ats'
  | 'interview'
  | 'coding'
  | 'skill_gap'
  | 'linkedin'
  | 'placement_readiness'
  | 'job_match'
  | 'company_research'
  | 'salary_prediction'
  | 'auto_apply'
  | 'video_interview';

export interface IReport extends Document {
  userId: Types.ObjectId;
  type: ReportType;
  title: string;
  data: Record<string, unknown>;
  score?: number;
  createdAt: Date;
}

const reportSchema = new Schema<IReport>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: ['ats', 'interview', 'coding', 'skill_gap', 'linkedin', 'placement_readiness', 'job_match', 'company_research', 'salary_prediction', 'auto_apply', 'video_interview'],
      required: true,
    },
    title: { type: String, required: true },
    data: { type: Schema.Types.Mixed, default: {} },
    score: Number,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Report = mongoose.model<IReport>('Report', reportSchema);
