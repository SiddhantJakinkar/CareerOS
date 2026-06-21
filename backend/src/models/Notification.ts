import mongoose, { Document, Schema, Types } from 'mongoose';

export interface INotification extends Document {
  userId: Types.ObjectId;
  title: string;
  message: string;
  type: 'job_match' | 'resume_analysis' | 'interview' | 'application' | 'roadmap' | 'system';
  isRead: boolean;
  link?: string;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ['job_match', 'resume_analysis', 'interview', 'application', 'roadmap', 'system'],
      default: 'system',
    },
    isRead: { type: Boolean, default: false },
    link: String,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);
