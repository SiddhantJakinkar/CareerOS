import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IActivityLog extends Document {
  userId: Types.ObjectId;
  action: string;
  entity: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const activityLogSchema = new Schema<IActivityLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    action: { type: String, required: true },
    entity: { type: String, required: true },
    entityId: String,
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

activityLogSchema.index({ userId: 1, createdAt: -1 });

export const ActivityLog = mongoose.model<IActivityLog>('ActivityLog', activityLogSchema);
