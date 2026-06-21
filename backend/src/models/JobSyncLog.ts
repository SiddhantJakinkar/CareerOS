import mongoose, { Document, Schema } from 'mongoose';

export interface IJobSyncLog extends Document {
  startedAt: Date;
  completedAt?: Date;
  status: 'running' | 'completed' | 'failed';
  queriesRun: number;
  stats: {
    remotive: number;
    jsearch: number;
    adzuna: number;
    totalUpserted: number;
  };
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

const jobSyncLogSchema = new Schema<IJobSyncLog>(
  {
    startedAt: { type: Date, required: true },
    completedAt: Date,
    status: { type: String, enum: ['running', 'completed', 'failed'], default: 'running' },
    queriesRun: { type: Number, default: 0 },
    stats: {
      remotive: { type: Number, default: 0 },
      jsearch: { type: Number, default: 0 },
      adzuna: { type: Number, default: 0 },
      totalUpserted: { type: Number, default: 0 },
    },
    error: String,
  },
  { timestamps: true }
);

jobSyncLogSchema.index({ startedAt: -1 });

export const JobSyncLog = mongoose.model<IJobSyncLog>('JobSyncLog', jobSyncLogSchema);
