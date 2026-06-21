import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ICoverLetter extends Document {
  userId: Types.ObjectId;
  jobId: Types.ObjectId;
  content: string;
  companyName: string;
  jobTitle: string;
  createdAt: Date;
  updatedAt: Date;
}

const coverLetterSchema = new Schema<ICoverLetter>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
    content: { type: String, required: true },
    companyName: { type: String, required: true },
    jobTitle: { type: String, required: true },
  },
  { timestamps: true }
);

export const CoverLetter = mongoose.model<ICoverLetter>('CoverLetter', coverLetterSchema);
