import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ISavedJob extends Document {
  userId: Types.ObjectId;
  jobId: Types.ObjectId;
  createdAt: Date;
}

const savedJobSchema = new Schema<ISavedJob>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

savedJobSchema.index({ userId: 1, jobId: 1 }, { unique: true });

export const SavedJob = mongoose.model<ISavedJob>('SavedJob', savedJobSchema);
