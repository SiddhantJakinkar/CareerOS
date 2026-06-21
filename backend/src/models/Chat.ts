import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IChatMessage {
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
}

export interface IChat extends Document {
  userId: Types.ObjectId;
  title: string;
  messages: IChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const chatSchema = new Schema<IChat>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, default: 'New Conversation' },
    messages: [
      {
        role: { type: String, enum: ['user', 'assistant'], required: true },
        content: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

chatSchema.index({ userId: 1, updatedAt: -1 });

export const Chat = mongoose.model<IChat>('Chat', chatSchema);
