import mongoose, { Document, Schema, Types } from 'mongoose';

export type ApplicationStatus =
  | 'saved'
  | 'applied'
  | 'interview_scheduled'
  | 'technical_round'
  | 'hr_round'
  | 'rejected'
  | 'selected'
  | 'offer_received';

export interface ITimelineEntry {
  status: ApplicationStatus;
  note?: string;
  date: Date;
}

export interface IApplication extends Document {
  userId: Types.ObjectId;
  jobId: Types.ObjectId;
  status: ApplicationStatus;
  notes: string;
  timeline: ITimelineEntry[];
  resumeId?: Types.ObjectId;
  coverLetterId?: string;
  appliedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const applicationSchema = new Schema<IApplication>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
    status: {
      type: String,
      enum: ['saved', 'applied', 'interview_scheduled', 'technical_round', 'hr_round', 'rejected', 'selected', 'offer_received'],
      default: 'saved',
    },
    notes: { type: String, default: '' },
    timeline: [
      {
        status: String,
        note: String,
        date: { type: Date, default: Date.now },
      },
    ],
    resumeId: { type: Schema.Types.ObjectId, ref: 'Resume' },
    coverLetterId: String,
    appliedAt: Date,
  },
  { timestamps: true }
);

applicationSchema.index({ userId: 1, jobId: 1 }, { unique: true });

export const Application = mongoose.model<IApplication>('Application', applicationSchema);
