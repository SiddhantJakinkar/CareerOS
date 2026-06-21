import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ITokenUsage extends Document {
  userId: Types.ObjectId;
  feature: string;
  tokensUsed: number;
  createdAt: Date;
}

const tokenUsageSchema = new Schema<ITokenUsage>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    feature: { type: String, required: true },
    tokensUsed: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const TokenUsage = mongoose.model<ITokenUsage>('TokenUsage', tokenUsageSchema);
